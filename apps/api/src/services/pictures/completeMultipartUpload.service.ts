import Joi from "joi";
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
	key: Joi.string().required(),
	upload_id: Joi.string().required(),
	parts: Joi.array()
		.items(
			Joi.object({
				ETag: Joi.string().required(),
				PartNumber: Joi.number().required(),
			}),
		)
		.required(),
});

const aliasSpec = {
	request: {
		userId: "user_id",
		albumId: "album_id",
		shareToken: "share_token",
		key: "key",
		uploadId: "upload_id",
		parts: "parts",
	},
	response: { success: "success" },
};

export const completeMultipartUploadService = async (data: any) => {
	const params = validateSpec(spec, aliaserSpec(aliasSpec.request, data));

	let currentStorage = storage;

	// Determine storage provider (same logic as getPresignedUrl)
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
			} catch (err) {
				console.error("Failed to get storage provider:", err);
			}
		}
	}

	try {
		await currentStorage.completeMultipartUpload(
			params.key,
			params.upload_id,
			params.parts,
		);
		return aliaserSpec(aliasSpec.response, { success: true });
	} catch (err: any) {
		console.error("Complete multipart upload failed:", err);
		throw new Error(`Failed to complete upload: ${err.message}`);
	}
};
