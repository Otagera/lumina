import {
	AlertTriangle,
	Download,
	Heart,
	Image as ImageIcon,
	Search,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { MainContainer } from "~/components/MainContainer";

type Variant =
	| "glass"
	| "flat"
	| "editorial"
	| "soft"
	| "vibrant"
	| "bento"
	| "outlined"
	| "material";

const VARIANTS: { id: Variant; label: string; tagline: string }[] = [
	{
		id: "glass",
		label: "Glass",
		tagline: "Translucent surfaces, backdrop blur, large radii. Current style.",
	},
	{
		id: "flat",
		label: "Flat",
		tagline: "Linear / Notion. Solid surfaces, small shadows, calm.",
	},
	{
		id: "editorial",
		label: "Editorial",
		tagline: "High contrast, sharp edges, typographic.",
	},
	{
		id: "soft",
		label: "Soft",
		tagline: "Warm paper, rounded-full controls, gentle shadow.",
	},
	{
		id: "vibrant",
		label: "Vibrant",
		tagline: "Gradient primary, sage glow, lively and youthful.",
	},
	{
		id: "bento",
		label: "Bento",
		tagline: "Apple iOS Settings. Grouped panels, no borders, no shadows.",
	},
	{
		id: "outlined",
		label: "Outlined",
		tagline: "Thin borders, transparent fills, minimal chrome.",
	},
	{
		id: "material",
		label: "Material",
		tagline: "Elevated paper, strong drop shadows, colored accents.",
	},
];

const SAMPLE_IMG =
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=600";

export default function StylePreview() {
	const [visible, setVisible] = useState<Record<Variant, boolean>>({
		glass: true,
		flat: true,
		editorial: true,
		soft: true,
		vibrant: true,
		bento: true,
		outlined: true,
		material: true,
	});

	const toggle = (id: Variant) =>
		setVisible((v) => ({ ...v, [id]: !v[id] }));

	const activeCount = Object.values(visible).filter(Boolean).length;
	const gridCols =
		activeCount === 1
			? "grid-cols-1"
			: activeCount === 2
				? "grid-cols-1 md:grid-cols-2"
				: activeCount === 3
					? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
					: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";

	return (
		<MainContainer maxWidth="max-w-[1800px]">
			<header className="mb-10">
				<p className="text-xs font-black uppercase tracking-widest text-sage mb-2">
					Dev only · /style-preview
				</p>
				<h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-3">
					Pick a direction
				</h1>
				<p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
					Same content rendered four ways. Toggle the theme in the navbar to
					see each variant in light and dark. Toggle variants below to compare
					two side-by-side at larger sizes.
				</p>
				<div className="flex flex-wrap gap-2 mt-6">
					{VARIANTS.map((v) => (
						<button
							key={v.id}
							type="button"
							onClick={() => toggle(v.id)}
							className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-colors ${visible[v.id]
								? "bg-sage text-zinc-950 border-sage"
								: "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
								}`}
						>
							{v.label}
						</button>
					))}
				</div>
			</header>

			<div className={`grid gap-6 ${gridCols}`}>
				{VARIANTS.filter((v) => visible[v.id]).map((v) => (
					<VariantColumn key={v.id} variant={v.id} label={v.label} tagline={v.tagline} />
				))}
			</div>
		</MainContainer>
	);
}

function VariantColumn({
	variant,
	label,
	tagline,
}: {
	variant: Variant;
	label: string;
	tagline: string;
}) {
	return (
		<section className="space-y-4">
			<div className="pb-3 border-b-2 border-zinc-200 dark:border-zinc-800">
				<h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
					{label}
				</h2>
				<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
					{tagline}
				</p>
			</div>
			<AlbumCardSample variant={variant} />
			<ButtonRowSample variant={variant} />
			<InputSample variant={variant} />
			<AlertSample variant={variant} />
			<ImageGridSample variant={variant} />
		</section>
	);
}

// ---------- per-variant token maps ----------

const tokens = {
	glass: {
		card: "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-xl rounded-3xl",
		btnPrimary:
			"bg-sage hover:bg-sage/90 text-zinc-950 rounded-2xl shadow-lg shadow-sage/20 font-semibold",
		btnGhost:
			"bg-white/60 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-2xl backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50",
		input:
			"bg-white/80 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-sage/50",
		alert:
			"bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 rounded-2xl backdrop-blur-xl",
		tile: "rounded-2xl overflow-hidden shadow-md",
		badge:
			"bg-sage/10 text-sage rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
	},
	flat: {
		card: "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow rounded-xl",
		btnPrimary:
			"bg-sage hover:bg-sage/90 text-zinc-950 rounded-lg shadow-sm font-medium",
		btnGhost:
			"bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg",
		input:
			"bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-1 focus:ring-sage focus:border-sage",
		alert:
			"bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-lg",
		tile: "rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800",
		badge:
			"bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
	},
	editorial: {
		card: "bg-white dark:bg-zinc-950 border-2 border-zinc-900 dark:border-zinc-100 rounded-none",
		btnPrimary:
			"bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none border-2 border-zinc-900 dark:border-zinc-100 font-black uppercase tracking-wider",
		btnGhost:
			"bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-none border-2 border-zinc-900 dark:border-zinc-100 font-black uppercase tracking-wider",
		input:
			"bg-transparent border-0 border-b-2 border-zinc-900 dark:border-zinc-100 rounded-none focus:ring-0 focus:border-sage px-0",
		alert:
			"bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 rounded-none",
		tile: "rounded-none border-2 border-zinc-900 dark:border-zinc-100 overflow-hidden",
		badge:
			"bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-none px-2 py-0.5 text-[10px] font-black uppercase tracking-widest",
	},
	soft: {
		card: "bg-stone-50 dark:bg-zinc-900 rounded-[1.75rem] shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.4)]",
		btnPrimary:
			"bg-sage hover:bg-sage/90 text-zinc-950 rounded-full shadow-md font-medium",
		btnGhost:
			"bg-white dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-full shadow-sm",
		input:
			"bg-white dark:bg-zinc-800 border-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:ring-2 focus:ring-sage/40",
		alert:
			"bg-amber-100/70 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 rounded-[1.5rem] border-0 shadow-sm",
		tile: "rounded-[1.25rem] overflow-hidden shadow-md",
		badge:
			"bg-sage/15 text-sage rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
	},
	vibrant: {
		card: "bg-white dark:bg-zinc-900 border border-sage/20 dark:border-sage/30 shadow-lg shadow-sage/10 rounded-2xl hover:shadow-xl hover:shadow-sage/20 transition-shadow",
		btnPrimary:
			"bg-linear-to-br from-sage via-sage to-terracotta text-zinc-950 rounded-xl shadow-lg shadow-sage/40 hover:shadow-xl hover:shadow-sage/50 font-bold transition-all",
		btnGhost:
			"bg-sage/10 hover:bg-sage/20 text-sage dark:text-sage rounded-xl border border-sage/30 font-semibold",
		input:
			"bg-white dark:bg-zinc-900 border-2 border-sage/30 rounded-xl focus:ring-4 focus:ring-sage/20 focus:border-sage transition-all",
		alert:
			"bg-linear-to-r from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 rounded-r-xl",
		tile: "rounded-xl overflow-hidden ring-2 ring-transparent hover:ring-sage transition-all",
		badge:
			"bg-linear-to-r from-sage to-terracotta text-zinc-950 rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm",
	},
	bento: {
		card: "bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden",
		btnPrimary:
			"bg-sage text-zinc-950 rounded-2xl font-semibold active:opacity-80",
		btnGhost:
			"bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl font-medium active:opacity-80",
		input:
			"bg-zinc-200 dark:bg-zinc-800 border-0 rounded-2xl focus:ring-2 focus:ring-sage focus:bg-white dark:focus:bg-zinc-900 transition-colors",
		alert:
			"bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-2xl",
		tile: "rounded-2xl overflow-hidden",
		badge:
			"bg-sage/20 text-sage rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
	},
	outlined: {
		card: "bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-sage dark:hover:border-sage transition-colors",
		btnPrimary:
			"bg-transparent border border-sage text-sage hover:bg-sage hover:text-zinc-950 rounded-md font-medium transition-colors",
		btnGhost:
			"bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md font-medium transition-colors",
		input:
			"bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-md focus:border-sage focus:ring-0 transition-colors",
		alert:
			"bg-transparent border border-amber-500/50 text-amber-700 dark:text-amber-400 rounded-md",
		tile: "rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-700 hover:border-sage transition-colors",
		badge:
			"bg-transparent border border-sage text-sage rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
	},
	material: {
		card: "bg-white dark:bg-zinc-800 rounded-2xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.5),0_2px_4px_-1px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.18),0_4px_8px_-2px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.6),0_4px_8px_-2px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all",
		btnPrimary:
			"bg-sage text-zinc-950 rounded-xl shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 font-semibold transition-all",
		btnGhost:
			"bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.15)] font-medium transition-all",
		input:
			"bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.1)] focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all",
		alert:
			"bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 rounded-xl shadow-[0_4px_12px_-4px_rgba(245,158,11,0.3)]",
		tile: "rounded-xl overflow-hidden shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.25)] hover:-translate-y-0.5 transition-all",
		badge:
			"bg-sage text-zinc-950 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
	},
} as const;

// ---------- sample components ----------

function AlbumCardSample({ variant }: { variant: Variant }) {
	const t = tokens[variant];
	return (
		<article className={`${t.card} p-4 overflow-hidden`}>
			<div className={`${t.tile} aspect-video mb-4`}>
				<img
					src={SAMPLE_IMG}
					alt="Sample event"
					className="w-full h-full object-cover"
				/>
			</div>
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="font-bold text-zinc-900 dark:text-white">
						Summer Wedding 2025
					</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
						312 photos · 47 people
					</p>
				</div>
				<span className={t.badge}>Live</span>
			</div>
		</article>
	);
}

function ButtonRowSample({ variant }: { variant: Variant }) {
	const t = tokens[variant];
	return (
		<div className="flex flex-wrap gap-2">
			<button type="button" className={`${t.btnPrimary} px-5 py-2.5 text-sm`}>
				<Sparkles className="w-4 h-4 inline -mt-0.5 mr-1.5" />
				Upload
			</button>
			<button type="button" className={`${t.btnGhost} px-5 py-2.5 text-sm`}>
				<Download className="w-4 h-4 inline -mt-0.5 mr-1.5" />
				Export
			</button>
		</div>
	);
}

function InputSample({ variant }: { variant: Variant }) {
	const t = tokens[variant];
	return (
		<div className="relative">
			<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
			<input
				type="text"
				placeholder="Search photos..."
				className={`${t.input} w-full h-12 pl-11 pr-4 text-sm text-zinc-900 dark:text-white outline-none transition-all`}
			/>
		</div>
	);
}

function AlertSample({ variant }: { variant: Variant }) {
	const t = tokens[variant];
	return (
		<div className={`${t.alert} px-4 py-3 flex items-start gap-3`}>
			<AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
			<div className="flex-1 text-sm">
				<p className="font-bold">Storage at 87%</p>
				<p className="opacity-80 text-xs mt-0.5">
					Upgrade your plan or delete old albums to free space.
				</p>
			</div>
		</div>
	);
}

function ImageGridSample({ variant }: { variant: Variant }) {
	const t = tokens[variant];
	const photos = [
		"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=400",
		"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=400",
		"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=400",
	];
	return (
		<div className="grid grid-cols-3 gap-2">
			{photos.map((src, i) => (
				<div key={src} className={`${t.tile} aspect-square relative group`}>
					<img
						src={src}
						alt={`Sample ${i + 1}`}
						className="w-full h-full object-cover"
					/>
					<div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
						<span className="text-white text-[10px] font-bold flex items-center gap-1">
							<Heart className="w-3 h-3" />
							{12 + i * 3}
						</span>
						<ImageIcon className="w-3 h-3 text-white/80" />
					</div>
				</div>
			))}
		</div>
	);
}
