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
				where: { album_id: albumId, deleted_at: null },
				include: { album_members: true },
			});

			if (!album) {
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
