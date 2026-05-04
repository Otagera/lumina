import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export interface UseInfiniteScrollOptions {
	view: "gallery" | "moderation" | "duplicates";
	hasGalleryNextPage: boolean;
	hasModerationNextPage: boolean;
	isFetchingGalleryNext: boolean;
	isFetchingModerationNext: boolean;
	fetchGalleryNext: () => void;
	fetchModerationNext: () => void;
	rootMargin?: string;
}

export function useInfiniteScroll({
	view,
	hasGalleryNextPage,
	hasModerationNextPage,
	isFetchingGalleryNext,
	isFetchingModerationNext,
	fetchGalleryNext,
	fetchModerationNext,
	rootMargin = "200px",
}: UseInfiniteScrollOptions) {
	const { ref, inView } = useInView({ rootMargin });

	useEffect(() => {
		if (!inView) return;

		if (view === "gallery" && hasGalleryNextPage && !isFetchingGalleryNext) {
			fetchGalleryNext();
		} else if (
			view === "moderation" &&
			hasModerationNextPage &&
			!isFetchingModerationNext
		) {
			fetchModerationNext();
		}
	}, [
		inView,
		view,
		hasGalleryNextPage,
		isFetchingGalleryNext,
		fetchGalleryNext,
		hasModerationNextPage,
		isFetchingModerationNext,
		fetchModerationNext,
	]);

	return { ref, inView };
}