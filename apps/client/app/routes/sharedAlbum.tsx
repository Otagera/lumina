import { useQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import { Upload } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BulkActionBar } from "~/components/BulkActionBar";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import ImageGridItem from "~/Images/ImageGridItem";
import ImageModal from "~/Images/ImageModal";
import { getBentoSpanClass } from "~/utils/bento";
import { SelfieSearchModal } from "../components/SelfieSearchModal";
import { fetchSharedAlbum, searchFaces } from "../utils/api";
import axiosAPI from "../utils/axios";
import { useUpload } from "../utils/UploadContext";

const SharedAlbumPage = () => {
	const { token } = useParams<{ token: string }>();
	const { addUploads, tasks } = useUpload();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isSelfieModalOpen, setIsSelfieModalOpen] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [filteredImageIds, setFilteredIds] = useState<Set<string> | null>(null);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);

	const { data: albumResponse, isLoading } = useQuery({
		queryKey: ["shared-album", token],
		queryFn: () => fetchSharedAlbum(token!),
		enabled: !!token,
	});

	const albumData = albumResponse?.data;
	const allImages = useMemo(() => albumData?.images || [], [albumData]);

	const handleUpload = () => {
		if (!uploadFiles || uploadFiles.length === 0) return;

		// Use the unified UploadContext for high-quality direct uploads
		addUploads(
			uploadFiles,
			albumData.id,
			albumData.settings?.requires_approval ? "PENDING" : "APPROVED",
			token, // Pass shareToken to signal guest upload
		);

		setIsUploadModalOpen(false);
		setUploadFiles(null);
	};

	const displayedImages = useMemo(() => {
		let baseImages = allImages;
		if (filteredImageIds) {
			baseImages = allImages.filter((img: any) =>
				filteredImageIds.has(img.imageId),
			);
		}

		if (!albumData?.settings?.requires_approval) return baseImages;

		// Find any locally uploaded images that are pending approval
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
			}));

		return [...pendingUploads, ...baseImages];
	}, [allImages, filteredImageIds, tasks, albumData]);

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !allImages.length) return null;
		return (
			allImages.find((img: any) => img.imageId === selectedImageId) || null
		);
	}, [selectedImageId, allImages]);

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

	const toggleSelect = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
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

	const handleFaceSearch = async (faceId: number) => {
		const toastId = toast.loading("Finding matching photos...");
		try {
			const results = await searchFaces({
				faceId,
				shareToken: token,
				threshold: 0.6,
			});
			if (results?.data?.faces) {
				const ids = new Set(results.data.faces.map((f: any) => f.imageId));
				setFilteredIds(ids);
				toast.success(`Found ${ids.size} photos with this face`, {
					id: toastId,
				});
			}
		} catch (_error) {
			toast.error("Search failed", { id: toastId });
		}
	};

	if (isLoading) {
		return (
			<MainContainer className="flex justify-center items-center h-[60vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage"></div>
			</MainContainer>
		);
	}

	if (!albumResponse?.data) {
		return (
			<MainContainer className="flex flex-col items-center justify-center h-[60vh] text-center">
				<h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
					Album Not Found
				</h1>
				<p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md leading-relaxed">
					This shared link may have expired or is invalid. Please contact the
					album owner for a new link.
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

	return (
		<MainContainer>
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<span className="px-2 py-0.5 bg-sage/10 text-sage rounded text-[10px] font-black uppercase tracking-widest border border-sage/20">
							Shared Album
						</span>
						{filteredImageIds && (
							<button
								type="button"
								onClick={() => setFilteredIds(null)}
								className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded text-[10px] font-bold uppercase hover:bg-zinc-200 transition-colors cursor-pointer"
							>
								Clear Filter &times;
							</button>
						)}
					</div>
					<h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
						{albumData.albumName}
					</h1>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
						{filteredImageIds
							? `Showing ${displayedImages.length} photos of you`
							: "Organized by the owner for you"}
					</p>
				</div>

				<div className="flex items-center space-x-3 w-full md:w-auto">
					{albumData.canUpload && (
						<button
							type="button"
							className="flex-1 md:flex-none px-8 py-3.5 font-bold rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-xl cursor-pointer"
							onClick={() => setIsUploadModalOpen(true)}
						>
							<Upload size={20} />
							<span>Contribute</span>
						</button>
					)}
					<button
						type="button"
						className={`flex-1 md:flex-none px-8 py-3.5 font-bold rounded-2xl border transition-all flex items-center justify-center space-x-2 active:scale-95 shadow-xl ${
							filteredImageIds
								? "bg-sage text-white border-sage"
								: "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
						}`}
						onClick={() => setIsSelfieModalOpen(true)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`h-5 w-5 ${filteredImageIds ? "text-white" : "text-sage"}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Find My Face"
						>
							<title>Find My Face</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
						<span>{filteredImageIds ? "Change Photo" : "Find My Face"}</span>
					</button>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full auto-rows-[150px] md:auto-rows-[200px] grid-flow-dense">
				{displayedImages.map((image: any, index: number) => {
					const width = image.originalSize?.width || 0;
					const height = image.originalSize?.height || 0;

					const area = width * height;
					const isFeatured = area > 2000000;

					const spanClass = getBentoSpanClass(width, height, index, isFeatured);

					return (
						<div key={image.imageId} className={`relative ${spanClass}`}>
							<ImageGridItem
								image={{
									id: image.imageId,
									width: width,
									height: height,
									url: image.imagePath,
									alt: image.imageId,
								}}
								onDelete={() => {}}
								onToggleSelect={toggleSelect}
								isSelected={selectedIds.has(image.imageId)}
								selectionMode={selectedIds.size > 0}
								shared={true}
								className="cursor-pointer rounded-xl transition-transform duration-300 hover:scale-[1.02] shadow-sm w-full object-cover"
								onClick={() => !image.isPending && setSelectedImage(image)}
							/>
							{image.isPending && (
								<div className="absolute top-2 left-2 z-10 px-2 py-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5">
									<div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
									Up for moderation
								</div>
							)}
						</div>
					);
				})}
			</div>

			{displayedImages.length === 0 && (
				<div className="text-center py-32">
					<p className="text-zinc-500 font-medium">
						No photos found matching this filter.
					</p>
				</div>
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
						setFilteredIds(ids);
					}}
				/>
			)}

			<BulkActionBar
				selectedCount={selectedIds.size}
				onClear={() => setSelectedIds(new Set())}
				onDownload={handleBulkDownload}
			/>

			{isUploadModalOpen && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
					<div className="bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
						<h2 className="text-2xl font-black mb-2">Contribute Photos</h2>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
							Add your photos to this shared collection.
						</p>

						{albumData.settings?.requires_approval && (
							<div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start space-x-3">
								<div className="text-amber-500 mt-0.5">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div>
									<h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-1">
										Moderation Enabled
									</h4>
									<p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
										Photos uploaded to this album require approval from the host
										before they become visible to everyone.
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
									{uploadFiles
										? `${uploadFiles.length} photos selected`
										: "Drop photos or click to browse"}
								</p>
							</div>
						</div>

						<div className="flex gap-3">
							<Button
								className="flex-1"
								onClick={handleUpload}
								disabled={!uploadFiles}
							>
								Add to Queue
							</Button>
							<Button
								variant="ghost"
								onClick={() => setIsUploadModalOpen(false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}
		</MainContainer>
	);
};

export default SharedAlbumPage;
