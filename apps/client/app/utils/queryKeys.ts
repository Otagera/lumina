import type { AlbumImageFilters } from "~/types";

export const imageKeys = {
	all: ["images"] as const,
	album: (albumId: string) => [...imageKeys.all, albumId] as const,
	albumList: (albumId: string, status: string) =>
		[...imageKeys.album(albumId), status] as const,
	albumListFiltered: (albumId: string, filters: AlbumImageFilters) =>
		[...imageKeys.album(albumId), "PENDING", filters] as const,
};

export const albumKeys = {
	all: ["album"] as const,
	detail: (albumId: string) => [...albumKeys.all, albumId] as const,
	list: () => [...albumKeys.all, "list"] as const,
};

export const settingsKeys = {
	all: ["settings"] as const,
};