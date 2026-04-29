import prisma from "../../config/src/db.config.ts";
import { ForbiddenError, NotFoundError } from "./error.util.ts";

export const checkAlbumPermissions = async (
	albumId: string,
	userId: string,
	allowedRoles: string[],
): Promise<string> => {
	const album = await prisma.albums.findUnique({
		where: { album_id: albumId, deleted_at: null },
		include: { album_members: true },
	});

	if (!album) {
		throw new NotFoundError("Album not found");
	}

	// Creator is implicitly an ADMIN
	if (album.created_by === userId) {
		return "ADMIN";
	}

	const member = album.album_members.find((m: any) => m.user_id === userId);

	if (!member) {
		throw new ForbiddenError("You do not have access to this album");
	}

	if (!allowedRoles.includes(member.role)) {
		throw new ForbiddenError(
			`You require one of these roles: ${allowedRoles.join(", ")}`,
		);
	}

	return member.role;
};
