import {
	ChevronLeft,
	ChevronRight,
	Download,
	Eye,
	EyeOff,
	Image as ImageIcon,
	Info,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "~/components/ConfirmModal";
import { downloadImage, editAlbum, reprocessImage } from "../utils/api";

interface ImageModalProps {
	image: any;
	images?: any[];
	albumId?: string;
	shareToken?: string;
	onClose: () => void;
	onDelete?: (imageId: string) => void;
	onNavigate?: (image: any) => void;
	onFaceSearch?: (faceId: number) => void;
	isSearchMode?: boolean;
	onModerate?: (status: "APPROVED" | "REJECTED", imageId: string) => void;
}

const ImageModal = ({
	image,
	images = [],
	albumId,
	shareToken,
	onClose,
	onDelete,
	onNavigate,
	onFaceSearch,
	isSearchMode = false,
	onModerate,
}: ImageModalProps) => {
	const navigate = useNavigate();
	const [isDetailsOpen, setIsDetailsOpen] = useState(false);
	const [isReprocessing, setIsReprocessing] = useState(false);
	const [isSettingCover, setIsSettingCover] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [showFaces, setShowFaces] = useState(isSearchMode);

	useEffect(() => {
		if (isSearchMode) setShowFaces(true);
	}, [isSearchMode]);

	// Carousel Logic
	const currentIndex = images.findIndex(
		(img) => (img.imageId || img.id) === (image?.imageId || image?.id),
	);
	const hasPrevious = currentIndex > 0;
	const hasNext = currentIndex < images.length - 1 && currentIndex !== -1;

	const handleNext = useCallback(() => {
		if (hasNext && onNavigate) {
			onNavigate(images[currentIndex + 1]);
		}
	}, [hasNext, onNavigate, images, currentIndex]);

	const handlePrevious = useCallback(() => {
		if (hasPrevious && onNavigate) {
			onNavigate(images[currentIndex - 1]);
		}
	}, [hasPrevious, onNavigate, images, currentIndex]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!image) return;

			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			if (e.key === "Escape") onClose();
			if (e.key === "ArrowRight") handleNext();
			if (e.key === "ArrowLeft") handlePrevious();

			// Moderation shortcuts
			if (onModerate && image.status === "PENDING" && !isDetailsOpen) {
				if (e.key.toLowerCase() === "a") {
					e.preventDefault();
					onModerate("APPROVED", image.imageId || image.id);
					handleNext();
				}
				if (e.key.toLowerCase() === "r") {
					e.preventDefault();
					onModerate("REJECTED", image.imageId || image.id);
					handleNext();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [image, onClose, handleNext, handlePrevious, onModerate, isDetailsOpen]);

	useEffect(() => {
		if (image) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [image]);

	if (!image) return null;

	const handleFaceClick = (faceId: number) => {
		if (onFaceSearch) {
			onFaceSearch(faceId);
			onClose();
			return;
		}
		const params = new URLSearchParams();
		params.append("faceId", faceId.toString());
		if (shareToken) params.append("shareToken", shareToken);
		else if (albumId) params.append("albumId", albumId);
		navigate({ pathname: "/search", search: `?${params.toString()}` });
	};

	const handleReprocess = async () => {
		const targetId = image.imageId || image.id;
		if (!targetId) return;
		setIsReprocessing(true);
		const toastId = toast.loading("Queuing image for AI reprocessing...");
		try {
			await reprocessImage(targetId);
			toast.success("Image queued! The AI is analyzing it now.", {
				id: toastId,
				duration: 4000,
			});
		} catch (_error) {
			toast.error("Failed to queue image for reprocessing.", { id: toastId });
		} finally {
			setIsReprocessing(false);
		}
	};

	const handleSetAsCover = async () => {
		if (!albumId) return;
		const targetId = image.imageId || image.id;
		setIsSettingCover(true);
		const toastId = toast.loading("Setting album cover...");
		try {
			await editAlbum({ albumId, coverImageId: targetId });
			toast.success("Album cover updated!", { id: toastId });
		} catch (_error) {
			toast.error("Failed to update album cover.", { id: toastId });
		} finally {
			setIsSettingCover(false);
		}
	};

	const handleDownload = async (e: React.MouseEvent) => {
		e.stopPropagation();
		const targetId = image.imageId || image.id;
		const toastId = toast.loading("Preparing download...");
		try {
			let downloadUrl = image.imagePath || image.url;
			if (!shareToken) {
				const res = await downloadImage(targetId);
				downloadUrl = res.data.downloadUrl;
			}
			const response = await fetch(downloadUrl);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `photo-${targetId}.jpg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			toast.success("Download started", { id: toastId });
		} catch (error) {
			console.error("Download error:", error);
			toast.error("Failed to start download", { id: toastId });
		}
	};

	return (
		<div
			className="fixed inset-0 w-full h-full bg-black/95 backdrop-blur-xl flex justify-center items-center z-[100] p-4 sm:p-8 transition-opacity duration-300 animate-in fade-in"
			onClick={onClose}
		>
			<div
				className="relative w-full h-full flex flex-col items-center justify-center max-w-[1400px] mx-auto overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Top Bar Actions */}
				<div className="absolute top-0 right-0 p-4 flex items-center space-x-4 z-50">
					<button
						type="button"
						onClick={() => setShowFaces(!showFaces)}
						className={cn(
							"p-3 rounded-2xl transition-all backdrop-blur-md shadow-lg border",
							showFaces
								? "bg-sage/20 text-sage border-sage/30"
								: "bg-white/10 text-white hover:bg-white/20 border-white/10",
						)}
						title={showFaces ? "Hide Faces" : "Show Faces"}
					>
						{showFaces ? <EyeOff size={20} /> : <Eye size={20} />}
					</button>

					{albumId && !shareToken && (
						<button
							type="button"
							onClick={handleSetAsCover}
							disabled={isSettingCover}
							className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10 shadow-lg"
							title="Set as Album Cover"
						>
							<ImageIcon size={20} />
						</button>
					)}

					<button
						type="button"
						onClick={handleDownload}
						className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10 shadow-lg"
						title="Download Original"
					>
						<Download size={20} />
					</button>

					{!shareToken && onDelete && (
						<button
							type="button"
							onClick={() => setIsDeleteModalOpen(true)}
							className="p-3 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all border border-red-500/20 shadow-lg"
							title="Delete Photo"
						>
							<Trash2 size={20} />
						</button>
					)}

					<button
						type="button"
						onClick={onClose}
						className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all backdrop-blur-md border border-white/10 shadow-lg"
						title="Close (Esc)"
					>
						<X size={20} />
					</button>
				</div>

				{/* Left Arrow */}
				{hasPrevious && (
					<div className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-4 hidden md:block">
						<button
							type="button"
							onClick={handlePrevious}
							className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-3xl backdrop-blur-md border border-white/10 transition-all active:scale-90 shadow-2xl"
						>
							<ChevronLeft size={32} />
						</button>
					</div>
				)}

				{/* Right Arrow */}
				{hasNext && (
					<div className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-4 hidden md:block">
						<button
							type="button"
							onClick={handleNext}
							className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-3xl backdrop-blur-md border border-white/10 transition-all active:scale-90 shadow-2xl"
						>
							<ChevronRight size={32} />
						</button>
					</div>
				)}

				{/* Main Image Container */}
				<div className="relative w-full h-full flex items-center justify-center p-4">
					<div className="relative max-w-full max-h-full inline-block">
						<img
							src={image.imagePath || image.url}
							alt="Full screen view"
							className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5"
						/>

						{/* Face Detection Overlays */}
						{showFaces &&
							image.faces?.map((face: any) => {
								const { top, left, right, bottom } = face.bounding_box;
								// Note: Face detection UI requires scaling logic if not pre-rendered
								return (
									<button
										type="button"
										key={face.face_id}
										className="absolute border-2 border-sage hover:border-white rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 z-20"
										style={{
											top: `${top}%`,
											left: `${left}%`,
											width: `${right - left}%`,
											height: `${bottom - top}%`,
										}}
										onClick={() => handleFaceClick(face.face_id)}
									/>
								);
							})}
					</div>
				</div>

				{/* Bottom Details Toggle */}
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
					<button
						type="button"
						onClick={() => setIsDetailsOpen(true)}
						className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 font-black rounded-2xl shadow-2xl hover:scale-105 transition-all active:scale-95"
					>
						<Info size={20} />
						View Details
					</button>
				</div>

				{/* Slide-out Details Panel */}
				<div
					className={cn(
						"fixed top-4 right-4 bottom-4 w-full max-w-[350px] bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-800 shadow-2xl p-6 transition-all duration-500 transform z-[60], overflow-y-auto",
						isDetailsOpen
							? "translate-x-0 opacity-100"
							: "translate-x-[120%] opacity-0 pointer-events-none",
					)}
				>
					<div className="flex items-center justify-between mb-8">
						<h3 className="text-xl font-bold text-white flex items-center space-x-2">
							<span className="w-1.5 h-6 bg-sage rounded-full" />
							<span>Details</span>
						</h3>
						<button
							type="button"
							onClick={() => setIsDetailsOpen(false)}
							className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
						>
							<X size={20} />
						</button>
					</div>

					<div className="space-y-6">
						<div>
							<span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
								Asset ID
							</span>
							<p className="text-sm text-zinc-300 font-mono bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 break-all">
								{image.imageId || image.id}
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
								<span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
									Width
								</span>
								<span className="text-lg font-bold text-zinc-100">
									{image.originalSize?.width || image.originalWidth}px
								</span>
							</div>
							<div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
								<span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1">
									Height
								</span>
								<span className="text-lg font-bold text-zinc-100">
									{image.originalSize?.height || image.originalHeight}px
								</span>
							</div>
						</div>

						<div className="bg-gradient-to-br from-sage/10 to-transparent p-6 rounded-3xl border border-sage/20 relative overflow-hidden mt-8">
							<div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-sage/20 rounded-full blur-2xl" />
							<span className="text-[10px] uppercase tracking-widest font-bold text-sage block mb-2">
								AI Insights
							</span>
							<div className="flex items-end space-x-3 mb-6 relative z-10">
								<span className="text-6xl font-black text-sage leading-none">
									{image.faces?.length || 0}
								</span>
								<span className="text-sm font-bold text-zinc-300 pb-1">
									Faces
									<br />
									Detected
								</span>
							</div>

							{!shareToken && (
								<button
									type="button"
									onClick={handleReprocess}
									disabled={isReprocessing}
									className="relative z-10 w-full py-3 bg-sage text-zinc-950 rounded-xl text-sm font-bold hover:bg-sage/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
								>
									{isReprocessing && (
										<div className="animate-spin h-4 w-4 border-2 border-zinc-950 border-t-transparent rounded-full" />
									)}
									<span>
										{isReprocessing ? "Queuing..." : "Re-process Image"}
									</span>
								</button>
							)}
						</div>
					</div>
				</div>
			</div>

			<ConfirmModal
				isOpen={isDeleteModalOpen}
				title="Delete Photo"
				message="Move this photo to trash? It will be permanently deleted after 30 days."
				confirmText="Move to Trash"
				onConfirm={() => {
					if (onDelete && (image.imageId || image.id)) {
						onDelete(image.imageId || image.id);
					}
					setIsDeleteModalOpen(false);
					onClose();
				}}
				onCancel={() => setIsDeleteModalOpen(false)}
				isDestructive={true}
			/>
		</div>
	);
};

export default ImageModal;
