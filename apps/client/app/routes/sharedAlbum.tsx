import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BulkActionBar } from "~/components/BulkActionBar";
import { MainContainer } from "~/components/MainContainer";
import { OfflineFallback } from "~/components/share/OfflineFallback";
import { SemanticSearchBar } from "~/components/share/SemanticSearchBar";
import { SharedAlbumHero } from "~/components/share/SharedAlbumHero";
import { StatsStrip } from "~/components/share/StatsStrip";
import { SelfieSearchModal } from "~/components/SelfieSearchModal";
import { Button } from "~/components/standard/Button";
import { Modal } from "~/components/standard/Modal";
import { useSharedAlbum } from "~/hooks/share/useSharedAlbum";
import { useLiveAlbum } from "~/hooks/share/useLiveAlbum";
import { useSharedAlbumSearch } from "~/hooks/share/useSharedAlbumSearch";
import ImageGridItem from "~/Images/ImageGridItem";
import ImageModal from "~/Images/ImageModal";
import { getBentoSpanClass } from "~/utils/bento";
import { searchFaces } from "../utils/api";
import axiosAPI from "../utils/axios";
import { useUpload } from "../utils/UploadContext";
import { ThemeProvider } from "../utils/ThemeContext";
import { Upload } from "lucide-react";
import JSZip from "jszip";
import { ReactionButton } from "~/components/share/ReactionButton";

