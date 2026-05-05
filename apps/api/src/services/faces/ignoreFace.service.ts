import Joi from "joi";
import { ignoreFace } from "../../../../../packages/models/src/faces.model.ts";
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

	await ignoreFace(params.personId, params.faceId, params.userId);

	return { status: "completed", message: "Face ignored successfully." };
};

export const ignoreFaceService = service;
