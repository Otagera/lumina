import { useQuery } from "@tanstack/react-query";
import { fetchSharedAlbum } from "~/utils/api";
import type { AlbumPhase, AlbumStats, SharedAlbum } from "~/types";

export interface UseSharedAlbumResult {
	album: SharedAlbum | undefined;
	phase: AlbumPhase;
	stats: AlbumStats | undefined;
	isLoading: boolean;
	isError: boolean;
}

export const useSharedAlbum = (
	token: string | undefined,
	options?: { refetchInterval?: number },
): UseSharedAlbumResult => {
	const { data: albumResponse, isLoading, isError } = useQuery({
		queryKey: ["shared-album", token],
		queryFn: () => fetchSharedAlbum(token!),
		enabled: !!token,
		refetchInterval: options?.refetchInterval,
	});

	const album = albumResponse?.data;
	const phase: AlbumPhase = album?.phase ?? "collecting";
	const stats = album?.stats;

	return { album, phase, stats, isLoading, isError };
};
