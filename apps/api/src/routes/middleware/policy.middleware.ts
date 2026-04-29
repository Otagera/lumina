import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";

export const checkTaggingPolicy = async ({
	faceId,
	userId,
	guestSessionId,
}: {
	faceId: number;
	userId?: string;
	guestSessionId?: string;
}) => {
	// 1. Fetch the face and its associated album(s)
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

	if (!face) {
		throw new NotFoundError("Face not found.");
	}

	const image = face.images;
	if (!image) {
		throw new Error("Face is not associated with an image.");
	}

	// A face/image could be in multiple albums, but tagging policy is usually
	// tied to the primary context. For simplicity, we check ALL albums it belongs to.
	const albums = image.album_images.map((ai) => ai.albums);

	if (albums.length === 0) {
		// If not in any album, default to owner-only if it has an owner, otherwise allow
		if (image.uploaded_by && image.uploaded_by !== userId) {
			throw new ForbiddenError("Only the owner can tag this untracked image.");
		}
		return;
	}

	// If ANY album allows it, we allow it (most permissive)
	for (const album of albums) {
		const policy = album.tagging_policy || "HOST_ONLY";

		// 1. HOST_ONLY: Only the album creator can tag
		if (policy === "HOST_ONLY") {
			if (userId && album.created_by === userId) return;
			continue; // Check other albums
		}

		// 2. ANYONE: Any authenticated user can tag
		if (policy === "ANYONE") {
			if (userId) return;
			continue;
		}

		// 3. GUESTS_SELF: Guests can tag themselves (the photos they uploaded)
		if (policy === "GUESTS_SELF") {
			// Check if this user is the owner of the album
			if (userId && album.created_by === userId) return;

			// Check if this user uploaded this specific image
			if (userId && image.uploaded_by === userId) return;
			if (guestSessionId && image.guest_session_id === guestSessionId) return;
		}
	}

	throw new ForbiddenError(
		"You do not have permission to tag this face based on the album policy.",
	);
};