const SharedAlbumPage = () => {
	const { token } = useParams<{ token: string }>();
	const { addUploads, tasks } = useUpload();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
	const [skipFaceIndexing, setSkipFaceIndexing] = useState(false);
	const [showDeleteSearchData, setShowDeleteSearchData] = useState(false);
	const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

	const { album: albumData, phase, stats, isLoading, isError } = useSharedAlbum(token);
	const { reactions } = useLiveAlbum(albumData?.id);
	const {
		searchQuery,
		setSearchQuery,
		isSearchLoading,
		filteredImageIds,
		setFilteredImageIds,
		handleSemanticSearch,
		clearSearch,
	} = useSharedAlbumSearch(token);

	const allImages = useMemo(() => albumData?.images || [], [albumData]);

	const displayedImages = useMemo(() => {
		let baseImages = allImages;
		if (filteredImageIds) {
			baseImages = allImages.filter((img: any) => filteredImageIds.has(img.imageId));
		}

		if (!albumData?.settings?.requires_approval) return baseImages;

		const pendingUploads = tasks
			.filter(
				(t) =>
					t.albumId === albumData.id &&
					t.initialStatus === "PENDING" &&
					t.status === "completed",
			)
			.map((t) => ({
				imageId: `pending-${t.id}`,
				imagePath: URL.createObjectURL(t.file),
				originalSize: { width: 800, height: 800 },
				isPending: true,
				reactionCount: 0,
			}));

		return [...pendingUploads, ...baseImages];
	}, [allImages, filteredImageIds, tasks, albumData]);

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !allImages.length) return null;
		return allImages.find((img: any) => img.imageId === selectedImageId) || null;
	}, [selectedImageId, allImages]);

	const setSelectedImage = (image: any | null) => {
		setSearchParams((prev) => {
			if (image) prev.set("imageId", image.imageId);
			else prev.delete("imageId");
			return prev;
		});
	};

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleBulkDownload = async (imageIds?: string[]) => {
		const ids = imageIds ?? Array.from(selectedIds);
		if (ids.length === 0) {
			toast.error("No images selected");
			return;
		}

		const toastId = toast.loading(`Initiating ZIP generation for ${ids.length} photos...`);

		try {
			const { data: res } = await axiosAPI.post("/images/bulk-download", { imageIds: ids });
			const jobId = res.data.jobId;

			let attempts = 0;
			const maxAttempts = 120;
			let completed = false;

			while (!completed && attempts < maxAttempts) {
				attempts++;
				const { data: statusRes } = await axiosAPI.get(`/images/bulk-download/${jobId}`);
				const { state, downloadUrl } = statusRes.data;

				if (state === "completed" && downloadUrl) {
					toast.loading("Download ready, starting...", { id: toastId });
					const link = document.createElement("a");
					link.href = downloadUrl;
					link.download = `photos-${Date.now()}.zip`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					toast.success("Download started!", { id: toastId });
					setSelectedIds(new Set());
					completed = true;
					break;
				}

				if (state === "failed") throw new Error("ZIP generation failed on server.");

				toast.loading(`Processing: ${state}...`, { id: toastId });
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			if (!completed) throw new Error("Download generation timed out.");
		} catch (error: any) {
			toast.error(error.message || "Failed to prepare download. Please try again.", { id: toastId });
		}
	};

	const handleDownloadAll = () => handleBulkDownload(allImages.map((img: any) => img.imageId));

	const handleGuestDownload = async (imageIds: string[]) => {
		if (imageIds.length === 0) { toast.error("No images selected"); return; }
		const toastId = toast.loading(`Preparing ${imageIds.length} photos...`);
		try {
			const { data: res } = await axiosAPI.post(`/public/albums/${token}/download`, { imageIds });
			const urls: Array<{ imageId: string; url: string }> = res.data.urls;
			toast.loading("Downloading photos...", { id: toastId });
			const zip = new JSZip();
			await Promise.all(
				urls.map(async ({ imageId, url }, i) => {
					const response = await fetch(url);
					const blob = await response.blob();
					const ext = blob.type.split("/")[1] || "jpg";
					zip.file(`photo-${i + 1}-${imageId.slice(0, 8)}.${ext}`, blob);
				}),
			);
			const content = await zip.generateAsync({ type: "blob" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(content);
			link.download = `photos-${Date.now()}.zip`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success("Download started!", { id: toastId });
		} catch (error: any) {
			toast.error(error.message || "Download failed.", { id: toastId });
		}
	};

	const handleFaceSearch = async (faceId: number) => {
		const toastId = toast.loading("Finding matching photos...");
		try {
			const results = await searchFaces({ faceId, shareToken: token, threshold: 0.6 });
			if (results?.data?.faces) {
				const ids = new Set<string>(results.data.faces.map((f: { imageId: string }) => f.imageId));
				setFilteredImageIds(ids);
				toast.success(`Found ${ids.size} photos with this face`, { id: toastId });
			}
		} catch {
			toast.error("Search failed", { id: toastId });
		}
	};

	const handleUpload = async () => {
		if (!uploadFiles || uploadFiles.length === 0 || !albumData) return;
		const status = albumData.settings?.requires_approval ? "PENDING" : "APPROVED";

		if (skipFaceIndexing) {
			const form = new FormData();
			Array.from(uploadFiles).forEach((f) => form.append("uploadedImages", f));
			form.append("skipFaceIndexing", "true");
			try {
				await axiosAPI.post(`/public/albums/${token}/upload`, form);
				toast.success(albumData.settings?.requires_approval ? "Photos pending approval." : "Photos uploaded.");
			} catch {
				toast.error("Upload failed.");
			}
		} else {
			addUploads(uploadFiles, albumData.id, status, token);
		}
		setIsUploadModalOpen(false);
		setUploadFiles(null);
		setSkipFaceIndexing(false);
	};

	if (isLoading) {
		return (
			<MainContainer className="flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage" />
			</MainContainer>
		);
	}

	if (isError) {
		return (
			<MainContainer>
				<OfflineFallback onRetry={() => window.location.reload()} />
			</MainContainer>
		);
	}

	if (!albumData) {
		return (
			<MainContainer className="flex flex-col items-center justify-center h-[60vh] text-center">
				<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
					Album Not Found
				</h1>
				<p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md leading-relaxed">
					This shared link may have expired or is invalid. Please contact the album owner for a new link.
				</p>
				<Link
					to="/"
					className="px-8 py-3 bg-sage text-white font-bold rounded-xl hover:bg-sage/90 transition-all shadow-lg shadow-sage/25 active:scale-95"
				>
					Return Home
				</Link>
			</MainContainer>
		);
	}

	const themeConfig = albumData.settings?.theme_config ?? undefined;
	const gridStyle = (themeConfig as any)?.gridStyle ?? "bento";

	const hasExpiring = albumData.images?.some(
		(img: any) => img.expires_at && new Date(img.expires_at) > new Date() && new Date(img.expires_at) < new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
	);
	const earliestExpiry = hasExpiring
		? albumData.images
			?.filter((img: any) => img.expires_at)
			.map((img: any) => new Date(img.expires_at))
			.sort((a: Date, b: Date) => a.getTime() - b.getTime())[0]
		: null;

	const showSemanticSearch =
		albumData.settings?.semantic_search_enabled && phase === "delivered";

	const photoGrid = (
		<>
			{gridStyle === "uniform" && (
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 w-full">
					{displayedImages.map((image: any) => {
						const width = image.originalSize?.width || 0;
						const height = image.originalSize?.height || 0;
						const liveCount = reactions[image.imageId] ?? image.reactionCount ?? 0;
						return (
							<div key={image.imageId} className="relative aspect-square">
								<ImageGridItem
									image={{ id: image.imageId, width, height, url: image.imagePath, alt: image.imageId }}
									onDelete={() => {}}
									onToggleSelect={toggleSelect}
									isSelected={selectedIds.has(image.imageId)}
									selectionMode={selectedIds.size > 0}
									shared={true}
									className="cursor-pointer rounded-xl shadow-sm w-full h-full object-cover"
									onClick={() => !image.isPending && setSelectedImage(image)}
									variant="admin"
								/>
								{!image.isPending && token && (
									<div className="absolute bottom-2 right-2 z-10">
										<ReactionButton imageId={image.imageId} shareToken={token} count={liveCount} />
									</div>
								)}
								{image.isPending && (
									<div className="absolute top-2 left-2 z-10 px-2 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
										Up for moderation
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{gridStyle === "masonry" && (
				<div className="columns-2 sm:columns-3 lg:columns-4 gap-2 w-full">
					{displayedImages.map((image: any) => {
						const width = image.originalSize?.width || 0;
						const height = image.originalSize?.height || 0;
						const liveCount = reactions[image.imageId] ?? image.reactionCount ?? 0;
						return (
							<div key={image.imageId} className="relative break-inside-avoid mb-2 w-full">
								<ImageGridItem
									image={{ id: image.imageId, width, height, url: image.imagePath, alt: image.imageId }}
									onDelete={() => {}}
									onToggleSelect={toggleSelect}
									isSelected={selectedIds.has(image.imageId)}
									selectionMode={selectedIds.size > 0}
									shared={true}
									className="cursor-pointer rounded-xl shadow-sm w-full object-cover"
									onClick={() => !image.isPending && setSelectedImage(image)}
									variant="admin"
								/>
								{!image.isPending && token && (
									<div className="absolute bottom-2 right-2 z-10">
										<ReactionButton imageId={image.imageId} shareToken={token} count={liveCount} />
									</div>
								)}
								{image.isPending && (
									<div className="absolute top-2 left-2 z-10 px-2 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
										Up for moderation
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{(gridStyle === "bento" || !gridStyle) && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full auto-rows-[150px] md:auto-rows-[200px] grid-flow-dense">
					{displayedImages.map((image: any, index: number) => {
						const width = image.originalSize?.width || 0;
						const height = image.originalSize?.height || 0;
						const area = width * height;
						const isFeatured = area > 2000000;
						const spanClass = getBentoSpanClass(width, height, index, isFeatured);
						const liveCount = reactions[image.imageId] ?? image.reactionCount ?? 0;

						return (
							<div key={image.imageId} className={`relative cv-tile ${spanClass}`}>
								<ImageGridItem
									image={{ id: image.imageId, width, height, url: image.imagePath, alt: image.imageId }}
									onDelete={() => {}}
									onToggleSelect={toggleSelect}
									isSelected={selectedIds.has(image.imageId)}
									selectionMode={selectedIds.size > 0}
									shared={true}
									className="cursor-pointer rounded-xl shadow-sm w-full object-cover"
									onClick={() => !image.isPending && setSelectedImage(image)}
									variant="admin"
								/>
								{!image.isPending && token && (
									<div className="absolute bottom-2 right-2 z-10">
										<ReactionButton imageId={image.imageId} shareToken={token} count={liveCount} />
									</div>
								)}
								{image.isPending && (
									<div className="absolute top-2 left-2 z-10 px-2 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5">
										<div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
										Up for moderation
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{displayedImages.length === 0 && (
				<div className="text-center py-32">
					<p className="text-zinc-500 font-medium">No photos found matching this filter.</p>
				</div>
			)}
		</>
	);

	const sectionComponents: Record<string, React.ReactNode> = {
		hero: (
			<SharedAlbumHero
				album={albumData}
				phase={phase}
				imageCount={displayedImages.length}
				filteredImageIds={filteredImageIds}
				onClearFilter={clearSearch}
				onFindMyFace={() => setIsSelfieModalOpen(true)}
				onContribute={() => setIsUploadModalOpen(true)}
				onDownloadAll={phase === "delivered" && albumData.settings?.allow_downloads !== false
					? () => handleGuestDownload(allImages.map((img: any) => img.imageId))
					: undefined}
			/>
		),
		stats: <StatsStrip stats={stats} isLoading={isLoading} />,
		search: showSemanticSearch ? (
			<SemanticSearchBar
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				onSubmit={handleSemanticSearch}
				onClear={clearSearch}
				isSearchLoading={isSearchLoading}
			/>
		) : null,
		grid: photoGrid,
	};

	const orderedSections: Array<"hero" | "stats" | "search" | "grid"> =
		(themeConfig as any)?.sections ?? ["hero", "stats", "search", "grid"];

	return (
		<ThemeProvider config={themeConfig ?? undefined}>
		<div
			className="min-h-screen transition-colors duration-300 antialiased overflow-x-hidden"
			style={{ background: "var(--theme-bg)", color: "var(--theme-text)", fontFamily: "var(--theme-font)" }}
		>
		<div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 pb-24 sm:pb-6">
			{hasExpiring && earliestExpiry && (
				<div className="mb-4 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl text-sm text-amber-800 dark:text-amber-300 font-medium">
					<span>⚠</span>
					<span>
						Some photos expire on{" "}
						<strong>{earliestExpiry.toLocaleDateString(undefined, { month: "long", day: "numeric" })}</strong>.
						Download them before then.
					</span>
				</div>
			)}

			{orderedSections.map((key) =>
				sectionComponents[key] ? (
					<React.Fragment key={key}>{sectionComponents[key]}</React.Fragment>
				) : null,
			)}

			<ImageModal
				image={selectedImage}
				images={displayedImages}
				shareToken={token}
				onClose={() => setSelectedImage(null)}
				onNavigate={(img) => setSelectedImage(img)}
				onFaceSearch={handleFaceSearch}
			/>

			{isSelfieModalOpen && (
				<SelfieSearchModal
					token={token!}
					onClose={() => setIsSelfieModalOpen(false)}
					onResults={(results) => {
						const ids = new Set(results.map((r) => r.imageId));
						setFilteredImageIds(ids);
						setShowDeleteSearchData(true);
					}}
				/>
			)}

			{showDeleteSearchData && filteredImageIds && filteredImageIds.size > 0 && (
				<div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 backdrop-blur-md border border-zinc-700 rounded-2xl shadow-2xl text-sm text-zinc-300">
					<span>Your selfie was not saved.</span>
					<button
						type="button"
						className="text-rose-400 font-bold hover:text-rose-300 transition-colors underline"
						onClick={async () => {
							try {
								await axiosAPI.delete(`/public/albums/${token}/selfie-data`);
								setFilteredImageIds(null);
								setShowDeleteSearchData(false);
								toast.success("Search data deleted.");
							} catch {
								toast.error("Failed to delete search data.");
							}
						}}
					>
						Delete search data
					</button>
					<button
						type="button"
						className="text-zinc-500 hover:text-zinc-300 transition-colors ml-1"
						onClick={() => setShowDeleteSearchData(false)}
						aria-label="Dismiss"
					>
						&times;
					</button>
				</div>
			)}

			<BulkActionBar
				selectedCount={selectedIds.size}
				onClear={() => setSelectedIds(new Set())}
				onDownload={
					albumData.settings?.allow_downloads !== false
						? () => handleGuestDownload(Array.from(selectedIds))
						: undefined
				}
			/>

			<Modal
				isOpen={isUploadModalOpen}
				onClose={() => setIsUploadModalOpen(false)}
				size="md"
				title="Contribute Photos"
				description="Add your photos to this shared collection."
			>
				<div className="mt-4">
					{albumData.settings?.requires_approval && (
						<div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start space-x-3">
							<div className="text-amber-500 mt-0.5">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
							</div>
							<div>
								<h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">Moderation Enabled</h4>
								<p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
									Photos uploaded to this album require approval from the host before they become visible to everyone.
								</p>
							</div>
						</div>
					)}

					<div className="relative group mb-8">
						<input
							type="file"
							multiple
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
							onChange={(e) => setUploadFiles(e.target.files)}
						/>
						<div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center transition-all group-hover:border-sage group-hover:bg-sage/5">
							<Upload className="h-10 w-10 text-zinc-300 group-hover:text-sage mb-4" />
							<p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 text-center">
								{uploadFiles ? `${uploadFiles.length} photos selected` : "Drop photos or click to browse"}
							</p>
						</div>
					</div>

					<label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={skipFaceIndexing}
							onChange={(e) => setSkipFaceIndexing(e.target.checked)}
							className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-sage focus:ring-sage"
						/>
						<span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
							Don't use my photos for face search
						</span>
					</label>

					<div className="flex gap-3">
						<Button className="flex-1" onClick={handleUpload} disabled={!uploadFiles}>
							{skipFaceIndexing ? "Upload (No Face Search)" : "Add to Queue"}
						</Button>
						<Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
							Cancel
						</Button>
					</div>
				</div>
			</Modal>
		</div>
		</div>
		</ThemeProvider>
	);
};

export default SharedAlbumPage;
