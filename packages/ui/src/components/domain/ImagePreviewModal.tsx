import {
	ChevronLeft,
	ChevronRight,
	Download,
	Heart,
	Share2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "../ui/dialog";

interface ImagePreviewModalProps {
	image: any | null;
	images: any[];
	isOpen: boolean;
	onClose: () => void;
	onNavigate: (image: any) => void;
	onReaction?: (imageId: string) => void;
	reactionCount?: number;
}

export const ImagePreviewModal = ({
	image,
	images,
	isOpen,
	onClose,
	onNavigate,
	onReaction,
	reactionCount = 0,
}: ImagePreviewModalProps) => {
	const [isReacting, setIsReacting] = useState(false);

	const currentIndex = image
		? images.findIndex((img) => img.imageId === image.imageId)
		: -1;
	const hasNext = currentIndex !== -1 && currentIndex < images.length - 1;
	const hasPrev = currentIndex > 0;

	const handleNext = useCallback(() => {
		if (hasNext) onNavigate(images[currentIndex + 1]);
	}, [hasNext, currentIndex, images, onNavigate]);

	const handlePrev = useCallback(() => {
		if (hasPrev) onNavigate(images[currentIndex - 1]);
	}, [hasPrev, currentIndex, images, onNavigate]);

	const handleReaction = () => {
		if (!image) return;
		setIsReacting(true);
		onReaction?.(image.imageId);
		setTimeout(() => setIsReacting(false), 1000);
	};

	const handleDownload = () => {
		if (!image) return;
		const link = document.createElement("a");
		link.href = image.imagePath;
		link.download = `lumina-${image.imageId}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen || !image) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") handleNext();
			if (e.key === "ArrowLeft") handlePrev();
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, image, handleNext, handlePrev, onClose]);

	if (!image) return null;

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:w-[92vw] md:h-[92vh] md:max-w-6xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none rounded-none md:rounded-[2rem] z-[300] flex flex-col gap-0 outline-none shadow-2xl"
				showCloseButton={false}
			>
				<DialogTitle className="sr-only">Photo Preview</DialogTitle>
				<DialogDescription className="sr-only">
					Full screen view of the selected event photo
				</DialogDescription>

				<div className="relative w-full h-full grid grid-rows-[minmax(0,1fr)_auto] bg-transparent">
					{/* Top Actions / Close Button Overlay */}
					<div className="absolute top-3 right-3 md:top-6 md:right-6 z-50">
						<button
							onClick={onClose}
							className="p-2.5 md:p-3 bg-zinc-100/90 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-2xl backdrop-blur-xl border border-zinc-200 dark:border-white/10 transition-all active:scale-90 shadow-lg"
							title="Close (Esc)"
						>
							<X size={24} />
						</button>
					</div>

					{/* Main Image Area - Flex 1 to fill available space */}
					<div className="relative w-full min-h-0 flex items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20 overflow-hidden px-3 md:px-6 pt-14 md:pt-6 pb-3 md:pb-4">
						{/* Navigation Controls - Positioned at far edges */}
						<div className="absolute inset-y-0 left-0 right-0 pointer-events-none z-20 flex items-center justify-between px-2 md:px-8">
							{hasPrev ? (
								<button
									onClick={(e) => {
										e.stopPropagation();
										handlePrev();
									}}
									className="pointer-events-auto p-2.5 md:p-5 bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-2xl md:rounded-3xl backdrop-blur-md border border-zinc-200 dark:border-white/10 transition-all active:scale-90 shadow-xl"
									aria-label="Previous image"
								>
									<ChevronLeft size={32} strokeWidth={2.5} />
								</button>
							) : (
								<div />
							)}

							{hasNext ? (
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleNext();
									}}
									className="pointer-events-auto p-2.5 md:p-5 bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-zinc-900 dark:text-white rounded-2xl md:rounded-3xl backdrop-blur-md border border-zinc-200 dark:border-white/10 transition-all active:scale-90 shadow-xl"
									aria-label="Next image"
								>
									<ChevronRight size={32} strokeWidth={2.5} />
								</button>
							) : (
								<div />
							)}
						</div>

						<img
							src={image.imagePath}
							alt="Preview"
							className="block max-w-full max-h-full w-auto h-auto object-contain mx-auto my-auto z-10 animate-in fade-in zoom-in-95 duration-500 select-none shadow-2xl rounded-xl"
						/>
					</div>

					{/* Bottom Actions Bar - Shrink 0 to keep constant height */}
					<div className="p-4 md:p-8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4 shrink-0 z-30">
						<p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-semibold">
							{currentIndex + 1} / {images.length}
						</p>
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								size="lg"
								className={cn(
									"rounded-[1.5rem] border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 bg-white dark:bg-white/5 h-14 md:h-16 px-6 md:px-8 text-lg font-black transition-all shadow-sm",
									(isReacting || reactionCount > 0) &&
										"border-plum/20 bg-plum/5 dark:bg-plum/10 text-plum",
									isReacting && "scale-110",
								)}
								onClick={handleReaction}
							>
								<Heart
									size={24}
									className={cn(
										"mr-2.5 transition-all duration-300",
										(isReacting || reactionCount > 0) &&
											"fill-plum text-plum scale-110",
									)}
								/>
								<span>{reactionCount > 0 ? reactionCount : "Love"}</span>
							</Button>
						</div>

						<div className="flex items-center justify-end gap-3">
							<Button
								variant="outline"
								size="icon"
								className="rounded-2xl border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 bg-white dark:bg-white/5 w-14 h-14 md:w-16 md:h-16 shrink-0 shadow-sm"
								onClick={handleDownload}
								title="Download Photo"
							>
								<Download size={24} />
							</Button>
							<Button
								variant="primary"
								size="lg"
								className="rounded-2xl px-8 md:px-10 h-14 md:h-16 font-black text-lg bg-sage text-zinc-950 hover:bg-sage/90 shadow-xl shadow-sage/20 shrink-0 border-none"
								onClick={() => {
									if (navigator.share) {
										navigator.share({
											title: "Check out my photo from Lumina!",
											url: window.location.href,
										});
									}
								}}
							>
								<Share2 size={24} className="mr-2.5" />
								<span>Share</span>
							</Button>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
