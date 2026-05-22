import { Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const SAMPLE_AVATARS = [
	"https://images.pexels.com/photos/3765147/pexels-photo-3765147.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/19379638/pexels-photo-19379638.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/5272402/pexels-photo-5272402.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/29387556/pexels-photo-29387556.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/6457556/pexels-photo-6457556.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/29292086/pexels-photo-29292086.jpeg?auto=compress&cs=tinysrgb&w=120",
];

const SAMPLE_PHOTO =
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=600";

// A — Face strip: avatar cluster + caption. Requires public guest-avatar endpoint.
export function FaceStripVariant({ count = 27 }: { count?: number }) {
	return (
		<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4">
			<div className="flex -space-x-2 shrink-0">
				{SAMPLE_AVATARS.slice(0, 5).map((src, i) => (
					<img
						key={src}
						src={src}
						alt=""
						loading="lazy"
						className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
						style={{ zIndex: 5 - i }}
					/>
				))}
				<div className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-black flex items-center justify-center">
					+{count - 5}
				</div>
			</div>
			<div className="min-w-0">
				<p className="font-black text-zinc-900 dark:text-white text-sm">
					{count} people found themselves
				</p>
				<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
					Real guests · last 24h on the sample event
				</p>
			</div>
		</div>
	);
}

// B — Confidence badge: pill overlay on a photo. Already returned by face search.
export function ConfidenceBadgeVariant({ score = 0.98 }: { score?: number }) {
	const pct = Math.round(score * 100);
	return (
		<div className="relative w-full aspect-3/4 rounded-tile overflow-hidden border border-zinc-200 dark:border-zinc-800">
			<img
				src={SAMPLE_PHOTO}
				alt=""
				className="absolute inset-0 w-full h-full object-cover"
			/>
			<div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-pill border border-white/40 dark:border-white/10 shadow-lg">
				<Sparkles className="w-3 h-3 text-sage" aria-hidden />
				<span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white tabular-nums">
					{pct}% match
				</span>
			</div>
		</div>
	);
}

// C — Live counter: count-up animation. Requires aggregate endpoint or websocket.
export function LiveCounterVariant({ target = 47 }: { target?: number }) {
	const [count, setCount] = useState(0);
	useEffect(() => {
		const start = Date.now();
		const duration = 1200;
		const tick = () => {
			const elapsed = Date.now() - start;
			const progress = Math.min(elapsed / duration, 1);
			setCount(Math.round(progress * target));
			if (progress < 1) requestAnimationFrame(tick);
		};
		tick();
	}, [target]);

	return (
		<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center gap-4">
			<div className="p-3 bg-sage/10 rounded-control shrink-0">
				<TrendingUp className="w-5 h-5 text-sage" aria-hidden />
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline gap-2">
					<span className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">
						{count}
					</span>
					<span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
						matches in the last hour
					</span>
				</div>
				<div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
					<div
						className="h-full bg-sage transition-[width] duration-1000 ease-out"
						style={{ width: `${(count / target) * 100}%` }}
					/>
				</div>
			</div>
		</div>
	);
}

// D — Combined: face strip + live counter + photo grid w/ confidence badges
export function HiFiCombinedVariant() {
	return (
		<div className="space-y-4">
			<div className="grid gap-4 sm:grid-cols-2">
				<FaceStripVariant />
				<LiveCounterVariant />
			</div>
			<div className="grid grid-cols-3 gap-3">
				{[0.99, 0.94, 0.87].map((s, i) => (
					<div
						key={s}
						className={`relative rounded-card overflow-hidden border border-zinc-200 dark:border-zinc-800 ${i === 0 ? "row-span-2 col-span-2 aspect-4/3" : "aspect-square"}`}
					>
						<img
							src={SAMPLE_PHOTO}
							alt=""
							className="absolute inset-0 w-full h-full object-cover"
						/>
						<div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-pill border border-white/40 dark:border-white/10 shadow">
							<Sparkles className="w-2.5 h-2.5 text-sage" aria-hidden />
							<span className="text-[9px] font-black uppercase tracking-widest text-zinc-900 dark:text-white tabular-nums">
								{Math.round(s * 100)}%
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
