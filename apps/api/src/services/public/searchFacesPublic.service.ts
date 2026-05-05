import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { searchFaces } from "../../../../../packages/models/src/faces.model.ts";
import { NotFoundError } from "../../../../../packages/utils/src/error.util.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	shareToken: Joi.string().required(),
	faceId: Joi.number().required(),
	threshold: Joi.number().default(0.6),
	limit: Joi.number().default(10),
});

const aliasSpec = {
	request: { shareToken: "share_token" },
	response: { faces: "faces" },
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	// Verify the share token
	const album = await prisma.albums.findUnique({
		where: { share_token: params.share_token },
		include: { album_images: true },
	});

	if (!album) throw new NotFoundError("Invalid share token.");

	// Perform vector search but filter to album images only
	const albumImageIds = album.album_images.map((ai) => ai.image_id);

	const searchResults = await searchFaces({
		faceId: params.faceId,
		threshold: params.threshold,
		limit: params.limit,
		imageIds: albumImageIds as string[],
	});

	// Transform paths for results
	const formattedResults = searchResults.map((result) => ({
		...result,
		imagePath: normalizeImagePath(
			result.imagePath,
			result.storageProvider,
			result.storageKey,
		),
	}));

	return { faces: formattedResults };
};

export const searchFacesPublicService = service;
