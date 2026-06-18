import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";

const USE_CASES = [
	{
		id: "weddings",
		label: "Weddings",
		emoji: "💍",
		eyebrow: "Wedding photography",
		heading: "Deliver polished galleries your couples will cherish.",
		tagline:
			"From candid uploads to a curated official gallery — all in one flow.",
		badge: "New · Official Gallery",
		features: [
			"Publish a curated Official Gallery from the event photo pool",
			"Every guest uploads from their angle — no app required",
			"Couples download originals once the gallery is delivered",
			"Selfie search finds every photo of each person instantly",
		],
		demoToken: "demo",
		demoLabel: "Open Wedding demo",
		photos: [
			"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
	{
		id: "parties",
		label: "Parties",
		emoji: "🎉",
		eyebrow: "Birthday & social events",
		heading: "Put the vibe on the wall in real time.",
		tagline: "Live Display streams every new photo to a screen as it's uploaded.",
		badge: null,
		features: [
			"Live Display projects new photos on a venue screen as they arrive",
			"Highlights Reel picks the best shots automatically from reactions",
			"Anyone uploads from their phone — no QR scanner app needed",
			"Guests react to their favourite moments during the event",
		],
		demoToken: "demo-party",
		demoLabel: "Open Party demo",
		photos: [
			"https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1543793/pexels-photo-1543793.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
	{
		id: "church",
		label: "Church & Media",
		emoji: "⛪",
		eyebrow: "Church & media teams",
		heading: "Build a living archive across every service.",
		tagline:
			"Multiple contributors, one organised archive — growing every week.",
		badge: null,
		features: [
			"Multiple contributors upload from every team simultaneously",
			"Delivered Gallery archives each service for the congregation",
			"Selfie search spans recurring events to find any member over time",
			"Series support groups events into a continuous timeline",
		],
		demoToken: "demo-church",
		demoLabel: "Open Church demo",
		photos: [
			"https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/8468470/pexels-photo-8468470.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1595385/pexels-photo-1595385.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
] as const;

export const UseCaseSection = () => {
	const [activeIdx, setActiveIdx] = useState(0);
	const active = USE_CASES[activeIdx];
	const nextIdx = (activeIdx + 1) % USE_CASES.length;
	const next = USE_CASES[nextIdx];

	return (
		<section className="relative">
			<div className="max-w-5xl mx-auto space-y-8">
				<div className="space-y-3 text-center">
					<p className="text-[10px] font-black uppercase tracking-[0.3em] text-sage">
						For every occasion
					</p>
					<h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
						Built to shine at every event.
					</h2>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
						One platform that adapts to what your event actually needs — from
						wedding galleries to live party walls to church archives.
					</p>
				</div>

				{/* Tab nav */}
				<div className="flex justify-center gap-2">
					{USE_CASES.map((uc, i) => (
						<button
							key={uc.id}
							type="button"
							onClick={() => setActiveIdx(i)}
							className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
								i === activeIdx
									? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
									: "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
							}`}
						>
							{uc.emoji} {uc.label}
						</button>
					))}
				</div>

				{/* Stacked card container */}
				<div className="relative">
					{/* Ghost card behind — peeks out below */}
					<div
						className="absolute inset-x-4 bottom-[-10px] h-full rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 scale-[0.97] blur-[1px] -z-10"
						aria-hidden
					>
						<div className="h-full flex items-center justify-center">
							<span className="text-xs font-black text-zinc-400 dark:text-zinc-600 select-none">
								{next.emoji} {next.label}
							</span>
						</div>
					</div>

					{/* Active card */}
					<div
						key={active.id}
						className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6 md:p-8 grid gap-8 md:grid-cols-[1.1fr_1fr] transition-all duration-300"
					>
						<div className="space-y-6">
							<div>
								<p className="text-[10px] font-black uppercase tracking-[0.3em] text-terracotta mb-2">
									{active.eyebrow}
								</p>
								<div className="flex items-start gap-2 flex-wrap">
									<h3 className="font-black text-zinc-900 dark:text-white text-xl leading-snug">
										{active.heading}
									</h3>
									{active.badge && (
										<span className="shrink-0 mt-1 text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
											{active.badge}
										</span>
									)}
								</div>
								<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
									{active.tagline}
								</p>
							</div>

							<ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
								{active.features.map((f) => (
									<li key={f} className="flex items-start gap-2">
										<span className="text-sage mt-0.5 shrink-0">·</span>
										<span>{f}</span>
									</li>
								))}
							</ul>

							<Button asChild className="font-bold w-full sm:w-auto">
								<Link to={`/share/${active.demoToken}`}>
									{active.demoLabel}{" "}
									<ArrowRight className="h-4 w-4 ml-1.5" />
								</Link>
							</Button>
						</div>

						{/* Photo mosaic — same layout as LivePreview */}
						<div className="grid grid-cols-3 gap-2">
							{active.photos.map((src, i) => (
								<div
									key={src}
									className={`rounded-card overflow-hidden relative bg-zinc-200 dark:bg-zinc-800 ${
										i === 0 ? "row-span-2 col-span-2" : "aspect-square"
									}`}
								>
									<img
										src={src}
										alt=""
										loading="lazy"
										className="w-full h-full object-cover"
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default UseCaseSection;
