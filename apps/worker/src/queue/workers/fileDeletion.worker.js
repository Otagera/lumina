import fs from "node:fs/promises";
import path from "node:path";
import config from "../../../../../packages/config/src/index.config.ts";
import { UPLOADS_DIR } from "../../../../../packages/utils/src/constants.util.ts";
import { storage } from "../../../../../packages/utils/src/storage.util.ts";

const getStorageProvider = (image, albumStorageConfig = null) => {
	const provider =
		image.storage_provider ||
		(albumStorageConfig ? albumStorageConfig.provider : null);

	if (!provider || provider === "local") {
		return { provider: null, isLocal: true };
	}

	let credentials = {
		accessKeyId:
			image.storage_access_key_id || albumStorageConfig?.access_key_id,
		secretAccessKey:
			image.storage_secret_access_key || albumStorageConfig?.secret_access_key,
		bucket: image.storage_bucket || albumStorageConfig?.bucket,
		endpoint: image.storage_endpoint || albumStorageConfig?.endpoint,
		region: image.storage_region || albumStorageConfig?.region,
	};

	const envConfig = config[config.env || "development"];
	const r2 = envConfig?.r2;
	if (
		r2?.access_key_id &&
		r2?.secret_access_key &&
		r2?.bucket &&
		(!credentials.bucket || !credentials.endpoint)
	) {
		credentials = {
			accessKeyId: r2.access_key_id,
			secretAccessKey: r2.secret_access_key,
			bucket: r2.bucket,
			endpoint: r2.endpoint || "",
			region: r2.region || "auto",
		};
	}

	return {
		provider: storage.getProvider({
			provider,
			credentials,
			skip_tls_verify:
				provider !== "local"
					? config[config.env || "development"].skip_tls_verify
					: false,
		}),
		isLocal: false,
	};
};

const run = async (jobData) => {
	const { image, albumStorageConfig } = jobData;

	try {
		console.log(`Starting file deletion for image: ${image.image_id}`);

		const { provider, isLocal } = getStorageProvider(image, albumStorageConfig);

		// 1. Delete original file
		if (isLocal) {
			const originalPath = path.resolve(
				process.cwd(),
				UPLOADS_DIR,
				image.image_path,
			);
			await fs.unlink(originalPath).catch((err) => {
				if (err.code !== "ENOENT")
					console.error("Error deleting local original:", err);
			});
		} else if (provider && image.storage_key) {
			await provider.delete(image.storage_key).catch((err) => {
				console.error("Error deleting remote original:", err);
			});
		}

		// 2. Delete optimized version
		if (image.optimized_path) {
			if (isLocal) {
				const optimizedPath = path.resolve(
					process.cwd(),
					UPLOADS_DIR,
					image.optimized_path,
				);
				await fs.unlink(optimizedPath).catch((err) => {
					if (err.code !== "ENOENT")
						console.error("Error deleting local optimized:", err);
				});
			} else if (provider) {
				await provider.delete(image.optimized_path).catch((err) => {
					console.error("Error deleting remote optimized:", err);
				});
			}
		}

		// 3. Delete thumbnails if any
		// (Thumbnails might be stored in a consistent path pattern)
		const thumbRelPath = `thumbnails/${image.image_id}.jpg`;
		if (isLocal) {
			const thumbPath = path.resolve(process.cwd(), UPLOADS_DIR, thumbRelPath);
			await fs.unlink(thumbPath).catch(() => {}); // Ignore error if thumb doesn't exist
		} else if (provider) {
			await provider.delete(thumbRelPath).catch(() => {});
		}

		return {
			status: "success",
			imageId: image.image_id,
		};
	} catch (error) {
		console.error("Error processing file deletion task:", error);
		throw error;
	}
};

export default run;
