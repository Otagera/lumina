import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const spec = Joi.object({
	userId: Joi.string().optional(),
	albumId: Joi.string().optional(),
	shareToken: Joi.string().optional(),
	fileName: Joi.string().required(),
	contentType: Joi.string().required(),
	isMultipart: Joi.boolean().optional(),
	uploadId: Joi.string().optional(),
	partNumber: Joi.number().optional(),
});

const aliasSpec = {
	request: {
		userId: "userId",
		albumId: "albumId",
		shareToken: "shareToken",
		fileName: "fileName",
		contentType: "contentType",
		isMultipart: "isMultipart",
		uploadId: "uploadId",
		partNumber: "partNumber",
	},
	response: {
		uploadUrl: "uploadUrl",
		key: "key",
		storageProvider: "storageProvider",
		uploadId: "uploadId",
	},
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	const key = params.key || `${Date.now()}-${params.fileName}`;
	let currentStorage = storage;
	let storageProvider: string | undefined = storage.getProviderName();

	// Use album's storage if specified
	if (params.albumId || params.shareToken) {
		const album = await prisma.albums.findUnique({
			where: params.albumId
				? { album_id: params.albumId, created_by: params.userId }
				: { share_token: params.shareToken },
			include: { storage_config: true },
		});

		if (album?.storage_config) {
			try {
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
				storageProvider = album.storage_config.provider;
			} catch (err) {
				console.error("Failed to get storage provider:", err);
			}
		}

		// Fallback to global storage if no album storage configured
		if (!storageProvider || storageProvider === "local") {
			const globalProvider = storage.getProviderName();
			if (globalProvider !== "local") {
				const envConfig = config[config.env || "development"];
				const r2 = envConfig?.r2;
				if (r2?.access_key_id && r2?.bucket) {
					currentStorage = storage.getProvider({
						provider: globalProvider,
						credentials: {
							accessKeyId: r2.access_key_id,
							secretAccessKey: r2.secret_access_key,
							bucket: r2.bucket,
							endpoint: r2.endpoint,
							region: r2.region,
						},
						skip_tls_verify: (envConfig as any).skip_tls_verify,
					}) as any;
					storageProvider = globalProvider;
				}
			}
		}
	}

	try {
		if (params.isMultipart) {
			if (params.uploadId && params.partNumber) {
				// Requesting a URL for a specific part
				const uploadUrl = await currentStorage.getUploadPartPresignedUrl(
					key,
					params.uploadId,
					params.partNumber,
				);
				return aliaserSpec(aliasSpec.response, {
					uploadUrl,
					key,
					storageProvider,
					uploadId: params.uploadId,
				});
			} else {
				// Initializing a new multipart upload
				const uploadId = await currentStorage.createMultipartUpload(
					key,
					params.contentType,
				);
				return aliaserSpec(aliasSpec.response, {
					key,
					storageProvider,
					uploadId,
				});
			}
		}

		// Single file upload (default)
		const uploadUrl = await (currentStorage as any).getUploadPresignedUrl(
			key,
			params.contentType,
			3600,
			params.shareToken,
		);

		return aliaserSpec(aliasSpec.response, {
			uploadUrl,
			key,
			storageProvider,
		});
	} catch (err: any) {
		console.error("Presigned URL generation failed:", err);
		throw new Error(`Failed to generate upload URL: ${err.message}`);
	}
};

export const getPresignedUrlService = service;
