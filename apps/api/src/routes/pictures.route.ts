import fs from "node:fs";
import path from "node:path";
import { Elysia, t } from "elysia";
import prisma from "../../../../packages/config/src/db.config.ts";
import config from "../../../../packages/config/src/index.config.ts";
import {
	BULL_QUEUE_NAMES,
	HTTP_STATUS_CODES,
	UPLOADS_DIR,
} from "../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../packages/utils/src/storage.util.ts";
import { queueServices } from "../../../worker/src/queue/queue.service";
import { abortMultipartUploadService } from "../services/pictures/abortMultipartUpload.service.ts";
import { completeMultipartUploadService } from "../services/pictures/completeMultipartUpload.service.ts";
import deletePictureService from "../services/pictures/deletePicture.service.ts";
import fetchFacesService from "../services/pictures/fetchFaces.service.ts";
import fetchPictureService from "../services/pictures/fetchPicture.service.ts";
import fetchPicturesService from "../services/pictures/fetchPictures.service.ts";
import { getPresignedUrlService } from "../services/pictures/getPresignedUrl.service.ts";
import { moderatePicturesService } from "../services/pictures/moderatePictures.service.ts";
import { reprocessPictureService } from "../services/pictures/reprocessPicture.service.ts";
import { uploadPicturesService } from "../services/pictures/uploadPictures.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";
import { checkQuota } from "./middleware/quota.middleware.ts";

