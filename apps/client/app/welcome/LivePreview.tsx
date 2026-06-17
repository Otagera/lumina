import { useQuery } from "@tanstack/react-query";
import { ArrowRight, QrCode, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";
import type { AlbumImage } from "~/types";
import { fetchSharedAlbum } from "~/utils/api";

interface LivePreviewProps {
	demoToken?: string;
}

const SAMPLE_GUEST_AVATARS = [
	"https://images.pexels.com/photos/3765147/pexels-photo-3765147.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/19379638/pexels-photo-19379638.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/5272402/pexels-photo-5272402.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/29387556/pexels-photo-29387556.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/6457556/pexels-photo-6457556.jpeg?auto=compress&cs=tinysrgb&w=120",
];

const useCountUp = (target: number, duration = 1200) => {
	const [count, setCount] = useState(0);
	useEffect(() => {
		if (target <= 0) {
			setCount(0);
			return;
		}
		const start = Date.now();
		let raf = 0;
		const tick = () => {
			const elapsed = Date.now() - start;
			const progress = Math.min(elapsed / duration, 1);
			setCount(Math.round(progress * target));
			if (progress < 1) raf = requestAnimationFrame(tick);
		};
		tick();
		return () => cancelAnimationFrame(raf);
	}, [target, duration]);
	return count;
};

export const LivePreview = ({ demoToken = "demo" }: LivePreviewProps) => {
	const { data: albumResponse, isLoading } = useQuery({
		queryKey: ["shared-album", demoToken],
		queryFn: () => fetchSharedAlbum(demoToken),
		staleTime: 1000 * 60 * 5,
	});

	const album = albumResponse?.data;
	const demoHref = `/share/${demoToken}`;
	const images: AlbumImage[] = album?.images ?? [];
	const photoCount = images.length;
	const coverPhotos = images.slice(0, 3);
	const albumName = album?.albumName ?? "Sample event";
	const totalFaces = images.reduce(
		(sum, img) => sum + (img.faces?.length ?? 0),
		0,
	);
	const facesCount = useCountUp(totalFaces);
	const guestCount = Math.max(SAMPLE_GUEST_AVATARS.length + 22, 0);

	return (
		<section className="relative">
			<div className="max-w-5xl mx-auto space-y-8">
				<div className="space-y-3 text-center">
					<p className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta">
						Sample event · Try the demo
					</p>
					<h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
						See what your guests will experience.
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
						A real, public album running on the same API your guests use. Open
						it on your phone to see the guest flow end-to-end.
					</p>
				</div>
				<div className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6 md:p-8 grid gap-8 md:grid-cols-[1.1fr_1fr]">
					<div className="space-y-6">
						<div className="flex items-center gap-4">
							<div className="w-20 h-20 rounded-control bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
								<QrCode className="w-10 h-10 text-white dark:text-zinc-900" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
									Public sample album
								</p>
								<p className="font-black text-zinc-900 dark:text-white text-lg mt-1">
									{isLoading ? (
										<span className="inline-block h-5 w-40 rounded-control bg-zinc-200 dark:bg-zinc-800 animate-pulse align-middle" />
									) : (
										albumName
									)}
								</p>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
									{photoCount > 0
										? `${photoCount} photos available`
										: "Open to browse photos"}
								</p>
							</div>
						</div>
						<ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
							<li className="flex items-start gap-2">
								<span className="text-sage mt-0.5">·</span>
								<span>Scan a QR or open the link on any phone</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-sage mt-0.5">·</span>
								<span>Take a selfie — we find every photo of you</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-sage mt-0.5">·</span>
								<span>Download originals, no account required</span>
							</li>
							<li className="flex items-start gap-2">
								<span className="text-sage mt-0.5">·</span>
								<span>Customize your album's look with themes</span>
							</li>
						</ul>
						<Button asChild className="font-bold w-full sm:w-auto">
							<Link to={demoHref}>
								Open the sample event <ArrowRight className="h-4 w-4 ml-1.5" />
							</Link>
						</Button>
					</div>
					<div className="grid grid-cols-3 gap-2">
						{(coverPhotos.length > 0
							? coverPhotos.map((img) => ({
								src: img.imagePath,
								key: img.imageId,
							}))
							: [1, 2, 3].map((n) => ({
								src: undefined as string | undefined,
								key: `skeleton-${n}`,
							}))
						).map((p, i) => (
							<div
								key={p.key}
								className={`rounded-card overflow-hidden relative ${i === 0 ? "row-span-2 col-span-2" : "aspect-square"} bg-zinc-200 dark:bg-zinc-800`}
							>
								{p.src ? (
									<img
										src={p.src}
										alt=""
										loading="lazy"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full animate-pulse" />
								)}
							</div>
						))}
					</div>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4">
						<div className="flex -space-x-2 shrink-0" aria-hidden>
							{SAMPLE_GUEST_AVATARS.map((src, i) => (
								<img
									key={src}
									src={src}
									alt=""
									loading="lazy"
									className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
									style={{ zIndex: SAMPLE_GUEST_AVATARS.length - i }}
								/>
							))}
							<div className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center">
								+{guestCount - SAMPLE_GUEST_AVATARS.length}
							</div>
						</div>
						<div className="min-w-0">
							<p className="font-black text-zinc-900 dark:text-white text-sm">
								Sample guests on this album
							</p>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
								Illustrative · your own events stay private
							</p>
						</div>
					</div>
					<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4">
						<div className="p-3 bg-sage/10 rounded-control shrink-0">
							<TrendingUp className="w-5 h-5 text-sage" aria-hidden />
						</div>
						<div className="min-w-0 flex-1">
							<div className="flex items-baseline gap-2">
								<span className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">
									{isLoading ? "—" : facesCount}
								</span>
								<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
									faces detected by Anoda
								</span>
							</div>
							<div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
								<div
									className="h-full bg-sage transition-[width] duration-1000 ease-out"
									style={{
										width: totalFaces > 0 ? `${(facesCount / totalFaces) * 100}%` : "0%",
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				<p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 text-center">
					<Sparkles className="w-3 h-3 text-sage shrink-0" aria-hidden />
					<span>
						Your own events are private by default — only people you share
						with can view or search them.
					</span>
				</p>
			</div>
		</section>
	);
};

export default LivePreview;
