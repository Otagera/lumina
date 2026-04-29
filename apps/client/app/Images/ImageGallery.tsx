import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router-dom";
import { AddToAlbumModal } from "~/components/AddToAlbumModal";
import { BulkActionBar } from "~/components/BulkActionBar";
import { CompactListView } from "~/components/CompactListView";
import { EmptyState } from "~/components/standard/EmptyState";
import type { ImageFromDB } from "~/types";
import { deleteImage, fetchImages } from "~/utils/api";
import axiosAPI from "~/utils/axios";
import { getBentoSpanClass } from "~/utils/bento";
import ImageGridItem from "./ImageGridItem";
import ImageModal from "./ImageModal";

const ImagesList: FC = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isAddToAlbumOpen, setIsAddToAlbumOpen] = useState(false);
	const [isBatchProcessing, setIsBatchProcessing] = useState(false);

	const queryClient = useQueryClient();

	const {
		data,
		isLoading,
		isError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["images"],
		queryFn: fetchImages,
		getNextPageParam: (lastPage) =>
			lastPage?.data?.pagination?.nextCursor || null,
		initialPageParam: null as string | null,
	});

	const images = useMemo(() => {
		return data?.pages.flatMap((page) => page?.data?.images || []) || [];
	}, [data]);

	const { ref, inView } = useInView({
		rootMargin: "200px",
	});

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !images) return null;
		return images.find((img: any) => img.imageId === selectedImageId) || null;
	}, [selectedImageId, images]);

	const handleImageClick = (image: ImageFromDB) => {
		setSearchParams((prev) => {
			prev.set("imageId", image.imageId);
			return prev;
		});
	};

	const unSelectImage = () => {
		setSearchParams((prev) => {
			prev.delete("imageId");
			return prev;
		});
	};

	const handleDeleteImage = async (imageId: string) => {
		// Optimistic update
		const previousImages = queryClient.getQueryData(["images"]);
		queryClient.setQueryData(["images"], (old: any) => {
			if (!old) return old;
			return {
				...old,
				pages: old.pages.map((page: any) => ({
					...page,
					data: {
						...page.data,
						images: page.data.images.filter(
							(img: any) => img.imageId !== imageId,
						),
					},
				})),
			};
		});

		try {
			await deleteImage(imageId);
			toast.success("Image deleted successfully");
			setSelectedIds((prev) => {
				const next = new Set(prev);
				next.delete(imageId);
				return next;
			});
		} catch (error) {
			console.error(`Error deleting image with ID ${imageId}:`, error);
			toast.error("Failed to delete image");
			// Rollback on error
			queryClient.setQueryData(["images"], previousImages);
		}
	};

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const toggleSelectAll = () => {
		if (!images) return;
		const allImageIds = images.map((img: any) => img.imageId);
		const allSelected = allImageIds.every((id: string) => selectedIds.has(id));

		if (allSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(allImageIds));
		}
	};

	const handleBulkDelete = async () => {
		const ids = Array.from(selectedIds);
		setIsBatchProcessing(true);
		const toastId = toast.loading(`Deleting ${ids.length} photos...`);
		try {
			await Promise.all(ids.map((id) => deleteImage(id)));
			queryClient.invalidateQueries({ queryKey: ["images"] });
			setSelectedIds(new Set());
			toast.success("Photos deleted successfully", { id: toastId });
		} catch (error) {
			console.error("Bulk delete failed:", error);
			toast.error("Failed to delete some photos", { id: toastId });
		} finally {
			setIsBatchProcessing(false);
		}
	};

	const handleBatchAddToAlbum = async (albumId: string) => {
		const ids = Array.from(selectedIds);
		setIsBatchProcessing(true);
		const toastId = toast.loading(`Adding ${ids.length} photos to album...`);
		try {
			await axiosAPI.post(`/albums/${albumId}/images`, {
				imageIds: ids,
			});
			queryClient.invalidateQueries({ queryKey: ["images", albumId] });
			setIsAddToAlbumOpen(false);
			setSelectedIds(new Set());
			toast.success(`Successfully added ${ids.length} photos to the album.`, {
				id: toastId,
			});
		} catch (error) {
			console.error("Batch add to album failed:", error);
			toast.error("Failed to add photos to album. Please try again.", {
				id: toastId,
			});
		} finally {
			setIsBatchProcessing(false);
		}
	};

	const handleBulkDownload = async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) return;

		const toastId = toast.loading(
			`Initiating ZIP generation for ${ids.length} photos...`,
		);

		try {
			// 1. Request bulk download job
			const { data: res } = await axiosAPI.post("/images/bulk-download", {
				imageIds: ids,
			});
			const jobId = res.data.jobId;

			// 2. Poll for completion
			let attempts = 0;
			const maxAttempts = 60; // 2 minutes
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

				// Update toast with status
				toast.loading(`Processing: ${state}...`, { id: toastId });

				// Wait 2 seconds before next poll
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

	if (isError) {
		return (
			<div className="text-center py-20 text-plum font-bold">
				Error loading images. Please try again.
			</div>
		);
	}

	if (!images.length && !isLoading) {
		return (
			<EmptyState
				title="No photos yet"
				description="Start by uploading some photos to your library. Our AI will automatically begin face detection and organization."
				icon={
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-12 w-12 opacity-20"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				}
			/>
		);
	}

	return (
		<div className="space-y-12">
			<div className="flex justify-between items-center px-1">
				<div className="flex flex-col">
					<span className="text-xs font-black uppercase tracking-widest text-sage mb-1">
						Library
					</span>
					<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
						Your Collection
					</h2>
				</div>

				<div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-full flex items-center gap-1">
					<button
						type="button"
						onClick={() => setViewMode("grid")}
						className={`p-2 rounded-xl transition-all ${
							viewMode === "grid"
								? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
								: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
						}`}
						title="Bento Grid"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
							role="img"
							aria-label="Grid View"
						>
							<title>Grid View</title>
							<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					</button>
					<button
						type="button"
						onClick={() => setViewMode("list")}
						className={`p-2 rounded-xl transition-all ${
							viewMode === "list"
								? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
								: "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
						}`}
						title="List View"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
							role="img"
							aria-label="List View"
						>
							<title>List View</title>
							<path
								fillRule="evenodd"
								d="M3 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>
			</div>

			{viewMode === "grid" ? (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full auto-rows-[150px] md:auto-rows-[250px] grid-flow-dense">
					{images?.map((image, index) => {
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
								className={`relative animate-in fade-in slide-in-from-bottom-4 duration-500 ${spanClass}`}
								style={{ animationDelay: `${(index % 50) * 50}ms` }}
							>
								<ImageGridItem
									image={{
										id: image.imageId,
										width: width,
										height: height,
										url: image.imagePath,
										alt: image.imagePath,
										status: image.status,
									}}
									isSelected={selectedIds.has(image.imageId)}
									onToggleSelect={toggleSelect}
									selectionMode={selectedIds.size > 0}
									className="cursor-pointer transition-transform duration-300 hover:scale-[1.015] w-full h-full object-cover"
									onClick={() => handleImageClick(image)}
									onDelete={handleDeleteImage}
								/>
							</div>
						);
					})}
				</div>
			) : (
				<div>
					<CompactListView
						images={images || []}
						selectedIds={selectedIds}
						onToggleSelect={toggleSelect}
						onImageClick={handleImageClick}
					/>
				</div>
			)}

			<div ref={ref} className="w-full flex justify-center py-12">
				{isFetchingNextPage && (
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
				)}
			</div>

			<ImageModal
				image={selectedImage}
				images={images}
				onClose={unSelectImage}
				onDelete={handleDeleteImage}
				onNavigate={handleImageClick}
			/>

			<BulkActionBar
				selectedCount={selectedIds.size}
				totalCount={images?.length || 0}
				onClear={() => setSelectedIds(new Set())}
				onSelectAll={toggleSelectAll}
				onDelete={handleBulkDelete}
				onAddToAlbum={() => setIsAddToAlbumOpen(true)}
				onDownload={handleBulkDownload}
			/>

			{isAddToAlbumOpen && (
				<AddToAlbumModal
					onClose={() => setIsAddToAlbumOpen(false)}
					onConfirm={handleBatchAddToAlbum}
					isProcessing={isBatchProcessing}
				/>
			)}
		</div>
	);
};

export default ImagesList;
