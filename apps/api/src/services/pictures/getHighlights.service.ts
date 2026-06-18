import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { fetchAlbumHighlights } from "../../../../../packages/models/src/albums.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
	limit: Joi.number().integer().min(1).max(100).default(20),
});

const aliasSpec = {
	request: {},
	response: {},
};

export const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { token, limit } = params;

	const album = await prisma.albums.findUnique({
		where: { share_token: token },
		select: { album_id: true },
	});

	if (!album) return [];

	// Check curated highlights first
	const curated = await prisma.album_highlights.findUnique({
		where: { album_id: album.album_id },
	});

	if (curated?.status === "ready" && Array.isArray(curated.image_ids) && curated.image_ids.length > 0) {
		const imageIds = curated.image_ids as string[];
		const images = await prisma.images.findMany({
			where: { image_id: { in: imageIds }, status: "APPROVED", deleted_at: null },
			select: {
				image_id: true,
				image_path: true,
				storage_provider: true,
				storage_key: true,
				original_width: true,
				original_height: true,
				status: true,
				_count: { select: { reactions: true } },
			},
		});
		// Preserve curated order
		const imageMap = new Map(images.map((img) => [img.image_id, img]));
		const ordered = imageIds.map((id) => imageMap.get(id)).filter(Boolean) as typeof images;

		return ordered.map((img) => ({
			imageId: img.image_id,
			imagePath: normalizeImagePath(img.image_path, img.storage_provider, img.storage_key),
			originalSize: { width: img.original_width, height: img.original_height },
			status: img.status,
			reactionCount: img._count.reactions,
			curated: true,
		}));
	}

	// Fallback to reaction-sorted
	const images = await fetchAlbumHighlights(token, limit);

	return images.map((img) => ({
		imageId: img.image_id,
		imagePath: normalizeImagePath(
			img.image_path,
			img.storage_provider,
			img.storage_key,
		),
		originalSize: { width: img.original_width, height: img.original_height },
		status: img.status,
		reactionCount: img._count.reactions,
		curated: false,
	}));
};

export const getHighlightsService = service;
