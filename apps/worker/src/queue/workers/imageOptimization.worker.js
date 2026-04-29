import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { logUsage } from "../../../../../packages/models/src/usage.model.ts";
import { UPLOADS_DIR } from "../../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";
import { queueServices } from "../queue.service.ts";

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

const calculatePerceptualHash = async (imageBuffer) => {
	try {
		// Use a simple dHash implementation:
		// 1. Resize to 9x8 grayscale
		// 2. Compare adjacent pixels in each row (8 comparisons per row * 8 rows = 64 bits)
		const { data, info } = await sharp(imageBuffer)
			.grayscale()
			.resize(9, 8, { fit: "fill" })
			.raw()
			.toBuffer({ resolveWithObject: true });

		let hash = "";
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const left = data[row * 9 + col];
				const right = data[row * 9 + col + 1];
				hash += left > right ? "1" : "0";
			}
		}

		// Convert binary string to hex
		const hexHash = BigInt(`0b${hash}`).toString(16).padStart(16, "0");
		return hexHash;
	} catch (error) {
		console.error("Error calculating perceptual hash:", error);
		return null;
	}
};

const run = async (jobData) => {
	const { imageId, imagePath, storageProvider, storageKey, albumId } = jobData;

	try {
		console.log(
			`Starting background image optimization for image: ${imageId} (Album: ${albumId || "None"})`,
		);

		// 1. Fetch image record and potential album storage config
		const image = await prisma.images.findUnique({
			where: { image_id: imageId },
		});

		if (!image) {
			throw new Error(`Image record ${imageId} not found`);
		}

		let albumStorageConfig = null;
		if (albumId) {
			const album = await prisma.albums.findUnique({
				where: { album_id: albumId },
				include: { storage_config: true },
			});
			albumStorageConfig = album?.storage_config;
		}

		// 2. Get the correct storage provider and file source
		const { provider, isLocal } = getStorageProvider(image, albumStorageConfig);

		let imageBuffer;
		if (isLocal) {
			const fullPath = path.resolve(
				process.cwd(),
				UPLOADS_DIR,
				image.image_path,
			);
			imageBuffer = await fs.readFile(fullPath);
		} else if (provider) {
			imageBuffer = await provider.getObject(image.storage_key);
		} else {
			throw new Error("Could not determine storage provider for source image");
		}

		// 3. Process with Sharp
		// We'll create a standard "web-optimized" version:
		// - Limit max dimension to 2000px
		// - WebP format (smaller than JPG for same quality)
		// - 80% quality
		const optimizedBuffer = await sharp(imageBuffer)
			.resize(2000, 2000, {
				fit: "inside",
				withoutEnlargement: true,
			})
			.webp({ quality: 80 })
			.toBuffer();

		// 4. Save optimized version
		let optimizedPathOrKey;
		let optimizedSize;

		if (isLocal) {
			// Save to local uploads/optimized
			const optimizedRelPath = `optimized/${path.basename(image.image_path, path.extname(image.image_path))}.webp`;
			const optimizedLocalPath = path.resolve(
				process.cwd(),
				UPLOADS_DIR,
				optimizedRelPath,
			);

			await fs.mkdir(path.dirname(optimizedLocalPath), { recursive: true });
			await fs.writeFile(optimizedLocalPath, optimizedBuffer);

			optimizedPathOrKey = optimizedRelPath;
			optimizedSize = (await fs.stat(optimizedLocalPath)).size;

			// Log usage
			if (image.uploaded_by) {
				await logUsage(image.uploaded_by, "storage", "optimize", optimizedSize);
			}
		} else {
			// Upload to external storage (R2/BYOS)
			const optimizedKey = `optimized/${image.image_id}.webp`;
			await provider.upload(optimizedBuffer, {
				key: optimizedKey,
				contentType: "image/webp",
			});

			optimizedPathOrKey = optimizedKey;
			optimizedSize = optimizedBuffer.length;

			if (image.uploaded_by) {
				await logUsage(image.uploaded_by, "storage", "optimize", optimizedSize);
			}
		}

		// Calculate perceptual hash for duplicate detection
		const pHash = await calculatePerceptualHash(imageBuffer);

		const imageUpdateData = {
			optimized_path: optimizedPathOrKey,
			optimized_size: optimizedSize,
			perceptual_hash: pHash,
		};

		// 5. Update DB
		// DO NOT overwrite storage_key here! storage_key must point to the original high-res image
		// so that the AI service (and future workers) process the correct original file.

		const updatedImage = await prisma.images.update({
			where: { image_id: imageId },
			data: imageUpdateData,
		});

		console.log(`Optimized image saved: ${optimizedPathOrKey}`);

		// 6. Queue next step: Face Recognition
		// We trigger this AFTER optimization so the AI service has a reliable version to work with if needed,
		// though it usually uses the original for best quality.
		await queueServices.faceRecognitionQueueLib.addJob("faceRecognition", {
			imageId,
			albumId,
			worker: "faceRecognition",
		});

		return {
			status: "success",
			message: `Image optimization completed for ${imagePath || storageKey}`,
		};
	} catch (error) {
		console.error("Error processing image optimization task:", error);
		throw error;
	}
};

export default run;
