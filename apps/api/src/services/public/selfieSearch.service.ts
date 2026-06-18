import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { searchFacesByEmbedding } from "../../../../../packages/models/src/faces.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { validateFileFromBuffer } from "../../../../../packages/utils/src/file-validator.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const spec = Joi.object({
	share_token: Joi.string().required(),
	selfie: Joi.any().required(),
});

const aliasSpec = {
	request: { token: "share_token", selfie: "selfie" },
	response: { faces: "faces" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// 1. Verify the share token and get albumId
	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: {
			album_images: true,
			// For delivered galleries, also pull source album images
			source_album: {
				include: { album_images: true },
			},
		},
	});

	if (!album) throw new NotFoundError("Invalid share token.");

	// 2. Save temporary selfie locally AND to storage
	const tempKey = `temp-selfie-${Date.now()}-${crypto.randomUUID()}`;
	const fileBuffer = Buffer.from(await params.selfie.arrayBuffer());

	// Validate file type
	await validateFileFromBuffer(fileBuffer, params.selfie.name);

	// Save locally for AI service to access
	// Note: UPLOADS_DIR should be defined or imported. Assuming it is available or needs to be src/uploads
	const UPLOADS_DIR = "src/uploads";
	const tempPath = path.resolve(process.cwd(), UPLOADS_DIR, tempKey);
	await fs.writeFile(tempPath, fileBuffer);

	// Also upload to storage if using R2/S3
	const currentStorage = storage.getProviderName();
	if (currentStorage !== "local") {
		await storage.upload(fileBuffer, {
			key: tempKey,
			contentType: params.selfie.type,
		});
	}

	// 3. Call AI service to get embedding
	const aiServiceUrl = config[config.env].ai_service_url;
	const aiResponse = await axios.post(`${aiServiceUrl}/process`, {
		image_path: tempPath,
		image_id: crypto.randomUUID(),
	});

	const faceData = aiResponse.data;

	// Cleanup temp file
	try {
		await fs.unlink(tempPath);
	} catch (_e) {}

	// Also cleanup from storage if using R2/S3
	if (storage.getProviderName() !== "local") {
		await storage.delete(tempKey);
	}

	if (
		!faceData.results ||
		faceData.results.length === 0 ||
		faceData.results[0].faces.length === 0
	) {
		throw new Error("No face detected in the selfie. Please try again.");
	}

	const searchEmbedding = faceData.results[0].faces[0].embedding;

	// 4. Perform scoped vector search (include source album images for cross-album search)
	const ownImageIds = album.album_images.map((ai) => ai.image_id);
	const sourceImageIds = (album as any).source_album?.album_images?.map((ai: any) => ai.image_id) ?? [];
	const albumImageIds = [...new Set([...ownImageIds, ...sourceImageIds])];

	const searchResults = await searchFacesByEmbedding({
		embedding: searchEmbedding,
		threshold: 0.6,
		limit: 50,
		imageIds: albumImageIds as string[],
	});

	// 5. Transform results
	const formattedResults = searchResults.map((result) => ({
		...result,
		imagePath: normalizeImagePath(
			result.imagePath,
			result.storageProvider,
			result.storageKey,
		),
		originalSize: {
			width: result.originalWidth,
			height: result.originalHeight,
		},
	}));

	// Fire-and-forget search tracking
	prisma.album_views
		.create({
			data: {
				album_id: album.album_id,
				session_hash: null,
				view_type: "selfie_search",
			},
		})
		.catch(() => {});

	return { faces: formattedResults };
};

export const selfieSearchService = service;
