import joi from "joi";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getAlbumLinks } from "./albums.lib";

const spec = joi.object({
	album_id: joi.string().required(),
	user_id: joi.string().required(),
	status: joi.string().valid("APPROVED", "PENDING", "REJECTED").optional(),
	limit: joi.alternatives().try(joi.number(), joi.string()).optional(),
	nextCursor: joi.string().optional(),
	paginationType: joi.string().optional(),
	// Filters
	startDate: joi.date().optional(),
	endDate: joi.date().optional(),
	uploaderId: joi.string().uuid().optional(),
	minFaces: joi.number().min(0).optional(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		userId: "user_id",
		status: "status",
		limit: "limit",
		nextCursor: "nextCursor",
		paginationType: "paginationType",
		startDate: "startDate",
		endDate: "endDate",
		uploaderId: "uploaderId",
		minFaces: "minFaces",
	},
	response: {
		album_id: "albumId",
		imagesInAlbum: "imagesInAlbum",
		pagination: "pagination",
	},
	image: {
		image_id: "imageId",
		faces: "faces",
		image_path: "imagePath",
		status: "status",
		upload_date: "uploadDate",
		update_date: "updateDate",
		original_size: "originalSize",
		uploaded_by: "userId",
		users: "user",
		album_images_id: "albumImageId",
		album_id: "albumId",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { limit, nextCursor, paginationType, ...where } = params;
	const take = limit ? Number.parseInt(String(limit), 10) : undefined;
	const options = {
		take,
		cursor: nextCursor ? { album_images_id: nextCursor } : undefined,
		skip: nextCursor ? 1 : undefined,
	};

	const imagesInAlbum = await getAlbumLinks(where, options);

	if (!imagesInAlbum || imagesInAlbum.length === 0) {
		return aliaserSpec(aliasSpec.response, {
			imagesInAlbum: [],
			album_id: params.album_id,
			pagination: {
				nextCursor: null,
			},
		});
	}

	const aliasImagesInAlbum = imagesInAlbum.map((_image) => {
		const imageData = aliaserSpec(aliasSpec.image, {
			..._image.images,
			original_size: {
				height: _image.images.original_height,
				width: _image.images.original_width,
			},
			image_path: normalizeImagePath(_image.images.image_path),
		});

		return {
			albumId: _image.album_id,
			imageId: _image.image_id,
			albumImageId: _image.album_images_id,
			images: imageData,
		};
	});

	// Determine next cursor
	let newNextCursor = null;
	if (take && imagesInAlbum.length === take) {
		const lastItem = imagesInAlbum[imagesInAlbum.length - 1];
		newNextCursor = lastItem.album_images_id;
	}

	const aliasRes = aliaserSpec(aliasSpec.response, {
		imagesInAlbum: aliasImagesInAlbum,
		album_id: params.album_id,
		pagination: {
			nextCursor: newNextCursor,
		},
	});
	return aliasRes;
};

export const fetchImagesInAlbumService = service;
