import { BarChart3, Download, FileSearch, Heart, Tag } from "lucide-react";

const MORE_FEATURES = [
	{
		icon: <Download className="h-5 w-5" />,
		eyebrow: "Downloads",
		title: "Guests keep their photos.",
		body: "One tap downloads a zip of every matched photo. No account, no friction — just their memories, theirs to keep.",
	},
	{
		icon: <BarChart3 className="h-5 w-5" />,
		eyebrow: "Analytics",
		title: "Know your event's impact.",
		body: "Real-time dashboard: page views, unique visitors, selfie searches, upload counts, and the photos guests reacted to most.",
	},
	{
		icon: <Heart className="h-5 w-5" />,
		eyebrow: "Reactions",
		title: "Let guests vote with their hearts.",
		body: "Guests react to their favourite shots during the event. Reactions rank the Highlights Reel automatically.",
	},
	{
		icon: <Tag className="h-5 w-5" />,
		eyebrow: "People",
		title: "Put names to faces.",
		body: "Tag people by name across your album. Selfie search then finds them across recurring events — service to service, year to year.",
	},
	{
		icon: <FileSearch className="h-5 w-5" />,
		eyebrow: "Semantic Search",
		title: "Words find photos too.",
		body: 'Type "blue dress" or "golden hour" and AI surfaces the matching shots. CLIP understands context, not just filenames.',
	},
];

export const MoreFeatures = () => {
	return (
		<section className="relative space-y-10 py-6">
			<div className="max-w-2xl mx-auto text-center space-y-4">
				<p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
					And there's more
				</p>
				<h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
					Every detail of your event,{" "}
					<span className="text-sage">handled.</span>
				</h2>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{MORE_FEATURES.map((f) => (
					<article
						key={f.title}
						className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-3"
					>
						<div className="inline-flex h-9 w-9 items-center justify-center rounded-card bg-sage/10 text-sage">
							{f.icon}
						</div>
						<p className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">
							{f.eyebrow}
						</p>
						<h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight">
							{f.title}
						</h3>
						<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
							{f.body}
						</p>
					</article>
				))}
			</div>
		</section>
	);
};

export default MoreFeatures;
