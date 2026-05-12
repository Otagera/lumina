import prisma from "../../config/src/db.config.ts";

const createReaction = async (data) => {
	return await prisma.reactions.create({
		data,
	});
};

const countReactions = async (image_id: string, type: string) => {
	return await prisma.reactions.count({
		where: {
			image_id,
			type,
		},
	});
};

const linkGuestReactionsToUser = async (
	guest_session_id: string,
	user_id: string,
) => {
	return await prisma.reactions.updateMany({
		where: {
			guest_session_id,
			user_id: null,
		},
		data: {
			user_id,
		},
	});
};

export { createReaction, countReactions, linkGuestReactionsToUser };
