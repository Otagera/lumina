import {
	Download,
	Heart,
	ImageIcon,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import type { HTMLAttributes } from "react";
import { useCallback, useEffect, useState } from "react";
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
	const aspectRatio = hasDimensions
		? `${image.width} / ${image.height}`
		: "3 / 4";

	return (
		<div
			className={cn(
				"group relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-sm transition-all duration-200 hover:shadow-xl w-full",
				isAdmin ? "h-full rounded-tile cursor-zoom-in" : "rounded-none cursor-pointer",
				containerClassName,
				isSelected && "outline-2 outline-sage -outline-offset-2",
			)}
			style={{ aspectRatio }}
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
					"absolute inset-0 w-full h-full object-cover z-10 pointer-events-none",
					className,
					isSelected && "opacity-80",
				)}
			/>

			{/* Hover overlay — gated by Tailwind hover variant (hover-capable devices only) */}
			<div className="absolute inset-0 bg-black/10 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20" />

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
							opacity: selectionMode || isSelected || isHovered ? 1 : 0,
							visibility:
								selectionMode || isSelected || isHovered ? "visible" : "hidden",
							transform:
								selectionMode || isSelected || isHovered
									? "scale(1)"
									: "scale(0.5)",
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

					{/* More Menu — always tappable on touch; fades in on hover for desktop */}
					{!shared && !selectionMode && (
						<div
							className={cn(
								"relative transition-opacity duration-200",
								menuOpen ? "opacity-100" : "opacity-60 group-hover:opacity-100",
							)}
						>
							<button
								type="button"
								className="p-2.5 bg-white/90 dark:bg-black/60 text-zinc-950 dark:text-white rounded-control transition-colors duration-200 hover:bg-white dark:hover:bg-black shadow-xl backdrop-blur-md border border-white/60 dark:border-white/20 active:scale-90 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									setMenuOpen(!menuOpen);
								}}
							>
								<MoreHorizontal size={20} />
							</button>
							{menuOpen && (
								<div
									className="absolute right-0 top-full mt-2 w-max min-w-44 bg-white dark:bg-zinc-800 rounded-card shadow-2xl border border-zinc-200 dark:border-zinc-700 py-2 z-100 animate-in fade-in slide-in-from-top-2"
									onClick={(e) => e.stopPropagation()}
								>
									{onSetCover && (
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
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
											onClick={(e) => {
												e.stopPropagation();
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

			{/* Guest Controls — Gradient footer + bottom-right heart button */}
			{isGuest && onReaction && (
				<>
					<div
						className={cn(
							"absolute inset-x-0 bottom-0 z-30 h-20 bg-linear-to-t from-black/70 via-black/30 to-transparent pointer-events-none transition-opacity duration-200",
							reactionCount > 0
								? "opacity-100"
								: "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
						)}
					/>
					<button
						type="button"
						onClick={handleReactionClick}
						aria-label={
							reactionCount > 0
								? `Reacted (${reactionCount})`
								: "React to photo"
						}
						className={cn(
							"absolute bottom-3 right-3 z-40 flex items-center gap-1.5 text-white active:scale-90 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 rounded-pill p-1",
							reactionCount > 0
								? "opacity-100"
								: "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
						)}
					>
						<Heart
							size={22}
							strokeWidth={2.25}
							className={cn(
								"drop-shadow-lg transition-all duration-200",
								reactionCount > 0
									? "fill-rose-500 text-rose-500"
									: "fill-transparent text-white",
							)}
						/>
						{reactionCount > 0 && (
							<span className="text-sm font-black drop-shadow-lg tabular-nums">
								{reactionCount}
							</span>
						)}
					</button>
				</>
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
