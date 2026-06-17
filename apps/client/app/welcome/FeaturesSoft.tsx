import { HardDrive, Paintbrush, Search, Users } from "lucide-react";

const FEATURES = [
	{
		icon: <Users className="h-6 w-6" />,
		eyebrow: "Collect",
		title: "Every guest contributes.",
		body: "Crowdsource photos with a single QR code. Guests upload directly to your cloud — no accounts, no app installs.",
	},
	{
		icon: <Search className="h-6 w-6" />,
		eyebrow: "Find",
		title: "A selfie is all it takes.",
		body: "Privacy-first face search across thousands of guest uploads. Results arrive in seconds, ranked by confidence.",
	},
	{
		icon: <HardDrive className="h-6 w-6" />,
		eyebrow: "Own",
		title: "Storage that grows with you.",
		body: "Start free with 1GB managed storage. Bring your own S3 or R2 bucket anytime — your photos, your control.",
	},
	{
		icon: <Paintbrush className="h-6 w-6" />,
		eyebrow: "Brand",
		title: "Make it yours.",
		body: "Custom themes, fonts, and layouts. Add your branding, pick a photo grid style, and set the mood for every event.",
	},
];

export const FeaturesSoft = () => {
	return (
		<section className="relative space-y-16 py-10">
			<div className="max-w-3xl mx-auto text-center space-y-5">
				<p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
					Built for hosts and guests alike
				</p>
				<h2 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-zinc-900 dark:text-white leading-[1.05]">
					A quieter way to collect{" "}
					<span className="italic text-sage">event photos.</span>
				</h2>
				<p className="mx-auto max-w-xl text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
					Lumina handles the chaos of group photo collection so you can stay
					in the moment with your guests.
				</p>
			</div>
			<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
				{FEATURES.map((f) => (
					<article key={f.title} className="space-y-4">
						<div className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-sage/10 text-sage">
							{f.icon}
						</div>
						<p className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">
							{f.eyebrow}
						</p>
						<h3 className="text-2xl font-serif font-medium tracking-tight text-zinc-900 dark:text-white leading-tight">
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

export default FeaturesSoft;
