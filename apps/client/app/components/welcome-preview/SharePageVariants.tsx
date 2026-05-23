import { ArrowRight, Camera, Download, QrCode, Sparkles } from "lucide-react";

const COVER =
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=1200";
const PHOTOS = [
	"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/7114417/pexels-photo-7114417.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&q=60",
];

// A — Current: plain header bar above a flat photo grid. Recap of today's look.
export function SharePageCurrent() {
	return (
		<div className="rounded-card border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
			<div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
				<div>
					<p className="text-xs font-bold text-zinc-500">Sample event</p>
					<h3 className="text-lg font-black text-zinc-900 dark:text-white">
						Maya &amp; Jordan
					</h3>
				</div>
				<button
					type="button"
					className="px-3 py-2 text-xs font-bold bg-sage text-zinc-950 rounded-control"
				>
					Find me
				</button>
			</div>
			<div className="grid grid-cols-3 gap-1 p-1">
				{PHOTOS.map((src) => (
					<div key={src} className="aspect-square overflow-hidden">
						<img
							src={src}
							alt=""
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

// B — Glass hero + grid: top hero card mirrors LivePreview, grid stays standard
export function SharePageGlassHero() {
	return (
		<div className="space-y-6">
			<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
				<div className="space-y-3">
					<p className="text-[10px] font-black uppercase tracking-widest text-terracotta">
						Public event · open to all guests
					</p>
					<h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
						Maya &amp; Jordan's wedding
					</h3>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						247 photos · 38 guests have already found themselves
					</p>
					<div className="flex flex-wrap gap-2 pt-2">
						<button
							type="button"
							className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-sage text-zinc-950 rounded-control"
						>
							<Camera className="w-3.5 h-3.5" /> Find photos of me
						</button>
						<button
							type="button"
							className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200"
						>
							<Download className="w-3.5 h-3.5" /> Download all
						</button>
					</div>
				</div>
				<div className="w-24 h-24 rounded-control bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mx-auto md:mx-0">
					<QrCode className="w-12 h-12 text-white dark:text-zinc-900" />
				</div>
			</div>
			<div className="grid grid-cols-3 gap-2">
				{PHOTOS.map((src) => (
					<div
						key={src}
						className="aspect-square rounded-card overflow-hidden"
					>
						<img
							src={src}
							alt=""
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				))}
			</div>
		</div>
	);
}

// C — Magazine: full-bleed cover image with overlay text + floating glass action card
export function SharePageMagazine() {
	return (
		<div className="space-y-6">
			<div className="relative rounded-tile overflow-hidden aspect-video border border-zinc-200 dark:border-zinc-800">
				<img
					src={COVER}
					alt=""
					className="absolute inset-0 w-full h-full object-cover"
				/>
				<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
				<div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex items-end justify-between gap-4">
					<div>
						<p className="text-[10px] font-black uppercase tracking-widest text-white/70">
							Sample event
						</p>
						<h3 className="text-2xl md:text-4xl font-black tracking-tight text-white mt-1">
							Maya &amp; Jordan
						</h3>
						<p className="text-xs md:text-sm text-white/80 mt-1">
							247 photos · 38 guests matched
						</p>
					</div>
					<button
						type="button"
						className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white text-zinc-950 rounded-control shrink-0"
					>
						<Sparkles className="w-3.5 h-3.5" /> Find me
						<ArrowRight className="w-3.5 h-3.5" />
					</button>
				</div>
			</div>
			<div className="rounded-card bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between sm:hidden">
				<p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
					Find photos of yourself
				</p>
				<button
					type="button"
					className="px-3 py-2 text-xs font-bold bg-sage text-zinc-950 rounded-control"
				>
					Start
				</button>
			</div>
			<div className="grid grid-cols-3 gap-2">
				{PHOTOS.map((src) => (
					<div
						key={src}
						className="aspect-square rounded-card overflow-hidden"
					>
						<img
							src={src}
							alt=""
							className="w-full h-full object-cover"
							loading="lazy"
						/>
					</div>
				))}
			</div>
		</div>
	);
}
