import dayjs from "dayjs";
import prisma from "../../config/src/db.config.ts";
import { models } from "../../models/src/index.model.ts";
import { InvalidRequestError, ValidationError } from "./error.util";

export const PaginationTypeEnum = {
	CURSOR: "cursor",
	OFFSET: "offset",
};

const _paginationAbstract = async (model, { _page, _limit, filter }) => {
	const page = parseInt(_page, 10) || 1;
	const limit = parseInt(_limit, 10) || 25;
	const startIndex = (page - 1) * limit;
	const endIndex = page * limit;
	const total = await model.countDocuments();

	const pagination = {};
	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit,
		};
	}
	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		};
	}

	const data = await model.find(filter, null, {
		skip: startIndex,
		limit,
	});
	return { pagination, count: data.length, data };
};

const buildQuery = (params) => {
	const filter: any = { deleted_at: null };
	const other_options: any = {};

	if (params.from || params.to) {
		const from_date = dayjs.utc(params.from);
		const to_date = dayjs.utc(params.to);

		// Check if 'to' date is in the past
		if (to_date?.isBefore(from_date, "day")) {
			throw new ValidationError('The "to" date must not be in the past');
		}

		// Check if the difference between 'from' and 'to' exceeds a year
		if (from_date && to_date) {
			const diff_in_days = to_date.diff(from_date, "day");
			if (diff_in_days > 365) {
				throw new ValidationError("The date range should be within a year.");
			}
		}

		filter.upload_date = {
			...(from_date && {
				gte: from_date.startOf("day").toDate(),
			}),
			...(to_date && {
				lte: to_date.endOf("day").toDate(),
			}),
		};
	}

	if (params.uploaded_by) {
		filter.uploaded_by = params.uploaded_by;
	}
	if (params.album_id) {
		filter.album_images = { some: { album_id: params.album_id } };
	}

	if (params.next_cursor) {
		const next_cursor = decode_cursor(params.next_cursor);
		filter.image_id = { lt: next_cursor };
		other_options.orderBy = { image_id: "desc" };
	} else if (params.prev_cursor) {
		const previous_cursor = decode_cursor(params.prev_cursor);
		filter.image_id = { gt: previous_cursor };
		other_options.orderBy = { image_id: "asc" };
	} else {
		other_options.orderBy = { image_id: "desc" };
	}

	return { filter, other_options };
};

export const decode_cursor = (cursor) => {
	if (!cursor) {
		return null;
	}

	try {
		return JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));
	} catch (_e) {
		throw new InvalidRequestError("Invalid cursor value");
	}
};

const encode_cursor = (cursor) => {
	if (!cursor) return null;
	return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

/**
 * Paginate query result
 * @param model - model name
 * @param limit - query limit
 * @param next_cursor - next cursor id
 * @param previous_cursor - previous cursor id
 * @param collection_key - label for the paginated items. Default: items
 * @param options - other query options such as WHERE clause, ATTRIBUTES, INCLUDE, ORDER, etc
 */
export const cursorPagination = async (
	model,
	limit,
	next_cursor,
	previous_cursor,
	collection_key,
	params = {},
) => {
	const query = buildQuery(params);
	const other_options = query.other_options;
	const filter = query.filter;

	if (!models.includes(model)) {
		throw new InvalidRequestError(
			"Invalid model name. Ensure the model exists in the database.",
		);
	}
	const key = collection_key || model || "items";

	let data = await prisma[model].findMany({
		...other_options,
		where: { ...filter },
		include: {
			faces: true,
		},
		take: limit + 1,
	});

	if (previous_cursor && data?.length) {
		data = data.sort((x, y) => {
			if (x.image_id > y.image_id) return -1;
			if (x.image_id < y.image_id) return 1;
			return 0;
		});
	} else {
		data = data.sort((x, y) => x.image_id - y.image_id);
	}

	// Check if there's a next page by inspecting if we fetched an extra item
	let has_next = data?.length > limit;
	let has_previous = !!previous_cursor || (!!next_cursor && data?.length > 0);

	// Remove the extra item if more than limit were fetched
	if (has_previous && previous_cursor) {
		// If fewer than limit + 1 records were fetched, you're on the first page while using the previous cursor
		if (!has_next) {
			// No more records before the current set
			has_previous = false;
			// if you are on the last page while moving backwards using previous_cursor, there's a next page
			has_next = true;
		} else {
			// Remove the extra item used to detect the previous page when moving backward
			data.shift();
		}
	} else if (has_next) {
		data.pop();
	}

	const first_item = data[0]?.image_id;
	const last_item = data[data.length - 1]?.image_id;

	const next_page_cursor = has_next ? encode_cursor(last_item) : null;
	const previous_page_cursor = has_previous ? encode_cursor(first_item) : null;

	const cursor_details = {
		next_cursor: next_page_cursor,
		previous_cursor: previous_page_cursor,
		limit: limit,
		has_more_items: !!has_next || !!has_previous || false,
	};

	return {
		pagination: cursor_details,
		[key]: data,
	};
};

/**
 * Paginate query result
 * @param model - model name
 * @param page - current page index
 * @param limit - query limit
 * @param collection_key - label for the paginated items. Default: items
 * @param options - other sequelize query options such as WHERE clause, ATTRIBUTES, INCLUDE, ORDER, etc
 */
export const offsetPagination = async (
	model,
	page = 1,
	limit = 10,
	collection_key,
	params = {},
) => {
	const query = buildQuery(params);
	const other_options = query.other_options;
	const filter = query.filter;

	if (!models.includes(model)) {
		throw new InvalidRequestError(
			"Invalid model name. Ensure the model exists in the database.",
		);
	}

	if (page < 1) {
		throw new InvalidRequestError("Page index must be 1 or greater.");
	}
	if (limit < 1) {
		throw new InvalidRequestError("Limit must be 1 or greater.");
	}

	const skip = (page - 1) * limit;
	const key = collection_key || model || "items";

	const total = await prisma[model].count({ where: { ...filter } });

	let data = await prisma[model].findMany({
		...other_options,
		where: { ...filter },
		include: {
			faces: true,
		},
		take: limit,
		skip,
	});

	const pageCount = Math.ceil(total / limit);
	data = data.sort((x, y) => {
		if (x.image_id > y.image_id) return -1;
		if (x.image_id < y.image_id) return 1;
		return 0;
	});

	const pagination = {
		total_pages: pageCount,
		total,
		current_page: page,
		limit,
		has_previous_page: page > 1,
		has_next_page: page < pageCount,
		is_first_page: page === 1,
		is_last_page: page === pageCount,
		item_start: skip + 1,
		item_end: Math.min(skip + limit, total),
	};

	return {
		pagination,
		[key]: data,
	};
};

/**
 * Convert paginated instance of one class to another
 * @param source - paginated instance to be converted
 * @param converter - converter callback function that accept `items` and return the converted items
 * @param collection_key - label for the paginated items. Default: items
 * @returns
 */
export const fromPaginator = (source, converter, collection_key) => {
	const key = collection_key || "items";

	const result = {
		[key]: source[key]?.map(converter),
	};

	if (source.cursor) {
		result.cursor = source.cursor;
	} else {
		result.pagination = source.pagination;
	}

	return result;
};
