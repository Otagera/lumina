export const HTTP_METHODS = { POST: "POST", GET: "GET", PUT: "PUT" };
export const HTTP_STATUS_CODES = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOTFOUND: 404,
	CONFLICT: 409,
	FILE_SIZE_TOO_LARGE: 418,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
};
export const AUTHORIZATION_LEVELS = {
	USER: "user",
	COMPANY: "company",
	ADMIN: "admin",
};
export const BULL_QUEUE_NAMES = {
	DEFAULT: "default",
	FACE_RECOGNITION: "face_recognition",
	FACE_SEARCH: "face_search",
	IMAGE_OPTIMIZATION: "image_optimization",
	FACE_CLUSTERING: "face_clustering",
	BULK_DOWNLOAD: "bulk_download",
	FILE_DELETION: "file_deletion",
	EMAIL: "email",
	TRASH_CLEANUP: "trash_cleanup",
};
export const DEGREES = ["Bsc.", "B.A", "LLB.", "MSc.", "M.A."];
export const LEVELS = ["Undergraduate", "Postgraduate"];
// Still not sure about this property name but it will do for now
export const REMOTE = ["remote", "on-site", "hybrid"];
export const HOW_TO_APPLY = ["withUs", "externalLink", "mailTo"];
export const MINIMUM_REQUIRED_SKILLS = 4;
export const MINIMUM_REQUIRED_TOOLS = 4;
export const MINIMUM_REQUIRED_KEY_RESPONSIBILITIES = 4;
export const MAXIMUM_IMAGES_CAN_UPLOAD = 10;
export const UPLOADS_DIR = "src/uploads";
