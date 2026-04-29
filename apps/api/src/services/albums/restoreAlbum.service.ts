import joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { restoreAlbum } from "./albums.lib";

const spec = joi.object({
	album_id: joi.string().required(),
	created_by: joi.string().required(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		userId: "created_by",
	},
	response: {
		album_id: "id",
		album_name: "albumName",
		created_by: "userId",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const restoredAlbum = await restoreAlbum(params.album_id, params.created_by);

	return aliaserSpec(aliasSpec.response, restoredAlbum);
};

export const restoreAlbumService = service;
