import Joi from "joi";
import { unignoreFace } from "../../../../../packages/models/src/faces.model.ts";
import { checkTaggingPolicy } from "../../routes/middleware/policy.middleware.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	faceId: Joi.number().required(),
	personId: Joi.string().required(),
	userId: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: {},
	response: { status: "status", message: "message" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	// Enforce policy
	await checkTaggingPolicy({ faceId: params.faceId, userId: params.userId });

	await unignoreFace(params.personId, params.faceId, params.userId);

	return { status: "completed", message: "Face un-ignored successfully." };
};

export const unignoreFaceService = service;
