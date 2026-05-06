import joi from "joi";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getAlbum, getAlbumForUser } from "./albums.lib.ts";

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
		cover_image: "coverImage",
		cover_images: "coverImages",
	},
};
const service = async (data: unknown) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { album_id, created_by } = params;
	const album = await getAlbumForUser(album_id, created_by);

	// Check if manual cover exists
	const hasManualCover = album.cover_image && !album.cover_image.deleted_at;

	// Format coverImage to match client expectations
	const formattedAlbum = {
		...album,
		coverImage: hasManualCover
			? {
					id: album.cover_image.image_id,
					url: normalizeImagePath(
						album.cover_image.image_path,
						album.cover_image.storage_provider,
						album.cover_image.storage_key,
					),
				}
			: null,
		coverImages: hasManualCover
			? []
			: album.album_images
					?.map((ai: any) => ai.images)
					.filter(Boolean)
					.map((img: any) =>
						normalizeImagePath(
							img.image_path,
							img.storage_provider,
							img.storage_key,
						),
					) || [],
	};

	const aliasRes = aliaserSpec(aliasSpec.response, {
		...formattedAlbum,
		// Use snake_case keys for aliasing
		cover_image: formattedAlbum.coverImage,
		cover_images: formattedAlbum.coverImages,
	});
	return aliasRes;
};

export const fetchAlbumService = service;
