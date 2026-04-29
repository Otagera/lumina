import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import { normalizeImagePath } from "../../../../../packages/utils/src/image.util.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	albumId: Joi.string().uuid().required(),
	userId: Joi.string().uuid().required(),
	threshold: Joi.number().min(0).max(64).default(5), // Hamming distance threshold
});

const aliasSpec = {
	image: {
		image_id: "imageId",
		image_path: "imagePath",
		optimized_path: "optimizedPath",
		file_hash: "fileHash",
		perceptual_hash: "perceptualHash",
		upload_date: "uploadDate",
	},
};

// Calculate Hamming distance between two hex hashes
const getHammingDistance = (h1: string, h2: string) => {
	if (!h1 || !h2 || h1.length !== h2.length) return 99;

	let distance = 0;
	for (let i = 0; i < h1.length; i++) {
		const val = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
		// Count set bits
		let v = val;
		while (v > 0) {
			if (v & 1) distance++;
			v >>= 1;
		}
	}
	return distance;
};

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	// 1. Fetch all images in the album that have a perceptual hash
	const albumImages = await prisma.album_images.findMany({
		where: {
			album_id: params.albumId,
			images: {
				deleted_at: null,
				perceptual_hash: { not: null },
			},
		},
		include: {
			images: true,
		},
		orderBy: {
			images: { upload_date: "desc" },
		},
	});

	const images = albumImages.map((ai) => ai.images);
	const groups: any[] = [];
	const processed = new Set<string>();

	for (let i = 0; i < images.length; i++) {
		const img1 = images[i];
		if (processed.has(img1.image_id)) continue;

		const duplicates = [];
		for (let j = i + 1; j < images.length; j++) {
			const img2 = images[j];
			if (processed.has(img2.image_id)) continue;

			// Exact hash check or pHash check
			const isExact = img1.file_hash && img1.file_hash === img2.file_hash;
			const distance = getHammingDistance(
				img1.perceptual_hash!,
				img2.perceptual_hash!,
			);

			if (isExact || distance <= params.threshold) {
				duplicates.push({
					...aliaserSpec(aliasSpec.image, {
						...img2,
						image_path: normalizeImagePath(img2.image_path),
					}),
					distance,
					isExact,
				});
				processed.add(img2.image_id);
			}
		}

		if (duplicates.length > 0) {
			groups.push({
				original: aliaserSpec(aliasSpec.image, {
					...img1,
					image_path: normalizeImagePath(img1.image_path),
				}),
				duplicates,
			});
			processed.add(img1.image_id);
		}
	}

	return groups;
};

export const findDuplicatesService = service;
