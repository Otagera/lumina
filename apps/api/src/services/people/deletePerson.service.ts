import Joi from "joi";
import { deletePerson } from "../../../../../packages/models/src/people.model.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	person_id: Joi.string().uuid().required(),
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { personId: "person_id", userId: "user_id" },
	response: { count: "count" },
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const result = await deletePerson(params.person_id, params.user_id);

	return aliaserSpec(aliasSpec.response, result);
};

export default service;