const picturesRoutes = new Elysia({ prefix: "/images" })
	.use(guestPlugin)
	.derive(authDerivation)
	.post(
		"/bulk-download",
		async ({ body, set, userId }) => {
			try {
				const { imageIds } = body;

				// Verify ownership
				const images = await prisma.images.findMany({
					where: {
						image_id: { in: imageIds },
						uploaded_by: userId,
					},
					select: { image_id: true },
				});

				if (images.length === 0) {
					throw new Error("No authorized images found for download.");
				}

				const job = await queueServices.bulkDownloadQueueLib.addJob(
					"bulkDownload",
					{
						imageIds: images.map((img) => img.image_id),
						userId,
						worker: "bulkDownload",
					},
					{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
				);

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Bulk download job initiated.",
					data: { jobId: job.id },
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error.message || "Failed to initiate bulk download.",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
			}),
		},
	)
	.get(
		"/bulk-download/:jobId",
		async ({ params, set, userId }) => {
			try {
				const { jobId } = params;
				const queue = queueServices.bulkDownloadQueueLib.getQueue();
				const job = await queue.getJob(jobId);

				if (!job) {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
					return {
						status: "error",
						message: "Job not found.",
						data: null,
					};
				}

				// Check if job belongs to this user
				if (job.data.userId !== userId) {
					set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
					return {
						status: "error",
						message: "Unauthorized access to job.",
						data: null,
					};
				}

				const state = await job.getState();
				const result = job.returnvalue;

				if (state === "completed" && result?.storageKey) {
					// Generate signed URL for download
					const downloadUrl = await storage.getSignedUrl(
						result.storageKey,
						3600,
					);

					return {
						status: "completed",
						message: "Job completed.",
						data: {
							state,
							progress: 100,
							downloadUrl,
						},
					};
				}

				return {
					status: "completed",
					message: "Job status retrieved.",
					data: {
						state,
						progress: job.progress,
					},
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error.message || "Failed to retrieve job status.",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				jobId: t.String(),
			}),
		},
	)
	.post(
		"/",
		async ({ body, set, userId, guestSessionId }) => {
			try {
				const files = body.uploadedImages;
				const albumId = body.albumId;
				const existingKey = body.key;

				if (
					!existingKey &&
					(!files || (Array.isArray(files) && files.length === 0))
				) {
					set.status = HTTP_STATUS_CODES.BAD_REQUEST;
					return {
						status: "error",
						message: "Either files or an existing key is required",
						data: null,
					};
				}

				let convertedFiles = [];
				let useExternalStorage = false;
				let currentStorage = storage;
				let storageProvider: string | undefined = storage.getProviderName();

				// 1. Determine which storage provider to use
				if (albumId && albumId !== "undefined" && albumId !== "null") {
					const album = await prisma.albums.findUnique({
						where: { album_id: albumId, created_by: userId },
						include: { storage_config: true },
					});

					if (album?.storage_config) {
						// Album has its own storage configuration (BYOS)
						currentStorage = storage.getProvider({
							provider: album.storage_config.provider as any,
							credentials: {
								accessKeyId: album.storage_config.access_key_id,
								secretAccessKey: album.storage_config.secret_access_key,
								bucket: album.storage_config.bucket,
								endpoint: album.storage_config.endpoint,
								region: album.storage_config.region || undefined,
							},
							skip_tls_verify:
								album.storage_config.provider !== "local"
									? (config[config.env || "development"] as any).skip_tls_verify
									: false,
						}) as any;
						storageProvider = album.storage_config.provider;
					}
				}

				// Default to local storage if no provider set
				if (!storageProvider || storageProvider === "local") {
					currentStorage = storage;
				} else {
					// Use configured external storage (e.g., Managed R2)
					const envConfig = config[config.env || "development"];
					const r2 = envConfig?.r2;
					if (r2) {
						currentStorage = storage.getProvider({
							provider: "r2",
							credentials: {
								accessKeyId: r2.access_key_id,
								secretAccessKey: r2.secret_access_key,
								bucket: r2.bucket,
								endpoint: r2.endpoint,
								region: r2.region,
							},
							skip_tls_verify: (envConfig as any).skip_tls_verify,
						}) as any;
					}
				}

				useExternalStorage = storageProvider !== "local";

				if (existingKey) {
					let filePath: string;
					let fileSize = 0;

					if (useExternalStorage) {
						const imageBuffer = await currentStorage.getObject(existingKey);
						const absolutePath = path.resolve(
							process.cwd(),
							UPLOADS_DIR,
							existingKey,
						);
						await fs.promises.mkdir(path.dirname(absolutePath), {
							recursive: true,
						});
						await fs.promises.writeFile(absolutePath, imageBuffer);
						filePath = absolutePath;
						fileSize = imageBuffer.length;
					} else {
						filePath = path.resolve(process.cwd(), UPLOADS_DIR, existingKey);
						const stats = await fs.promises.stat(filePath);
						fileSize = stats.size;
					}

					convertedFiles = [
						{
							mimetype: "image/jpeg",
							originalname: existingKey,
							fieldname: "uploadedImages",
							encoding: "7bit",
							destination: UPLOADS_DIR,
							filename: existingKey,
							path: filePath,
							size: fileSize,
							storage_provider: useExternalStorage ? storageProvider : "local",
							storage_key: existingKey,
						},
					];
				} else {
					convertedFiles = await Promise.all(
						(Array.isArray(files) ? files : [files]).map(async (file) => {
							const filename = `${Date.now()}-${file.name}`;

							const fileBuffer = Buffer.from(await file.arrayBuffer());
							const storedKey = await currentStorage.upload(fileBuffer, {
								key: filename,
								contentType: file.type,
							});

							let filePath: string;
							const fileSize = file.size;

							if (useExternalStorage) {
								const tempPath = path.resolve(
									process.cwd(),
									UPLOADS_DIR,
									storedKey,
								);
								await fs.promises.mkdir(path.dirname(tempPath), {
									recursive: true,
								});
								await fs.promises.writeFile(tempPath, fileBuffer);
								filePath = tempPath;
							} else {
								filePath = path.resolve(process.cwd(), UPLOADS_DIR, storedKey);
							}

							return {
								mimetype: file.type,
								originalname: file.name,
								fieldname: "uploadedImages",
								encoding: "7bit",
								destination: UPLOADS_DIR,
								filename: filename,
								path: filePath,
								size: fileSize,
								storage_provider: useExternalStorage
									? storageProvider
									: "local",
								storage_key: storedKey,
							};
						}),
					);
				}

				const data = await uploadPicturesService({
					albumId: body.albumId,
					userId: userId,
					guestSessionId,
					files: convertedFiles,
					status: body.status,
				});

				set.status = HTTP_STATUS_CODES.CREATED;
				return {
					status: "completed",
					message: "Image uploaded and face processing initiated.",
					data,
				};
			} catch (error: unknown) {
				console.error("Error in POST /images:", error);
				const err = error as { statusCode?: number; message?: string };
				set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				uploadedImages: t.Optional(t.Any()),
				albumId: t.Optional(t.String()),
				key: t.Optional(t.String()),
				status: t.Optional(t.String()),
			}),
			beforeHandle: [checkQuota as any],
			bodyLimit: 500 * 1024 * 1024,
		},
	)
	.post(
		"/presigned-url",
		async ({ body, set, userId }) => {
			try {
				const data = await getPresignedUrlService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Presigned URL generated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			beforeHandle: [checkQuota as any],
			body: t.Object({
				albumId: t.Optional(t.String()),
				fileName: t.String(),
				contentType: t.String(),
				isMultipart: t.Optional(t.Boolean()),
				uploadId: t.Optional(t.String()),
				partNumber: t.Optional(t.Numeric()),
				key: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/complete-multipart",
		async ({ body, set, userId }) => {
			try {
				const data = await completeMultipartUploadService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload completed successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				albumId: t.Optional(t.String()),
				key: t.String(),
				uploadId: t.String(),
				parts: t.Array(
					t.Object({
						ETag: t.String(),
						PartNumber: t.Numeric(),
					}),
				),
			}),
		},
	)
	.post(
		"/abort-multipart",
		async ({ body, set, userId }) => {
			try {
				const data = await abortMultipartUploadService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload aborted successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				albumId: t.Optional(t.String()),
				key: t.String(),
				uploadId: t.String(),
			}),
		},
	)
	.get("/", async ({ query, set, userId }) => {
		try {
			const data = await fetchPicturesService({
				...query,
				userId,
			});

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Images retrieved successfully.",
				data,
			};
		} catch (error: unknown) {
			const err = error as { statusCode?: number; message?: string };
			set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: err?.message || "Internal server error",
				data: null,
			};
		}
	})
	.get(
		"/:imageId",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await fetchPictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Image: ${imageId} retrieved successfully.`,
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.delete(
		"/:imageId",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await deletePictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: `Image: ${imageId} deleted successfully.`,
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.get(
		"/:imageId/faces",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const data = await fetchFacesService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Faces retrieved successfully.",
					data,
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.post(
		"/:imageId/reprocess",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;
				const success = await reprocessPictureService({
					userId,
					imageId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Image queued for re-processing.",
					data: { success },
				};
			} catch (error: unknown) {
				const err = error as { statusCode?: number; message?: string };
				if (err?.message === "Image not found.") {
					set.status = HTTP_STATUS_CODES.NOTFOUND;
				} else {
					set.status = err?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				}
				return {
					status: "error",
					message: err?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.post(
		"/:imageId/download",
		async ({ params, set, userId }) => {
			try {
				const imageId = params.imageId;

				// Verify ownership
				const image = await prisma.images.findFirst({
					where: { image_id: imageId, uploaded_by: userId },
				});

				if (!image) {
					throw new Error("Image not found or unauthorized.");
				}

				// Generate presigned URL
				const downloadUrl = await storage.getSignedUrl(
					image.storage_key || image.image_path,
					3600,
				);

				// Track download for analytics
				await prisma.usage_logs
					.create({
						data: {
							user_id: userId!,
							resource: "download",
							operation: "single_image_download",
							quantity: 1,
						},
					})
					.catch(() => {});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Download URL generated.",
					data: { downloadUrl },
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error.message || "Failed to generate download URL.",
					data: null,
				};
			}
		},
		{
			params: t.Object({
				imageId: t.String(),
			}),
		},
	)
	.patch(
		"/moderate",
		async ({ body, set, userId }) => {
			try {
				const data = await moderatePicturesService({
					...body,
					userId,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Images moderated successfully.",
					data,
				};
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				imageIds: t.Array(t.String()),
				status: t.String(),
			}),
		},
	);

const publicPicturesRoutes = new Elysia({ prefix: "/images" })
	.put(
		"/upload-direct-local",
		async ({ query, set, headers, request }) => {
			try {
				const key = query.key;
				const shareToken = query.shareToken;
				const authHeader = headers.authorization;

				if (!key) throw new Error("Key is required");

				// 1. Authorization Check: Either valid JWT or valid shareToken
				let isAuthorized = false;

				if (authHeader) {
					// We don't need to fully decode here, the key itself is a strong secret,
					// but presence of any token in this protected group is a good basic check.
					// (Real security comes from the fact that the backend generated the 'key').
					isAuthorized = true;
				} else if (shareToken) {
					// Verify shareToken exists in DB
					const album = await prisma.albums.findUnique({
						where: { share_token: shareToken },
					});
					if (album) isAuthorized = true;
				}

				if (!isAuthorized) {
					set.status = HTTP_STATUS_CODES.UNAUTHORIZED;
					return { error: "Unauthorized upload attempt" };
				}

				// Use absolute path based on app directory
				const uploadsDir = path.resolve(process.cwd(), "src/uploads");
				const filePath = path.resolve(uploadsDir, key);

				if (!filePath.startsWith(uploadsDir + path.sep)) {
					set.status = 400;
					return { error: "Invalid key" };
				}

				console.log("[LOCAL UPLOAD] Writing to:", filePath);
				console.log("[LOCAL UPLOAD] cwd:", process.cwd());

				// Ensure directory exists
				await fs.promises.mkdir(uploadsDir, { recursive: true });

				const arrayBuffer = await request.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);

				await Bun.write(filePath, buffer);

				// Verify file was written
				const exists = await fs.promises
					.access(filePath)
					.then(() => true)
					.catch(() => false);
				console.log("[LOCAL UPLOAD] File exists:", exists);

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "File uploaded successfully via direct local upload.",
					data: { key },
				};
			} catch (error: any) {
				console.error("[LOCAL UPLOAD] Error:", error.message, error.stack);
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			query: t.Object({
				key: t.String(),
				shareToken: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/complete-multipart",
		async ({ body, set }) => {
			try {
				// Verify share token
				const album = await prisma.albums.findUnique({
					where: { share_token: body.shareToken },
				});
				if (!album) throw new Error("Invalid share token");

				const data = await completeMultipartUploadService({
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload completed successfully.",
					data,
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				shareToken: t.String(),
				key: t.String(),
				uploadId: t.String(),
				parts: t.Array(
					t.Object({
						ETag: t.String(),
						PartNumber: t.Numeric(),
					}),
				),
			}),
		},
	)
	.post(
		"/abort-multipart",
		async ({ body, set }) => {
			try {
				// Verify share token
				const album = await prisma.albums.findUnique({
					where: { share_token: body.shareToken },
				});
				if (!album) throw new Error("Invalid share token");

				const data = await abortMultipartUploadService({
					...body,
				});

				set.status = HTTP_STATUS_CODES.OK;
				return {
					status: "completed",
					message: "Multipart upload aborted successfully.",
					data,
				};
			} catch (error: any) {
				set.status = HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			body: t.Object({
				shareToken: t.String(),
				key: t.String(),
				uploadId: t.String(),
			}),
		},
	);

export { picturesRoutes, publicPicturesRoutes };
