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
	faceId: Joi.number().optional(),
	personId: Joi.string().uuid().optional(),
	albumId: Joi.string().uuid(),
	threshold: Joi.number().min(0).max(1),
	limit: Joi.number().integer().min(1).max(100),
	excludeSourceFace: Joi.boolean().default(false),
}).or("faceId", "personId");

const aliasSpec = {
	request: {
		faceId: "faceId",
		personId: "personId",
		albumId: "albumId",
		threshold: "threshold",
		limit: "limit",
		excludeSourceFace: "excludeSourceFace",
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

	if (params.faceId) {
		const face = await fetchFaceById(params.faceId);
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
		} else if (!params.personId) {
			throw new NotFoundError("Face not found.");
		}
	}

	const similarFaces = await searchFaces({
		faceId: params.faceId,
		personId: params.personId,
		albumId: params.albumId,
		threshold: params.threshold,
		limit: params.limit,
		excludeSourceFace: params.excludeSourceFace,
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
