import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Upload, XCircle } from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AddToAlbumModal } from "~/components/AddToAlbumModal";
import { AlbumSettingsModal } from "~/components/AlbumSettingsModal";
import { AlbumHeader, AlbumToolbar } from "~/components/album";
import { BackButton } from "~/components/BackButton";
import { BulkActionBar } from "~/components/BulkActionBar";
import { CompactListView } from "~/components/CompactListView";
import { ConfirmModal } from "~/components/ConfirmModal";
import { DuplicateReview } from "~/components/DuplicateReview";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import { albumKeys } from "~/utils/queryKeys";
import { useAlbumImages } from "~/hooks/album/useAlbumImages";
import { useBatchActions } from "~/hooks/album/useBatchActions";
import { useInfiniteScroll } from "~/hooks/album/useInfiniteScroll";
import { useKeyboardShortcuts } from "~/hooks/album/useKeyboardShortcuts";
import { useModeration } from "~/hooks/album/useModeration";
import ImageGridItem from "~/Images/ImageGridItem";
import ImageModal from "~/Images/ImageModal";
import ModerationGridItem from "~/Images/ModerationGridItem";
import type {
	Album,
	AlbumImage,
	ApiResponse,
	DisplayMode,
	ImageStatus,
	ViewMode,
} from "~/types";
import { getBentoSpanClass } from "~/utils/bento";
import { groupImagesByDate } from "~/utils/dateGrouping";
import { AlbumFilters } from "../components/AlbumFilters";
import { AlbumPermissionsModal } from "../components/AlbumPermissionsModal";
import { RejectReasonModal } from "../components/RejectReasonModal";
import { ShareModal } from "../components/ShareModal";
import {
	deleteAlbum as deleteAlbumApi,
	editAlbum as editAlbumApi,
} from "../utils/api";
import { useUpload } from "../utils/UploadContext";

// Type guard for coverImage - can be string or object { id, url }
const getCoverImageId = (coverImage: string | { id: string | null; url: string | null } | null | undefined): string | null => {
	if (!coverImage) return null;
	return typeof coverImage === 'string' ? coverImage : coverImage.id;
};

