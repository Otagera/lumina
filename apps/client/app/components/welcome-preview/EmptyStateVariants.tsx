import { ArrowRight, ImagePlus, QrCode, Sparkles } from "lucide-react";

const STEPS = [
	{
		icon: <ImagePlus className="w-5 h-5" />,
		title: "Create your first album",
		body: "Name it, then we'll set it up for photos in one click.",
		cta: "+ New album",
	},
	{
		icon: <Sparkles className="w-5 h-5" />,
		title: "Make it an event",
		body: "Flip the Event toggle so guests can contribute too.",
		cta: "Open settings",
	},
	{
		icon: <QrCode className="w-5 h-5" />,
		title: "Share the QR code",
		body: "Print, share, or AirDrop it. Guests upload without accounts.",
		cta: "Preview QR",
	},
];

export function EmptyStateBigGuided() {
	return (
		<div className="rounded-tile border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 md:p-10">
			<div className="max-w-2xl mx-auto text-center mb-8">
				<div className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-sage/15 text-sage mb-4">
					<Sparkles className="w-6 h-6" />
				</div>
				<h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
					Let's get your first event live
				</h3>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
					Three quick steps and your guests can start uploading photos.
				</p>
			</div>
			<ol className="grid gap-4 md:grid-cols-3">
				{STEPS.map((s, i) => (
					<li
						key={s.title}
						className="rounded-card border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
					>
						<div className="flex items-center gap-2">
							<span className="w-6 h-6 rounded-full bg-sage text-zinc-950 text-xs font-black flex items-center justify-center">
								{i + 1}
							</span>
							<span className="text-sage">{s.icon}</span>
						</div>
						<h4 className="font-bold text-zinc-900 dark:text-white">
							{s.title}
						</h4>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
							{s.body}
						</p>
						<button
							type="button"
							className="text-xs font-black uppercase tracking-wider text-sage inline-flex items-center gap-1 group"
						>
							{s.cta}
							<ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
						</button>
					</li>
				))}
			</ol>
		</div>
	);
}

export function EmptyStateInlineStrip() {
	return (
		<div className="space-y-6">
			<div className="rounded-card border border-sage/30 bg-sage/5 dark:bg-sage/10 p-4 flex items-center gap-4 flex-wrap">
				<div className="flex items-center gap-3 flex-1 min-w-50">
					<div className="w-9 h-9 rounded-control bg-sage/20 text-sage flex items-center justify-center shrink-0">
						<Sparkles className="w-4 h-4" />
					</div>
					<div>
						<p className="text-sm font-bold text-zinc-900 dark:text-white">
							New here? Set up your first event in 3 steps.
						</p>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							Create album → Make it an event → Share QR
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						className="rounded-control bg-sage px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-950"
					>
						Start tour
					</button>
					<button
						type="button"
						className="rounded-control border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300"
					>
						Dismiss
					</button>
				</div>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="aspect-3/4 rounded-tile border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
					/>
				))}
			</div>
		</div>
	);
}

export function EmptyStateIllustrated() {
	return (
		<div className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
			<div className="relative mx-auto w-32 h-32 mb-6">
				<div className="absolute inset-0 rounded-tile bg-sage/10 rotate-6" />
				<div className="absolute inset-0 rounded-tile bg-plum/10 -rotate-6" />
				<div className="absolute inset-0 rounded-tile bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
					<ImagePlus className="w-12 h-12 text-zinc-400" />
				</div>
			</div>
			<h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
				No albums yet
			</h3>
			<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
				Albums are buckets for photos. Make one into an event and your guests
				can contribute too.
			</p>
			<button
				type="button"
				className="inline-flex items-center gap-2 rounded-control bg-sage px-6 py-3 text-sm font-black uppercase tracking-wider text-zinc-950 shadow-lg shadow-sage/20"
			>
				+ Create your first album
			</button>
		</div>
	);
}
