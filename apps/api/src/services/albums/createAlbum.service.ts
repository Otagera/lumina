import joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { createAlbum } from "./albums.lib.ts";

const spec = joi.object({
	album_name: joi.string().required(),
	created_by: joi.string().required(),
});

const aliasSpec = {
	request: {
		albumName: "album_name",
		userId: "created_by",
	},
	response: {
		album_id: "id",
		album_name: "albumName",
		created_by: "userId",
		creation_date: "createdAt",
		shared_link: "sharedLink",
		share_token: "shareToken",
	},
};

const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const newAlbum = await createAlbum(params);

	const aliasRes = aliaserSpec(aliasSpec.response, newAlbum);
	return aliasRes;
};

export const createAlbumService = service;
