import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { logUsage, checkComputeLimit } from "../../../../../packages/models/src/usage.model.ts";
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
	const { imageId, albumId } = jobData;

	try {
		console.log(`Starting semantic embedding for image: ${imageId}`);

		// 1. Fetch image and album settings
		const image = await prisma.images.findUnique({
			where: { image_id: imageId },
		});

		if (!image) throw new Error("Image not found");

		const album = await prisma.albums.findUnique({
			where: { album_id: albumId },
			include: { 
				storage_config: true,
				settings: true
			},
		});

		// Only proceed if semantic search is enabled for this album
		if (!album?.settings?.semantic_search_enabled) {
			console.log(`Semantic search disabled for album ${albumId}. Skipping.`);
			return { status: "skipped", reason: "feature_disabled" };
		}

		// 2. Check soft limits
		if (image.uploaded_by) {
			const limitCheck = await checkComputeLimit(image.uploaded_by);
			if (limitCheck.status !== "OK") {
				console.log(`[Soft Limit] ${limitCheck.notification} Proceeding with demo.`);
				// In a real production app, we might block here if status was EXCEEDED and we wanted hard limits
			}
		}

		// 3. Get image source
		const { provider, isLocal } = getStorageProvider(image, album.storage_config);

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
		}

		if (!imageBuffer) throw new Error("Failed to load image buffer");

		const envConfig = config[config.env || "development"];
		const aiServiceUrl = envConfig.ai_service_url;

		// 4. Call AI service for CLIP embedding
		// We use the same file source logic as face recognition
		const formData = new FormData();
		const blob = new Blob([imageBuffer], { type: "image/jpeg" });
		formData.append("file", blob, "image.jpg");

		// Note: The AI service has a /embed endpoint as defined in Part 1
		const response = await axios.post(`${aiServiceUrl}/embed`, {
			image_path: isLocal ? path.resolve(process.cwd(), UPLOADS_DIR, image.image_path) : null,
			storage_provider: !isLocal ? image.storage_provider : null,
			storage_key: !isLocal ? image.storage_key : null,
		});

		const embedding = response.data.embedding;

		if (embedding && embedding.length > 0) {
			// 5. Save embedding to database using raw SQL for pgvector compatibility
			await prisma.$executeRaw`
				UPDATE images 
				SET embedding = ${embedding}::vector
				WHERE image_id = ${imageId}::uuid
			`;

			// 6. Log usage (2 units for semantic search)
			if (image.uploaded_by) {
				await logUsage(
					image.uploaded_by,
					"compute",
					"semantic_embedding",
					2,
					albumId,
					{ image_id: imageId },
				);
			}
		}

		console.log(`Semantic embedding completed for ${imageId}.`);

		return {
			status: "success",
			imageId,
		};
	} catch (error) {
		console.error("Semantic embedding worker failed:", error);
		throw error;
	}
};

export default run;
