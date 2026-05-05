import Joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { restoreImages } from "./pictures.lib.ts";

const spec = Joi.object({
	imageIds: Joi.array().items(Joi.string().uuid()).required(),
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: { success: "success" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	await restoreImages(params.user_id, params.imageIds);

	return aliaserSpec(aliasSpec.response, { success: true });
};

export default service;
