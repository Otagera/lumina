import {
	ArrowRight,
	Building2,
	Church,
	GraduationCap,
	Heart,
	PartyPopper,
	Trophy,
	type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";

type UseCase = {
	id: string;
	label: string;
	icon: LucideIcon;
	activeAnimation: string;
	eyebrow: string;
	heading: string;
	tagline: string;
	badge: string | null;
	features: string[];
	demoToken: string | null;
	demoLabel: string;
	photos: string[];
};

const USE_CASES: UseCase[] = [
	{
		id: "weddings",
		label: "Weddings",
		icon: Heart,
		activeAnimation: "animate-pulse",
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
		icon: PartyPopper,
		activeAnimation: "animate-bounce",
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
		icon: Church,
		activeAnimation: "",
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
	{
		id: "corporate",
		label: "Conferences",
		icon: Building2,
		activeAnimation: "",
		eyebrow: "Corporate & conferences",
		heading: "Branded galleries for events that represent your company.",
		tagline: "From keynote to networking — every moment captured and searchable.",
		badge: null,
		features: [
			"Branded gallery with your logo, colours, and custom domain",
			"Selfie search across thousands of attendee photos instantly",
			"Bulk exports for comms teams and post-event reports",
			"Analytics: views, searches, and top-reacted photos at a glance",
		],
		demoToken: null,
		demoLabel: "Get started free",
		photos: [
			"https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1181304/pexels-photo-1181304.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
	{
		id: "school",
		label: "Schools",
		icon: GraduationCap,
		activeAnimation: "",
		eyebrow: "Schools & graduation",
		heading: "Every student finds their moment in seconds.",
		tagline: "Selfie search makes graduation photo chaos a thing of the past.",
		badge: null,
		features: [
			"Students find their own ceremony photos instantly with a selfie",
			"Multiple photographers upload simultaneously from any device",
			"Delivered Gallery creates the official school archive",
			"Guest downloads available once the gallery is published",
		],
		demoToken: null,
		demoLabel: "Get started free",
		photos: [
			"https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/1139319/pexels-photo-1139319.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
	{
		id: "sports",
		label: "Sports",
		icon: Trophy,
		activeAnimation: "",
		eyebrow: "Sports & community",
		heading: "Action shots on the screen before the crowd even cheers.",
		tagline: "Live Display puts new photos on venue screens the moment they land.",
		badge: null,
		features: [
			"Live Display streams action shots to stadium screens in real time",
			"Players find themselves in action photos with a quick selfie",
			"React to highlights and auto-generate a season reel",
			"Series support keeps a continuous archive across the whole season",
		],
		demoToken: null,
		demoLabel: "Get started free",
		photos: [
			"https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/3755440/pexels-photo-3755440.jpeg?auto=compress&cs=tinysrgb&w=1200",
			"https://images.pexels.com/photos/2834917/pexels-photo-2834917.jpeg?auto=compress&cs=tinysrgb&w=1200",
		],
	},
];

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

				{/* Tab nav — scrollable on mobile */}
				<div className="flex gap-2 overflow-x-auto pb-1 sm:justify-center scrollbar-none">
					{USE_CASES.map((uc, i) => {
						const isActive = i === activeIdx;
						return (
							<button
								key={uc.id}
								type="button"
								onClick={() => setActiveIdx(i)}
								className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all duration-200 ${
									isActive
										? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
										: "bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
								}`}
							>
								<uc.icon
									size={14}
									className={isActive && uc.activeAnimation ? uc.activeAnimation : ""}
								/>
								{uc.label}
							</button>
						);
					})}
				</div>

				{/* Stacked card container */}
				<div className="relative">
					{/* Ghost card behind — peeks out below */}
					<div
						className="absolute inset-x-4 bottom-[-10px] h-full rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 scale-[0.97] blur-[1px] -z-10"
						aria-hidden
					>
						<div className="h-full flex items-center justify-center gap-1.5">
							<next.icon
								size={12}
								className="text-zinc-400 dark:text-zinc-600"
							/>
							<span className="text-xs font-black text-zinc-400 dark:text-zinc-600 select-none">
								{next.label}
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
								<Link
									to={
										active.demoToken
											? `/share/${active.demoToken}`
											: "/signup"
									}
								>
									{active.demoLabel}{" "}
									<ArrowRight className="h-4 w-4 ml-1.5" />
								</Link>
							</Button>
						</div>

						{/* Photo mosaic */}
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
