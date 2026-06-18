import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";

const spec = Joi.object({
	album_id: Joi.string().uuid().required(),
	user_id: Joi.string().uuid().required(),
	period: Joi.string().valid("all", "7d").default("all"),
});

const aliasSpec = {
	request: { albumId: "album_id", userId: "user_id" },
	response: {},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	// Verify ownership or admin membership
	const album = await prisma.albums.findUnique({
		where: { album_id: params.album_id },
		include: {
			album_members: {
				where: { user_id: params.user_id, role: { in: ["ADMIN", "CONTRIBUTOR"] } },
			},
		},
	});

	if (!album) throw new NotFoundError("Album not found.");
	if (album.created_by !== params.user_id && album.album_members.length === 0) {
		throw new ForbiddenError("Not authorized to view analytics.");
	}

	const since = params.period === "7d"
		? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		: new Date(0);

	const [views, selfieSearches, textSearches, uniqueVisitorCount, allAlbumImages, reactions] =
		await Promise.all([
			prisma.album_views.count({
				where: { album_id: params.album_id, view_type: "page_view", created_at: { gte: since } },
			}),
			prisma.album_views.count({
				where: { album_id: params.album_id, view_type: "selfie_search", created_at: { gte: since } },
			}),
			prisma.album_views.count({
				where: { album_id: params.album_id, view_type: "text_search", created_at: { gte: since } },
			}),
			prisma.album_views.findMany({
				where: { album_id: params.album_id, view_type: "page_view", session_hash: { not: null } },
				select: { session_hash: true },
				distinct: ["session_hash"],
			}),
			prisma.album_images.findMany({
				where: { album_id: params.album_id },
				include: {
					images: {
						select: {
							uploaded_by: true,
							guest_session_id: true,
							status: true,
						},
					},
				},
			}),
			prisma.reactions.groupBy({
				by: ["type"],
				where: {
					image_id: {
						in: (
							await prisma.album_images.findMany({
								where: { album_id: params.album_id },
								select: { image_id: true },
							})
						).map((ai) => ai.image_id),
					},
				},
				_count: { id: true },
			}),
		]);

	const approvedImages = allAlbumImages
		.map((ai) => ai.images)
		.filter((img): img is any => img !== null && img.status === "APPROVED");

	const guestUploads = approvedImages.filter(
		(img) => !img.uploaded_by && img.guest_session_id,
	).length;
	const hostUploads = approvedImages.filter((img) => !!img.uploaded_by).length;

	const reactionsByType: Record<string, number> = {};
	let totalReactions = 0;
	for (const r of reactions) {
		reactionsByType[r.type] = r._count.id;
		totalReactions += r._count.id;
	}

	// Top 6 most-reacted photos
	const imageIds = allAlbumImages.map((ai) => ai.image_id);
	const topPhotos = await prisma.images.findMany({
		where: {
			image_id: { in: imageIds },
			status: "APPROVED",
			deleted_at: null,
		},
		orderBy: { reactions: { _count: "desc" } },
		take: 6,
		select: {
			image_id: true,
			image_path: true,
			storage_provider: true,
			storage_key: true,
			_count: { select: { reactions: true } },
		},
	});

	return {
		views: {
			total: views,
			uniqueVisitors: uniqueVisitorCount.length,
		},
		searches: {
			selfie: selfieSearches,
			text: textSearches,
		},
		uploads: {
			total: approvedImages.length,
			byGuests: guestUploads,
			byHost: hostUploads,
		},
		reactions: {
			total: totalReactions,
			byType: reactionsByType,
		},
		topPhotos: topPhotos.map((img) => ({
			imageId: img.image_id,
			imagePath: normalizeImagePath(img.image_path, img.storage_provider, img.storage_key),
			reactionCount: img._count.reactions,
		})),
	};
};

export const albumAnalyticsService = service;
