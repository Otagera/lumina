import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import toast from "react-hot-toast";

interface HighlightPhoto {
	imageId: string;
	imagePath: string;
	reactionCount: number;
}

interface Props {
	photos: HighlightPhoto[];
	albumToken: string;
	onClose: () => void;
}

export function HighlightsCarousel({ photos, albumToken, onClose }: Props) {
	const [idx, setIdx] = useState(0);
	const [isDownloading, setIsDownloading] = useState(false);

	const prev = useCallback(() => setIdx((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
	const next = useCallback(() => setIdx((i) => (i + 1) % photos.length), [photos.length]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "ArrowLeft") prev();
			else if (e.key === "ArrowRight") next();
			else if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [prev, next, onClose]);

	const handleDownload = async () => {
		if (isDownloading || photos.length === 0) return;
		setIsDownloading(true);
		const toastId = toast.loading("Preparing highlights download...");
		try {
			const res = await fetch(`/api/v1/public/albums/${albumToken}/download`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageIds: photos.map((p) => p.imageId) }),
			});
			const json = await res.json();
			const urls: Array<{ imageId: string; url: string }> = json?.data?.urls ?? [];

			const zip = new JSZip();
			await Promise.all(
				urls.map(async ({ imageId, url }) => {
					const blob = await fetch(url).then((r) => r.blob());
					const ext = blob.type.includes("png") ? "png" : "jpg";
					zip.file(`highlight-${imageId}.${ext}`, blob);
				}),
			);
			const content = await zip.generateAsync({ type: "blob" });
			const link = document.createElement("a");
			link.href = URL.createObjectURL(content);
			link.download = "highlights.zip";
			link.click();
			URL.revokeObjectURL(link.href);
			toast.success("Download ready!", { id: toastId });
		} catch {
			toast.error("Download failed.", { id: toastId });
		} finally {
			setIsDownloading(false);
		}
	};

	if (photos.length === 0) return null;

	const current = photos[idx];

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
			<div className="absolute top-4 right-4 flex items-center gap-2 z-10">
				<button
					type="button"
					onClick={handleDownload}
					disabled={isDownloading}
					className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-50"
					title="Download highlights"
				>
					<Download size={18} />
				</button>
				<button
					type="button"
					onClick={onClose}
					className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
					title="Close"
				>
					<X size={18} />
				</button>
			</div>

			<div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold z-10">
				{idx + 1} / {photos.length}
			</div>

			<div className="relative w-full max-w-3xl h-full flex items-center justify-center px-16">
				<img
					key={current.imageId}
					src={current.imagePath}
					alt=""
					className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
				/>

				{photos.length > 1 && (
					<>
						<button
							type="button"
							onClick={prev}
							className="absolute left-2 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
						>
							<ChevronLeft size={24} />
						</button>
						<button
							type="button"
							onClick={next}
							className="absolute right-2 p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
						>
							<ChevronRight size={24} />
						</button>
					</>
				)}
			</div>

			<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
				{photos.map((_, i) => (
					<button
						key={i}
						type="button"
						onClick={() => setIdx(i)}
						className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-4" : "bg-white/40"}`}
					/>
				))}
			</div>
		</div>
	);
}
