import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import {
	searchFaces,
	searchFacesByEmbedding,
} from "../../../../../packages/models/src/faces.model.ts";
import {
	HTTP_STATUS_CODES,
	UPLOADS_DIR,
} from "../../../../../packages/utils/src/constants.util.ts";
import {
	BadRequestError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import { validateFileFromBuffer } from "../../../../../packages/utils/src/file-validator.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";
import { uploadPicturesService } from "../pictures/uploadPictures.service.ts";

const spec = Joi.object({
	share_token: Joi.string().required(),
	files: Joi.any().optional(),
	key: Joi.string().optional(),
	guest_session_id: Joi.string().uuid().optional(),
});

const aliasSpec = {
	request: {
		token: "share_token",
		existingKey: "key",
		guestSessionId: "guest_session_id",
	},
	response: {
		images: "images",
		duplicateCount: "duplicateCount",
	},
};

const GUEST_UPLOAD_QUOTA = {
	sessionLimit: 20,
	tokenLimit: 120,
	windowMs: 60 * 60 * 1000,
};

const enforceGuestUploadQuota = async ({
	albumId,
	guestSessionId,
	incomingCount,
}: {
	albumId: string;
	guestSessionId?: string;
	incomingCount: number;
}) => {
	const windowStart = new Date(Date.now() - GUEST_UPLOAD_QUOTA.windowMs);

	const [albumWindowCount, sessionWindowCount] = await Promise.all([
		prisma.album_images.count({
			where: {
				album_id: albumId,
				images: {
					guest_session_id: { not: null },
					upload_date: { gte: windowStart },
				},
			},
		}),
		guestSessionId
			? prisma.album_images.count({
				where: {
					album_id: albumId,
					images: {
						guest_session_id: guestSessionId,
						upload_date: { gte: windowStart },
					},
				},
			})
			: Promise.resolve(0),
	]);

	if (
		guestSessionId &&
		sessionWindowCount + incomingCount > GUEST_UPLOAD_QUOTA.sessionLimit
	) {
		throw new BadRequestError(
			`Guest upload session limit exceeded: max ${GUEST_UPLOAD_QUOTA.sessionLimit} images per hour.`,
		);
	}

	if (albumWindowCount + incomingCount > GUEST_UPLOAD_QUOTA.tokenLimit) {
		throw new BadRequestError(
			`Guest upload event limit exceeded: max ${GUEST_UPLOAD_QUOTA.tokenLimit} images per hour.`,
		);
	}
};

const service = async (data: any) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	// 1. Verify album and check permissions
	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: {
			settings: true,
			storage_config: true,
			album_images: { include: { images: true }, take: 1 },
		},
	});

	if (!album) throw new NotFoundError("Album not found.");

	const isCollaborative =
		album.settings?.is_event && album.settings?.allow_guest_uploads;
	const isExpired =
		album.settings?.expires_at &&
		new Date(album.settings.expires_at) < new Date();

	if (!isCollaborative || isExpired) {
		throw new Error(
			"Guest uploads are not allowed or have expired for this event.",
		);
	}

	// 2. Determine storage provider
	let currentStorage = storage;
	let useExternalStorage = false;
	let storageProvider: string | undefined;

	if (album.storage_config) {
		currentStorage = storage.getProvider({
			provider: album.storage_config.provider as any,
			credentials: {
				accessKeyId: album.storage_config.access_key_id,
				secretAccessKey: album.storage_config.secret_access_key,
				bucket: album.storage_config.bucket,
				endpoint: album.storage_config.endpoint,
				region: album.storage_config.region || undefined,
			},
			skip_tls_verify:
				album.storage_config.provider !== "local"
					? (config[config.env || "development"] as any).skip_tls_verify
					: false,
		}) as any;
		useExternalStorage = album.storage_config.provider !== "local";
		storageProvider = album.storage_config.provider;
	} else {
		// Check if images have external storage
		const firstImage = album.album_images[0]?.images;
		if (
			firstImage?.storage_provider &&
			firstImage.storage_provider !== "local"
		) {
			const envConfig = config[config.env || "development"];
			const r2 = (envConfig as any)?.r2;
			if (r2?.access_key_id && r2?.bucket) {
				currentStorage = storage.getProvider({
					provider: firstImage.storage_provider,
					credentials: {
						accessKeyId: r2.access_key_id,
						secretAccessKey: r2.secret_access_key,
						bucket: r2.bucket,
						endpoint: r2.endpoint || undefined,
						region: r2.region || "auto",
					},
				}) as any;
				useExternalStorage = true;
				storageProvider = firstImage.storage_provider;
			}
		}
	}

	// 3. Process files
	const files = params.files || [];
	const existingKey = params.key;

	if (
		!existingKey &&
		(!files || (Array.isArray(files) && files.length === 0))
	) {
		throw new Error("Either files or an existing key is required");
	}

	const processedFiles = [];

	if (existingKey) {
		// Handle existing key (file already in storage)
		const secureKey = `${crypto.randomUUID()}-${existingKey.split("-").pop() || "guest.jpg"}`;
		let filePath: string;
		let fileSize = 0;
		let fileHash = "";

		if (useExternalStorage) {
			const imageBuffer = await currentStorage.getObject(existingKey);
			const { type: _fileType, hash: hashResult } =
				await validateFileFromBuffer(imageBuffer, existingKey);
			fileHash = hashResult;

			// Duplicate check
			const existingImage = await prisma.images.findFirst({
				where: {
					file_hash: fileHash,
					album_images: { some: { album_id: album.album_id } },
					deleted_at: null,
				},
			});

			if (existingImage) {
				return {
					images: [{ imageId: existingImage.image_id, isDuplicate: true }],
					duplicateCount: 1,
				};
			}

			const absolutePath = path.resolve(process.cwd(), UPLOADS_DIR, secureKey);
			await fs.mkdir(path.dirname(absolutePath), { recursive: true });
			await fs.writeFile(absolutePath, imageBuffer);
			filePath = absolutePath;
			fileSize = imageBuffer.length;
		} else {
			// Local storage
			const oldPath = path.resolve(process.cwd(), UPLOADS_DIR, existingKey);
			const stats = await fs.stat(oldPath);
			fileSize = stats.size;

			const fullBuffer = await fs.readFile(oldPath);
			const { type: _fileType, hash: hashResult } =
				await validateFileFromBuffer(fullBuffer, existingKey);
			fileHash = hashResult;

			// Duplicate check
			const existingImage = await prisma.images.findFirst({
				where: {
					file_hash: fileHash,
					album_images: { some: { album_id: album.album_id } },
					deleted_at: null,
				},
			});

			if (existingImage) {
				return {
					images: [{ imageId: existingImage.image_id, isDuplicate: true }],
					duplicateCount: 1,
				};
			}

			const absolutePath = path.resolve(process.cwd(), UPLOADS_DIR, secureKey);
			await fs.rename(oldPath, absolutePath);
			filePath = absolutePath;
		}

		processedFiles.push({
			name: existingKey,
			type: "image/jpeg",
			size: fileSize,
			existingKey: secureKey,
			storage_provider: useExternalStorage ? storageProvider : "local",
			storage_key: useExternalStorage ? existingKey : secureKey,
			file_hash: fileHash,
		});
	} else {
		// Handle new file uploads
		const filesArray = Array.isArray(files) ? files : [files];
		for (const file of filesArray) {
			const fileBuffer = Buffer.from(await file.arrayBuffer());
			const { type: fileType, hash: fileHash } = await validateFileFromBuffer(
				fileBuffer,
				file.name,
			);

			// Duplicate check
			const existingImage = await prisma.images.findFirst({
				where: {
					file_hash: fileHash,
					album_images: { some: { album_id: album.album_id } },
					deleted_at: null,
				},
			});

			if (existingImage) {
				processedFiles.push({
					imageId: existingImage.image_id,
					isDuplicate: true,
				});
				continue;
			}

			const secureKey = `${crypto.randomUUID()}.${fileType.ext}`;
			const storedKey = await currentStorage.upload(fileBuffer, {
				key: secureKey,
				contentType: file.type,
			});

			const absolutePath = path.resolve(process.cwd(), UPLOADS_DIR, storedKey);
			await fs.mkdir(path.dirname(absolutePath), { recursive: true });
			await fs.writeFile(absolutePath, fileBuffer);

			processedFiles.push({
				name: file.name,
				type: file.type,
				size: file.size,
				existingKey: secureKey,
				storage_provider: useExternalStorage ? storageProvider : "local",
				storage_key: storedKey,
				file_hash: fileHash,
			});
		}
	}

	const status = album.settings?.requires_approval ? "PENDING" : "APPROVED";
	const newFiles = processedFiles.filter((f) => !f.isDuplicate);
	const duplicateCount = processedFiles.filter((f) => f.isDuplicate).length;

	if (newFiles.length > 0) {
		await enforceGuestUploadQuota({
			albumId: album.album_id,
			guestSessionId: params.guest_session_id,
			incomingCount: newFiles.length,
		});
	}

	// 4. Upload via service

	let uploadResult = { images: [] };
	if (newFiles.length > 0) {
		uploadResult = await uploadPicturesService({
			albumId: album.album_id,
			files: newFiles,
			status,
			guestSessionId: params.guest_session_id,
			userId: undefined,
		});
	}

	return {
		...uploadResult,
		duplicateCount,
	};
};

export const uploadPublicService = service;
