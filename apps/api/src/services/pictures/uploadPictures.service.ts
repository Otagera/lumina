import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	getUserPlanLimits,
	getUserUsage,
	logUsage,
} from "../../../../../packages/models/src/usage.model.ts";
import {
	getImageSize,
	isImageCorrupted,
	normalizeImagePath,
} from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { queueServices } from "../../../../worker/src/queue/queue.service.ts";
import { createImage, getImagesByIds } from "./pictures.lib";

const fileSchema = Joi.object({
	fieldname: Joi.string().valid("uploadedImages").required(),
	originalname: Joi.string().required(),
	encoding: Joi.string().required(),
	mimetype: Joi.string().required(),
	destination: Joi.string().required(),
	filename: Joi.string().required(),
	path: Joi.string().required(),
	size: Joi.number()
		.max(500 * 1024 * 1024)
		.required(), // Increased to 500MB
	storage_provider: Joi.string().optional(),
	storage_key: Joi.string().optional(),
	file_hash: Joi.string().optional(),
});

const spec = Joi.object({
	album_id: Joi.string().uuid().optional(),
	uploaded_by: Joi.string().uuid().optional(),
	guest_session_id: Joi.string().uuid().optional(),
	status: Joi.string()
		.valid("PENDING", "APPROVED", "REJECTED")
		.default("APPROVED"),
	files: Joi.array().items(fileSchema).min(1).max(50).required(),
});

const aliasSpec = {
	request: {
		albumId: "album_id",
		files: "files",
		userId: "uploaded_by",
		guestSessionId: "guest_session_id",
		status: "status",
	},
	response: {
		images: "images",
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
		guest_session_id: "guestSessionId",
	},
};

const storeImage = async (
	file,
	uploaded_by,
	guest_session_id,
	status,
	album_id,
) => {
	const imagePath = file.path;
	const imageSize = await getImageSize(imagePath);
	const isCorrupted = await isImageCorrupted(imagePath);
	if (isCorrupted) {
		throw new Error(`Image: ${file.filename} is corrupted`);
	}

	const imageData: any = {
		image_path: imagePath,
		original_height: imageSize.height,
		original_width: imageSize.width,
		size: file.size,
		uploaded_by,
		guest_session_id,
		status,
		file_hash: file.file_hash,
		album_id,
	};

	if (file.storage_provider && file.storage_key) {
		imageData.storage_provider = file.storage_provider;
		imageData.storage_key = file.storage_key;
	}

	const imageResult = await createImage(imageData);

	const imageId = imageResult.image_id;

	return {
		imagePath,
		imageId: imageId.toString(),
		size: file.size,
		storageProvider: file.storage_provider,
		storageKey: file.storage_key,
	};
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// 1. Per-member/guest rate limiting (100 images per album)
	if (params.album_id && (params.uploaded_by || params.guest_session_id)) {
		const currentCount = await prisma.album_images.count({
			where: {
				album_id: params.album_id,
				images: {
					OR: [
						{ uploaded_by: params.uploaded_by || undefined },
						{ guest_session_id: params.guest_session_id || undefined },
					].filter((c) => c.uploaded_by || c.guest_session_id),
				},
			},
		});

		if (currentCount + params.files.length > 100) {
			throw new Error(
				"Album upload limit reached for your session (max 100 photos).",
			);
		}
	}

	// 2. Host Quota Check
	let hasQuota = true;
	if (params.uploaded_by) {
		const startOfMonth = new Date();
		startOfMonth.setDate(1);
		startOfMonth.setHours(0, 0, 0, 0);

		const { computeLimit } = await getUserPlanLimits(params.uploaded_by);
		if (computeLimit !== -1) {
			const usage = await getUserUsage(
				params.uploaded_by,
				"compute",
				startOfMonth,
			);
			if (usage >= computeLimit) {
				hasQuota = false;
			}
		}
	}

	const imagesToProcess = [];
	for (const file of params.files) {
		imagesToProcess.push(
			await storeImage(
				file,
				params.uploaded_by,
				params.guest_session_id,
				hasQuota ? params.status : "QUOTA_EXCEEDED",
				params.album_id,
			),
		);
	}

	for (const imageInfo of imagesToProcess) {
		if (hasQuota) {
			await queueServices.imageOptimizationQueueLib.addJob(
				"imageOptimization",
				{
					imageId: imageInfo.imageId,
					imagePath: imageInfo.imagePath,
					storageProvider: imageInfo.storageProvider,
					storageKey: imageInfo.storageKey,
					albumId: params.album_id,
					worker: "imageOptimization",
				},
				{ removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
			);

			// Log usage for each image processed
			if (params.uploaded_by) {
				await logUsage(params.uploaded_by, "compute", "face_detection", 1);
			}
		}

		// Always log storage usage as the file IS stored
		if (params.uploaded_by) {
			await logUsage(
				params.uploaded_by,
				"storage",
				"upload",
				imageInfo.size || 0,
			);
		}
	}
	const imageIds = imagesToProcess.map((img) => {
		return img.imageId;
	});

	const images = await getImagesByIds(imageIds);

	// Trigger "New photos in shared album" notification for owner if uploaded by guest
	if (params.album_id && params.guest_session_id && images.length > 0) {
		try {
			const album = await prisma.albums.findUnique({
				where: { album_id: params.album_id },
				include: { users: { select: { email: true } } },
			});

			if (album?.users?.email) {
				await queueServices.emailQueueLib.addJob("email", {
					worker: "email",
					type: "new_photos",
					data: {
						email: album.users.email,
						albumName: album.album_name || "your album",
						photoCount: images.length,
						token: album.share_token,
					},
				});
			}
		} catch (error) {
			console.error("Failed to enqueue new photos notification:", error);
		}
	}

	const aliasRes = aliaserSpec(aliasSpec.response, {
		images: images.map((image) => {
			return aliaserSpec(aliasSpec.image, {
				...image,
				image_path: normalizeImagePath(image.image_path),
			});
		}),
	});
	return aliasRes;
};

export const uploadPicturesService = service;
