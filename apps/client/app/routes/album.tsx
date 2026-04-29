import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	CheckCircle,
	Copy,
	Settings2,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AddToAlbumModal } from "~/components/AddToAlbumModal";
import { AlbumSettingsModal } from "~/components/AlbumSettingsModal";
import { BackButton } from "~/components/BackButton";
import { BulkActionBar } from "~/components/BulkActionBar";
import { CompactListView } from "~/components/CompactListView";
import { ConfirmModal } from "~/components/ConfirmModal";
import { DuplicateReview } from "~/components/DuplicateReview";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import { UsageIndicator } from "~/components/UsageIndicator";
import ImageGridItem from "~/Images/ImageGridItem";
import ImageModal from "~/Images/ImageModal";
import ModerationGridItem from "~/Images/ModerationGridItem";
import { getBentoSpanClass } from "~/utils/bento";
import { AlbumFilters } from "../components/AlbumFilters";
import { AlbumPermissionsModal } from "../components/AlbumPermissionsModal";
import { RejectReasonModal } from "../components/RejectReasonModal";
import { ShareModal } from "../components/ShareModal";
import {
	deleteAlbum,
	deleteImage,
	editAlbum,
	fetchAlbum,
	fetchImagesInAlbum,
	fetchSettings,
	moderateImages,
	uploadImages,
} from "../utils/api";
import axiosAPI from "../utils/axios";
import { useUpload } from "../utils/UploadContext";

