import joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	cacheDelPattern,
	cacheKeys,
} from "../../../../../packages/utils/src/cache.util.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { deleteAlbumImages, getAlbumLinksForDelete } from "./albums.lib";

const spec = joi.object({
	image_ids: joi.array().items(joi.string().uuid()).required(),
	album_id: joi.string().uuid().required(),
	user_id: joi.string().uuid().required(),
});

const aliasSpec = {
	request: {
		imageIds: "image_ids",
		albumId: "album_id",
		userId: "user_id",
	},
	response: {
		album_id: "id",
		album_name: "albumName",
		created_by: "userId",
		creation_date: "createdAt",
		shared_link: "sharedLink",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const { image_ids, album_id, user_id } = validateSpec(spec, aliasReq);

	const albumLinks = await getAlbumLinksForDelete({
		image_ids,
		album_id,
		user_id,
	});
	if (!albumLinks || albumLinks.length === 0) {
		throw new NotFoundError("Image(s) not found in album.");
	}

	const deletedAlbum = await deleteAlbumImages(album_id, image_ids);

	prisma.albums
		.findUnique({ where: { album_id }, select: { share_token: true } })
		.then((a) => { if (a?.share_token) cacheDelPattern(cacheKeys.publicAlbumPattern(a.share_token)); })
		.catch(() => {});

	const aliasRes = aliaserSpec(aliasSpec.response, deletedAlbum);
	return aliasRes;
};

export const updateImagesInAlbumStatusService = service;
export const removeImagesInAlbumService = updateImagesInAlbumStatusService;
