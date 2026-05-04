import prisma from "../../config/src/db.config.ts";

const fetchFaceById = async (face_id) => {
	return await prisma.faces.findUnique({
		where: {
			face_id,
		},
		include: {
			images: {
				include: {
					album_images: true,
				},
			},
			people: true,
		},
	});
};

const createNewFace = async (data) => {
	return await prisma.faces.create({
		data,
	});
};

const deleteFacesByImageId = async (image_id) => {
	return await prisma.faces.deleteMany({
		where: {
			image_id,
		},
	});
};

const ignoreFace = async (personId: string, faceId: number, userId: string) => {
	const face = await prisma.faces.findUnique({
		where: { face_id: faceId },
		include: {
			images: {
				include: {
					album_images: {
						include: {
							albums: true,
						},
					},
				},
			},
		},
	});

	const album = face?.images?.album_images?.[0]?.albums;
	if (!album?.created_by) {
		throw new Error("Face not found or not accessible");
	}

	if (album.created_by !== userId) {
		throw new Error("Not authorized to modify this face");
	}

	try {
		return await prisma.ignored_faces.create({
			data: {
				person_id: personId,
				face_id: faceId,
			},
		});
	} catch (e: any) {
		if (e.code === "P2002") return;
		throw e;
	}
};

const unignoreFace = async (
	personId: string,
	faceId: number,
	userId: string,
) => {
	const face = await prisma.faces.findUnique({
		where: { face_id: faceId },
		include: {
			images: {
				include: {
					album_images: {
						include: {
							albums: true,
						},
					},
				},
			},
		},
	});

	const album = face?.images?.album_images?.[0]?.albums;
	if (!album?.created_by) {
		throw new Error("Face not found or not accessible");
	}

	if (album.created_by !== userId) {
		throw new Error("Not authorized to modify this face");
	}

	return await prisma.ignored_faces.deleteMany({
		where: {
			person_id: personId,
			face_id: faceId,
		},
	});
};

const searchFaces = async ({
	faceId,
	personId,
	albumId,
	threshold = 0.8,
	limit = 20,
	imageIds,
	excludeSourceFace = false,
}: {
	faceId?: number;
	personId?: string;
	albumId?: string;
	threshold?: number;
	limit?: number;
	imageIds?: string[];
	excludeSourceFace?: boolean;
}) => {
	let targetEmbedding: number[] | null = null;
	let targetPersonId = personId;

	if (faceId) {
		const targetFace = await fetchFaceById(faceId);
		if (targetFace) {
			targetEmbedding = targetFace.embedding as number[];
			if (!targetPersonId && targetFace.person_id) {
				targetPersonId = targetFace.person_id;
			}
		}
	}

	if (!targetEmbedding && !targetPersonId) {
		return [];
	}

	const params: any[] = [];
	let distanceQuery = "";
	let ignoredJoin = "";

	if (targetPersonId) {
		// If we have a personId, find the minimum distance to ANY of their confirmed faces
		params.push(targetPersonId);
		distanceQuery = `
      (
        SELECT MIN(1.0 - (
          SELECT (SUM(u1.val * u2.val) / (SQRT(SUM(u1.val * u1.val)) * SQRT(SUM(u2.val * u2.val))))
          FROM unnest(f.embedding) WITH ORDINALITY AS u1(val, idx)
          JOIN unnest(p_faces.embedding) WITH ORDINALITY AS u2(val, idx) ON u1.idx = u2.idx
        ))
        FROM faces p_faces
        WHERE p_faces.person_id = $1::uuid
      )
    `;
		ignoredJoin =
			"LEFT JOIN ignored_faces ig ON ig.face_id = f.face_id AND ig.person_id = $1::uuid";
	} else {
		// Single face search
		params.push(targetEmbedding);
		distanceQuery = `
      (
        SELECT 1.0 - (SUM(u1.val * u2.val) / (SQRT(SUM(u1.val * u1.val)) * SQRT(SUM(u2.val * u2.val))))
        FROM unnest(f.embedding) WITH ORDINALITY AS u1(val, idx)
        JOIN unnest($1::real[]) WITH ORDINALITY AS u2(val, idx) ON u1.idx = u2.idx
      )
    `;
		// No ignored faces possible if no person is identified
		ignoredJoin = "LEFT JOIN (SELECT NULL::int as id) ig ON false";
	}

	// Add faceId to avoid returning the same face if searching by faceId and excludeSourceFace is true
	let excludeClause = "";
	if (faceId && excludeSourceFace) {
		params.push(faceId);
		excludeClause = `AND f.face_id != $${params.length}`;
	}

	let query = `
    WITH distances AS (
      SELECT
        f.face_id,
        ${distanceQuery} as distance
      FROM
        faces f
      WHERE 1=1 ${excludeClause}
    ),
    ranked_faces AS (
      SELECT
        f.face_id,
        f.image_id,
        i.image_path,
        i.storage_provider,
        i.storage_key,
        i.original_width as "originalWidth",
        i.original_height as "originalHeight",
        f.bounding_box,
        d.distance,
        p.name as "personName",
        f.person_id as "personId",
        CASE WHEN ig.id IS NOT NULL THEN true ELSE false END as is_ignored,
        ROW_NUMBER() OVER (PARTITION BY f.image_id ORDER BY d.distance ASC) as rn
      FROM
        faces f
      JOIN
        images i ON f.image_id = i.image_id
      JOIN
        distances d ON f.face_id = d.face_id
      LEFT JOIN
        people p ON f.person_id = p.person_id
      ${ignoredJoin}
  `;

	const thresholdParamIdx = params.length + 1;
	params.push(threshold);
	const whereClauses = [`d.distance <= $${thresholdParamIdx}`];

	if (albumId) {
		params.push(albumId);
		whereClauses.push(
			`i.image_id IN (SELECT image_id FROM album_images WHERE album_id = $${params.length}::uuid)`,
		);
	}

	if (imageIds && imageIds.length > 0) {
		params.push(imageIds);
		whereClauses.push(`i.image_id = ANY($${params.length}::uuid[])`);
	}

	query += ` WHERE ${whereClauses.join(" AND ")}`;

	query += `
    )
    SELECT
      face_id as "faceId",
      image_id as "imageId",
      image_path as "imagePath",
      storage_provider as "storageProvider",
      storage_key as "storageKey",
      "originalWidth",
      "originalHeight",
      bounding_box as "boundingBox",
      distance,
      "personName",
      "personId",
      is_ignored as "isIgnored"
    FROM ranked_faces
    WHERE rn = 1
    ORDER BY distance ASC
    LIMIT $${params.length + 1};
  `;
	params.push(limit);

	return (await prisma.$queryRawUnsafe(query, ...params)) as any[];
};

