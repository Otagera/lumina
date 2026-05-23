import { ArrowUpRight, Camera, ImageIcon, Users } from "lucide-react";

// Mock "album row" data used as the carrier for each surface treatment.
const STATS = [
	{ icon: ImageIcon, label: "Photos", value: "247" },
	{ icon: Users, label: "Guests", value: "38" },
	{ icon: Camera, label: "Selfies", value: "112" },
];

function CardBody() {
	return (
		<>
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-[10px] font-black uppercase tracking-widest text-terracotta">
						Active event
					</p>
					<h3 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white mt-1">
						Maya &amp; Jordan's wedding
					</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
						Last upload 2h ago · 38 guests scanned
					</p>
				</div>
				<button
					type="button"
					aria-label="Open event"
					className="p-2 rounded-control text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
				>
					<ArrowUpRight className="w-4 h-4" />
				</button>
			</div>
			<div className="grid grid-cols-3 gap-3 mt-5">
				{STATS.map(({ icon: Icon, label, value }) => (
					<div key={label} className="text-left">
						<div className="flex items-center gap-1.5 text-zinc-400">
							<Icon className="w-3.5 h-3.5" aria-hidden />
							<p className="text-[10px] font-black uppercase tracking-widest">
								{label}
							</p>
						</div>
						<p className="text-2xl font-black text-zinc-900 dark:text-white mt-1 tabular-nums">
							{value}
						</p>
					</div>
				))}
			</div>
		</>
	);
}

// A — Current baseline: solid white card, soft shadow, hard border
export function SurfaceSolidCard() {
	return (
		<div className="rounded-card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
			<CardBody />
		</div>
	);
}

// B — Glass card: translucent base + backdrop blur (matches LivePreview tile)
export function SurfaceGlassCard() {
	return (
		<div className="rounded-card bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 shadow-sm p-6">
			<CardBody />
		</div>
	);
}

// C — Glass raised: same translucency + elevated shadow + subtle inner highlight
export function SurfaceGlassRaised() {
	return (
		<div className="relative rounded-card bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800/60 p-6 shadow-[0_10px_30px_-5px_rgb(0_0_0/0.12),0_4px_10px_-2px_rgb(0_0_0/0.06)] overflow-hidden">
			<div
				aria-hidden
				className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/60 dark:via-white/10 to-transparent"
			/>
			<CardBody />
		</div>
	);
}

// D — Glass tile (LivePreview parity): rounded-tile, stronger blur, no shadow
export function SurfaceGlassTile() {
	return (
		<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8">
			<CardBody />
		</div>
	);
}
