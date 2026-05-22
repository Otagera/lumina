import { ArrowRight, CheckCircle2, QrCode, Sparkles } from "lucide-react";

const FAKE_FACES = [
	"https://images.pexels.com/photos/3765147/pexels-photo-3765147.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/19379638/pexels-photo-19379638.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/5272402/pexels-photo-5272402.jpeg?auto=compress&cs=tinysrgb&w=120",
	"https://images.pexels.com/photos/29387556/pexels-photo-29387556.jpeg?auto=compress&cs=tinysrgb&w=120",
];

const COLLAGE = [
	"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=400",
];

export function HeroEditorial() {
	return (
		<div className="relative overflow-hidden rounded-tile border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-8 md:p-12">
			<div className="absolute -top-20 left-10 h-72 w-72 rounded-full bg-sage/20 blur-[100px] pointer-events-none" />
			<div className="absolute top-20 -right-10 h-72 w-72 rounded-full bg-plum/15 blur-[100px] pointer-events-none" />
			<div className="relative grid gap-10 lg:grid-cols-[1.2fr_1fr] items-center">
				<div className="space-y-6">
					<p className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">
						A · Editorial maximalist
					</p>
					<h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.95] text-zinc-900 dark:text-white">
						Crowdsource photos.
						<br />
						<span className="text-sage italic">Find yourself</span> instantly.
					</h1>
					<p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-300 font-medium">
						Share a QR code. Guests upload. Anyone finds their own photos with
						a selfie — no accounts, no chaos.
					</p>
					<div className="flex flex-wrap gap-3">
						<button
							type="button"
							className="inline-flex items-center gap-2 rounded-control bg-sage px-6 py-3 text-sm font-black uppercase tracking-wider text-zinc-950 shadow-lg shadow-sage/20"
						>
							Start hosting <ArrowRight className="w-4 h-4" />
						</button>
						<button
							type="button"
							className="rounded-control border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 px-6 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-200"
						>
							Sign in
						</button>
					</div>
					<div className="flex flex-wrap gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 pt-2">
						{["1GB free", "QR contribution", "Privacy-first AI"].map((b) => (
							<span key={b} className="inline-flex items-center gap-1.5">
								<CheckCircle2 className="w-3.5 h-3.5 text-sage" />
								{b}
							</span>
						))}
					</div>
				</div>
				<div className="rounded-card border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-6 space-y-5">
					<div className="flex items-center justify-between">
						<p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Live preview
						</p>
						<span className="rounded-full bg-sage/15 text-sage text-[10px] font-bold px-2 py-0.5">
							Event open
						</span>
					</div>
					<div className="flex items-center gap-4">
						<div className="w-20 h-20 rounded-control bg-zinc-900 dark:bg-white flex items-center justify-center">
							<QrCode className="w-10 h-10 text-white dark:text-zinc-900" />
						</div>
						<div className="flex-1">
							<p className="text-xs text-zinc-500 dark:text-zinc-400">
								/e/wedding-2025
							</p>
							<p className="font-black text-zinc-900 dark:text-white">
								312 photos · 47 guests
							</p>
						</div>
					</div>
					<div className="space-y-2">
						<p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Matched in 1.2s
						</p>
						<div className="flex -space-x-2">
							{FAKE_FACES.map((src) => (
								<img
									key={src}
									src={src}
									alt=""
									className="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 object-cover"
								/>
							))}
							<div className="w-10 h-10 rounded-full bg-sage/15 border-2 border-white dark:border-zinc-900 text-sage text-[10px] font-black flex items-center justify-center">
								+12
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function HeroSoftSerif() {
	return (
		<div className="relative overflow-hidden rounded-tile border border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950 p-8 md:p-16">
			<div className="relative max-w-3xl mx-auto text-center space-y-8">
				<p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
					B · Soft-serif moment
				</p>
				<h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-zinc-900 dark:text-white leading-[1.05]">
					Every guest. Every photo.{" "}
					<span className="italic text-sage">One link.</span>
				</h1>
				<p className="mx-auto max-w-xl text-base md:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed">
					A quieter way to collect event photos. Lumina handles the chaos so
					you can stay in the moment.
				</p>
				<div className="flex justify-center gap-3 pt-4">
					<button
						type="button"
						className="rounded-full bg-zinc-900 dark:bg-white px-7 py-3 text-sm font-semibold text-white dark:text-zinc-900"
					>
						Get started — free
					</button>
					<button
						type="button"
						className="rounded-full border border-zinc-300 dark:border-zinc-700 px-7 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200"
					>
						See how it works
					</button>
				</div>
			</div>
		</div>
	);
}

export function HeroCollage() {
	return (
		<div className="relative overflow-hidden rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 md:p-12">
			<div className="relative grid gap-10 lg:grid-cols-[1fr_1fr] items-center">
				<div className="space-y-6">
					<p className="text-[10px] font-black uppercase tracking-[0.25em] text-terracotta">
						C · Bold sans + collage
					</p>
					<h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
						Photos from everyone,
						<br />
						organized for you.
					</h1>
					<p className="text-zinc-600 dark:text-zinc-400 max-w-lg">
						Share one QR. We collect, deduplicate, and cluster faces so guests
						find themselves instantly.
					</p>
					<div className="flex gap-3">
						<button
							type="button"
							className="rounded-control bg-sage px-6 py-3 text-sm font-bold text-zinc-950 inline-flex items-center gap-2"
						>
							<Sparkles className="w-4 h-4" />
							Create your first event
						</button>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					{COLLAGE.map((src, i) => (
						<div
							key={src}
							className={`rounded-tile overflow-hidden ${i === 0 ? "row-span-2 aspect-3/5" : "aspect-square"
								}`}
						>
							<img
								src={src}
								alt=""
								className="w-full h-full object-cover"
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
