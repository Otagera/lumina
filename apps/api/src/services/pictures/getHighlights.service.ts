import Joi from "joi";
import { fetchAlbumHighlights } from "../../../../../packages/models/src/albums.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
	limit: Joi.number().integer().min(1).max(100).default(10),
});

const aliasSpec = {
	request: {},
	response: {},
};

export const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { token, limit } = params;

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
	}));
};

export const getHighlightsService = service;
