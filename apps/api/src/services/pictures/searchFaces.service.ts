import Joi from "joi";
import {
	fetchFaceById,
	searchFaces,
} from "../../../../../packages/models/src/faces.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	face_id: Joi.number().optional(),
	person_id: Joi.string().uuid().optional(),
	album_id: Joi.string().uuid(),
	threshold: Joi.number().min(0).max(1),
	limit: Joi.number().integer().min(1).max(100),
	exclude_source_face: Joi.boolean().default(false),
}).or("face_id", "person_id");

const aliasSpec = {
	request: {
		faceId: "face_id",
		personId: "person_id",
		albumId: "album_id",
		threshold: "threshold",
		limit: "limit",
		excludeSourceFace: "exclude_source_face",
	},
	response: {
		faces: "faces",
		sourceFace: "sourceFace",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const params = validateSpec(spec, aliasReq);

	let sourceFaceData: any = null;

	if (params.face_id) {
		const face = await fetchFaceById(params.face_id);
		if (face) {
			sourceFaceData = {
				faceId: face.face_id,
				personId: face.person_id,
				personName: face.people?.name || null,
				imagePath: face.images
					? normalizeImagePath(
							face.images.image_path,
							face.images.storage_provider,
							face.images.storage_key,
						)
					: null,
				boundingBox: face.bounding_box,
				originalWidth: face.images?.original_width || null,
				originalHeight: face.images?.original_height || null,
			};
		} else if (!params.person_id) {
			throw new NotFoundError("Face not found.");
		}
	}

	const similarFaces = await searchFaces({
		faceId: params.face_id,
		personId: params.person_id,
		albumId: params.album_id,
		threshold: params.threshold,
		limit: params.limit,
		excludeSourceFace: params.exclude_source_face,
	});

	const aliasRes = aliaserSpec(aliasSpec.response, {
		faces: similarFaces.map((f) => ({
			...f,
			imagePath: normalizeImagePath(
				f.imagePath,
				f.storageProvider,
				f.storageKey,
			),
		})),
		sourceFace: sourceFaceData,
	});

	return aliasRes;
};

export default service;
