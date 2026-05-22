import {
	createPublicEventClient,
	eventAlbumKeys,
	useEventAlbum,
	useEventAlbumHighlights,
	useSelfieSearch,
} from "@lumina/event-sdk";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useLiveAlbum } from "~/hooks/useLiveAlbum";
import { api } from "~/utils/eden";

const publicEventClient = createPublicEventClient({
	getAlbum: async (token: string) => {
		const res = await api.public.albums[token].get();
		if (res.error) throw res.error;
		return res.data;
	},
	getHighlights: async (token: string) => {
		const res = await api.public.albums[token].highlights.get();
		if (res.error) throw res.error;
		return res.data;
	},
	searchByImage: async (token: string, selfie: File | Blob) => {
		const res = await api.public.albums[token]["search-by-image"].post({
			selfie: selfie as File,
		});
		if (res.error) throw res.error;
		return res.data;
	},
});

export function useEventLogic(token: string | undefined) {
	const queryClient = useQueryClient();
	const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
	const [selectedImage, setSelectedImage] = useState<any | null>(null);
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [ctaVisible, setCtaVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const ctaImpressionSentRef = useRef(false);
	const [isReviewMode, setIsReviewMode] = useState(false);
	const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

	useEffect(() => {
		setIsOnline(window.navigator.onLine);
		const onOnline = () => setIsOnline(true);
		const onOffline = () => setIsOnline(false);
		window.addEventListener("online", onOnline);
		window.addEventListener("offline", onOffline);
		return () => {
			window.removeEventListener("online", onOnline);
			window.removeEventListener("offline", onOffline);
		};
	}, []);

	const { data: albumData, isLoading: isAlbumLoading } = useEventAlbum({
		token: token!,
		client: publicEventClient,
	});

	const {
		data: searchResults,
		isLoading: isSearchLoading,
		refetch: runSearch,
	} = useQuery({
		queryKey: ["semantic-search-public", token, searchQuery],
		queryFn: async () => {
			const res = await api.search.semantic.public.post({
				query: searchQuery,
				shareToken: token!,
			});
			if (res.error) throw res.error;
			return res.data;
		},
		enabled: false,
	});

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			setIsSearching(true);
			runSearch();
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		setIsSearching(false);
	};

	const albumId = albumData?.id;
	const { reactions: liveReactions } = useLiveAlbum(albumId);

	const { data: highlightsData, isLoading: isHighlightsLoading } =
		useEventAlbumHighlights({
			token: token!,
			client: publicEventClient,
		});

	const searchMutation = useSelfieSearch({
		token: token!,
		client: publicEventClient,
		onSuccess: (data) => {
			if (data?.faces) {
				toast.success(`Found ${data.faces.length} photos of you!`);
			}
		},
		onError: (error: any) => {
			console.error("Search failed:", error);
			toast.error(error.message || "Face search failed. Try another photo.");
		},
	});

	const reactMutation = useMutation({
		mutationFn: async (imageId: string) => {
			const res = await api.reactions.post({
				imageId,
				type: "HEART",
			});
			if (res.error) throw res.error;
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: eventAlbumKeys.highlights(token as string),
			});
		},
	});

	const { data: suggestionsData, refetch: runSuggestions } = useQuery({
		queryKey: ["face-suggestions-guest", token, searchMutation.data?.embedding],
		queryFn: async () => {
			if (!searchMutation.data?.embedding) return null;
			const res = await api.public.albums[token!].suggestions.post({
				embedding: searchMutation.data.embedding as number[],
			});
			if (res.error) throw res.error;
			return res.data;
		},
		enabled: false,
	});

	const handleIgnoreSuggestion = () => {
		setCurrentSuggestionIndex((prev) => prev + 1);
	};

	const handleConfirmSuggestion = () => {
		toast.success("Match confirmed! Thank you.");
		setCurrentSuggestionIndex((prev) => prev + 1);
	};

	const suggestions = suggestionsData?.data?.suggestions || [];
	const currentSuggestion = suggestions[currentSuggestionIndex];

	const handleCapture = (file: File) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			setSelfiePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
		searchMutation.mutate(file, {
			onSuccess: (data) => {
				if (data?.embedding) {
					runSuggestions();
				}
			},
		});
	};

	const images = useMemo(() => {
		if (isSearching && searchResults?.data?.images) {
			return searchResults.data.images;
		}
		const searchResultsByFace = searchMutation.data?.faces || [];
		const highlights = highlightsData || [];
		return searchMutation.data?.faces ? searchResultsByFace : highlights;
	}, [isSearching, searchResults, searchMutation.data, highlightsData]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const imageIdFromUrl = params.get("imageId");

		if (imageIdFromUrl && images.length > 0) {
			const img = images.find((i: any) => i.imageId === imageIdFromUrl);
			if (img && (!selectedImage || selectedImage.imageId !== imageIdFromUrl)) {
				setSelectedImage(img);
			}
		} else if (!imageIdFromUrl && selectedImage) {
			setSelectedImage(null);
		}
	}, [images, selectedImage]);

	const handleImageClick = (img: any) => {
		const params = new URLSearchParams(window.location.search);
		params.set("imageId", img.imageId);
		window.history.pushState({}, "", `?${params.toString()}`);
		setSelectedImage(img);
	};

	const handleCloseModal = () => {
		const params = new URLSearchParams(window.location.search);
		params.delete("imageId");
		const newSearch = params.toString();
		window.history.pushState(
			{},
			"",
			newSearch ? `?${newSearch}` : window.location.pathname,
		);
		setSelectedImage(null);
	};

	const handleActiveImageChange = (img: any) => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("imageId") !== img.imageId) {
			params.set("imageId", img.imageId);
			window.history.replaceState({}, "", `?${params.toString()}`);
		}
	};

	const isNoMatchesState =
		!!searchMutation.data && !isSearching && images.length === 0;
	const albumQueryError = !isAlbumLoading && !albumData;
	const highlightsQueryError = !isHighlightsLoading && !highlightsData;
	const showOfflineFallback =
		!isOnline && (albumQueryError || highlightsQueryError);

	const ctaMilestone = searchMutation.data
		? images.length > 0
			? "results"
			: "search"
		: "discover";
	const ctaUrl = useMemo(() => {
		if (!token) return "#";
		const clientAppUrl =
			import.meta.env.VITE_CLIENT_APP_URL || "http://localhost:3001";
		const signup = new URL("/signup", clientAppUrl);
		signup.searchParams.set("token", token);
		signup.searchParams.set("referrer", `guest_event_${ctaMilestone}_cta`);
		if (albumData?.id) signup.searchParams.set("albumId", albumData.id);
		if (albumData?.albumName)
			signup.searchParams.set("albumName", albumData.albumName);
		return signup.toString();
	}, [albumData?.albumName, albumData?.id, ctaMilestone, token]);

	useEffect(() => {
		const shouldShowCta = !!searchMutation.data || isNoMatchesState;
		if (shouldShowCta) {
			const timer = window.setTimeout(() => setCtaVisible(true), 900);
			return () => window.clearTimeout(timer);
		}
		setCtaVisible(false);
		return undefined;
	}, [searchMutation.data, isNoMatchesState]);

	useEffect(() => {
		ctaImpressionSentRef.current = false;
	}, [ctaMilestone]);

	useEffect(() => {
		if (!ctaVisible || ctaImpressionSentRef.current) return;
		window.dispatchEvent(
			new CustomEvent("lumina:analytics", {
				detail: {
					event: "guest_host_cta_impression",
					milestone: ctaMilestone,
					token,
					albumId: albumData?.id,
				},
			}),
		);
		ctaImpressionSentRef.current = true;
	}, [albumData?.id, ctaMilestone, ctaVisible, token]);

	const mergedReactions = useMemo(() => {
		const base: Record<string, number> = {};
		if (highlightsData) {
			highlightsData.forEach((img: any) => {
				base[img.imageId] = img.reactionCount || 0;
			});
		}
		if (searchMutation.data?.faces) {
			searchMutation.data.faces.forEach((img: any) => {
				base[img.imageId] = img.reactionCount || 0;
			});
		}
		if (searchResults?.data?.images) {
			searchResults.data.images.forEach((img: any) => {
				base[img.imageId] = img.reactionCount || 0;
			});
		}
		return { ...base, ...liveReactions };
	}, [highlightsData, searchMutation.data, searchResults, liveReactions]);

	const isLoading = isAlbumLoading || isHighlightsLoading;

	return {
		albumData,
		images,
		mergedReactions,
		suggestions,
		currentSuggestion,
		currentSuggestionIndex,
		selfiePreview,
		setSelfiePreview,
		selectedImage,
		isCameraOpen,
		setIsCameraOpen,
		ctaVisible,
		searchQuery,
		setSearchQuery,
		isSearching,
		isReviewMode,
		setIsReviewMode,
		isLoading,
		isSearchLoading,
		isNoMatchesState,
		showOfflineFallback,
		searchMutation,
		reactMutation,
		ctaMilestone,
		ctaUrl,
		handleSearch,
		clearSearch,
		handleCapture,
		handleIgnoreSuggestion,
		handleConfirmSuggestion,
		handleImageClick,
		handleCloseModal,
		handleActiveImageChange,
		queryClient,
		token,
	};
}
