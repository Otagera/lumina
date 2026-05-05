import Joi from "joi";
import { unignoreFace } from "../../../../../packages/models/src/faces.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { checkTaggingPolicy } from "../../routes/middleware/policy.middleware.ts";

const spec = Joi.object({
	face_id: Joi.number().required(),
	person_id: Joi.string().required(),
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: {
		faceId: "face_id",
		personId: "person_id",
		userId: "user_id",
	},
	response: { status: "status", message: "message" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Enforce policy
	await checkTaggingPolicy({ faceId: params.face_id, userId: params.user_id });

	await unignoreFace(params.person_id, params.face_id, params.user_id);

	return { status: "completed", message: "Face un-ignored successfully." };
};

export const unignoreFaceService = service;
