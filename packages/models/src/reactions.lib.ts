import { createReaction, countReactions, linkGuestReactionsToUser } from "./reactions.model";

const addReaction = async (data) => {
	return await createReaction(data);
};

const getReactionCount = async (imageId: string, type: string) => {
	return await countReactions(imageId, type);
};

const mergeGuestReactions = async (guestSessionId: string, userId: string) => {
	return await linkGuestReactionsToUser(guestSessionId, userId);
};

export { addReaction, getReactionCount, mergeGuestReactions };