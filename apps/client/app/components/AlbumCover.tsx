import type { Album } from "~/types";
import { cn } from "~/utils/cn";

interface AlbumCoverProps {
	album: Album;
	className?: string;
}

const AlbumCover = ({ album, className }: AlbumCoverProps) => {
	// The cover image logic is as follows:
	// we need somehthing for when album is undefined (loading state), when album has no images, when album has images but no cover set, and when album has a cover image set
	if (!album) {
		return (
			<div
				className={cn("w-full h-full bg-gray-200 animate-pulse", className)}
			/>
		);
	}
	// 1. Manual Cover Selection (Priority)
	if (album.coverImage?.url) {
		return (
			<img
				src={album.coverImage.url}
				alt={album.albumName}
				className={cn(
					"w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
					className,
				)}
			/>
		);
	}

	const coverImages = album.coverImages || [];

	// 2. Fallback: Grid of 4 images
	if (coverImages.length >= 4) {
		return (
			<div
				className={cn("grid grid-cols-2 grid-rows-2 w-full h-full", className)}
			>
				{coverImages.slice(0, 4).map((src: string, i: number) => (
					<img
						key={src}
						src={src}
						alt={`${album.albumName} cover ${i + 1}`}
						className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				))}
			</div>
		);
	}

	// 3. Fallback: Single image
	if (coverImages.length > 0) {
		return (
			<img
				src={coverImages[0]}
				alt={album.albumName}
				className={cn(
					"w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
					className,
				)}
			/>
		);
	}

	// 4. Fallback: stylized text for empty albums
	const firstLetter = album.albumName
		? album.albumName.charAt(0).toUpperCase()
		: "?";

	const fallbackGradients = [
		"from-sage to-slate-blue",
		"from-terracotta to-plum",
		"from-slate-blue to-terracotta",
		"from-plum to-sage",
	];

	const charCode = (album.albumName || "A").charCodeAt(0);
	const gradient = fallbackGradients[charCode % fallbackGradients.length];

	return (
		<div
			className={cn(
				"w-full h-full flex items-center justify-center bg-gradient-to-br text-white font-black text-6xl transition-transform duration-500 group-hover:scale-105",
				gradient,
				className,
			)}
		>
			{firstLetter}
		</div>
	);
};

export default AlbumCover;
