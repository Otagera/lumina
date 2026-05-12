import { cn } from "@lumina/ui/lib/utils";
import { Download, Heart, Share2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GuestImageModalProps {
	initialImage: any | null;
	images: any[];
	onClose: () => void;
	onReaction?: (imageId: string) => void;
	reactions: Record<string, number>;
}

export const GuestImageModal = ({
	initialImage,
	images,
	onClose,
	onReaction,
	reactions,
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
	}, [initialImage, images, hasScrolledInit]);

	const handleReaction = (image: any) => {
		setActiveReactingId(image.imageId);
		onReaction?.(image.imageId);
		setTimeout(() => setActiveReactingId(null), 1000);
	};

	const handleDownload = (image: any) => {
		const link = document.createElement("a");
		link.href = image.imagePath;
		link.download = `lumina-${image.imageId}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleShare = () => {
		if (navigator.share) {
			navigator.share({
				title: "Check out my photo from Lumina!",
				url: window.location.href,
			});
		}
	};

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
		<div className="fixed inset-0 w-full h-[100dvh] bg-black z-[500] animate-in fade-in duration-300">
			{/* Close Button - Top Left */}
			<div className="absolute top-6 left-6 z-[510]">
				<button
					type="button"
					onClick={onClose}
					className="p-3 bg-zinc-900/60 hover:bg-zinc-800/80 text-white rounded-full backdrop-blur-xl border border-white/10 transition-all active:scale-90"
					aria-label="Close"
				>
					<X size={24} />
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
