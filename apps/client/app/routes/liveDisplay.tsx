import { Grid2x2, Monitor, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosAPI from "~/utils/axios";
import { useLiveAlbum } from "../hooks/share/useLiveAlbum";
import type { AlbumImage } from "~/types";

type DisplayMode = "slideshow" | "grid";

function LiveSlideshow({ images }: { images: AlbumImage[] }) {
	const [idx, setIdx] = useState(0);

	useEffect(() => {
		if (images.length < 2) return;
		const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 4000);
		return () => clearInterval(t);
	}, [images.length]);

	if (images.length === 0) {
		return (
			<div className="flex items-center justify-center h-full text-white/40 text-lg font-bold">
				Waiting for photos...
			</div>
		);
	}

	return (
		<div className="relative w-full h-full">
			{images.map((img, i) => (
				<div
					key={img.imageId}
					className="absolute inset-0 transition-opacity duration-1000"
					style={{ opacity: i === idx % images.length ? 1 : 0 }}
				>
					<img
						src={img.imagePath}
						alt=""
						className="w-full h-full object-contain"
					/>
				</div>
			))}
		</div>
	);
}

function LiveGrid({ images }: { images: AlbumImage[] }) {
	if (images.length === 0) {
		return (
			<div className="flex items-center justify-center h-full text-white/40 text-lg font-bold">
				Waiting for photos...
			</div>
		);
	}

	return (
		<div className="w-full h-full overflow-hidden p-2 columns-2 sm:columns-3 md:columns-4 gap-2">
			{images.map((img) => (
				<div key={img.imageId} className="mb-2 break-inside-avoid rounded-lg overflow-hidden">
					<img src={img.imagePath} alt="" className="w-full" />
				</div>
			))}
		</div>
	);
}

export default function LiveDisplay() {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const [mode, setMode] = useState<DisplayMode>("slideshow");
	const [baseImages, setBaseImages] = useState<AlbumImage[]>([]);
	const [albumId, setAlbumId] = useState<string | undefined>();

	useEffect(() => {
		if (!token) return;
		(async () => {
			try {
				const res = await axiosAPI.get(`/public/albums/${token}`);
				const album = res?.data?.data;
				if (album) {
					setAlbumId(album.id);
					setBaseImages((album.images ?? []).filter((img: AlbumImage) => img.status === "APPROVED" || !img.status));
				}
			} catch (_e) {}
		})();
	}, [token]);

	const { newImages } = useLiveAlbum(albumId);

	const allImages = [...newImages, ...baseImages];

	return (
		<div className="fixed inset-0 bg-black z-50 flex flex-col">
			<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
				<button
					type="button"
					onClick={() => setMode((m) => (m === "slideshow" ? "grid" : "slideshow"))}
					className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
					title={mode === "slideshow" ? "Switch to grid" : "Switch to slideshow"}
				>
					{mode === "slideshow" ? <Grid2x2 size={18} /> : <Monitor size={18} />}
				</button>
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
					title="Exit"
				>
					<X size={18} />
				</button>
			</div>

			<div className="flex-1 overflow-hidden">
				{mode === "slideshow" ? (
					<LiveSlideshow images={allImages} />
				) : (
					<LiveGrid images={allImages} />
				)}
			</div>
		</div>
	);
}
