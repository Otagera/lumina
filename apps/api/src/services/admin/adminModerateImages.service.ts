import Joi from "joi";
import { moderateImagesQuery } from "../../../../../packages/models/src/images.model.ts";
import { InvalidRequestError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	image_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
	status: Joi.string().valid("APPROVED", "REJECTED").required(),
	reason: Joi.string().optional(),
});

const aliasSpec = {
	request: { imageIds: "image_ids" },
	response: { count: "count", status: "status" },
};

export const adminModerateImagesService = async (data: {
	imageIds: string[];
	status: "APPROVED" | "REJECTED";
	reason?: string;
}) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	if (!params.image_ids || params.image_ids.length === 0) {
		throw new InvalidRequestError("No image IDs provided");
	}

	const result = await moderateImagesQuery(params.image_ids, params.status, params.reason);

	return aliaserSpec(aliasSpec.response, {
		count: result.count,
		status: params.status,
	});
};
