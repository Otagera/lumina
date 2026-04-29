import { Calendar, Info, User } from "lucide-react";
import { cn } from "~/utils/cn";

interface ModerationGridItemProps {
	image: {
		width: number;
		height: number;
		url: string;
		alt: string;
		id: string;
		uploadDate?: string;
		user?: {
			email: string;
		};
	};
	isSelected?: boolean;
	onToggleSelect?: (imageId: string) => void;
	onClick?: (e: React.MouseEvent) => void;
}

const ModerationGridItem = ({
	image,
	isSelected,
	onToggleSelect,
	onClick,
}: ModerationGridItemProps) => {
	const formattedDate = image.uploadDate
		? new Date(image.uploadDate).toLocaleString()
		: "Unknown date";

	return (
		<div
			className={cn(
				"relative group overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800 transition-all duration-500 h-full",
				isSelected
					? "ring-4 ring-sage ring-offset-4 dark:ring-offset-zinc-950 scale-[0.98] shadow-2xl shadow-sage/20"
					: "hover:shadow-2xl hover:shadow-sage/10",
			)}
		>
			<img
				src={image.url}
				alt={image.alt}
				loading="lazy"
				className={cn(
					"w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
					isSelected ? "opacity-80" : "",
				)}
				onClick={(e) => {
					if (onClick) onClick(e);
				}}
			/>

			{/* Info Overlay (Always visible or on hover) */}
			<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 text-white/90 text-[10px] font-medium">
						<User size={12} className="text-sage" />
						<span className="truncate">{image.user?.email || "Guest"}</span>
					</div>
					<div className="flex items-center gap-2 text-white/70 text-[10px]">
						<Calendar size={12} />
						<span>{formattedDate}</span>
					</div>
				</div>
			</div>

			{/* Selection Checkbox Overlay */}
			<div
				className={cn(
					"absolute top-4 left-4 transition-all duration-300",
					isSelected
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
		</div>
	);
};

export default ModerationGridItem;
