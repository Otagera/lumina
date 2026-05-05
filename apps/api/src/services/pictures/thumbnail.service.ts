import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const spec = Joi.object({
	image_id: Joi.string().uuid().required(),
	face_id: Joi.string().optional(),
});

const aliasSpec = {
	request: { imageId: "image_id", faceId: "face_id" },
	response: { imageBuffer: "imageBuffer", contentType: "contentType" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const image = await prisma.images.findUnique({
		where: { image_id: params.image_id },
		select: {
			image_id: true,
			image_path: true,
			optimized_path: true,
			storage_provider: true,
			storage_key: true,
			original_width: true,
			original_height: true,
		},
	});

	if (!image) {
		throw new NotFoundError("Image not found.");
	}

	let boundingBox = null;
	if (params.face_id) {
		const face = await prisma.faces.findUnique({
			where: { face_id: Number(params.face_id) },
			select: { bounding_box: true },
		});
		boundingBox = face?.bounding_box;
	}

	const isR2 = image.storage_provider && image.storage_provider !== "local";
	let imageBuffer = null;

	if (isR2) {
		const envConfig = config[config.env || "development"];
		const r2 = envConfig?.r2;
		const skipTlsVerify = envConfig?.skip_tls_verify || false;

		const credentials = {
			accessKeyId: r2?.access_key_id,
			secretAccessKey: r2?.secret_access_key,
			bucket: r2?.bucket,
			endpoint: r2?.endpoint,
			region: r2?.region || "auto",
		};

		const storageProvider = storage.getProvider({
			provider: image.storage_provider,
			credentials,
			skip_tls_verify: skipTlsVerify,
		});

		const key = image.optimized_path || image.storage_key;
		imageBuffer = await storageProvider.getObject(key);
	} else {
		const imagePath = image.optimized_path || image.image_path;
		imageBuffer = await Bun.file(imagePath).arrayBuffer();
	}

	const sharp = require("sharp");
	let imageProcessor = sharp(Buffer.from(imageBuffer));

	const metadata = await imageProcessor.metadata();
	const actualWidth = metadata.width || image.original_width || 2084;
	const actualHeight = metadata.height || image.original_height || 4624;

	if (boundingBox) {
		const { top, left, right, bottom } = boundingBox;

		// Bounding box is in ORIGINAL image coordinates, need to scale to ACTUAL dimensions
		const scaleX = actualWidth / (image.original_width || 2084);
		const scaleY = actualHeight / (image.original_height || 4624);

		let faceLeft: number,
			faceTop: number,
			faceWidth: number,
			faceHeight: number;

		if (left < 1 && right <= 1 && top < 1 && bottom <= 1) {
			// Normalized coordinates (0-1)
			faceLeft = Math.max(0, Math.floor(left * actualWidth));
			faceTop = Math.max(0, Math.floor(top * actualHeight));
			faceWidth = Math.floor((right - left) * actualWidth);
			faceHeight = Math.floor((bottom - top) * actualHeight);
		} else {
			// Absolute coordinates - need to scale from original to actual
			faceLeft = Math.max(0, Math.floor(left * scaleX));
			faceTop = Math.max(0, Math.floor(top * scaleY));
			faceWidth = Math.floor((right - left) * scaleX);
			faceHeight = Math.floor((bottom - top) * scaleY);
		}

		// Add smart padding (30% of face dimensions)
		const paddingX = Math.floor(faceWidth * 0.3);
		const paddingY = Math.floor(faceHeight * 0.3);

		// Calculate padded coordinates, respecting image bounds
		const paddedLeft = Math.max(0, faceLeft - paddingX);
		const paddedTop = Math.max(0, faceTop - paddingY);
		const paddedWidth = Math.min(
			faceWidth + paddingX * 2,
			actualWidth - paddedLeft,
		);
		const paddedHeight = Math.min(
			faceHeight + paddingY * 2,
			actualHeight - paddedTop,
		);

		imageProcessor = imageProcessor.extract({
			left: paddedLeft,
			top: paddedTop,
			width: paddedWidth,
			height: paddedHeight,
		});
	}

	const thumbnailBuffer = await imageProcessor
		.resize(250, 250, { fit: "cover", kernel: "lanczos3" })
		.sharpen({ sigma: 0.5, m1: 0.5, m2: 0.5 })
		.toFormat("webp", { quality: 85 })
		.toBuffer();

	return aliaserSpec(aliasSpec.response, {
		imageBuffer: thumbnailBuffer,
		contentType: "image/webp",
	});
};

export const thumbnailService = service;
