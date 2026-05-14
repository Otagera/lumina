import fs, { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { logUsage } from "../../../../../packages/models/src/usage.model.ts";
import { UPLOADS_DIR } from "../../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const getStorageProvider = (image, albumStorageConfig = null) => {
	const provider =
		image.storage_provider ||
		(albumStorageConfig ? albumStorageConfig.provider : null);

	if (!provider || provider === "local") {
		return { provider: null, isLocal: true };
	}

	let credentials = {
		accessKeyId:
			image.storage_access_key_id || albumStorageConfig?.access_key_id,
		secretAccessKey:
			image.storage_secret_access_key || albumStorageConfig?.secret_access_key,
		bucket: image.storage_bucket || albumStorageConfig?.bucket,
		endpoint: image.storage_endpoint || albumStorageConfig?.endpoint,
		region: image.storage_region || albumStorageConfig?.region,
	};

	const envConfig = config[config.env || "development"];
	const r2 = envConfig?.r2;
	if (
		r2?.access_key_id &&
		r2?.secret_access_key &&
		r2?.bucket &&
		(!credentials.bucket || !credentials.endpoint)
	) {
		credentials = {
			accessKeyId: r2.access_key_id,
			secretAccessKey: r2.secret_access_key,
			bucket: r2.bucket,
			endpoint: r2.endpoint || "",
			region: r2.region || "auto",
		};
	}

	return {
		provider: storage.getProvider({
			provider,
			credentials,
			skip_tls_verify:
				provider !== "local"
					? config[config.env || "development"].skip_tls_verify
					: false,
		}),
		isLocal: false,
	};
};

const run = async (jobData) => {
	const { imageIds, userId, jobId } = jobData;

	const tempDir = path.resolve(process.cwd(), UPLOADS_DIR, "temp");
	const zipFileName = `bulk-download-${jobId || Date.now()}.zip`;
	const zipPath = path.join(tempDir, zipFileName);

	try {
		console.log(`Starting bulk download for job: ${jobId || "unknown"}`);

		await mkdir(tempDir, { recursive: true });

		const images = await prisma.images.findMany({
			where: {
				image_id: { in: imageIds },
				// Optionally check userId here if not already checked in API
			},
		});

		if (images.length === 0) {
			console.warn(`[BULK-DOWNLOAD] No images found for job ${jobId}`);

			if (userId) {
				try {
					await prisma.notifications.create({
						data: {
							user_id: userId,
							type: "DOWNLOAD_FAILED",
							metadata: {
								jobId,
								message:
									"Download failed - some images were removed before download.",
								requestedCount: imageIds.length,
							},
						},
					});
				} catch (notifError) {
					console.warn(`[BULK-DOWNLOAD] Failed to create notification:`, notifError);
				}
			}

			return {
				status: "failed",
				reason: "no_images",
				requestedCount: imageIds.length,
				userId,
			};
		}

		const output = createWriteStream(zipPath);
		const archive = archiver("zip", { zlib: { level: 9 } });

		return new Promise((resolve, reject) => {
			output.on("close", async () => {
				console.log(
					`ZIP created successfully: ${archive.pointer()} total bytes`,
				);
				try {
					const zipBuffer = await readFile(zipPath);
					const storageKey = `temp/${zipFileName}`;

					// Upload to default storage
					await storage.upload(zipBuffer, {
						key: storageKey,
						contentType: "application/zip",
					});

					// Cleanup local zip
					await unlink(zipPath);

					resolve({
						status: "success",
						storageKey,
						count: images.length,
					});
				} catch (err) {
					reject(err);
				}
			});

			archive.on("error", (err) => {
				reject(err);
			});

			archive.pipe(output);

			(async () => {
				for (const image of images) {
					try {
						// Get image data
						const { provider: storageProviderInstance, isLocal } =
							getStorageProvider(image);
						let imageBuffer;

						if (!isLocal && storageProviderInstance) {
							try {
								imageBuffer = await storageProviderInstance.getObject(
									image.storage_key,
								);
							} catch (e) {
								if (
									e.name === "NoSuchKey" ||
									e.code === "NoSuchKey" ||
									e.message?.includes("NoSuchKey") ||
									e.name === "NotFound" ||
									e.code === "NotFound"
								) {
									console.warn(
										`[Bulk Download] File not found in ${image.storage_provider} as ${image.storage_key}. Falling back to local file.`,
									);
									const localPath = path.resolve(
										process.cwd(),
										UPLOADS_DIR,
										image.storage_key || image.image_path,
									);
									imageBuffer = await readFile(localPath);
								} else {
									throw e;
								}
							}
						} else {
							const localPath = path.resolve(
								process.cwd(),
								UPLOADS_DIR,
								image.storage_key || image.image_path,
							);
							imageBuffer = await readFile(localPath);
						}

						const fileName =
							image.image_id +
							path.extname(image.image_path || image.storage_key || ".jpg");
						archive.append(imageBuffer, { name: fileName });
					} catch (imgErr) {
						console.error(
							`Failed to add image ${image.image_id} to ZIP:`,
							imgErr,
						);
						// Continue with other images
					}
				}
				archive.finalize();
			})().catch(reject);
		});
	} catch (error) {
		console.error(`[BULK-DOWNLOAD] Error for job ${jobId}:`, error);
		if (fs.existsSync(zipPath)) {
			await unlink(zipPath).catch(() => {});
		}

		// Create notification for user
		if (userId) {
			try {
				await prisma.notifications.create({
					data: {
						user_id: userId,
						type: "DOWNLOAD_FAILED",
						metadata: {
							jobId,
							message: "Download failed. Please try again or contact support.",
						},
					},
				});
			} catch (notifError) {
				console.warn(`[BULK-DOWNLOAD] Failed to create notification:`, notifError);
			}

			try {
				await logUsage(
					userId,
					"compute",
					"bulk_download",
					Math.ceil(imageIds.length / 10),
					null,
					{ image_count: imageIds.length, job_id: jobId },
				);
			} catch (logError) {
				console.warn(`[BULK-DOWNLOAD] Failed to log usage:`, logError);
			}
		}

		return { status: "error", reason: error.message, jobId, userId };
	}
};

export default run;
