import Joi from "joi";
import { findFaceSuggestions } from "../../../../../packages/models/src/faces.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	userId: Joi.string().uuid().required(),
	limit: Joi.number().integer().min(1).max(50).default(10),
});

const aliasSpec = {
	response: {
		suggestions: "suggestions",
	},
	suggestion: {
		faceId: "faceId",
		imageId: "imageId",
		personId: "personId",
		personName: "personName",
		similarity: "similarity",
		imagePath: "imagePath",
		boundingBox: "boundingBox",
	},
};

const service = async (params: any) => {
	const data = validateSpec(spec, params);
	const { userId, limit } = data;

	const suggestions = await findFaceSuggestions(userId, limit);

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

export const fetchSuggestionsService = service;
