import Joi from "joi";
import {
	fetchFaceById,
	updateFacePerson,
} from "../../../../../packages/models/src/faces.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	face_id: Joi.number().required(),
	person_id: Joi.string().uuid().allow(null),
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: {
		faceId: "face_id",
		personId: "person_id",
		userId: "user_id",
	},
	response: {
		face_id: "faceId",
		person_id: "personId",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const face = await fetchFaceById(params.face_id);
	if (!face) {
		throw new NotFoundError("Face not found.");
	}

	const updatedFace = await updateFacePerson(
		params.face_id,
		params.person_id,
		params.user_id,
	);

	return aliaserSpec(aliasSpec.response, updatedFace);
};

export default service;
