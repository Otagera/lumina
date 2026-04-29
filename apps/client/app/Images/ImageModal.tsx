import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "~/components/ConfirmModal";
import { downloadImage, editAlbum, reprocessImage } from "../utils/api";

interface ImageModalProps {
	image: any;
	images?: any[]; // The full list of images for carousel
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
	const imgRef = useRef<HTMLImageElement>(null);
	const navigate = useNavigate();
	const [imageDimensions, setImageDimensions] = useState({
		width: 0,
		height: 0,
	});
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

	const handlePrevious = useCallback(
		(e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (hasPrevious && onNavigate) {
				onNavigate(images[currentIndex - 1]);
			}
		},
		[hasPrevious, currentIndex, images, onNavigate],
	);

	const handleNext = useCallback(
		(e?: React.MouseEvent) => {
			e?.stopPropagation();
			if (hasNext && onNavigate) {
				onNavigate(images[currentIndex + 1]);
			}
		},
		[hasNext, currentIndex, images, onNavigate],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!image) return;

			// Ignore shortcuts if user is typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			)
				return;

			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") handlePrevious();
			if (e.key === "ArrowRight") handleNext();

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
	}, [image, onClose, handlePrevious, handleNext, onModerate, isDetailsOpen]);

	useEffect(() => {
		const updateDimensions = () => {
			if (imgRef.current) {
				setImageDimensions({
					width: imgRef.current.offsetWidth,
					height: imgRef.current.offsetHeight,
				});
			}
		};

		if (imgRef.current) {
			if (imgRef.current.complete) {
				updateDimensions();
			} else {
				imgRef.current.onload = updateDimensions;
			}
			window.addEventListener("resize", updateDimensions);
		}

		return () => {
			window.removeEventListener("resize", updateDimensions);
		};
	}, [image]);

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

		if (shareToken) {
			params.append("shareToken", shareToken);
		} else if (albumId) {
			params.append("albumId", albumId);
		}

		navigate({
			pathname: "/search",
			search: `?${params.toString()}`,
		});
		// onClose();
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
			let downloadUrl = image.imagePath;

			if (!shareToken) {
				// For private images, get an authorized presigned URL
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

	const imageId = image.imageId || image.id;

	return (
		<div
			className="fixed inset-0 w-full h-full bg-black/95 backdrop-blur-xl flex justify-center items-center z-[100] p-4 sm:p-8 transition-opacity duration-300 animate-in fade-in"
			onClick={onClose}
		>
			<div
				className="relative w-full h-full flex flex-col items-center justify-center max-w-[1400px] mx-auto"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Top Bar Actions */}
				<div className="absolute top-0 right-0 p-4 flex items-center space-x-4 z-50">
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							setShowFaces(!showFaces);
						}}
						className={`p-3 rounded-full transition-all backdrop-blur-md shadow-lg border ${
							showFaces
								? "bg-sage/20 text-sage border-sage/30"
								: "bg-zinc-800/80 text-white hover:bg-zinc-700 border-zinc-700"
						}`}
						title={showFaces ? "Hide Faces" : "Show Faces"}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label={showFaces ? "Hide Faces" : "Show Faces"}
						>
							<title>{showFaces ? "Hide Faces" : "Show Faces"}</title>
							{showFaces ? (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
								/>
							) : (
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							)}
						</svg>
					</button>

					{albumId && !shareToken && (
						<button
							type="button"
							onClick={handleSetAsCover}
							disabled={isSettingCover}
							className="p-3 bg-zinc-800/80 text-white rounded-full hover:bg-zinc-700 transition-all backdrop-blur-md border border-zinc-700 shadow-lg"
							title="Set as Album Cover"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="img"
								aria-label="Set as Cover"
							>
								<title>Set as Cover</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</button>
					)}

					<button
						type="button"
						onClick={handleDownload}
						className="p-3 bg-zinc-800/80 text-white rounded-full hover:bg-zinc-700 transition-all backdrop-blur-md border border-zinc-700 shadow-lg"
						title="Download Photo"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Download"
						>
							<title>Download</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
							/>
						</svg>
					</button>

					{!shareToken && onDelete && (
						<button
							type="button"
							onClick={() => setIsDeleteModalOpen(true)}
							className="p-3 bg-red-500/10 text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-all border border-red-500/20 shadow-lg"
							title="Delete Photo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								role="img"
								aria-label="Delete"
							>
								<title>Delete</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					)}
					<button
						type="button"
						className="p-3 bg-zinc-800/80 text-white rounded-full hover:bg-zinc-700 transition-all backdrop-blur-md border border-zinc-700 shadow-lg"
						onClick={onClose}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							role="img"
							aria-label="Close"
						>
							<title>Close</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* Carousel Controls */}
				{images.length > 0 && (
					<>
						<button
							type="button"
							className={`absolute left-4 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md border border-zinc-800 transition-all z-40 ${
								!hasPrevious ? "opacity-0 pointer-events-none" : "opacity-100"
							}`}
							onClick={handlePrevious}
							aria-label="Previous image"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Previous</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>
						<button
							type="button"
							className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md border border-zinc-800 transition-all z-40 ${
								!hasNext ? "opacity-0 pointer-events-none" : "opacity-100"
							}`}
							onClick={handleNext}
							aria-label="Next image"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Next</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</>
				)}

				<div
					className={`relative flex items-center justify-center transition-all duration-300 w-full h-[85vh] ${
						isDetailsOpen ? "lg:pr-[380px]" : ""
					}`}
				>
					<div className="relative inline-block max-w-full max-h-full">
						<img
							ref={imgRef}
							src={image.imagePath}
							alt="Selected"
							className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
						/>
						{showFaces &&
							image.faces?.map((face: any) => {
								const { top, left, right, bottom } = face.bounding_box;
								const originalWidth =
									image.originalSize?.width || image.originalWidth;
								const originalHeight =
									image.originalSize?.height || image.originalHeight;

								const scaleX = imageDimensions.width / originalWidth;
								const scaleY = imageDimensions.height / originalHeight;

								const width = (right - left) * scaleX;
								const height = (bottom - top) * scaleY;
								const x = left * scaleX;
								const y = top * scaleY;

								return (
									<button
										type="button"
										key={face.face_id}
										className="absolute border-[3px] border-sage hover:border-sage/80 rounded-[40%] shadow-[0_0_15px_rgba(182, 186, 68, 0.4)] cursor-pointer transition-all duration-300 hover:shadow-[0_0_25px_rgba(182, 186, 68, 0.6)] group"
										style={{
											left: `${x}px`,
											top: `${y}px`,
											width: `${width}px`,
											height: `${height}px`,
										}}
										title="Click to search for this face"
										onClick={(e) => {
											e.stopPropagation();
											handleFaceClick(face.face_id);
										}}
									>
										<div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-zinc-900 text-white text-[10px] font-bold py-1 px-2 rounded-md">
											Search Face
										</div>
									</button>
								);
							})}
					</div>
				</div>

				{/* Bottom Metadata Bar */}
				<div
					className={`absolute bottom-6 transition-all duration-500 z-40 ${
						isDetailsOpen
							? "opacity-0 translate-y-10 pointer-events-none"
							: "opacity-100 translate-y-0 left-1/2 -translate-x-1/2"
					}`}
				>
					<div className="flex justify-between items-center bg-zinc-900/80 backdrop-blur-xl px-6 py-3 rounded-2xl border border-zinc-800 shadow-2xl space-x-6">
						<div className="flex flex-col">
							<p className="text-sm font-bold text-zinc-100">
								{image.faces?.length || 0} faces detected
							</p>
							<p className="text-[10px] text-sage uppercase tracking-wider font-black">
								AI Match Active
							</p>
						</div>
						<div className="flex items-center space-x-3">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setIsDetailsOpen(true);
								}}
								className="px-5 py-2 text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 border bg-zinc-100 text-zinc-900 hover:bg-white border-zinc-300"
							>
								View Details
							</button>
						</div>
					</div>
				</div>

				{/* Slide-out Details Panel */}
				<div
					className={`absolute top-4 right-4 bottom-4 w-full max-w-[350px] bg-zinc-900/95 backdrop-blur-2xl rounded-3xl border border-zinc-800 shadow-2xl p-6 transition-all duration-500 transform z-50 overflow-y-auto ${
						isDetailsOpen
							? "translate-x-0 opacity-100"
							: "translate-x-[120%] opacity-0 pointer-events-none"
					}`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex items-center justify-between mb-8">
						<h3 className="text-xl font-bold text-white flex items-center space-x-2">
							<span className="w-1.5 h-6 bg-sage rounded-full" />
							<span>Details</span>
						</h3>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								setIsDetailsOpen(false);
							}}
							className="p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
							aria-label="Close Details"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<title>Close Details</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div className="space-y-6">
						<div>
							<span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
								Asset ID
							</span>
							<p className="text-sm text-zinc-300 font-mono bg-zinc-950 p-3 rounded-xl border border-zinc-800 mt-1 break-all">
								{imageId}
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
									className="relative z-10 w-full py-3 bg-sage text-zinc-950 rounded-xl text-sm font-bold hover:bg-sage/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2 shadow-lg shadow-sage/20"
								>
									{isReprocessing && (
										<svg
											className="animate-spin h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											role="img"
											aria-label="Loading"
										>
											<title>Loading</title>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
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
					if (onDelete && imageId) {
						onDelete(imageId);
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