const AlbumPage = () => {
	const { albumId } = useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { addUploads } = useUpload();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isAlbumSettingsModalOpen, setIsAlbumSettingsModalOpen] =
		useState(false);
	const [isAlbumPermissionsModalOpen, setIsAlbumPermissionsModalOpen] =
		useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);
	const [editAlbumName, setEditAlbumName] = useState("");
	const [files, setFiles] = useState<FileList | null>(null);

	const [view, setView] = useState<"gallery" | "moderation" | "duplicates">(
		"gallery",
	);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
	const [isBatchProcessing, setIsBatchProcessing] = useState(false);
	const [rejectModal, setRejectModal] = useState<{
		isOpen: boolean;
		imageIds: string[];
	}>({ isOpen: false, imageIds: [] });
	const [moderationFilters, setModerationFilters] = useState<{
		startDate?: string;
		endDate?: string;
		uploaderId?: string;
	}>({});

	const {
		data: imagesData,
		isLoading: isImagesDataLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["images", albumId, "APPROVED"],
		queryFn: ({ pageParam }) =>
			fetchImagesInAlbum({ albumId: albumId!, pageParam, status: "APPROVED" }),
		enabled: !!albumId && view === "gallery",
		getNextPageParam: (lastPage) =>
			lastPage?.data?.pagination?.nextCursor || null,
		initialPageParam: null as string | null,
	});

	const {
		data: pendingImagesData,
		isLoading: isPendingImagesLoading,
		fetchNextPage: fetchNextPendingPage,
		hasNextPage: hasNextPendingPage,
		isFetchingNextPage: isFetchingNextPendingPage,
	} = useInfiniteQuery({
		queryKey: ["images", albumId, "PENDING", moderationFilters],
		queryFn: ({ pageParam }) =>
			fetchImagesInAlbum({
				albumId: albumId!,
				pageParam,
				status: "PENDING",
				...moderationFilters,
			}),
		enabled: !!albumId && view === "moderation",
		getNextPageParam: (lastPage) =>
			lastPage?.data?.pagination?.nextCursor || null,
		initialPageParam: null as string | null,
	});

	const { ref, inView } = useInView({
		rootMargin: "200px",
	});

	useEffect(() => {
		if (inView) {
			if (view === "gallery" && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			} else if (
				view === "moderation" &&
				hasNextPendingPage &&
				!isFetchingNextPendingPage
			) {
				fetchNextPendingPage();
			}
		}
	}, [
		inView,
		view,
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
		hasNextPendingPage,
		isFetchingNextPendingPage,
		fetchNextPendingPage,
	]);

	const { data: albumData, isLoading: isAlbumDataLoading } = useQuery({
		queryKey: [`album-${albumId}`, albumId],
		queryFn: () => fetchAlbum(albumId!),
		enabled: !!albumId,
	});

	const { data: settingsData } = useQuery({
		queryKey: ["settings"],
		queryFn: fetchSettings,
	});

	const usage = settingsData?.data?.usage;
	const imagesUsed = usage?.imagesUsed || 0;
	const imagesLimit = usage?.imagesLimit || 50;

	const images = useMemo(() => {
		const currentData = view === "gallery" ? imagesData : pendingImagesData;
		return (
			currentData?.pages.flatMap(
				(page) => page?.data?.imagesInAlbum?.map((ia: any) => ia.images) || [],
			) || []
		);
	}, [imagesData, pendingImagesData, view]);

	const toggleSelectAll = () => {
		const allImageIds = images.map((img: any) => img.imageId);
		const allSelected = allImageIds.every((id: string) => selectedIds.has(id));

		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(allImageIds));
		}
	};

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !images.length) return null;
		return images.find((img: any) => img.imageId === selectedImageId) || null;
	}, [selectedImageId, images]);

	const setSelectedImage = (image: any | null) => {
		setSearchParams((prev) => {
			if (image) {
				prev.set("imageId", image.imageId);
			} else {
				prev.delete("imageId");
			}
			return prev;
		});
	};

	const uploadImagesMutation = useMutation({
		mutationFn: uploadImages,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			setIsUploadModalOpen(false);
			setFiles(null);
		},
	});

	const editAlbumMutation = useMutation({
		mutationFn: editAlbum,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Album updated");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update album");
		},
	});

	const moderateImagesMutation = useMutation({
		mutationFn: ({
			imageIds,
			status,
			reason,
		}: {
			imageIds: string[];
			status: "APPROVED" | "REJECTED";
			reason?: string;
		}) => moderateImages(albumId!, imageIds, status, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			setSelectedIds(new Set());
			toast.success("Action completed successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to moderate images");
		},
	});

	const handleModerate = (
		status: "APPROVED" | "REJECTED",
		singleId?: string,
	) => {
		const targetIds = singleId ? [singleId] : Array.from(selectedIds);
		if (targetIds.length === 0) return;

		if (status === "REJECTED") {
			setRejectModal({ isOpen: true, imageIds: targetIds });
			return;
		}

		moderateImagesMutation.mutate({
			imageIds: targetIds,
			status,
		});
	};

	const handleConfirmReject = (reason: string) => {
		moderateImagesMutation.mutate({
			imageIds: rejectModal.imageIds,
			status: "REJECTED",
			reason,
		});
		setRejectModal({ isOpen: false, imageIds: [] });
	};

	// Keyboard shortcuts for moderation view
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (view !== "moderation") return;
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			const targetIds = Array.from(selectedIds);
			if (targetIds.length === 0) return;

			if (e.key.toLowerCase() === "a") {
				e.preventDefault();
				handleModerate("APPROVED");
			} else if (e.key.toLowerCase() === "r") {
				e.preventDefault();
				handleModerate("REJECTED");
			} else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				const currentIndex = images.findIndex((img: any) =>
					selectedIds.has(img.imageId),
				);
				if (currentIndex >= 0 && currentIndex < images.length - 1) {
					const nextImage = images[currentIndex + 1];
					setSelectedImage(nextImage);
					setSelectedIds(new Set([nextImage.imageId]));
				}
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				const currentIndex = images.findIndex((img: any) =>
					selectedIds.has(img.imageId),
				);
				if (currentIndex > 0) {
					const prevImage = images[currentIndex - 1];
					setSelectedImage(prevImage);
					setSelectedIds(new Set([prevImage.imageId]));
				}
			}
		};

		if (view === "moderation") {
			window.addEventListener("keydown", handleKeyDown);
			return () => window.removeEventListener("keydown", handleKeyDown);
		}
	}, [view, selectedIds, images, handleModerate]);

	const deleteAlbumMutation = useMutation({
		mutationFn: deleteAlbum,
		onSuccess: () => {
			toast.success("Album deleted");
			navigate("/home");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete album");
		},
	});

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFiles(e.target.files);
		}
	};

	const handleUpload = () => {
		if (files) {
			addUploads(files, albumId!);
			setIsUploadModalOpen(false);
			setFiles(null);
		}
	};

	const handleEditAlbum = () => {
		if (!editAlbumName.trim() || !albumId) return;
		editAlbumMutation.mutate({ albumId, albumName: editAlbumName });
		setIsEditModalOpen(false);
	};

	const handleDeleteImage = (imageId: string) => {
		deleteImageMutation.mutate(imageId);
	};

	const deleteImageMutation = useMutation({
		mutationFn: deleteImage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			toast.success("Image deleted");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete image");
		},
	});

	const handleToggleSelect = (imageId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(imageId)) {
				next.delete(imageId);
			} else {
				next.add(imageId);
			}
			return next;
		});
	};

	const handleBatchDelete = async () => {
		const ids = Array.from(selectedIds);
		try {
			setIsBatchProcessing(true);
			await Promise.all(ids.map((id) => deleteImage(id)));
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			setSelectedIds(new Set());
			toast.success(`Successfully deleted ${ids.length} photos.`);
		} catch (error) {
			console.error("Batch deletion failed:", error);
			toast.error("Failed to delete some photos. Please try again.");
		} finally {
			setIsBatchProcessing(false);
		}
	};

	const handleBatchMove = async (targetAlbumId: string) => {
		const ids = Array.from(selectedIds);
		try {
			setIsBatchProcessing(true);
			await axiosAPI.post(`/albums/${targetAlbumId}/images`, {
				imageIds: ids,
			});
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			queryClient.invalidateQueries({ queryKey: ["images", targetAlbumId] });
			setIsAddToAlbumOpen(false);
			setSelectedIds(new Set());
			toast.success(`Successfully moved ${ids.length} photos.`);
		} catch (error) {
			console.error("Batch add to album failed:", error);
			toast.error("Failed to move photos. Please try again.");
		} finally {
			setIsBatchProcessing(false);
		}
	};

	const handleBulkDownload = async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) {
			toast.error("No images selected");
			return;
		}

		const toastId = toast.loading(
			`Initiating ZIP generation for ${ids.length} photos...`,
		);

		try {
			const { data: res } = await axiosAPI.post("/images/bulk-download", {
				imageIds: ids,
			});
			const jobId = res.data.jobId;

			let attempts = 0;
			const maxAttempts = 120;
			let completed = false;

			while (!completed && attempts < maxAttempts) {
				attempts++;
				const { data: statusRes } = await axiosAPI.get(
					`/images/bulk-download/${jobId}`,
				);
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

				if (state === "failed") {
					throw new Error("ZIP generation failed on server.");
				}

				toast.loading(`Processing: ${state}...`, { id: toastId });
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			if (!completed) {
				throw new Error("Download generation timed out.");
			}
		} catch (error: any) {
			console.error("Bulk Download Error:", error);
			toast.error(
				error.message || "Failed to prepare download. Please try again.",
				{ id: toastId },
			);
		}
	};

	const handleTriggerClustering = async () => {
		const toastId = toast.loading("Starting face clustering...");
		try {
			await axiosAPI.post(`/albums/${albumId}/cluster`);
			toast.success(
				"Face clustering started! The UI will update when finished.",
				{ id: toastId, duration: 5000 },
			);
		} catch (_error) {
			toast.error("Failed to start clustering.", { id: toastId });
		}
	};

	return (
		<MainContainer className="space-y-12" maxWidth="max-w-none">
			<BackButton label="Back to Dashboard" to="/home" />

			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
				<div className="flex-1">
					<div className="flex items-center space-x-3 mb-4">
						<span className="px-3 py-1 bg-sage/10 text-sage rounded-full text-[10px] font-bold uppercase tracking-widest border border-sage/20">
							Album
						</span>
						<p className="text-xs text-zinc-400 font-mono tracking-tighter opacity-50">
							{albumId}
						</p>
					</div>
					<div className="flex items-center gap-4 group">
						<Heading level={1} className="text-5xl md:text-6xl">
							{albumData?.data?.albumName}
						</Heading>
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setIsAlbumSettingsModalOpen(true)}
								className="p-2 text-zinc-400 hover:text-sage transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
								title="Album Settings"
							>
								<Settings2 size={20} />
							</button>
							<button
								type="button"
								onClick={() => setConfirmDeleteAlbum(true)}
								className="p-2 text-zinc-400 hover:text-plum transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
								title="Delete Album"
							>
								<Trash2 size={20} />
							</button>
						</div>
					</div>
					<p className="text-zinc-500 dark:text-zinc-400 mt-4 max-w-2xl">
						{images.length} photos curated in this collection. Organize, share,
						and rediscover your memories.
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
					{/* Tab Toggle */}
					{(albumData?.data?.settings?.is_event ||
						albumData?.data?.settings?.requires_approval) && (
						<div className="bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center shadow-inner mr-4">
							<button
								type="button"
								onClick={() => setView("gallery")}
								className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
									view === "gallery"
										? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
										: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
							>
								Gallery
							</button>
							<button
								type="button"
								onClick={() => setView("moderation")}
								className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
									view === "moderation"
										? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
										: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
							>
								Moderation
							</button>
							<button
								type="button"
								onClick={() => setView("duplicates")}
								className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
									view === "duplicates"
										? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
										: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
							>
								Duplicates
							</button>
						</div>
					)}

					{/* View Toggle */}
					<div className="bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center shadow-inner">
						<button
							type="button"
							onClick={() => setViewMode("grid")}
							className={`p-2 rounded-xl transition-all ${
								viewMode === "grid"
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
							}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
							</svg>{" "}
						</button>
						<button
							type="button"
							onClick={() => setViewMode("list")}
							className={`p-2 rounded-xl transition-all ${
								viewMode === "list"
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
							}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fillRule="evenodd"
									d="M3 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</button>
					</div>

					<Button
						variant="outline"
						onClick={handleTriggerClustering}
						className="flex-1 md:flex-none"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
						Group Faces
					</Button>

					<Button
						variant="outline"
						onClick={() => setIsShareModalOpen(true)}
						className="flex-1 md:flex-none"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
							/>
						</svg>
						Share
					</Button>

					<Button
						variant="outline"
						onClick={() => setIsAlbumPermissionsModalOpen(true)}
						className="flex-1 md:flex-none"
					>
						<Settings2 size={16} className="mr-2" />
						Permissions
					</Button>

					<Button
						variant="primary"
						onClick={() => setIsUploadModalOpen(true)}
						className="flex-1 md:flex-none"
					>
						Upload Photos
					</Button>
				</div>
			</div>

			<div className="mt-8">
				{view === "duplicates" ? (
					<DuplicateReview albumId={albumId!} />
				) : (
					<>
						{view === "moderation" && (
							<div className="mb-6">
								<AlbumFilters
									filters={moderationFilters}
									onFilterChange={setModerationFilters}
									members={albumData?.data?.members}
								/>
							</div>
						)}

						{(isImagesDataLoading || isPendingImagesLoading) &&
						isAlbumDataLoading ? (
							<div className="flex justify-center py-20">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
							</div>
						) : images.length === 0 ? (
							<div className="text-center py-32">
								<p className="text-zinc-500 font-medium">
									{view === "moderation"
										? "No pending photos to moderate. You're all caught up!"
										: "No photos in this album yet. Start by uploading some!"}
								</p>
							</div>
						) : viewMode === "grid" ? (
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 auto-rows-[200px]">
								{images.map((image: any, index: number) => {
									const width = image.originalSize?.width || 0;
									const height = image.originalSize?.height || 0;

									const area = width * height;
									const isFeatured = area > 2000000;

									const spanClass = getBentoSpanClass(
										width,
										height,
										index,
										isFeatured,
									);

									return (
										<div
											key={image.imageId}
											className={`relative ${spanClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}
											style={{ animationDelay: `${index * 50}ms` }}
										>
											{view === "moderation" ? (
												<ModerationGridItem
													image={{
														...image,
														id: image.imageId,
														url: image.imagePath,
														alt: image.imagePath,
													}}
													onClick={() => setSelectedImage(image)}
													isSelected={selectedIds.has(image.imageId)}
													onToggleSelect={() =>
														handleToggleSelect(image.imageId)
													}
												/>
											) : (
												<ImageGridItem
													image={{
														id: image.imageId,
														width: width,
														height: height,
														url: image.imagePath,
														alt: image.imagePath,
													}}
													onClick={() => setSelectedImage(image)}
													isSelected={selectedIds.has(image.imageId)}
													onToggleSelect={() =>
														handleToggleSelect(image.imageId)
													}
													onDelete={handleDeleteImage}
													selectionMode={selectedIds.size > 0}
												/>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<CompactListView
								images={images}
								onImageClick={setSelectedImage}
								selectedIds={selectedIds}
								onToggleSelect={handleToggleSelect}
							/>
						)}
					</>
				)}
			</div>

			{/* Infinite Scroll Trigger */}
			<div ref={ref} className="w-full flex justify-center py-12">
				{(isFetchingNextPage || isFetchingNextPendingPage) && (
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
				)}
			</div>

			<ImageModal
				image={selectedImage}
				images={images}
				albumId={albumId}
				onClose={() => setSelectedImage(null)}
				onDelete={handleDeleteImage}
				onNavigate={(img) => setSelectedImage(img)}
				onModerate={handleModerate}
			/>

			<RejectReasonModal
				isOpen={rejectModal.isOpen}
				onClose={() => setRejectModal({ isOpen: false, imageIds: [] })}
				onConfirm={handleConfirmReject}
				isBatch={rejectModal.imageIds.length > 1}
				count={rejectModal.imageIds.length}
			/>

			{/* Custom Bulk Bar for Moderation */}
			{view === "moderation" && selectedIds.size > 0 ? (
				<div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
					<div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6">
						<div className="flex flex-col">
							<span className="text-white font-black text-lg leading-none">
								{selectedIds.size}
							</span>
							<span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mt-1">
								Selected
							</span>
						</div>

						<div className="h-8 w-px bg-white/10" />

						<div className="flex gap-2">
							<Button
								size="sm"
								className="bg-sage hover:bg-sage/90 text-zinc-950 font-bold rounded-xl flex items-center gap-2"
								onClick={() => handleModerate("APPROVED")}
							>
								<CheckCircle size={16} />
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl flex items-center gap-2"
								onClick={() => handleModerate("REJECTED")}
							>
								<XCircle size={16} />
								Reject
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="dark:text-zinc-500 text-zinc-400"
								onClick={() => setSelectedIds(new Set())}
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			) : (
				<BulkActionBar
					selectedCount={selectedIds.size}
					totalCount={images.length}
					onClear={() => setSelectedIds(new Set())}
					onSelectAll={toggleSelectAll}
					onDelete={handleBatchDelete}
					onDownload={handleBulkDownload}
					onAddToAlbum={() => setIsAddToAlbumOpen(true)}
				/>
			)}

			{isUploadModalOpen && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
					<div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
						<Heading level={2} className="mb-2">
							Upload Photos
						</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 font-medium">
							Add new memories to your collection.
						</p>

						<div className="space-y-6">
							<div className="relative group">
								<input
									type="file"
									multiple
									onChange={handleFileChange}
									className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
								/>
								<div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 group-hover:border-sage rounded-3xl p-12 transition-all flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 group-hover:bg-sage/5">
									<div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
										<Upload className="text-sage" size={24} />
									</div>
									<p className="text-sm font-bold text-zinc-900 dark:text-white">
										{files
											? `${files.length} files selected`
											: "Drop photos or click to browse"}
									</p>
									<p className="text-xs text-zinc-500 mt-2 font-medium">
										JPG, PNG, HEIC up to 50MB
									</p>
								</div>
							</div>

							<div className="flex gap-3">
								<Button
									className="flex-1 rounded-2xl py-6 font-bold"
									onClick={handleUpload}
									disabled={!files || uploadImagesMutation.isPending}
								>
									{uploadImagesMutation.isPending
										? "Uploading..."
										: "Start Upload"}
								</Button>
								<Button
									variant="ghost"
									className="rounded-2xl px-6 font-bold"
									onClick={() => setIsUploadModalOpen(false)}
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{isAlbumSettingsModalOpen && (
				<AlbumSettingsModal
					albumId={albumId!}
					albumName={albumData?.data?.albumName}
					settings={albumData?.data?.settings}
					storageConfigId={albumData?.data?.storageConfigId}
					onClose={() => setIsAlbumSettingsModalOpen(false)}
				/>
			)}

			{isAlbumPermissionsModalOpen && (
				<AlbumPermissionsModal
					albumId={albumId!}
					members={albumData?.data?.members}
					onClose={() => setIsAlbumPermissionsModalOpen(false)}
				/>
			)}

			<ConfirmModal
				isOpen={confirmDeleteAlbum}
				title="Move Album to Trash"
				message={`Are you sure you want to move "${albumData?.data?.albumName}" to trash? It will be permanently deleted after 30 days if not restored.`}
				onConfirm={() => {
					deleteAlbumMutation.mutate(albumId!);
					setConfirmDeleteAlbum(false);
				}}
				onCancel={() => setConfirmDeleteAlbum(false)}
				isDestructive={true}
			/>

			{isAddToAlbumOpen && (
				<AddToAlbumModal
					isOpen={isAddToAlbumOpen}
					onClose={() => setIsAddToAlbumOpen(false)}
					onConfirm={handleBatchMove}
					isBatch={true}
				/>
			)}

			{isShareModalOpen && (
				<ShareModal
					isOpen={isShareModalOpen}
					onClose={() => setIsShareModalOpen(false)}
					albumId={albumId!}
					albumName={albumData?.data?.albumName}
					shareToken={albumData?.data?.shareToken}
				/>
			)}
		</MainContainer>
	);
};

export default AlbumPage;
