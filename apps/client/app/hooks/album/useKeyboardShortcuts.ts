import { useEffect, useCallback } from "react";
import type { AlbumImage } from "~/types";
import type { ImageStatus } from "~/types";

export interface UseKeyboardShortcutsOptions {
	view: "gallery" | "moderation" | "duplicates";
	selectedIds: Set<string>;
	images: AlbumImage[];
	onModerate?: (status: ImageStatus, imageIds: string[]) => void;
	onNavigateNext?: (image: AlbumImage) => void;
	onNavigatePrev?: (image: AlbumImage) => void;
}

export function useKeyboardShortcuts({
	view,
	selectedIds,
	images,
	onModerate,
	onNavigateNext,
	onNavigatePrev,
}: UseKeyboardShortcutsOptions) {
	const handleModerate = useCallback(
		(status: ImageStatus) => {
			if (!onModerate) return;
			const targetIds = Array.from(selectedIds);
			if (targetIds.length === 0) return;
			onModerate(status, targetIds);
		},
		[selectedIds, onModerate],
	);

	const handleNavigate = useCallback(
		(direction: "next" | "prev") => {
			const currentIndex = images.findIndex((img) =>
				selectedIds.has(img.imageId),
			);
			if (currentIndex < 0) return;

			const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
			if (nextIndex < 0 || nextIndex >= images.length) return;

			const nextImage = images[nextIndex];
			if (direction === "next" && onNavigateNext) {
				onNavigateNext(nextImage);
			} else if (direction === "prev" && onNavigatePrev) {
				onNavigatePrev(nextImage);
			}
		},
		[images, selectedIds, onNavigateNext, onNavigatePrev],
	);

	useEffect(() => {
		if (view !== "moderation") return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			const targetIds = Array.from(selectedIds);
			if (targetIds.length === 0 && e.key !== "a" && e.key !== "r") return;

			if (e.key.toLowerCase() === "a") {
				e.preventDefault();
				handleModerate("APPROVED");
			} else if (e.key.toLowerCase() === "r") {
				e.preventDefault();
				handleModerate("REJECTED");
			} else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				handleNavigate("next");
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				handleNavigate("prev");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [view, selectedIds, handleModerate, handleNavigate]);
}