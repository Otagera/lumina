import Joi from "joi";
import jwt from "jsonwebtoken";
import prisma from "../../../../../packages/config/src/db.config.ts";
import config from "../../../../../packages/config/src/index.config.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const spec = Joi.object({
	user_id: Joi.string().optional(),
	album_id: Joi.string().optional(),
	share_token: Joi.string().optional(),
	file_name: Joi.string().required(),
	content_type: Joi.string().required(),
	is_multipart: Joi.boolean().optional(),
	upload_id: Joi.string().optional(),
	part_number: Joi.number().optional(),
});

const aliasSpec = {
	request: {
		userId: "user_id",
		albumId: "album_id",
		shareToken: "share_token",
		fileName: "file_name",
		contentType: "content_type",
		isMultipart: "is_multipart",
		uploadId: "upload_id",
		partNumber: "part_number",
	},
	response: {
		uploadUrl: "uploadUrl",
		key: "key",
		storageProvider: "storageProvider",
		uploadId: "uploadId",
	},
};

const service = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	const key = params.key || `${Date.now()}-${params.file_name}`;
	let currentStorage = storage;
	let storageProvider: string | undefined = storage.getProviderName();
	let authToken: string | undefined;

	// Use album's storage if specified
	if (params.album_id || params.share_token) {
		const album = await prisma.albums.findUnique({
			where: params.album_id
				? { album_id: params.album_id, created_by: params.user_id }
				: { share_token: params.share_token },
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
		if (params.is_multipart) {
			if (params.upload_id && params.part_number) {
				// Requesting a URL for a specific part
				const uploadUrl = await currentStorage.getUploadPartPresignedUrl(
					key,
					params.upload_id,
					params.part_number,
				);
				return aliaserSpec(aliasSpec.response, {
					uploadUrl,
					key,
					storageProvider,
					uploadId: params.upload_id,
				});
			} else {
				// Initializing a new multipart upload
				const uploadId = await currentStorage.createMultipartUpload(
					key,
					params.content_type,
				);
				return aliaserSpec(aliasSpec.response, {
					key,
					storageProvider,
					uploadId,
				});
			}
		}

		// Single file upload (default)
		if (storageProvider === "local") {
			authToken = jwt.sign(
				{ key, userId: params.user_id, shareToken: params.share_token },
				config[config.env || "development"].secret || "default_secret",
				{ expiresIn: "1h" },
			);
		}

		const uploadUrl = await (currentStorage as any).getUploadPresignedUrl(
			key,
			params.content_type,
			3600,
			params.share_token,
			authToken,
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
