import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
	Album,
	AlbumImage,
	AlbumImageFilters,
	ApiResponse,
	ImagesInAlbum,
	ImagesInAlbumResponse,
	ViewMode,
} from "~/types";
import { fetchAlbum, fetchImagesInAlbum, fetchSettings } from "~/utils/api";
import { albumKeys, imageKeys, settingsKeys } from "~/utils/queryKeys";

export interface UseAlbumImagesOptions {
	albumId: string;
	view: ViewMode;
	filters?: AlbumImageFilters;
}

export interface UseAlbumImagesReturn {
	approvedImages: AlbumImage[];
	pendingImages: AlbumImage[];
	isApprovedLoading: boolean;
	isPendingLoading: boolean;
	fetchNextApproved: () => void;
	fetchNextPending: () => void;
	hasApprovedNextPage: boolean;
	hasPendingNextPage: boolean;
	isFetchingApprovedNext: boolean;
	isFetchingPendingNext: boolean;
	albumData: ApiResponse<Album> | undefined;
	isAlbumLoading: boolean;
	settingsData:
	| { data: { usage: { imagesUsed: number; imagesLimit: number } } }
	| undefined;
}

export function useAlbumImages({
	albumId,
	view,
	filters = {},
}: UseAlbumImagesOptions): UseAlbumImagesReturn {
	const approvedQuery = useInfiniteQuery({
		queryKey: imageKeys.albumList(albumId, "APPROVED"),
		queryFn: ({ pageParam }) =>
			fetchImagesInAlbum({ albumId, pageParam, status: "APPROVED" }),
		enabled: !!albumId && view === "gallery",
		getNextPageParam: (lastPage) =>
			lastPage?.data?.pagination?.nextCursor || null,
		initialPageParam: null as string | null,
	});

	const pendingQuery = useInfiniteQuery({
		queryKey: imageKeys.albumListFiltered(albumId, filters),
		queryFn: ({ pageParam }) =>
			fetchImagesInAlbum({
				albumId,
				pageParam,
				status: "PENDING",
				...filters,
			}),
		enabled: !!albumId && view === "moderation",
		getNextPageParam: (lastPage) =>
			lastPage?.data?.pagination?.nextCursor || null,
		initialPageParam: null as string | null,
	});

	const albumQuery = useQuery({
		queryKey: albumKeys.detail(albumId),
		queryFn: () => fetchAlbum(albumId),
		enabled: !!albumId,
	});

	const settingsQuery = useQuery({
		queryKey: settingsKeys.all,
		queryFn: fetchSettings,
	});

	const approvedImages = useMemo(() => {
		return (
			approvedQuery.data?.pages.flatMap(
				(page: ApiResponse<ImagesInAlbumResponse>) =>
					page?.data?.imagesInAlbum?.map(
						(albumImageJoin: ImagesInAlbum) => albumImageJoin.images,
					) || [],
			) || []
		);
	}, [approvedQuery.data]);

	const pendingImages = useMemo(() => {
		return (
			pendingQuery.data?.pages.flatMap(
				(page: ApiResponse<ImagesInAlbumResponse>) =>
					page?.data?.imagesInAlbum?.map(
						(albumImageJoin: ImagesInAlbum) => albumImageJoin.images,
					) || [],
			) || []
		);
	}, [pendingQuery.data]);

	return {
		approvedImages,
		pendingImages,
		isApprovedLoading: approvedQuery.isLoading,
		isPendingLoading: pendingQuery.isLoading,
		fetchNextApproved: approvedQuery.fetchNextPage,
		fetchNextPending: pendingQuery.fetchNextPage,
		hasApprovedNextPage: approvedQuery.hasNextPage || false,
		hasPendingNextPage: pendingQuery.hasNextPage || false,
		isFetchingApprovedNext: approvedQuery.isFetchingNextPage,
		isFetchingPendingNext: pendingQuery.isFetchingNextPage,
		albumData: albumQuery.data as ApiResponse<Album> | undefined,
		isAlbumLoading: albumQuery.isLoading,
		settingsData: settingsQuery.data as
			| { data: { usage: { imagesUsed: number; imagesLimit: number } } }
			| undefined,
	};
}
