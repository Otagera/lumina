import {
	Download,
	Heart,
	ImageIcon,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

export interface ImageGridItemProps extends HTMLAttributes<HTMLImageElement> {
	image: {
		width: number;
		height: number;
		url: string;
		alt: string;
		id: string;
		status?: string;
	};
	onDelete?: (imageId: string) => void;
	onSetCover?: (imageId: string) => void;
	onReaction?: (imageId: string) => void;
	reactionCount?: number;
	isCover?: boolean;
	shared?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (imageId: string) => void;
	selectionMode?: boolean;
	containerClassName?: string;
}

const ImageGridItem = ({
	image,
	className,
	onClick,
	onDelete,
	onSetCover,
	onReaction,
	reactionCount = 0,
	isCover,
	isSelected,
	onToggleSelect,
	selectionMode,
	containerClassName = "",
	shared = false,
}: ImageGridItemProps) => {
	const isQuotaExceeded = image.status === "QUOTA_EXCEEDED";
	const [menuOpen, setMenuOpen] = useState(false);
	const [isHeartPopping, setIsHeartPoping] = useState(false);

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (onReaction) {
				setIsHeartPoping(true);
				onReaction(image.id);
				setTimeout(() => setIsHeartPoping(false), 800);
			}
		},
		[onReaction, image.id],
	);

	const handleReactionClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onReaction?.(image.id);
	};

	const handleContainerClick = (e: React.MouseEvent) => {
		if (selectionMode && onToggleSelect) {
			onToggleSelect(image.id);
		} else if (onClick) {
			// Create a fake event object that looks like what an image click would send
			onClick(e as any);
		}
	};

	return (
		<div
			className={cn(
				"relative group overflow-hidden rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 transition-all duration-500 shadow-sm hover:shadow-xl isolate cursor-zoom-in",
				containerClassName,
				isSelected &&
					"ring-4 ring-sage ring-offset-4 dark:ring-offset-zinc-950 scale-[0.98]",
			)}
			onClick={handleContainerClick}
			onDoubleClick={handleDoubleClick}
		>
			<img
				src={image.url}
				alt={image.alt}
				loading="lazy"
				className={cn(
					"w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 relative z-10 pointer-events-none",
					className,
					isSelected && "opacity-80",
				)}
			/>

			{/* Pinterest-style Hover Overlay */}
			<div className="absolute inset-0 bg-black/10 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

			{/* Heart Pop Animation */}
			{isHeartPopping && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
					<Heart className="w-20 h-20 text-white fill-white animate-ping opacity-75" />
					<Heart className="absolute w-16 h-16 text-white fill-white animate-in zoom-in duration-300" />
				</div>
			)}

			{/* Top Controls (Selection/Menu) */}
			<div className="absolute top-3 left-3 right-3 flex justify-between items-center z-30">
				<div
					className={cn(
						"transition-all duration-300 transform",
						selectionMode || isSelected
							? "opacity-100 scale-100"
							: "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100",
					)}
				>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onToggleSelect?.(image.id);
						}}
						className={cn(
							"w-9 h-9 rounded-xl flex items-center justify-center transition-all border shadow-lg backdrop-blur-md active:scale-90",
							isSelected
								? "bg-sage border-sage text-zinc-950"
								: "bg-white/40 dark:bg-black/20 border-white/40 dark:border-white/20 text-transparent hover:border-white/60",
						)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
				</div>

				{!shared && !selectionMode && onDelete && (
					<div className="relative">
						<button
							type="button"
							className="p-2 bg-white/40 dark:bg-black/20 text-zinc-900 dark:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/60 dark:hover:bg-black/40 shadow-lg backdrop-blur-md border border-white/40 dark:border-white/10 active:scale-90"
							onClick={(e) => {
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
						>
							<MoreHorizontal size={18} />
						</button>
						{menuOpen && (
							<div
								className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 py-2 z-[100] animate-in fade-in slide-in-from-top-2"
								onClick={(e) => e.stopPropagation()}
							>
								{onSetCover && (
									<button
										type="button"
										onClick={() => {
											onSetCover(image.id);
											setMenuOpen(false);
										}}
										className={cn(
											"w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2",
											isCover && "text-sage font-bold bg-sage/5",
										)}
									>
										<ImageIcon size={14} />
										{isCover ? "Remove Cover" : "Set as Cover"}
									</button>
								)}
								<button
									type="button"
									onClick={() => {
										onDelete(image.id);
										setMenuOpen(false);
									}}
									className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
								>
									<Trash2 size={14} />
									Delete
								</button>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Bottom Controls (Reactions) */}
			<div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
				{onReaction && !selectionMode && (
					<button
						type="button"
						onClick={handleReactionClick}
						className={cn(
							"pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-full transition-all duration-300 shadow-xl border border-white/40 dark:border-white/20 active:scale-95 group/heart",
							reactionCount > 0 && "text-plum",
						)}
					>
						<Heart
							size={16}
							className={cn(
								"transition-colors duration-300",
								reactionCount > 0
									? "fill-plum text-plum"
									: "text-zinc-400 group-hover/heart:text-plum",
							)}
						/>
						{reactionCount > 0 && (
							<span className="text-xs font-black tracking-tight">
								{reactionCount}
							</span>
						)}
					</button>
				)}

				<div className="flex gap-2">
					<button className="pointer-events-auto p-2 bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 rounded-full shadow-xl border border-white/40 dark:border-white/20 active:scale-90">
						<Download size={16} />
					</button>
				</div>
			</div>

			{/* Quota Exceeded Badge */}
			{isQuotaExceeded && (
				<div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-40">
					<div className="bg-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 animate-in zoom-in">
						<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
						<span className="text-[10px] font-black uppercase tracking-widest text-zinc-950">
							Quota Exceeded
						</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default ImageGridItem;
