import { Elysia } from "elysia";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	ForbiddenError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";

export const requireAlbumRole = (allowedRoles: string[]) =>
	new Elysia({ name: "require-album-role" }).derive(
		async ({ params, userId }) => {
			const albumId = (params as any)?.albumId;
			if (!albumId || !userId) {
				return { albumRole: null };
			}

			const album = await prisma.albums.findUnique({
				where: { album_id: albumId },
				include: { album_members: true },
			});

			if (!album || album.deleted_at) {
				throw new NotFoundError("Album not found");
			}

			if (album.created_by === userId) {
				return { albumRole: "ADMIN" };
			}

			const member = album.album_members.find((m) => m.user_id === userId);

			if (!member) {
				throw new ForbiddenError("You do not have access to this album");
			}

			if (!allowedRoles.includes(member.role)) {
				throw new ForbiddenError(
					`You require one of these roles: ${allowedRoles.join(", ")}`,
				);
			}

			return { albumRole: member.role };
		},
	);

export const checkAlbumPermissions = async (
	albumId: string,
	userId: string,
	allowedRoles: string[],
) => {
	const album = await prisma.albums.findUnique({
		where: { album_id: albumId },
		include: { album_members: true },
	});

	if (!album || album.deleted_at) {
		throw new NotFoundError("Album not found");
	}

	if (album.created_by === userId) {
		return "ADMIN";
	}

	const member = album.album_members.find((m) => m.user_id === userId);

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

export const getAlbumForUser = async (albumId: string, userId: string) => {
	const album = await prisma.albums.findFirst({
		where: {
			album_id: albumId,
			OR: [
				{ created_by: userId },
				{ album_members: { some: { user_id: userId } } },
			],
			deleted_at: null,
		},
	});

	if (!album) {
		throw new NotFoundError("Album not found or access denied");
	}

	return album;
};
