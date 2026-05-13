import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	user_id: Joi.string().uuid().required(),
});

const aliasSpec = {
	request: { userId: "user_id" },
	response: {
		albums: "albums",
		images: "images",
	},
	album: {
		album_id: "id",
		album_name: "name",
		deleted_at: "deletedAt",
	},
	image: {
		image_id: "id",
		image_path: "path",
		storage_provider: "storageProvider",
		storage_key: "storageKey",
		deleted_at: "deletedAt",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Fetch soft-deleted albums
	const deletedAlbums = await prisma.albums.findMany({
		where: {
			created_by: params.user_id,
			deleted_at: { not: null },
		},
		orderBy: { deleted_at: "desc" },
	});

	// Fetch soft-deleted images
	const deletedImages = await prisma.images.findMany({
		where: {
			uploaded_by: params.user_id,
			deleted_at: { not: null },
		},
		orderBy: { deleted_at: "desc" },
	});

	return {
		albums: deletedAlbums.map((a) => aliaserSpec(aliasSpec.album, a)),
		images: deletedImages.map((img) =>
			aliaserSpec(aliasSpec.image, {
				...img,
				image_path: normalizeImagePath(
					img.image_path,
					img.storage_provider,
					img.storage_key,
				),
			}),
		),
	};
};

export const listTrashService = service;
