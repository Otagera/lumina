import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { X, ArrowLeft } from "lucide-react";
import { useSharedAlbum } from "~/hooks/share/useSharedAlbum";
import { useLiveAlbum } from "~/hooks/share/useLiveAlbum";

const Slideshow = () => {
	const { token } = useParams<{ token: string }>();
	const { album, isLoading, isError } = useSharedAlbum(token, { refetchInterval: 30_000 });
	const { reactions } = useLiveAlbum(album?.id);
	const [focused, setFocused] = useState<string | null>(null);

	const images = useMemo(() => album?.images || [], [album]);

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white/40" />
			</div>
		);
	}

	if (isError || !album) {
		return (
			<div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-4 text-white">
				<p className="text-zinc-400 text-sm">Album not found or unavailable.</p>
				<Link to="/" className="text-xs underline text-zinc-500 hover:text-white">Go home</Link>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-zinc-950 overflow-auto">
			{/* Header */}
			<div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
				<div className="flex items-center gap-3">
					<Link
						to={`/share/${token}`}
						className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
						aria-label="Back to album"
					>
						<ArrowLeft className="w-5 h-5" />
					</Link>
					<div>
						<p className="text-white font-bold text-sm leading-tight">{album.albumName}</p>
						<p className="text-zinc-500 text-[11px]">{images.length} photos · live</p>
					</div>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
					<span className="text-zinc-400 text-[11px] font-medium">Party Mode</span>
				</div>
			</div>

			{/* Masonry-style grid */}
			<div className="columns-2 sm:columns-3 md:columns-4 gap-1 p-1">
				{images.map((image: any) => {
					const liveCount = reactions[image.imageId] ?? image.reactionCount ?? 0;
					return (
						<div
							key={image.imageId}
							className="relative break-inside-avoid mb-1 group cursor-pointer"
							onClick={() => setFocused(image.imageId)}
						>
							<img
								src={image.imagePath}
								alt=""
								loading="lazy"
								className="w-full h-auto object-cover rounded-sm"
							/>
							{liveCount > 0 && (
								<div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-white text-[10px] font-bold">
									♥ {liveCount}
								</div>
							)}
						</div>
					);
				})}
			</div>

			{images.length === 0 && (
				<div className="flex items-center justify-center h-[60vh]">
					<p className="text-zinc-600 text-sm">Waiting for photos…</p>
				</div>
			)}

			{/* Lightbox */}
			{focused && (
				<div
					className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
					onClick={() => setFocused(null)}
				>
					<button
						type="button"
						className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
						onClick={() => setFocused(null)}
						aria-label="Close"
					>
						<X className="w-6 h-6" />
					</button>
					{(() => {
						const img = images.find((i: any) => i.imageId === focused);
						return img ? (
							<img
								src={img.imagePath}
								alt=""
								className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
								onClick={(e) => e.stopPropagation()}
							/>
						) : null;
					})()}
				</div>
			)}
		</div>
	);
};

export default Slideshow;
