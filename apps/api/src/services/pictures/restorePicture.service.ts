import Joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { restoreImages } from "./pictures.lib.ts";

const spec = Joi.object({
	imageIds: Joi.array().items(Joi.string().uuid()).required(),
	userId: Joi.string().uuid().required(),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	await restoreImages(params.imageIds);

	return { success: true };
};

export default service;
