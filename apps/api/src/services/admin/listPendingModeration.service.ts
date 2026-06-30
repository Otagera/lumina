import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(24),
});

const aliasSpec = {
	request: {},
	response: {},
};

export const listPendingModerationService = async (data: {
	page?: number;
	limit?: number;
}) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));
	const skip = (params.page - 1) * params.limit;

	const [images, total] = await Promise.all([
		prisma.images.findMany({
			where: { status: "PENDING", deleted_at: null },
			select: {
				image_id: true,
				image_path: true,
				optimized_path: true,
				storage_provider: true,
				storage_key: true,
				upload_date: true,
				users: { select: { email: true } },
				album_images: {
					select: {
						albums: {
							select: { album_id: true, album_name: true },
						},
					},
					take: 1,
				},
			},
			orderBy: { upload_date: "asc" },
			skip,
			take: params.limit,
		}),
		prisma.images.count({ where: { status: "PENDING", deleted_at: null } }),
	]);

	const normalized = images.map((img) => ({
		image_id: img.image_id,
		upload_date: img.upload_date,
		storage_provider: img.storage_provider,
		uploaderEmail: img.users?.email ?? null,
		albumName: img.album_images?.[0]?.albums?.album_name ?? null,
		albumId: img.album_images?.[0]?.albums?.album_id ?? null,
		imagePath: normalizeImagePath(
			img.optimized_path ?? img.image_path,
			img.storage_provider,
			img.storage_key,
		),
	}));

	return aliaserSpec(aliasSpec.response, {
		images: normalized,
		total,
		page: params.page,
		limit: params.limit,
		pages: Math.ceil(total / params.limit),
	});
};
