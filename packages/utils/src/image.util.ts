import sharp from "sharp";
import config from "../../config/src/index.config.ts";

const getImageSize = async (imagePath) => {
	if (config.env === "test") {
		return { width: 800, height: 600 };
	}
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
	if (config.env === "test") {
		return false;
	}
	try {
		await sharp(imagePath).metadata();
		return false;
	} catch (_error) {
		return true;
	}
};

const normalizeImagePath = (image_path, storage_provider?, storage_key?) => {
	const env = config.env || "production";
	const envConfig = config[env];

	if (env === "test" || env === "development") {
		if (!image_path) return image_path;
		const port = envConfig.elysia_port;
		const baseUrl = port
			? `${envConfig.base_api_url}:${port}`
			: envConfig.base_api_url;
		const imagePathSplit = image_path.split("/");
		const strucImagePath = image_path
			? `${baseUrl}/api/uploads/${imagePathSplit[imagePathSplit.length - 1]}`
			: image_path;
		return strucImagePath;
	} else {
		// Production: determine URL based on storage provider
		const isLocalStorage = !storage_provider || storage_provider === "local";

		if (isLocalStorage) {
			// For local storage, use API endpoint
			if (image_path) {
				const baseUrl =
					envConfig.base_api_url || "https://lumina-api.otagera.xyz";
				const filename = storage_key || image_path.split("/").pop();
				return `${baseUrl}/api/uploads/${filename}`;
			}
			return image_path;
		}

		// For external storage (R2), use R2 public URL if available
		const r2PublicUrl = envConfig?.r2?.public_url;

		if (r2PublicUrl && image_path) {
			const filename = storage_key || image_path.split("/").pop();
			return `${r2PublicUrl}/${filename}`;
		}

		// Fallback to API endpoint for external storage
		if (image_path) {
			const baseUrl =
				envConfig.base_api_url || "https://lumina-api.otagera.xyz";
			const filename = storage_key || image_path.split("/").pop();
			return `${baseUrl}/api/uploads/${filename}`;
		}

		return image_path;
	}
};

export { getImageSize, isImageCorrupted, normalizeImagePath };
