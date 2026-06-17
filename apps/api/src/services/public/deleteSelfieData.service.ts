import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = joi.object({
	share_token: joi.string().required(),
	guest_session_id: joi.string().uuid().required(),
});

const aliasSpec = {
	request: {
		shareToken: "share_token",
		guestSessionId: "guest_session_id",
	},
};

const service = async (data: { shareToken: string; guestSessionId: string }) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Find album to scope the deletion
	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		select: { album_id: true },
	});

	if (!album) return { deleted: 0 };

	// Find images uploaded by this guest in this album
	const guestImages = await prisma.images.findMany({
		where: {
			guest_session_id: params.guest_session_id,
			album_images: { some: { album_id: album.album_id } },
			deleted_at: null,
		},
		select: { image_id: true },
	});

	if (guestImages.length === 0) return { deleted: 0 };

	const imageIds = guestImages.map((img) => img.image_id);

	const { count } = await prisma.faces.deleteMany({
		where: { image_id: { in: imageIds } },
	});

	return { deleted: count };
};

export const deleteSelfieDataService = service;
