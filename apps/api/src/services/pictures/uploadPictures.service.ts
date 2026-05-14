import fs from "node:fs";
import path from "node:path";
import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import {
	getUserPlanLimits,
	getUserUsage,
	logUsage,
} from "../../../../../packages/models/src/usage.model.ts";
import { UPLOADS_DIR } from "../../../../../packages/utils/src/constants.util.ts";
import {
	getImageSize,
	isImageCorrupted,
	normalizeImagePath,
} from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";
import { incrementPendingUpload } from "../../../../../packages/email/src/newPhotosDebounce.ts";
import { createImage, getImagesByIds } from "./pictures.lib";

const fileSchema = Joi.object({
	// Raw file from request or object with existingKey
	existingKey: Joi.string().optional(),
	name: Joi.string().optional(),
	originalname: Joi.string().optional(),
	type: Joi.string().optional(),
	mimetype: Joi.string().optional(),
	size: Joi.number()
		.max(500 * 1024 * 1024)
		.optional(),
}).or("existingKey", "name"); // Must have either existingKey or name

const spec = Joi.object({
	album_id: Joi.string().uuid().optional(),
	uploaded_by: Joi.string().uuid().optional(),
	guest_session_id: Joi.string().uuid().optional(),
	status: Joi.string()
		.valid("PENDING", "APPROVED", "REJECTED")
		.default("APPROVED"),
	files: Joi.array().items(fileSchema).min(1).max(50).required(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		files: "files",
		userId: "uploaded_by",
		guestSessionId: "guest_session_id",
		status: "status",
	},
	response: {
		images: "images",
	},
	image: {
		image_id: "imageId",
		faces: "faces",
		image_path: "imagePath",
		status: "status",
		upload_date: "uploadDate",
		update_date: "updateDate",
		original_size: "originalSize",
		uploaded_by: "userId",
		guest_session_id: "guestSessionId",
	},
};

const storeImage = async (
	file,
	uploaded_by,
	guest_session_id,
	status,
	album_id,
) => {
	const imagePath = file.path;
	const imageSize = await getImageSize(imagePath);
	const isCorrupted = await isImageCorrupted(imagePath);
	if (isCorrupted) {
		throw new Error(`Image: ${file.filename} is corrupted`);
	}

	const imageData: any = {
		image_path: imagePath,
		original_height: imageSize.height,
		original_width: imageSize.width,
		size: file.size,
		uploaded_by,
		guest_session_id,
		status,
		file_hash: file.file_hash,
		album_id,
	};

	if (file.storage_provider && file.storage_key) {
		imageData.storage_provider = file.storage_provider;
		imageData.storage_key = file.storage_key;
	}

	const imageResult = await createImage(imageData);

	const imageId = imageResult.image_id;

	return {
		imagePath,
		imageId: imageId.toString(),
		size: file.size,
		storageProvider: file.storage_provider,
		storageKey: file.storage_key,
	};
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Determine storage provider based on album or config
	let currentStorage = storage;
	let storageProvider: string | undefined = storage.getProviderName();
	let useExternalStorage = false;

	if (params.album_id) {
		const album = await prisma.albums.findUnique({
			where: { album_id: params.album_id },
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
		const r2 = (envConfig as any)?.r2;
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

	const processedFiles = await Promise.all(
		params.files.map(async (file: any) => {
			const originalname = file?.name || file?.originalname || "unknown.jpg";
			const mimetype = file?.type || file?.mimetype || "image/jpeg";
			const filename = file.existingKey || `${Date.now()}-${originalname}`;
			let filePath: string;
			let fileSize: number;
			let storageKey: string;

			if (file.existingKey) {
				// File already exists in storage
				if (useExternalStorage) {
					const imageBuffer = await currentStorage.getObject(file.existingKey);
					const absolutePath = path.resolve(
						process.cwd(),
						UPLOADS_DIR,
						file.existingKey,
					);
					await fs.promises.mkdir(path.dirname(absolutePath), {
						recursive: true,
					});
					await fs.promises.writeFile(absolutePath, imageBuffer);
					filePath = absolutePath;
					fileSize = imageBuffer.length;
				} else {
					filePath = path.resolve(process.cwd(), UPLOADS_DIR, file.existingKey);
					const stats = await fs.promises.stat(filePath);
					fileSize = stats.size;
				}
				storageKey = file.existingKey;
			} else {
				// New file upload
				const fileBuffer = Buffer.from(await file.arrayBuffer());
				storageKey = await currentStorage.upload(fileBuffer, {
					key: filename,
					contentType: mimetype,
				});

				if (useExternalStorage) {
					const tempPath = path.resolve(process.cwd(), UPLOADS_DIR, storageKey);
					await fs.promises.mkdir(path.dirname(tempPath), { recursive: true });
					await fs.promises.writeFile(tempPath, fileBuffer);
					filePath = tempPath;
				} else {
					filePath = path.resolve(process.cwd(), UPLOADS_DIR, storageKey);
				}
				fileSize = file.size || fileBuffer.length;
			}

			return {
				filePath,
				fileSize,
				storageKey,
				storageProvider: useExternalStorage ? storageProvider : "local",
				originalname,
				mimetype,
			};
		}),
	);

	// 1. Per-member/guest rate limiting (100 images per album)
	if (params.album_id && (params.uploaded_by || params.guest_session_id)) {
		const currentCount = await prisma.album_images.count({
			where: {
				album_id: params.album_id,
				images: {
					OR: [
						{ uploaded_by: params.uploaded_by || undefined },
						{ guest_session_id: params.guest_session_id || undefined },
					].filter((c) => c.uploaded_by || c.guest_session_id),
				},
			},
		});

		if (currentCount + processedFiles.length > 100) {
			throw new Error(
				"Album upload limit reached for your session (max 100 photos).",
			);
		}
	}

	// 2. Host Quota Check
	let hasQuota = true;
	if (params.uploaded_by) {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const { computeLimit } = await getUserPlanLimits(params.uploaded_by);
		if (computeLimit !== -1) {
			const usage = await getUserUsage(
				params.uploaded_by,
				"compute",
				startOfMonth,
			);
			if (usage >= computeLimit) {
				hasQuota = false;
			}
		}
	}

	const imagesToProcess = [];
	for (const fileData of processedFiles) {
		const imageSize = await getImageSize(fileData.filePath);
		const isCorrupted = await isImageCorrupted(fileData.filePath);
		if (isCorrupted) {
			throw new Error(`Image: ${fileData.originalname} is corrupted`);
		}

		const imageData: any = {
			image_path: fileData.filePath,
			original_height: imageSize.height,
			original_width: imageSize.width,
			size: fileData.fileSize,
			uploaded_by: params.uploaded_by,
			guest_session_id: params.guest_session_id,
			status: hasQuota ? params.status : "QUOTA_EXCEEDED",
			file_hash: undefined,
			album_id: params.album_id,
		};

		if (fileData.storageProvider && fileData.storageKey) {
			imageData.storage_provider = fileData.storageProvider;
			imageData.storage_key = fileData.storageKey;
		}

		const imageResult = await createImage(imageData);
		imagesToProcess.push({
			imageId: imageResult.image_id.toString(),
			imagePath: fileData.filePath,
			size: fileData.fileSize,
			storageProvider: fileData.storageProvider,
			storageKey: fileData.storageKey,
		});
	}

	for (const imageInfo of imagesToProcess) {
		if (hasQuota) {
			await queueServices.imageOptimizationQueueLib.addJob(
				"imageOptimization",
				{
					imageId: imageInfo.imageId,
					imagePath: imageInfo.imagePath,
					storageProvider: imageInfo.storageProvider,
					storageKey: imageInfo.storageKey,
					albumId: params.album_id,
					worker: "imageOptimization",
				},
				{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
			);

			// Log usage for each image processed
			if (params.uploaded_by) {
				await logUsage(params.uploaded_by, "compute", "face_detection", 1);
			}
		}

		// Always log storage usage as the file IS stored
		if (params.uploaded_by) {
			await logUsage(
				params.uploaded_by,
				"storage",
				"upload",
				imageInfo.size || 0,
			);
		}
	}
	const imageIds = imagesToProcess.map((img) => {
		return img.imageId;
	});

	const images = await getImagesByIds(imageIds);

	// Trigger "New photos in shared album" notification for owner if uploaded by guest
	if (params.album_id && params.guest_session_id && images.length > 0) {
		try {
			const album = await prisma.albums.findUnique({
				where: { album_id: params.album_id },
				include: { users: { select: { email: true } } },
			});

			if (album?.users?.email) {
				await incrementPendingUpload(
					params.album_id,
					album.users.email,
					album.album_name || "your album",
					images.length,
				);
			}
		} catch (error) {
			console.error("Failed to track new photos notification:", error);
		}
	}

	const aliasRes = aliaserSpec(aliasSpec.response, {
		images: images.map((image) => {
			return aliaserSpec(aliasSpec.image, {
				...image,
				image_path: normalizeImagePath(
					image.image_path,
					image.storage_provider,
					image.storage_key,
				),
			});
		}),
	});
	return aliasRes;
};

export const uploadPicturesService = service;
