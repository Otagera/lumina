import joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { updateAlbum } from "./albums.lib";

const spec = joi.object({
	album_id: joi.string().required(),
	created_by: joi.string().required(),
	album_name: joi.string().optional(),
	share_token: joi.string().optional().allow(null),
	cover_image_id: joi.string().uuid().optional().allow(null),
	settings: joi
		.object({
			is_event: joi.boolean().optional(),
			requires_approval: joi.boolean().optional(),
			tagging_policy: joi.string().valid("HOST_ONLY", "GUESTS_SELF", "ANYONE"),
			expires_at: joi.date().optional().allow(null),
			allow_guest_uploads: joi.boolean().optional(),
		})
		.optional(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		userId: "created_by",
		albumName: "album_name",
		shareToken: "share_token",
		coverImageId: "cover_image_id",
		settings: "settings",
	},
	response: {
		album_id: "id",
		album_name: "albumName",
		created_by: "userId",
		creation_date: "createdAt",
		shared_link: "sharedLink",
		share_token: "shareToken",
		cover_image_id: "coverImageId",
		settings: "settings",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { album_id, created_by, ...albumData } = params;

	const updatedAlbum = await updateAlbum(album_id, created_by, albumData);

	const aliasRes = aliaserSpec(aliasSpec.response, updatedAlbum);
	return aliasRes;
};

export const alterAlbumService = service;
