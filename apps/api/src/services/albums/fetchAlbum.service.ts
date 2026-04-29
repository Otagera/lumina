import joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getAlbum } from "./albums.lib.ts";

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
		storage_config_id: "storageConfigId",
		storage_config: "storageConfig",
		creation_date: "createdAt",
		shared_link: "sharedLink",
		share_token: "shareToken",
		settings: "settings",
		album_members: "members",
	},
};
const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const album = await getAlbum(params);

	const aliasRes = aliaserSpec(aliasSpec.response, album);
	return aliasRes;
};

export const fetchAlbumService = service;