const searchFacesByEmbedding = async ({
	embedding,
	albumId,
	threshold = 0.8,
	limit = 10,
	imageIds,
}: {
	embedding: number[];
	albumId?: string;
	threshold?: number;
	limit?: number;
	imageIds?: string[];
}) => {
	const params = [embedding, threshold, limit];

	let query = `
    WITH distances AS (
      SELECT
        f.face_id,
        (
          SELECT 1.0 - (SUM(u1.val * u2.val) / (SQRT(SUM(u1.val * u1.val)) * SQRT(SUM(u2.val * u2.val))))
          FROM unnest(f.embedding) WITH ORDINALITY AS u1(val, idx)
          JOIN unnest($1::real[]) WITH ORDINALITY AS u2(val, idx) ON u1.idx = u2.idx
        ) as distance
      FROM
        faces f
    ),
    ranked_faces AS (
      SELECT
        f.face_id,
        f.image_id,
        i.image_path,
        i.storage_provider,
        i.storage_key,
        i.original_width as "originalWidth",
        i.original_height as "originalHeight",
        f.bounding_box,
        d.distance,
        ROW_NUMBER() OVER (PARTITION BY f.image_id ORDER BY d.distance ASC) as rn
      FROM
        faces f
      JOIN
        images i ON f.image_id = i.image_id
      JOIN
        distances d ON f.face_id = d.face_id
  `;

	const whereClauses = ["d.distance <= $2"];
	if (albumId) {
		params.push(albumId);
		whereClauses.push(
			`i.image_id IN (SELECT image_id FROM album_images WHERE album_id = $${params.length}::uuid)`,
		);
	}

	if (imageIds && imageIds.length > 0) {
		params.push(imageIds);
		whereClauses.push(`i.image_id = ANY($${params.length}::uuid[])`);
	}

	query += ` WHERE ${whereClauses.join(" AND ")}`;

	query += `
    )
    SELECT
      face_id as "faceId",
      image_id as "imageId",
      image_path as "imagePath",
      storage_provider as "storageProvider",
      storage_key as "storageKey",
      "originalWidth",
      "originalHeight",
      bounding_box as "boundingBox",
      distance
    FROM ranked_faces
    WHERE rn = 1
    ORDER BY distance ASC
    LIMIT $3;
  `;

	return (await prisma.$queryRawUnsafe(query, ...params)) as any[];
};

const updateFacePerson = async (
	face_id: number,
	person_id: string | null,
	userId: string,
) => {
	const face = await prisma.faces.findUnique({
		where: { face_id },
		include: {
			images: {
				include: {
					album_images: {
						include: {
							albums: true,
						},
					},
				},
			},
		},
	});

	if (!face?.images?.album_images?.[0]?.albums?.created_by) {
		throw new Error("Face not found or not accessible");
	}

	if (face.images.album_images[0].albums.created_by !== userId) {
		throw new Error("Not authorized to modify this face");
	}

	return await prisma.faces.update({
		where: {
			face_id,
		},
		data: {
			person_id,
		},
	});
};

export {
	fetchFaceById,
	searchFaces,
	searchFacesByEmbedding,
	createNewFace,
	deleteFacesByImageId,
	updateFacePerson,
	ignoreFace,
	unignoreFace,
};
