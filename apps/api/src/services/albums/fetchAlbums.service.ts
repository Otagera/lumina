import joi from "joi";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getAlbumsForUser } from "./albums.lib";

const spec = joi.object({
	created_by: joi.string().required(),
});

const aliasSpec = {
	request: {
		userId: "created_by",
	},
	response: {
		albums: "albums",
	},
	album: {
		album_id: "id",
		album_name: "albumName",
		created_by: "userId",
		creation_date: "createdAt",
		shared_link: "sharedLink",
		coverImages: "coverImages",
		coverImage: "coverImage",
		_count: "_count",
		settings: "settings",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const { created_by } = validateSpec(spec, aliasReq);

	const albums = await getAlbumsForUser(created_by);

	const mappedAlbums = albums.map((album: any) => {
		let coverImage: string | null = null;

		// MANUAL: if cover_image is set and not deleted
		if (album.cover_image && !album.cover_image.deleted_at) {
			coverImage = normalizeImagePath(album.cover_image.image_path);
		}

		// FALLBACK: first 4 images if no manual cover set
		const coverImages = coverImage
			? []
			: album.album_images
					?.slice(0, 4)
					.map((ai: any) => ai.images?.image_path)
					.filter(Boolean)
					.map(normalizeImagePath) || [];

		return {
			...album,
			coverImages,
			coverImage,
			_count: {
				images: album._count?.album_images || 0,
			},
		};
	});

	const aliasRes = aliaserSpec(aliasSpec.response, {
		albums: mappedAlbums.map((album) => aliaserSpec(aliasSpec.album, album)),
	});
	return aliasRes;
};

export const fetchAlbumsService = service;
