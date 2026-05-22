import { Heart } from "lucide-react";

const SAMPLE_IMG =
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=600";

const TILE_WRAP =
	"relative w-full aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-800 group cursor-pointer";

const Img = () => (
	<img
		src={SAMPLE_IMG}
		alt=""
		loading="lazy"
		className="absolute inset-0 w-full h-full object-cover"
	/>
);

const HoverDim = () => (
	<div className="absolute inset-0 bg-black/10 dark:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
);

// A — Current: bottom-left pill with heart + count, opacity-revealed on hover
export function HeartBottomLeftPill({ count = 7 }: { count?: number }) {
	return (
		<div className={TILE_WRAP}>
			<Img />
			<HoverDim />
			<button
				type="button"
				aria-label="React"
				className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/85 dark:bg-zinc-900/85 text-zinc-900 dark:text-white rounded-pill shadow-lg border border-white/40 dark:border-white/20 backdrop-blur-md opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-opacity"
			>
				<Heart size={16} className="fill-rose-500 text-rose-500" />
				<span className="text-xs font-black">{count}</span>
			</button>
		</div>
	);
}

// B — Top-right floating icon. Count appears as a small badge only when > 0.
export function HeartTopRightFloat({ count = 7 }: { count?: number }) {
	return (
		<div className={TILE_WRAP}>
			<Img />
			<HoverDim />
			<button
				type="button"
				aria-label="React"
				className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center bg-white/85 dark:bg-zinc-900/85 rounded-full shadow-lg border border-white/40 dark:border-white/20 backdrop-blur-md transition-transform active:scale-90"
			>
				<Heart size={18} className="fill-rose-500 text-rose-500" />
				{count > 0 && (
					<span className="absolute -bottom-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
						{count}
					</span>
				)}
			</button>
		</div>
	);
}

// C — Full-width gradient footer with heart + count anchored bottom-right.
export function HeartGradientFooter({ count = 7 }: { count?: number }) {
	return (
		<div className={TILE_WRAP}>
			<Img />
			<HoverDim />
			<div className="absolute inset-x-0 bottom-0 z-20 h-16 bg-linear-to-t from-black/60 to-transparent flex items-end justify-end p-3 pointer-events-none">
				<button
					type="button"
					aria-label="React"
					className="pointer-events-auto flex items-center gap-1.5 text-white"
				>
					<Heart size={20} className="fill-white text-white drop-shadow-md" />
					<span className="text-sm font-black drop-shadow-md">{count}</span>
				</button>
			</div>
		</div>
	);
}

// D — Outside the tile. Count chip below in a small action row.
export function HeartOutsideAction({ count = 7 }: { count?: number }) {
	return (
		<div className="space-y-2">
			<div className={TILE_WRAP}>
				<Img />
				<HoverDim />
			</div>
			<div className="flex items-center justify-between px-1">
				<button
					type="button"
					aria-label="React"
					className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-200 hover:text-rose-500 transition-colors"
				>
					<Heart size={18} className="fill-rose-500 text-rose-500" />
					<span className="text-xs font-bold">{count}</span>
				</button>
				<span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
					Tap to react
				</span>
			</div>
		</div>
	);
}
