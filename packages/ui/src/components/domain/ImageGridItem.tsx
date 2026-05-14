import {
	Download,
	Heart,
	ImageIcon,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { useCallback, useState, useEffect } from "react";
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
	onDownload?: (imageId: string) => void;
	reactionCount?: number;
	isCover?: boolean;
	shared?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (imageId: string) => void;
	selectionMode?: boolean;
	containerClassName?: string;
	variant?: "admin" | "guest";
}

const ImageGridItem = ({
	image,
	className,
	onClick,
	onDelete,
	onSetCover,
	onReaction,
	onDownload,
	reactionCount = 0,
	isCover,
	isSelected,
	onToggleSelect,
	selectionMode,
	containerClassName = "",
	shared = false,
	variant = "guest",
}: ImageGridItemProps) => {
	const isQuotaExceeded = image.status === "QUOTA_EXCEEDED";
	const [menuOpen, setMenuOpen] = useState(false);
	const [isHeartPopping, setIsHeartPoping] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const isAdmin = variant === "admin";
	const isGuest = variant === "guest";

	const handleDoubleClick = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (onReaction && isGuest) {
				setIsHeartPoping(true);
				onReaction(image.id);
				setTimeout(() => setIsHeartPoping(false), 800);
			}
		},
		[onReaction, image.id, isGuest],
	);

	const handleReactionClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onReaction?.(image.id);
	};

	const handleContainerClick = (e: React.MouseEvent) => {
		if (selectionMode && onToggleSelect) {
			onToggleSelect(image.id);
		} else if (onClick) {
			onClick(e as any);
		}
	};

	const handleDownloadClick = async (e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDownload) {
			onDownload(image.id);
		} else {
			try {
				const response = await fetch(image.url);
				const blob = await response.blob();
				const blobUrl = window.URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = blobUrl;
				link.download = `lumina-${image.id}.jpg`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(blobUrl);
			} catch (error) {
				console.error("Download failed:", error);
				const link = document.createElement("a");
				link.href = image.url;
				link.download = `lumina-${image.id}.jpg`;
				link.target = "_blank";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			}
		}
	};

	const hasDimensions = image.width > 0 && image.height > 0;
	const aspectRatio = hasDimensions ? `${image.width} / ${image.height}` : "3 / 4";

	return (
		<div
			className={cn(
				"relative overflow-hidden transition-all duration-500 bg-zinc-100 dark:bg-zinc-800 shadow-sm hover:shadow-xl cursor-zoom-in w-full",
				isAdmin ? "h-full rounded-[1.5rem]" : "rounded-none",
				containerClassName,
				isSelected &&
					"ring-4 ring-sage ring-offset-4 dark:ring-offset-zinc-950 scale-[0.98]",
			)}
			style={isGuest ? { aspectRatio } : undefined}
			onClick={handleContainerClick}
			onDoubleClick={handleDoubleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => {
				setIsHovered(false);
				setMenuOpen(false);
			}}
		>
			<img
				src={image.url}
				alt={image.alt}
				loading="lazy"
				className={cn(
					"absolute inset-0 w-full h-full object-cover transition-transform duration-700 z-10 pointer-events-none",
					isHovered && "scale-105",
					className,
					isSelected && "opacity-80",
				)}
			/>

			{/* Pinterest-style Hover Overlay */}
			<div 
				className="absolute inset-0 bg-black/10 dark:bg-black/20 transition-opacity duration-300 pointer-events-none z-20"
				style={{ 
					opacity: isHovered ? 1 : 0,
					visibility: isHovered ? 'visible' : 'hidden'
				}}
			/>

			{/* Heart Pop Animation */}
			{isHeartPopping && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
					<Heart className="w-20 h-20 text-white fill-white animate-ping opacity-75" />
					<Heart className="absolute w-16 h-16 text-white fill-white animate-in zoom-in duration-300" />
				</div>
			)}

			{/* Admin Controls (Top) */}
			{isAdmin && (
				<div className="absolute top-3 left-3 right-3 flex justify-between items-start z-40">
					{/* Selection Toggle */}
					<div
						className="transition-all duration-300 transform"
						style={{ 
							opacity: (selectionMode || isSelected || isHovered) ? 1 : 0,
							visibility: (selectionMode || isSelected || isHovered) ? 'visible' : 'hidden',
							transform: (selectionMode || isSelected || isHovered) ? 'scale(1)' : 'scale(0.5)'
						}}
					>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onToggleSelect?.(image.id);
							}}
							className={cn(
								"w-9 h-9 rounded-xl flex items-center justify-center transition-all border shadow-lg backdrop-blur-md active:scale-90 cursor-pointer",
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

					{/* More Menu */}
					{!shared && !selectionMode && (
						<div 
							className="relative transition-all duration-300"
							style={{ 
								opacity: isHovered ? 1 : 0,
								visibility: isHovered ? 'visible' : 'hidden'
							}}
						>
							<button
								type="button"
								className="p-2.5 bg-white/90 dark:bg-black/60 text-zinc-950 dark:text-white rounded-xl transition-all duration-300 hover:bg-white dark:hover:bg-black shadow-xl backdrop-blur-md border border-white/60 dark:border-white/20 active:scale-90 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(!menuOpen);
								}}
							>
								<MoreHorizontal size={20} />
							</button>
							{menuOpen && (
								<div
									className="absolute right-0 top-full mt-2 w-max min-w-44 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 py-2 z-[100] animate-in fade-in slide-in-from-top-2"
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
												"w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 cursor-pointer",
												isCover && "text-sage font-bold bg-sage/5",
											)}
										>
											<ImageIcon size={14} />
											{isCover ? "Remove Cover" : "Set as Cover"}
										</button>
									)}
									<button
										type="button"
										onClick={handleDownloadClick}
										className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 cursor-pointer"
									>
										<Download size={14} />
										Download
									</button>
									{onDelete && (
										<button
											type="button"
											onClick={() => {
												onDelete(image.id);
												setMenuOpen(false);
											}}
											className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 cursor-pointer"
										>
											<Trash2 size={14} />
											Delete
										</button>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			)}

			{/* Guest Controls (Bottom) */}
			{isGuest && (
				<div 
					className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-40 transition-all duration-300"
					style={{ 
						opacity: isHovered ? 1 : 0,
						visibility: isHovered ? 'visible' : 'hidden',
						pointerEvents: isHovered ? 'auto' : 'none',
						transform: isHovered ? 'translateY(0)' : 'translateY(8px)'
					}}
				>
					{onReaction ? (
						<button
							type="button"
							onClick={handleReactionClick}
							className={cn(
								"flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-white rounded-full transition-all duration-300 shadow-xl border border-white/40 dark:border-white/20 active:scale-95 group/heart cursor-pointer",
								reactionCount > 0 && "text-rose-500",
							)}
						>
							<Heart
								size={16}
								className={cn(
									"transition-colors duration-300",
									reactionCount > 0
										? "fill-rose-500 text-rose-500"
										: "text-zinc-400 hover:text-rose-500",
								)}
							/>
							{reactionCount > 0 && (
								<span className="text-xs font-black tracking-tight">
									{reactionCount}
								</span>
							)}
						</button>
					) : (
						<div />
					)}

					<button
						type="button"
						onClick={handleDownloadClick}
						className="p-2 bg-white/90 dark:bg-zinc-900/90 text-zinc-600 dark:text-zinc-300 rounded-full shadow-xl border border-white/40 dark:border-white/20 active:scale-90 cursor-pointer"
					>
						<Download size={16} />
					</button>
				</div>
			)}

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
