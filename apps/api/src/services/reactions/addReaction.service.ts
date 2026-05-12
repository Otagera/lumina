import Joi from "joi";
import { emitReactionAdded } from "../../../../../packages/utils/src/events.util.ts";
import { addReaction, getReactionCount } from "../../../../../packages/models/src/reactions.lib.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	imageId: Joi.string().uuid().required(),
	albumId: Joi.string().uuid().optional(),
	type: Joi.string().default("HEART"),
	userId: Joi.string().uuid().optional(),
	guestSessionId: Joi.string().uuid().optional(),
});

const aliasSpec = {
	request: {
		imageId: "imageId",
		albumId: "albumId",
		type: "type",
		userId: "userId",
		guestSessionId: "guestSessionId",
	},
	response: {
		reaction_id: "reactionId",
		image_id: "imageId",
		type: "type",
		user_id: "userId",
		guest_session_id: "guestSessionId",
	},
};

export const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { imageId, albumId, type, userId, guestSessionId } = params;

	const reactionType = type || "HEART";

	const reaction = await addReaction({
		image_id: imageId,
		type: reactionType,
		user_id: userId,
		guest_session_id: guestSessionId,
	});

	const count = await getReactionCount(imageId, reactionType);

	await emitReactionAdded({
		imageId,
		albumId,
		type: reactionType,
		count,
	});

	return aliaserSpec(aliasSpec.response, {
		reaction_id: reaction.reaction_id,
		image_id: reaction.image_id,
		type: reaction.type,
		user_id: reaction.user_id,
		guest_session_id: reaction.guest_session_id,
		count,
	});
};

export const addReactionService = service;