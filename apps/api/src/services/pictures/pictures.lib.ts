import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	deleteImage,
	fetchFaces,
	fetchImage,
	fetchImages,
	fetchImagesByIds,
	restoreImagesByIds,
	softDeleteImagesByIds,
	uploadImage,
	uploadImages,
} from "../../../../../packages/models/src/images.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	cursorPagination,
	decode_cursor,
	offsetPagination,
	PaginationTypeEnum,
} from "../../../../../packages/utils/src/pagination.util.ts";

const validateImageData = (imageData) => {
	if (!imageData.image_path) {
		throw new Error("Image path: image_path is required");
	}

	if (!imageData.original_width) {
		throw new Error("Width: original_width is required");
	}
	if (!imageData.original_height) {
		throw new Error("Height: original_height is required");
	}
};

export const createImage = async (imageData) => {
	const { album_id, ...rest } = imageData;
	validateImageData(rest);
	const image = await uploadImage(rest);

	if (album_id) {
		await prisma.album_images.create({
			data: {
				album_id,
				image_id: image.image_id,
			},
		});
	}

	return image;
};

export const createImages = async (imagesData) => {
	if (!Array.isArray(imagesData)) {
		throw new Error("imagesData must be an array");
	}
	imagesData.forEach((imageData) => {
		validateImageData(imageData);
	});
	return await uploadImages(imagesData);
};

export const getFaces = async (where) => {
	const { image_id, uploaded_by } = where;
	if (!image_id) {
		throw new Error("No image_id provided.");
	}
	if (!uploaded_by) {
		throw new Error("No uploaded_by provided.");
	}
	await getImage({ image_id, uploaded_by });
	return fetchFaces({ image_id, uploaded_by });
};

export const getImage = async (where) => {
	if (!where) {
		throw new Error("No where clause provided.");
	}
	if (!where.uploaded_by && !where.image_id) {
		if (!where.uploaded_by) {
			throw new Error("No uploaded_by provided.");
		}
		if (!where.image_id) {
			throw new Error("No image_id provided.");
		}
	}

	const image = await fetchImage(where);
	if (!image) {
		throw new NotFoundError("Image not found.");
	}
	return image;
};

export const getImageById = async (where) => fetchImage(where);
export const getImagesByIds = async (where) => fetchImagesByIds(where);

export const getImages = async (where) => {
	if (!where) {
		throw new Error("No where clause provided.");
	}
	if (!where.uploaded_by) {
		if (!where.uploaded_by) {
			throw new Error("No uploaded_by provided.");
		}
	}
	const { uploaded_by } = where;

	return fetchImages({ uploaded_by });
};

export const getImagesPaginaton = async (params) => {
	if (!params) {
		throw new Error("No params clause provided.");
	}

	const model = "images";
	const { page, limit, pagination_type, ...paramsRest } = params;
	const nextCursorDecoded = decode_cursor(paramsRest.next_cursor);
	const previousCursorDecoded = decode_cursor(paramsRest.previous_cursor);
	let paginatedImages;

	if (pagination_type === PaginationTypeEnum.CURSOR) {
		paginatedImages = await cursorPagination(
			model,
			limit,
			nextCursorDecoded,
			previousCursorDecoded,
			model,
			{ ...paramsRest, deleted_at: null },
		);
	} else {
		paginatedImages = await offsetPagination(model, page, limit, model, {
			...paramsRest,
			deleted_at: null,
		});
	}

	return paginatedImages;
};

export const removeImage = async (where) => {
	if (!where) {
		throw new Error("No where clause provided.");
	}
	if (!where.uploaded_by && !where.image_id) {
		if (!where.uploaded_by) {
			throw new Error("No uploaded_by provided.");
		}
		if (!where.image_id) {
			throw new Error("No image_id provided.");
		}
	}

	const image = await fetchImage(where);
	if (!image) {
		throw new NotFoundError("Image not found.");
	}
	return await softDeleteImagesByIds([where.image_id]);
};

export const restoreImages = async (imageIds: string[]) => {
	return await restoreImagesByIds(imageIds);
};
