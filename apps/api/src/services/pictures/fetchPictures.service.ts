import dayjs from "dayjs";
import Joi from "joi";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import { PaginationTypeEnum } from "../../../../../packages/utils/src/pagination.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { getImagesPaginaton } from "./pictures.lib.ts";

const spec = Joi.object({
	uploaded_by: Joi.string().uuid().required(),
	album_id: Joi.string().uuid(),
	page: Joi.number().optional().default(1),
	limit: Joi.number().optional().default(10),
	next_cursor: Joi.string().base64().message("Invalid cursor"),
	prev_cursor: Joi.string().base64().message("Invalid cursor"),
	pagination_type: Joi.string()
		.valid(...Object.values(PaginationTypeEnum))
		.optional()
		.default(PaginationTypeEnum.OFFSET),
	from: Joi.date().optional(),
	to: Joi.date().optional(),
}).custom((obj, helpers) => {
	const from_date = dayjs(obj.from);
	const to_date = dayjs(obj.to);

	const diff_in_years = to_date.diff(from_date, "year", true);
	if (diff_in_years > 1) {
		return helpers.message({
			custom: "The date range should be within a year.",
		});
	}

	return obj;
});

const aliasSpec = {
	request: {
		userId: "uploaded_by",
		albumId: "album_id",
		page: "page",
		limit: "limit",
		nextCursor: "next_cursor",
		prevCursor: "prev_cursor",
		paginationType: "pagination_type",
		from: "from",
		to: "to",
	},
	response: { images: "images", pagination: "pagination" },
	image: {
		image_id: "imageId",
		faces: "faces",
		image_path: "imagePath",
		upload_date: "uploadDate",
		update_date: "updateDate",
		original_size: "originalSize",
		uploaded_by: "userId",
	},
	pagination: {
		total_pages: "totalPages",
		total: "total",
		current_page: "currentPage",
		limit: "limit",
		has_previous_page: "hasPreviousPage",
		has_next_page: "hasNextPage",
		is_first_page: "isFirstPage",
		is_last_page: "isLastPage",
		item_start: "itemStart",
		item_end: "itemEnd",
		//cursor pagination
		next_cursor: "nextCursor",
		previous_cursor: "previousCursor",
		// limit: "limit",
		has_more_items: "hasMoreItems",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	const { pagination, images } = await getImagesPaginaton(params);
	const aliasImages = images.map((image) => {
		return aliaserSpec(aliasSpec.image, {
			...image,
			original_size: {
				height: image.original_height,
				width: image.original_width,
			},
			image_path: normalizeImagePath(
				image.image_path,
				image.storage_provider,
				image.storage_key,
			),
		});
	});
	const aliasPageInfo = aliaserSpec(aliasSpec.pagination, pagination);
	const aliasRes = aliaserSpec(aliasSpec.response, {
		images: aliasImages,
		pagination: aliasPageInfo,
	});

	return aliasRes;
};

export default service;
