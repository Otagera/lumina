import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { logUsage } from "../../../../../packages/models/src/usage.model.ts";
import { UPLOADS_DIR } from "../../../../../packages/utils/src/constants.util.ts";
import { emitFaceDetected } from "../../../../../packages/utils/src/events.util.ts";
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
		console.log(`Starting face recognition for image: ${imageId}`);

		const image = await prisma.images.findUnique({
			where: { image_id: imageId },
		});

		if (!image) throw new Error("Image not found");

		let albumStorageConfig = null;
		if (albumId) {
			const album = await prisma.albums.findUnique({
				where: { album_id: albumId },
				include: { storage_config: true },
			});
			albumStorageConfig = album?.storage_config;
		}

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
		}

		if (!imageBuffer) throw new Error("Failed to load image buffer");

		const envConfig = config[config.env || "development"];
		const aiServiceUrl = envConfig.ai_service_url;

		// Call AI service for face detection and embedding
		// We send the file as multipart/form-data
		const formData = new FormData();
		const blob = new Blob([imageBuffer], { type: "image/jpeg" });
		formData.append("file", blob, "image.jpg");

		const response = await axios.post(`${aiServiceUrl}/detect`, formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});

		const faces = response.data.faces; // [{ box: [], embedding: [] }]

		if (faces && faces.length > 0) {
			// Save faces to database
			for (const face of faces) {
				await prisma.faces.create({
					data: {
						image_id: imageId,
						bounding_box: face.box,
						embedding: face.embedding,
					},
				});
			}

			// Emit event for real-time updates
			await emitFaceDetected(imageId, albumId);

			// Log usage
			if (image.uploaded_by) {
				await logUsage(
					image.uploaded_by,
					"compute",
					"face_recognition",
					faces.length,
					null,
					{ image_id: imageId, face_count: faces.length },
				);
			}
		}

		console.log(
			`Face recognition completed for ${imageId}. Found ${faces?.length || 0} faces.`,
		);

		return {
			status: "success",
			imageId,
			faceCount: faces?.length || 0,
		};
	} catch (error) {
		console.error("Face recognition worker failed:", error);
		throw error;
	}
};

export default run;
