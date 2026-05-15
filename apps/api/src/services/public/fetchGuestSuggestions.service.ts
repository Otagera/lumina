import Joi from "joi";
import { findMatchesForEmbedding } from "../../../../../packages/models/src/faces.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	embedding: Joi.array().items(Joi.number()).required(),
	shareToken: Joi.string().required(),
	limit: Joi.number().integer().min(1).max(20).default(10),
});

const aliasSpec = {
	response: {
		suggestions: "suggestions",
	},
	suggestion: {
		faceId: "faceId",
		imageId: "imageId",
		similarity: "similarity",
		imagePath: "imagePath",
		boundingBox: "boundingBox",
	},
};

const service = async (params: any) => {
	const data = validateSpec(spec, params);
	const { embedding, shareToken, limit } = data;

	const suggestions = await findMatchesForEmbedding({
		embedding,
		shareToken,
		limit,
		threshold: 0.15, // High similarity for confirmation
	});

	const mappedSuggestions = suggestions.map((s) => {
		const normalizedPath = normalizeImagePath(
			s.imagePath,
			s.storageProvider,
			s.storageKey,
		);

		return aliaserSpec(aliasSpec.suggestion, {
			...s,
			imagePath: normalizedPath,
			similarity: 1 - s.distance,
		});
	});

	return aliaserSpec(aliasSpec.response, {
		suggestions: mappedSuggestions,
	});
};

export const fetchGuestSuggestionsService = service;
