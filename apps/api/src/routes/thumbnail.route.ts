import { Elysia, t } from "elysia";
import prisma from "../../../../packages/config/src/db.config.ts";
import config from "../../../../packages/config/src/index.config.ts";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../packages/utils/src/storage.util.ts";

export const thumbnailRoutes = new Elysia({ prefix: "/thumbnail" }).get(
	"/:imageId",
	async ({ params, query, set }) => {
		const { imageId } = params;
		const faceId = query.faceId;

		try {
			const image = await prisma.images.findUnique({
				where: { image_id: imageId },
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
				set.status = HTTP_STATUS_CODES.NOTFOUND;
				return { status: "error", message: "Image not found" };
			}

			let boundingBox = null;
			if (faceId) {
				const face = await prisma.faces.findUnique({
					where: { face_id: Number(faceId) },
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
				imageBuffer = await fs.readFile(imagePath);
			}

			const sharp = require("sharp");
			let imageProcessor = sharp(imageBuffer);

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

			set.headers["Content-Type"] = "image/webp";
			set.headers["Cache-Control"] = "public, max-age=86400";

			return thumbnailBuffer;
		} catch (error: any) {
			console.error("[Thumbnail] Error:", error.message, error.stack);
			set.status = HTTP_STATUS_CODES.INTERNAL_ERROR;
			return { status: "error", message: "Failed to generate thumbnail" };
		}
	},
	{
		params: t.Object({
			imageId: t.String(),
		}),
		query: t.Object({
			faceId: t.Optional(t.String()),
		}),
	},
);
