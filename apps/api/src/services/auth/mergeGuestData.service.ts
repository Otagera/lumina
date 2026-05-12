import Joi from "joi";
import { mergeGuestImages } from "../../../../../packages/models/src/images.lib.ts";
import { mergeGuestReactions } from "../../../../../packages/models/src/reactions.lib.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	guestSessionId: Joi.string().uuid().required(),
	userId: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: {
		guestSessionId: "guestSessionId",
		userId: "userId",
	},
	response: {
		images_merged: "imagesMerged",
		reactions_merged: "reactionsMerged",
	},
};

export const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { guestSessionId, userId } = params;

	const imagesResult = await mergeGuestImages(guestSessionId, userId);
	const reactionsResult = await mergeGuestReactions(guestSessionId, userId);

	return aliaserSpec(aliasSpec.response, {
		images_merged: imagesResult.count,
		reactions_merged: reactionsResult.count,
	});
};

export default service;