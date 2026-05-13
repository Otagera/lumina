import {
	createPublicEventClient,
	eventAlbumKeys,
	useEventAlbum,
	useEventAlbumHighlights,
	useSelfieSearch,
} from "@lumina/event-sdk";
import { ImageGrid } from "@lumina/ui/components/domain/ImageGrid";
import { SkeletonImageGrid } from "@lumina/ui/components/domain/Skeleton";
import { Button } from "@lumina/ui/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Camera,
	Heart,
	Image as ImageIcon,
	Scan,
	Sparkles,
	Trophy,
	WifiOff,
	Search,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "wouter";
import { GuestImageModal } from "~/components/GuestImageModal";
import { InAppCamera } from "~/components/InAppCamera";
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

export default function EventPage() {
	const { token } = useParams();
	const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
	const [selectedImage, setSelectedImage] = useState<any | null>(null);
	const [isCameraOpen, setIsCameraOpen] = useState(false);
	const [ctaVisible, setCtaVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const queryClient = useQueryClient();
	const [isOnline, setIsOnline] = useState(true);
	const ctaImpressionSentRef = useRef(false);

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

	// Fetch Album Details
	const { data: albumData, isLoading: isAlbumLoading } = useEventAlbum({
		token: token!,
		client: publicEventClient,
	});

	// Semantic Search Query
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

	// Fetch Highlights (Trending)
	const { data: highlightsData, isLoading: isHighlightsLoading } =
		useEventAlbumHighlights({
			token: token!,
			client: publicEventClient,
		});

	// Selfie Search Mutation
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

	// Reaction Mutation
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

	const handleCapture = (file: File) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			setSelfiePreview(reader.result as string);
		};
		reader.readAsDataURL(file);
		searchMutation.mutate(file);
	};

	const images = useMemo(() => {
		if (isSearching && searchResults?.data?.images) {
			return searchResults.data.images;
		}
		const searchResultsByFace = searchMutation.data?.faces || [];
		const highlights = highlightsData || [];
		return searchMutation.data?.faces ? searchResultsByFace : highlights;
	}, [isSearching, searchResults, searchMutation.data, highlightsData]);

	// Sync selectedImage with URL search params
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
		window.history.pushState({}, "", newSearch ? `?${newSearch}` : window.location.pathname);
		setSelectedImage(null);
	};

	const isNoMatchesState = !!searchMutation.data && !isSearching && images.length === 0;
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

	// Combine live reactions with initial data
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

	return (
		<div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 space-y-10 md:space-y-12">
			{showOfflineFallback ? (
				<div className="mx-2 rounded-[2rem] border border-amber-300/50 bg-amber-50 p-6 text-center dark:border-amber-700/40 dark:bg-amber-950/30">
					<WifiOff className="mx-auto mb-3 h-10 w-10 text-amber-600" />
					<h2 className="text-xl font-bold">Connection is weak or offline</h2>
					<p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-300">
						We could not refresh this event right now. Cached photos will appear
						when available, and we'll retry automatically once signal returns.
					</p>
					<Button
						className="mt-4"
						onClick={() => {
							queryClient.invalidateQueries({ queryKey: ["album", token] });
							queryClient.invalidateQueries({
								queryKey: ["album-highlights", token],
							});
						}}
					>
						Retry now
					</Button>
				</div>
			) : isLoading && !isSearching ? (
				<div className="p-6 space-y-6">
					<div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
					<SkeletonImageGrid count={12} />
				</div>
			) : (
				<>
					{/* Hero Section */}
					<header className="text-center space-y-4">
						<div className="inline-flex items-center px-3 py-1  text-xs font-black uppercase tracking-widest">
							Live Event Gallery
						</div>
						<h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white px-2 sm:px-4 text-balance break-words">
							{albumData?.albumName || "Event Gallery"}
						</h1>
						<p className="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto px-4 sm:px-6 text-pretty">
							Take a selfie and let our AI find every photo you're in,
							instantly.
						</p>
					</header>

					{/* Semantic Search UI */}
					{albumData?.settings?.semantic_search_enabled && (
						<form
							onSubmit={handleSearch}
							className="relative max-w-lg mx-auto w-full group px-4"
						>
							<div className="absolute inset-0 bg-sage/5 rounded-3xl blur-xl group-focus-within:bg-sage/10 transition-all" />
							<div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-1 shadow-lg transition-all focus-within:ring-2 focus-within:ring-sage/40">
								<div className="pl-4 pr-2 text-zinc-400">
									<Search size={18} />
								</div>
								<input
									type="text"
									placeholder="Search photos... (e.g. 'dancing')"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="flex-1 bg-transparent border-none outline-none py-3 text-sm font-bold text-zinc-900 dark:text-white placeholder:text-zinc-500 placeholder:font-medium"
								/>
								{searchQuery && (
									<button
										type="button"
										onClick={clearSearch}
										className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400"
									>
										<X size={14} />
									</button>
								)}
								<Button
									type="submit"
									disabled={isSearchLoading || !searchQuery.trim()}
									className="rounded-2xl px-5 h-11 bg-sage text-zinc-950 font-black tracking-tight"
								>
									{isSearchLoading ? "..." : "Search"}
								</Button>
							</div>
						</form>
					)}

					{/* Action Section */}
					<div className="flex flex-col items-center justify-center space-y-6 px-4">
						{!selfiePreview ? (
							<Button
								size="md"
								className="w-full sm:w-auto h-16 sm:h-20 px-6 sm:px-10 rounded-[2rem] sm:rounded-[2.5rem] text-lg sm:text-xl shadow-2xl shadow-sage/30 hover:scale-105 transition-transform bg-sage hover:bg-sage/90 text-zinc-950 border-none"
								onClick={() => setIsCameraOpen(true)}
								disabled={searchMutation.isPending}
							>
								{searchMutation.isPending ? (
									<div className="flex items-center gap-3">
										<div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
										Finding you...
									</div>
								) : (
									<>
										<Scan className="w-6 h-6 mr-3" />
										Find My Photos
									</>
								)}
							</Button>
						) : (
							<div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
								<div className="relative">
									<img
										src={selfiePreview!}
										alt="Selfie"
										className="w-24 h-24 rounded-[2rem] object-cover border-4 border-sage shadow-2xl"
									/>
									<button
										onClick={() => setIsCameraOpen(true)}
										className="absolute -bottom-1 -right-1 p-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-700 hover:scale-110 transition-transform"
									>
										<Camera className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
									</button>
								</div>
								<div className="flex flex-col items-center">
									<p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">
										Matched Results
									</p>
									<Button
										variant="link"
										size="sm"
										onClick={() => {
											searchMutation.reset();
											setSelfiePreview(null);
										}}
										className="text-zinc-400 h-auto p-0"
									>
										Clear & view highlights
									</Button>
								</div>
							</div>
						)}
					</div>

					{/* Gallery Section */}
					<section className="space-y-8">
						{isSearching && (
							<div className="flex items-center justify-between px-2 mb-4">
								<div className="flex items-center gap-2 text-sage">
									<Sparkles size={18} />
									<p className="text-sm font-black uppercase tracking-widest">
										AI Results for "{searchQuery}"
									</p>
								</div>
								<button
									onClick={clearSearch}
									className="text-xs font-bold text-zinc-400 underline underline-offset-4"
								>
									Clear
								</button>
							</div>
						)}

						{!isSearching && (
							<div className="flex items-center justify-between gap-2 px-2">
								<div className="flex items-center gap-3">
									{!selfiePreview ? (
										<div className="p-2 bg-sage/10 rounded-xl">
											<Trophy className="w-5 h-5 text-sage" />
										</div>
									) : (
										<div className="p-2 bg-rose-500/10 rounded-xl">
											<Heart className="w-5 h-5 text-rose-500" />
										</div>
									)}
									<h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words">
										{selfiePreview ? "Photos of You" : "Event Highlights"}
									</h3>
								</div>
								<span className="hidden sm:inline-flex px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
									{selfiePreview ? `${images.length} results` : "Trending Now"}
								</span>
							</div>
						)}

						{searchMutation.isPending || isSearchLoading ? (
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
								{Array.from({ length: 8 }).map((_, idx) => (
									<div
										key={`result-slot-${idx}`}
										className="aspect-[3/4] rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 overflow-hidden"
									>
										<div className="h-3/4 bg-gradient-to-br from-zinc-200 dark:from-zinc-800 to-zinc-100 dark:to-zinc-900 animate-pulse" />
										<div className="p-3 space-y-2">
											<div className="h-3 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
											<div className="h-3 w-1/2 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
										</div>
									</div>
								))}
							</div>
						) : images.length > 0 ? (
							<div className="px-2">
								<ImageGrid
									images={images}
									reactions={mergedReactions}
									onReaction={(id) => reactMutation.mutate(id)}
									onImageClick={handleImageClick}
								/>
							</div>
						) : isNoMatchesState || (isSearching && images.length === 0) ? (
							<div className="p-8 md:p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2 space-y-5">
								{isSearching ? (
									<>
										<ImageIcon className="w-12 h-12 mx-auto text-zinc-300" />
										<p className="text-zinc-700 dark:text-zinc-200 font-bold">No results for your search.</p>
										<Button variant="outline" onClick={clearSearch}>Clear Search</Button>
									</>
								) : (
									<>
										<ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-300 mb-2" />
										<div className="space-y-2 max-w-sm mx-auto">
											<p className="text-zinc-700 dark:text-zinc-200 font-bold text-base md:text-lg">
												No face matches yet
											</p>
											<p className="text-zinc-500 font-medium text-sm md:text-base">
												Try a clear front-facing selfie with good lighting and
												minimal obstructions.
											</p>
										</div>
										<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
											<Button
												onClick={() => setIsCameraOpen(true)}
												className="w-full sm:w-auto rounded-2xl bg-sage text-zinc-950 hover:bg-sage/90 px-6"
											>
												<Camera className="w-4 h-4 mr-2" />
												Retake Selfie
											</Button>
											<Button
												variant="outline"
												onClick={() => {
													searchMutation.reset();
													setSelfiePreview(null);
												}}
												className="w-full sm:w-auto rounded-2xl"
											>
												View Highlights Instead
											</Button>
										</div>
									</>
								)}
							</div>
						) : (
							<div className="p-10 md:p-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2">
								<ImageIcon className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-200 mb-6" />
								<p className="text-zinc-500 font-medium max-w-[200px] md:max-w-xs mx-auto text-sm md:text-base">
									The gallery is empty or face search failed to find matches.
								</p>
							</div>
						)}
					</section>

					{ctaVisible && (
						<section className="mx-2 rounded-[2rem] border border-sage/30 bg-gradient-to-br from-sage/15 to-rose-500/10 p-5 sm:p-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-500">
							<p className="text-[11px] uppercase tracking-widest font-black text-sage mb-2">
								For Event Creators
							</p>
							<h4 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">
								Host your own event
							</h4>
							<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
								Create a branded AI face-match gallery in minutes and share it
								with your guests.
							</p>
							<a
								href={ctaUrl}
								className="mt-4 inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-sage px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-sage/90 transition-colors"
								onClick={() => {
									window.dispatchEvent(
										new CustomEvent("lumina:analytics", {
											detail: {
												event: "guest_host_cta_click",
												milestone: ctaMilestone,
												token,
												albumId: albumData?.id,
												url: ctaUrl,
											},
										}),
									);
								}}
							>
								Host your own event
							</a>
						</section>
					)}
				</>
			)}

			{/* Viral Footnote */}
			<footer className="pt-16 sm:pt-20 pb-[max(env(safe-area-inset-bottom),2rem)] border-t border-zinc-100 dark:border-zinc-800 text-center px-4">
				<p className="text-xs md:text-sm text-zinc-400 flex items-center justify-center gap-2">
					Experience by{" "}
					<span className="font-black text-zinc-900 dark:text-white tracking-tighter">
						LUMINA
					</span>{" "}
					• Shared with{" "}
					<Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
				</p>
			</footer>

			{/* In-App Camera Modal */}
			<InAppCamera
				isOpen={isCameraOpen}
				onClose={() => setIsCameraOpen(false)}
				onCapture={handleCapture}
			/>

			{/* Image Preview */}
			<GuestImageModal
				initialImage={selectedImage}
				images={images}
				onClose={handleCloseModal}
				onReaction={(id) => reactMutation.mutate(id)}
				reactions={mergedReactions}
				onActiveImageChange={(img) => {
					const params = new URLSearchParams(window.location.search);
					if (params.get("imageId") !== img.imageId) {
						params.set("imageId", img.imageId);
						window.history.replaceState({}, "", `?${params.toString()}`);
					}
				}}
			/>
		</div>
	);
}
