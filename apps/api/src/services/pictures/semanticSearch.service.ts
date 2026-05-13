import axios from "axios";
import config from "../../../../../packages/config/src/index.config.ts";
import { searchImagesByEmbedding } from "../../../../../packages/models/src/images.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import Joi from "joi";

const spec = Joi.object({
	query: Joi.string().required().min(2),
	albumId: Joi.string().uuid().optional(),
	shareToken: Joi.string().optional(),
	limit: Joi.number().integer().min(1).max(100).default(20),
});

const aliasSpec = {
	request: {
		query: "query",
		albumId: "albumId",
		shareToken: "shareToken",
		limit: "limit",
	},
	response: {
		images: "images",
	},
};

const service = async (params: any) => {
	const data = validateSpec(spec, params);
	const { query, albumId, shareToken, limit } = data;

	const envConfig = config[config.env || "development"];
	const aiServiceUrl = envConfig.ai_service_url;

	console.log(`[SEARCH] Query: "${query}", Album: ${albumId || shareToken || 'Global'}`);

	// 1. Get embedding for the text query
	const response = await axios.post(`${aiServiceUrl}/embed`, {
		text: query,
	});

	const queryEmbedding = response.data.embedding;

	// 2. Perform vector search using the model
	const rawImages = await searchImagesByEmbedding({
		embedding: queryEmbedding,
		albumId,
		shareToken,
		limit,
	});

	console.log(`[SEARCH] Found ${rawImages.length} results`);
	if (rawImages.length > 0) {
		console.log(`[SEARCH] First Result Keys: ${Object.keys(rawImages[0]).join(', ')}`);
	}

	// 3. Map to camelCase and normalize paths
	const mappedImages = rawImages.map((img: any) => {
		const normalizedPath = normalizeImagePath(
			img.image_path,
			img.storage_provider,
			img.storage_key,
		);

		if (normalizedPath && !normalizedPath.startsWith("http")) {
			console.warn(`[SEARCH] Potential normalization failure: ${img.image_path} -> ${normalizedPath}`);
		}

		return {
			imageId: img.image_id,
			imagePath: normalizedPath,
			status: img.status,
			uploadDate: img.upload_date,
			originalSize: {
				width: img.original_width,
				height: img.original_height,
			}
		};
	});

	return aliaserSpec(aliasSpec.response, {
		images: mappedImages
	});
};

export const semanticSearchService = service;
