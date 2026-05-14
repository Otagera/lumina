import Masonry from "react-masonry-css";
import { cn } from "@/lib/utils";
import ImageGridItem from "./ImageGridItem";

export interface ImageGridProps {
	images: Array<{
		imageId: string;
		imagePath: string;
		originalSize?: { width: number; height: number };
		status?: string;
	}>;
	selectedIds?: Set<string>;
	onToggleSelect?: (id: string) => void;
	onImageClick?: (image: any) => void;
	onDelete?: (id: string) => void;
	onReaction?: (id: string) => void;
	onDownload?: (id: string) => void;
	reactions?: Record<string, number>;
	className?: string;
	masonry?: boolean;
	variant?: "admin" | "guest";
}

export const ImageGrid = ({
	images,
	selectedIds = new Set(),
	onToggleSelect,
	onImageClick,
	onDelete,
	onReaction,
	onDownload,
	reactions = {},
	className,
	masonry = true,
	variant = "guest",
}: ImageGridProps) => {
	const breakpointColumnsObj = {
		default: 4,
		1100: 3,
		700: 2,
		400: 1,
	};

	const renderItem = (image: any, index: number) => (
		<ImageGridItem
			key={image.imageId}
			image={{
				id: image.imageId,
				width: image.originalSize?.width || 0,
				height: image.originalSize?.height || 0,
				url: image.imagePath,
				alt: image.imagePath,
				status: image.status,
			}}
			isSelected={selectedIds.has(image.imageId)}
			onToggleSelect={onToggleSelect}
			onReaction={onReaction}
			onDownload={onDownload}
			reactionCount={reactions[image.imageId] || 0}
			selectionMode={selectedIds.size > 0}
			onClick={() => {
				console.log("[ImageGrid] Triggering onImageClick for", image.imageId);
				onImageClick?.(image);
			}}
			onDelete={onDelete}
			containerClassName={!masonry ? "aspect-square" : ""}
			variant={variant}
		/>
	);

	if (!masonry) {
		return (
			<div
				className={cn(
					"grid grid-cols-2 md:grid-cols-4 gap-4 w-full auto-rows-fr",
					className,
				)}
			>
				{images?.map((image, index) => (
					<div key={image.imageId} className="relative">
						{renderItem(image, index)}
					</div>
				))}
			</div>
		);
	}

	return (
		<Masonry
			breakpointCols={breakpointColumnsObj}
			className={cn("flex w-auto -ml-0", className)}
			columnClassName="bg-clip-padding pl-0"
		>
			{images.map((image, index) => (
				<div
					key={image.imageId}
					className="animate-in fade-in slide-in-from-bottom-4 duration-500"
					style={{ animationDelay: `${(index % 20) * 50}ms` }}
				>
					{renderItem(image, index)}
				</div>
			))}
		</Masonry>
	);
};
