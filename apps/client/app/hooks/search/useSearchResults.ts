import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import type { SearchResultFace, SearchSourceFace } from "~/types";
import {
	ignoreFace,
	searchFaces,
	unignoreFace,
	updateFace,
} from "~/utils/api";

const CONFIDENT_THRESHOLD = 0.5;
const POSSIBLE_THRESHOLD = 0.2;

export const useSearchResults = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [results, setResults] = useState<SearchResultFace[]>([]);
	const [sourceFace, setSourceFace] = useState<SearchSourceFace | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [refetchToken, setRefetchToken] = useState(0);

	const faceId = searchParams.get("faceId");
	const albumId = searchParams.get("albumId");
	const shareToken = searchParams.get("shareToken");
	const selectedImageId = searchParams.get("imageId");

	const selectedImage = useMemo(() => {
		if (!selectedImageId || !results.length) return null;
		return results.find((r) => r.imageId === selectedImageId) || null;
	}, [selectedImageId, results]);

	const setSelectedImage = useCallback(
		(image: SearchResultFace | null) => {
			setSearchParams((prev) => {
				if (image) prev.set("imageId", image.imageId);
				else prev.delete("imageId");
				return prev;
			});
		},
		[setSearchParams],
	);

	const { confident, possible, ignored } = useMemo(() => {
		const filtered = results.filter((f) => !f.hidden);
		const active = filtered.filter((f) => !f.isIgnored);
		const score = (f: SearchResultFace) => 1 - (f.distance || 0);
		return {
			confident: active.filter((f) => score(f) >= CONFIDENT_THRESHOLD),
			possible: active.filter(
				(f) => score(f) < CONFIDENT_THRESHOLD && score(f) >= POSSIBLE_THRESHOLD,
			),
			ignored: filtered.filter((f) => f.isIgnored),
		};
	}, [results]);

	useEffect(() => {
		const performSearch = async () => {
			if (!faceId) {
				setError("No face ID provided for search.");
				setLoading(false);
				return;
			}
			try {
				setLoading(true);
				setError(null);
				const response = await searchFaces({
					faceId: Number.parseInt(faceId, 10),
					albumId: albumId || undefined,
					shareToken: shareToken || undefined,
				});
				if (response?.status === "completed") {
					setResults(response.data.faces || []);
					setSourceFace(response.data.sourceFace || null);
				} else {
					setError(response?.message || "Couldn't load matches.");
				}
			} catch (err) {
				console.error("Search error:", err);
				setError("Something went wrong while searching.");
			} finally {
				setLoading(false);
			}
		};
		performSearch();
	}, [faceId, albumId, shareToken, refetchToken]);

	const refetch = useCallback(() => setRefetchToken((n) => n + 1), []);

	const handleConfirm = useCallback(
		async (face: SearchResultFace, onNeedsTag: (faceId: number) => void) => {
			if (!sourceFace) return;
			if (!sourceFace.personId) {
				onNeedsTag(sourceFace.faceId);
				return;
			}
			try {
				await updateFace(face.faceId, { personId: sourceFace.personId });
				setResults((prev) =>
					prev.map((f) =>
						f.faceId === face.faceId
							? { ...f, personId: sourceFace.personId, isConfirmed: true }
							: f,
					),
				);
				toast.success("Match confirmed");
			} catch (err) {
				console.error("Failed to confirm match:", err);
				toast.error("Couldn't confirm match");
			}
		},
		[sourceFace],
	);

	const handleReject = useCallback(
		async (faceIdToReject: number) => {
			if (sourceFace?.personId) {
				try {
					await ignoreFace(faceIdToReject, sourceFace.personId);
					setResults((prev) =>
						prev.map((f) =>
							f.faceId === faceIdToReject ? { ...f, isIgnored: true } : f,
						),
					);
					toast.success("Match ignored");
				} catch (err) {
					console.error("Failed to ignore face:", err);
					toast.error("Couldn't ignore match");
				}
			} else {
				setResults((prev) =>
					prev.map((f) =>
						f.faceId === faceIdToReject ? { ...f, hidden: true } : f,
					),
				);
			}
		},
		[sourceFace],
	);

	const handleRestore = useCallback(
		async (faceIdToRestore: number) => {
			if (!sourceFace?.personId) return;
			try {
				await unignoreFace(faceIdToRestore, sourceFace.personId);
				setResults((prev) =>
					prev.map((f) =>
						f.faceId === faceIdToRestore ? { ...f, isIgnored: false } : f,
					),
				);
				toast.success("Match restored");
			} catch (err) {
				console.error("Failed to restore face:", err);
				toast.error("Couldn't restore match");
			}
		},
		[sourceFace],
	);

	return {
		faceId,
		albumId,
		shareToken,
		results,
		sourceFace,
		loading,
		error,
		confident,
		possible,
		ignored,
		selectedImage,
		setSelectedImage,
		handleConfirm,
		handleReject,
		handleRestore,
		refetch,
	};
};
