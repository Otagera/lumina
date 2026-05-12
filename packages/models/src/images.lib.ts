import { linkGuestImagesToUser } from "./images.model";

const mergeGuestImages = async (guestSessionId: string, userId: string) => {
	return await linkGuestImagesToUser(guestSessionId, userId);
};

export { mergeGuestImages };