const AlbumPage = () => {
	const { albumId } = useParams();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const { addUploads } = useUpload();

	const [view, setView] = useState<ViewMode>("gallery");
	const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
		new Set(),
	);
	const [moderationFilters, setModerationFilters] = useState<{
		startDate?: string;
		endDate?: string;
		uploaderId?: string;
	}>({});

	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [isAlbumSettingsModalOpen, setIsAlbumSettingsModalOpen] =
		useState(false);
	const [isAlbumPermissionsModalOpen, setIsAlbumPermissionsModalOpen] =
		useState(false);
	const [confirmDeleteAlbum, setConfirmDeleteAlbum] = useState(false);
	const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
	const [editAlbumName, setEditAlbumName] = useState("");
	const [isEditingName, setIsEditingName] = useState(false);
	const [files, setFiles] = useState<FileList | null>(null);
	const [rejectModal, setRejectModal] = useState<{
		isOpen: boolean;
		imageIds: string[];
	}>({ isOpen: false, imageIds: [] });

	const {
		approvedImages,
		pendingImages,
		isApprovedLoading,
		isPendingLoading,
		fetchNextApproved,
		fetchNextPending,
		hasApprovedNextPage,
		hasPendingNextPage,
		isFetchingApprovedNext,
		isFetchingPendingNext,
		albumData,
		isAlbumLoading,
		settingsData,
	} = useAlbumImages({
		albumId: albumId!,
		view,
		filters: moderationFilters,
	});

	const { moderate, isPending: isModerationPending } = useModeration({
		albumId: albumId!,
	});

	const {
		batchDelete,
		batchMove,
		batchDownload,
		isProcessing: isBatchProcessing,
	} = useBatchActions({ albumId: albumId! });

	const { ref: infiniteScrollRef } = useInfiniteScroll({
		view,
		hasGalleryNextPage: hasApprovedNextPage,
		hasModerationNextPage: hasPendingNextPage,
		isFetchingGalleryNext: isFetchingApprovedNext,
		isFetchingModerationNext: isFetchingPendingNext,
		fetchGalleryNext: fetchNextApproved,
		fetchModerationNext: fetchNextPending,
	});

	const images = useMemo(
		() => (view === "gallery" ? approvedImages : pendingImages),
		[view, approvedImages, pendingImages],
	);

	const dateSections = useMemo(
		() => (view === "gallery" ? groupImagesByDate(approvedImages) : []),
		[view, approvedImages],
	);

	const settings = albumData?.data?.settings;
	const showModeration = settings?.is_event || settings?.requires_approval;

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !images.length) return null;
		return images.find((img) => img.imageId === selectedImageId) || null;
	}, [selectedImageId, images]);

	const setSelectedImage = useCallback(
		(image: AlbumImage | null) => {
			setSearchParams((prev) => {
				if (image) {
					prev.set("imageId", image.imageId);
				} else {
					prev.delete("imageId");
				}
				return prev;
			});
		},
		[setSearchParams],
	);

	const queryClient = useQueryClient();

	const editAlbumMutation = useMutation({
		mutationFn: ({
			albumId,
			albumName,
			coverImageId,
		}: {
			albumId: string;
			albumName?: string;
			coverImageId?: string | null;
		}) => editAlbumApi({ albumId, albumName, coverImageId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId!) });
			toast.success("Album updated");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to update album");
		},
	});

	const deleteAlbumMutation = useMutation({
		mutationFn: deleteAlbumApi,
		onSuccess: () => {
			toast.success("Album deleted");
			navigate("/home");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to delete album");
		},
	});

	const handleModerateAction = (status: ImageStatus, imageIds?: string[]) => {
		const targetIds = imageIds || Array.from(selectedIds);
		if (targetIds.length === 0) return;

		if (status === "REJECTED") {
			setRejectModal({ isOpen: true, imageIds: targetIds });
			return;
		}

		moderate(status, targetIds);
		setSelectedIds(new Set());
	};

	const handleConfirmReject = (reason: string) => {
		moderate("REJECTED", rejectModal.imageIds, reason);
		setRejectModal({ isOpen: false, imageIds: [] });
	};

	const handleModerateWithIds = useCallback(
		(status: ImageStatus, ids: string[]) => {
			handleModerateAction(status, ids);
		},
		[],
	);

	const handleNavigateToImage = useCallback(
		(image: AlbumImage) => {
			setSelectedImage(image);
			setSelectedIds(new Set([image.imageId]));
		},
		[setSelectedImage],
	);

	useKeyboardShortcuts({
		view,
		selectedIds,
		images,
		onModerate: handleModerateWithIds,
		onNavigateNext: (img) => {
			setSelectedImage(img);
			setSelectedIds(new Set([img.imageId]));
		},
		onNavigatePrev: (img) => {
			setSelectedImage(img);
			setSelectedIds(new Set([img.imageId]));
		},
	});

	const toggleSection = (key: string) => {
		setCollapsedSections((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	const toggleSelectAll = () => {
		const allImageIds = images.map((img) => img.imageId);
		const allSelected = allImageIds.every((id) => selectedIds.has(id));
		setSelectedIds(allSelected ? new Set() : new Set(allImageIds));
	};

	const handleToggleSelect = (imageId: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(imageId)) next.delete(imageId);
			else next.add(imageId);
			return next;
		});
	};

	const handleEditAlbum = () => {
		if (!editAlbumName.trim() || !albumId) return;
		editAlbumMutation.mutate({ albumId, albumName: editAlbumName });
		setIsEditingName(false);
	};

	const handleSetCoverImage = (imageId: string) => {
		if (!albumId) return;
		const coverImage = albumData?.data?.coverImage;
		const currentCoverId = typeof coverImage === 'object' ? coverImage?.id : coverImage;
		const newCoverId = currentCoverId === imageId ? null : imageId;
		editAlbumMutation.mutate({ albumId, coverImageId: newCoverId });
	};

	const handleDeleteImage = (imageId: string) => {
		batchDelete([imageId]);
	};

	const handleBatchDelete = async () => {
		await batchDelete(Array.from(selectedIds));
		setSelectedIds(new Set());
	};

	const handleBatchMove = async (targetAlbumId: string) => {
		await batchMove(Array.from(selectedIds), targetAlbumId);
		setSelectedIds(new Set());
	};

	const handleBulkDownload = async () => {
		await batchDownload(Array.from(selectedIds));
		setSelectedIds(new Set());
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) setFiles(e.target.files);
	};

	const handleUpload = () => {
		if (files && albumId) {
			addUploads(files, albumId);
			setIsUploadModalOpen(false);
			setFiles(null);
		}
	};

	const handleStartEditing = () => {
		setEditAlbumName(albumData?.data?.albumName || "");
		setIsEditingName(true);
	};

	const handleCancelEditing = () => {
		setIsEditingName(false);
		setEditAlbumName(albumData?.data?.albumName || "");
	};

	const handleTriggerClustering = async () => {
		const toastId = toast.loading("Starting face clustering...");
		try {
			await fetch(`/api/albums/${albumId}/cluster`, { method: "POST" });
			toast.success(
				"Face clustering started! The UI will update when finished.",
				{
					id: toastId,
					duration: 5000,
				},
			);
		} catch {
			toast.error("Failed to start clustering.", { id: toastId });
		}
	};

	const isLoading = isApprovedLoading || isPendingLoading || isAlbumLoading;

	return (
		<MainContainer className="space-y-12" maxWidth="max-w-6xl">
			<BackButton label="Back to Dashboard" to="/home" />

			<AlbumHeader
				album={albumData?.data}
				imageCount={images.length}
				isEditingName={isEditingName}
				editAlbumName={editAlbumName}
				onEditName={setEditAlbumName}
				onStartEditing={handleStartEditing}
				onCancelEditing={handleCancelEditing}
				onSaveName={handleEditAlbum}
				onUpload={() => setIsUploadModalOpen(true)}
				onOpenPermissions={() => setIsAlbumPermissionsModalOpen(true)}
				onOpenSettings={() => setIsAlbumSettingsModalOpen(true)}
				onOpenShare={() => setIsShareModalOpen(true)}
				onDelete={() => setConfirmDeleteAlbum(true)}
				onTriggerClustering={handleTriggerClustering}
				isRenamePending={editAlbumMutation.isPending}
			/>

			<div className="mt-8">
				<AlbumToolbar
					view={view}
					displayMode={displayMode}
					onViewChange={setView}
					onDisplayModeChange={setDisplayMode}
					showModeration={showModeration}
					showDuplicates={true}
				/>

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

						{isLoading ? (
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
						) : displayMode === "grid" ? (
							<div className="space-y-6">
								{view === "gallery" && dateSections.length > 0 ? (
									dateSections.map((section) => {
										const isCollapsed = collapsedSections.has(section.key);
										return (
											<div key={section.key} className="space-y-2">
												<button
													type="button"
													onClick={() => toggleSection(section.key)}
													className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
												>
													<span
														className={`text-zinc-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"
															}`}
													>
														›
													</span>
													<span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
														{section.label}
													</span>
													<span className="text-xs text-zinc-500">
														({section.images.length})
													</span>
												</button>
												<div
													className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed
														? "max-h-0 opacity-0"
														: "max-h-[5000px] opacity-100"
														}`}
												>
													<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5 sm:gap-1 auto-rows-[150px] sm:auto-rows-[200px]">
														{section.images.map((image, idx) => {
															const width = image.originalSize?.width || 0;
															const height = image.originalSize?.height || 0;
															const area = width * height;
															const isFeatured = area > 2000000;
															const spanClass = getBentoSpanClass(
																width,
																height,
																idx,
																isFeatured,
															);
															return (
																<div
																	key={image.imageId}
																	className={`relative ${spanClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}
																	style={{ animationDelay: `${idx * 30}ms` }}
																>
																	<ImageGridItem
																		image={{
																			id: image.imageId,
																			width,
																			height,
																			url: image.imagePath,
																			alt: image.imagePath,
																		}}
																		onClick={() => setSelectedImage(image)}
																		isSelected={selectedIds.has(image.imageId)}
																		onToggleSelect={() =>
																			handleToggleSelect(image.imageId)
																		}
																		onDelete={handleDeleteImage}
																		onSetCover={handleSetCoverImage}
																		isCover={
																			getCoverImageId(albumData?.data?.coverImage) ===
																			image.imageId
																		}
																		selectionMode={selectedIds.size > 0}
																	/>
																</div>
															);
														})}
													</div>
												</div>
											</div>
											);
											})
											) : (
											<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5 sm:gap-1 auto-rows-[150px] sm:auto-rows-[200px]">
										{images.map((image, index) => {
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
															onSetCover={handleSetCoverImage}
															isCover={
																getCoverImageId(albumData?.data?.coverImage) ===
																image.imageId
															}
															selectionMode={selectedIds.size > 0}
														/>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						) : (
							<CompactListView
								images={images}
								onImageClick={setSelectedImage}
								selectedIds={selectedIds}
								onToggleSelect={handleToggleSelect}
								onSelectAll={toggleSelectAll}
								onDelete={handleDeleteImage}
								onSetCover={handleSetCoverImage}
								coverImageId={getCoverImageId(albumData?.data?.coverImage)}
							/>
						)}
					</>
				)}
			</div>

			<div ref={infiniteScrollRef} className="w-full flex justify-center py-12">
				{(isFetchingApprovedNext || isFetchingPendingNext) && (
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
				onModerate={(status) => handleModerateAction(status)}
			/>

			<RejectReasonModal
				isOpen={rejectModal.isOpen}
				onClose={() => setRejectModal({ isOpen: false, imageIds: [] })}
				onConfirm={handleConfirmReject}
				isBatch={rejectModal.imageIds.length > 1}
				count={rejectModal.imageIds.length}
			/>

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
								onClick={() => handleModerateAction("APPROVED")}
							>
								<CheckCircle size={16} />
								Approve
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl flex items-center gap-2"
								onClick={() => handleModerateAction("REJECTED")}
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
									disabled={!files}
								>
									Start Upload
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
					albumName={albumData?.data?.albumName ?? ""}
					settings={albumData?.data?.settings}
					storageConfigId={albumData?.data?.storageConfigId ?? null}
					onClose={() => setIsAlbumSettingsModalOpen(false)}
				/>
			)}

			{isAlbumPermissionsModalOpen && (
				<AlbumPermissionsModal
					albumId={albumId!}
					members={albumData?.data?.members ?? []}
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
					onClose={() => setIsAddToAlbumOpen(false)}
					onConfirm={handleBatchMove}
					isProcessing={false}
				/>
			)}

			{isShareModalOpen && (
				<ShareModal
					isOpen={isShareModalOpen}
					onClose={() => setIsShareModalOpen(false)}
					album={albumData?.data}
					albumId={albumId!}
					shareToken={albumData?.data?.shareToken ?? null}
					qrColor={albumData?.data?.qrColor ?? null}
					qrLogoUrl={albumData?.data?.qrLogoUrl ?? null}
					creationDate={albumData?.data?.createdAt ?? null}
				/>
			)}
		</MainContainer>
	);
};

export default AlbumPage;
