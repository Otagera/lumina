import prisma from "../../../../../packages/config/src/db.config.ts";
import { logUsage } from "../../../../../packages/models/src/usage.model.ts";
import {
	fetchFace,
	searchFaces,
} from "../../../api/src/services/pictures/faces.lib.ts";

const run = async (jobData) => {
	const { faceId, threshold, limit } = jobData;

	try {
		console.log(`Starting background face search for face: ${faceId}`);

		// 1. Get the target face
		const face = await fetchFace({ face_id: faceId });
		if (!face) {
			throw new Error("Face not found");
		}

		// 2. Perform search
		const results = await searchFaces({
			faceId,
			threshold,
			limit,
			albumId: face.image.album_images[0]?.album_id,
		});

		// 3. Log usage
		if (face.image.uploaded_by) {
			await logUsage(
				face.image.uploaded_by,
				"compute",
				"face_search",
				1,
				null,
				{ face_id: faceId, results_count: results.length },
			);
		}

		console.log(`Face search completed. Found ${results.length} matches.`);

		return {
			status: "success",
			faceId,
			matchCount: results.length,
			matches: results.map((r) => r.imageId),
		};
	} catch (error) {
		console.error("Error processing face search task:", error);
		throw error;
	}
};

export default run;
