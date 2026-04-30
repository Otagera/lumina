import sharp from "sharp";
import config from "../../config/src/index.config.ts";

const getImageSize = async (imagePath) => {
	const metadata = await sharp(imagePath).metadata();

	// Respect EXIF orientation
	// Orientations 5, 6, 7, 8 mean the image is rotated 90 or 270 degrees.
	// In these cases, the visual width is the metadata height, and vice versa.
	let width = metadata.width;
	let height = metadata.height;

	if (metadata.orientation && metadata.orientation >= 5) {
		width = metadata.height;
		height = metadata.width;
	}

	return { width, height };
};

const isImageCorrupted = async (imagePath) => {
	try {
		await sharp(imagePath).metadata();
		return false;
	} catch (_error) {
		return true;
	}
};

const normalizeImagePath = (image_path, storage_provider?, storage_key?) => {
	if (config.env === "test" || config.env === "development") {
		const envConfig = config[config.env];
		const port = envConfig.elysia_port;
		const baseUrl = port ? `${envConfig.base_api_url}:${port}` : envConfig.base_api_url;
		const imagePathSplit = image_path.split("/");
		const strucImagePath = image_path
			? `${baseUrl}/api/uploads/${imagePathSplit[imagePathSplit.length - 1]}`
			: image_path;
		return strucImagePath;
	} else {
		// Production: use R2 public URL if available
		const envConfig = config[config.env || "production"];
		const r2PublicUrl = envConfig?.r2?.public_url;

		// Fallback: if storage_provider not set, check if global R2 is configured
		if (!storage_provider && r2PublicUrl && image_path) {
			const r2 = envConfig?.r2;
			if (r2?.access_key_id && r2?.bucket) {
				storage_provider = "r2";
				if (!storage_key) {
					const parts = image_path.split("/");
					storage_key = parts[parts.length - 1];
				}
			}
		}

		if (storage_provider === "r2" && storage_key && r2PublicUrl) {
			return `${r2PublicUrl}/${storage_key}`;
		}
		return image_path;
	}
};

export { getImageSize, isImageCorrupted, normalizeImagePath };
