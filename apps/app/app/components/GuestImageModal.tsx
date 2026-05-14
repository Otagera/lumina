import { cn } from "@lumina/ui/lib/utils";
import {
	ChevronDown,
	ChevronUp,
	Download,
	Heart,
	Share2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface GuestImageModalProps {
	initialImage: any | null;
	images: any[];
	onClose: () => void;
	onReaction?: (imageId: string) => void;
	reactions: Record<string, number>;
	onActiveImageChange?: (image: any) => void;
}

export const GuestImageModal = ({
	initialImage,
	images,
	onClose,
	onReaction,
	reactions,
	onActiveImageChange,
}: GuestImageModalProps) => {
	const [activeReactingId, setActiveReactingId] = useState<string | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const [hasScrolledInit, setHasScrolledInit] = useState(false);

	// Set initial scroll position
	useEffect(() => {
		if (initialImage && scrollContainerRef.current && !hasScrolledInit) {
			const activeNode = document.getElementById(
				`modal-img-${initialImage.imageId}`,
			);
			if (activeNode) {
				activeNode.scrollIntoView({ behavior: "auto", block: "center" });
				setHasScrolledInit(true);
			}
		}
	}, [initialImage, hasScrolledInit]);

	// Intersection Observer to track active image
	useEffect(() => {
		if (!onActiveImageChange) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const id = entry.target.id.replace("modal-img-", "");
						const img = images.find((i) => i.imageId === id);
						if (img) onActiveImageChange(img);
					}
				}
			},
			{ threshold: 0.6 },
		);

		const container = scrollContainerRef.current;
		if (container) {
			const items = container.querySelectorAll("[id^='modal-img-']");
			for (const item of items) observer.observe(item);
		}

		return () => observer.disconnect();
	}, [images, onActiveImageChange]);

	const handleReaction = (image: any) => {
		setActiveReactingId(image.imageId);
		onReaction?.(image.imageId);
		setTimeout(() => setActiveReactingId(null), 1000);
	};

	const handleDownload = async (image: any) => {
		try {
			const response = await fetch(image.imagePath);
			const blob = await response.blob();
			const blobUrl = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = blobUrl;
			link.download = `lumina-${image.imageId}.jpg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(blobUrl);
		} catch (error) {
			console.error("Download failed:", error);
			// Fallback to direct link if fetch fails
			window.open(image.imagePath, "_blank");
		}
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: "Check out my photo from Lumina!",
				url: window.location.href,
			});
		}
	};

	const scrollToNext = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({
				top: window.innerHeight,
				behavior: "smooth",
			});
		}
	}, []);

	const scrollToPrev = useCallback(() => {
		if (scrollContainerRef.current) {
			scrollContainerRef.current.scrollBy({
				top: -window.innerHeight,
				behavior: "smooth",
			});
		}
	}, []);

	// Keyboard navigation
	useEffect(() => {
		if (!initialImage) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowDown") scrollToNext();
			if (e.key === "ArrowUp") scrollToPrev();
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [initialImage, onClose, scrollToNext, scrollToPrev]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (initialImage) {
			document.body.style.overflow = "hidden";
			setHasScrolledInit(false);
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [initialImage]);

	if (!initialImage) return null;

	return (
		<div className="fixed inset-0 w-full h-[100dvh] bg-black z-[500] animate-in fade-in duration-300 overflow-hidden">
			{/* Close Button - Top Right */}
			<div className="absolute top-6 right-6 z-[520]">
				<button
					type="button"
					onClick={onClose}
					className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90"
					aria-label="Close"
				>
					<X size={24} />
				</button>
			</div>

			{/* Desktop Navigation Buttons (Moved to Left) */}
			<div className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-[520] flex-col gap-4">
				<button
					type="button"
					onClick={scrollToPrev}
					className="p-4 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90"
					aria-label="Previous Photo"
				>
					<ChevronUp size={24} />
				</button>
				<button
					type="button"
					onClick={scrollToNext}
					className="p-4 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90"
					aria-label="Next Photo"
				>
					<ChevronDown size={24} />
				</button>
			</div>

			{/* Vertical Scroll Container */}
			<div
				ref={scrollContainerRef}
				className="w-full h-full overflow-y-auto snap-y snap-mandatory no-scrollbar"
			>
				{images.map((img) => {
					const reactionCount = reactions[img.imageId] || 0;
					const isReacting = activeReactingId === img.imageId;

					return (
						<div
							key={img.imageId}
							id={`modal-img-${img.imageId}`}
							className="w-full h-[100dvh] snap-center snap-always relative flex items-center justify-center bg-black"
						>
							<img
								src={img.imagePath}
								alt="Event"
								className="max-w-full max-h-full object-contain"
								loading="lazy"
							/>

							{/* TikTok style actions overlay (Right side) */}
							<div className="absolute right-4 bottom-24 z-[510] flex flex-col items-center gap-6">
								<div className="flex flex-col items-center gap-1.5">
									<button
										type="button"
										className={cn(
											"w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900/60 backdrop-blur-xl border border-white/10 transition-all active:scale-90",
											(isReacting || reactionCount > 0) &&
												"text-rose-500 border-rose-500/40",
											!isReacting && reactionCount === 0 && "text-white",
										)}
										onClick={() => handleReaction(img)}
									>
										<Heart
											size={24}
											className={cn(
												(isReacting || reactionCount > 0) && "fill-rose-500",
												isReacting && "animate-ping",
											)}
										/>
									</button>
									<span className="text-white text-[10px] font-bold shadow-sm drop-shadow-md">
										{reactionCount > 0 ? reactionCount : "Love"}
									</span>
								</div>

								<div className="flex flex-col items-center gap-1.5">
									<button
										type="button"
										className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900/60 text-white backdrop-blur-xl border border-white/10 transition-all active:scale-90"
										onClick={() => handleDownload(img)}
									>
										<Download size={24} />
									</button>
									<span className="text-white text-[10px] font-bold shadow-sm drop-shadow-md">
										Save
									</span>
								</div>

								<div className="flex flex-col items-center gap-1.5">
									<button
										type="button"
										className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900/60 text-white backdrop-blur-xl border border-white/10 transition-all active:scale-90"
										onClick={handleShare}
									>
										<Share2 size={24} />
									</button>
									<span className="text-white text-[10px] font-bold shadow-sm drop-shadow-md">
										Share
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
