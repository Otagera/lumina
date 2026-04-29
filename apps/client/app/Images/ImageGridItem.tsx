import type { HTMLAttributes } from "react";
import { cn } from "~/utils/cn";

interface ImageGridItemProps extends HTMLAttributes<HTMLImageElement> {
	image: {
		width: number;
		height: number;
		url: string;
		alt: string;
		id: string;
		status?: string;
	};
	onDelete: (imageId: string) => void;
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
	isSelected,
	onToggleSelect,
	selectionMode,
	containerClassName = "",
	shared = false,
}: ImageGridItemProps) => {
	const isQuotaExceeded = image.status === "QUOTA_EXCEEDED";

	return (
		<div
			className={cn(
				"relative group overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800 transition-all duration-500 h-full",
				containerClassName,
				isSelected
					? "ring-4 ring-sage ring-offset-4 dark:ring-offset-zinc-950 scale-[0.98] shadow-2xl shadow-sage/20"
					: "hover:shadow-2xl hover:shadow-sage/10",
				isQuotaExceeded ? "grayscale-[0.5] opacity-90" : "",
			)}
		>
			<img
				src={image.url}
				alt={image.alt}
				loading="lazy"
				className={cn(
					"w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
					className,
					isSelected ? "opacity-80" : "",
				)}
				onClick={(e) => {
					if (selectionMode && onToggleSelect) {
						onToggleSelect(image.id);
					} else if (onClick) {
						onClick(e);
					}
				}}
			/>

			{/* Quota Exceeded Badge */}
			{isQuotaExceeded && (
				<div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
					<div className="bg-white/90 dark:bg-zinc-900/90 px-4 py-2 rounded-2xl shadow-xl border border-white/20 flex items-center gap-2 animate-in zoom-in duration-300">
						<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
						<span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
							Quota Exceeded
						</span>
					</div>
				</div>
			)}

			{/* Selection Checkbox Overlay */}
			<div
				className={cn(
					"absolute top-4 left-4 transition-all duration-300",
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
						"w-8 h-8 rounded-xl flex items-center justify-center transition-all border shadow-lg backdrop-blur-md active:scale-90",
						isSelected
							? "bg-sage border-sage text-zinc-950"
							: "bg-black/20 border-white/20 text-transparent hover:border-white/40",
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

			{/* Delete Button - hide when in selection mode */}
			{!shared && !selectionMode && (
				<button
					type="button"
					className="absolute top-4 right-4 p-2.5 bg-black/40 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-plum shadow-lg backdrop-blur-md border border-white/10 active:scale-90"
					onClick={(e) => {
						e.stopPropagation();
						onDelete(image.id);
					}}
					title="Move to trash"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2.5}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			)}
		</div>
	);
};

export default ImageGridItem;
