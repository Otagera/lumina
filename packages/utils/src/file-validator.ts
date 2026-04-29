import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const ALLOWED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
	"image/gif",
];

export const ALLOWED_VIDEO_MIME_TYPES = [
	"video/mp4",
	"video/quicktime",
	"video/x-matroska",
	"video/webm",
];

export const ALLOWED_MIME_TYPES = [
	...ALLOWED_IMAGE_MIME_TYPES,
	...ALLOWED_VIDEO_MIME_TYPES,
];

export const validateFileFromBuffer = async (
	buffer: Buffer,
	originalName: string,
) => {
	if (buffer.length > MAX_FILE_SIZE) {
		throw new Error(`File size exceeds maximum limit of 100MB`);
	}

	const type = await fileTypeFromBuffer(buffer);

	if (!type) {
		throw new Error("Could not determine file type");
	}

	if (!ALLOWED_MIME_TYPES.includes(type.mime)) {
		throw new Error(`File type ${type.mime} is not allowed`);
	}

	// Calculate SHA-256 hash for duplicate detection
	const hash = crypto.createHash("sha256").update(buffer).digest("hex");

	// Optional: check extension match
	const extension = originalName.split(".").pop()?.toLowerCase();
	if (extension && type.ext.toLowerCase() !== extension) {
		// Some minor mismatches are okay (jpeg vs jpg)
		const normalizedExt = extension === "jpg" ? "jpg" : extension;
		const normalizedTypeExt = type.ext === "jpeg" ? "jpg" : type.ext;

		if (normalizedExt !== normalizedTypeExt) {
			// We'll trust magic bytes over extension, but maybe log a warning
			console.warn(
				`MIME type / extension mismatch: ${type.mime} vs .${extension}`,
			);
		}
	}

	return { type, hash };
};
