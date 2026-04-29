import config from "../../../../../packages/config/src/index.config.ts";
import { getPeople } from "../../../../../packages/models/src/people.model.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import { aliaserSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const aliasSpec = {
	response: {
		person_id: "personId",
		name: "name",
		created_at: "createdAt",
	},
};

const service = async (user_id: string) => {
	const people = await getPeople(user_id);

	const envConfig = config[config.env || "development"];
	const r2 = envConfig?.r2;

	return people.map((person: any) => {
		const base = aliaserSpec(aliasSpec.response, person);

		const firstFace = person.faces?.[0];
		if (firstFace) {
			const faceId = firstFace.face_id;
			const imageId = firstFace.image_id;

			// Use thumbnail API for R2 images
			if (imageId && faceId) {
				base.faceUrl = `/api/v1/thumbnail/${imageId}?faceId=${faceId}`;
				base.faceId = faceId;
				base.imageId = imageId;
			}

			if (firstFace.images) {
				const image = firstFace.images;
				const imagePath = image.optimized_path || image.image_path;

				// Fallback for local storage or if thumbnail API fails
				const isR2 =
					image.storage_provider && image.storage_provider !== "local";
				if (!isR2) {
					base.faceUrl = normalizeImagePath(imagePath);
				}

				base.boundingBox = firstFace.bounding_box;
			}
		}

		return base;
	});
};

export default service;
