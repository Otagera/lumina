import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
	status: Joi.string().optional(),
	startDate: Joi.string().optional(),
	endDate: Joi.string().optional(),
	uploaderId: Joi.string().uuid().optional(),
	minFaces: Joi.number().optional(),
	guestSessionId: Joi.string().uuid().optional(),
});

const aliasSpec = {
	request: {
		token: "share_token",
		guestSessionId: "guest_session_id",
	},
	response: {
		id: "albumId",
		albumName: "albumName",
		settings: "settings",
		canUpload: "canUpload",
		images: "images",
	},
	image: {
		image_id: "imageId",
		image_path: "imagePath",
		original_width: "originalSize.width",
		original_height: "originalSize.height",
		status: "isPending",
	},
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// Build image filter
	const imageFilter: any = { deleted_at: null };

	if (params.status) {
		imageFilter.status = params.status;
	} else {
		imageFilter.OR = [
			{ status: "APPROVED" },
			{ guest_session_id: params.guest_session_id },
		];
	}

	if (params.uploaderId) imageFilter.uploaded_by = params.uploaderId;

	if (params.startDate || params.endDate) {
		imageFilter.upload_date = {};
		if (params.startDate) imageFilter.upload_date.gte = new Date(params.startDate);
		if (params.endDate) imageFilter.upload_date.lte = new Date(params.endDate);
	}

	if (params.minFaces !== undefined) {
		imageFilter.faces = {
			_count: { gte: Number.parseInt(String(params.minFaces), 10) },
		};
	}

	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: {
			album_images: {
				include: { images: { include: { faces: true } } },
				where: { images: imageFilter },
			},
			settings: true,
		},
	});

	if (!album) throw new NotFoundError("Album not found or link expired.");

	const isCollaborative = album.settings?.is_event && album.settings?.allow_guest_uploads;
	const canUpload =
		isCollaborative &&
		(!album.settings?.expires_at || new Date(album.settings.expires_at) > new Date());

	const images = album.album_images
		.map((ai) => ai.images)
		.filter((img): img is any => img !== null)
		.map((img) => ({
			...img,
			imageId: img.image_id,
			imagePath: normalizeImagePath(img.image_path, img.storage_provider, img.storage_key),
			originalSize: { width: img.original_width, height: img.original_height },
			isPending: img.status === "PENDING",
		}));

	return {
		id: album.album_id,
		albumName: album.album_name,
		settings: album.settings,
		canUpload,
		images,
	};
};

export const getSharedAlbumService = service;
