import {
	fetchFaceById,
	searchFaces,
} from "../../../../../packages/models/src/faces.model.ts";

const fetchFace = async ({ face_id }) => {
	const face = await fetchFaceById(face_id);
	if (!face) return null;
	return {
		...face,
		image: {
			...face.images,
			album_images: face.images?.album_images || [],
			uploaded_by: face.images?.uploaded_by,
		},
	};
};

const findSimilarFaces = async (
	faceId,
	albumId,
	threshold,
	limit,
	excludeSourceFace = false,
) => {
	return await searchFaces({
		faceId,
		albumId,
		threshold,
		limit,
		excludeSourceFace,
	});
};

export { findSimilarFaces, searchFaces, fetchFace };
