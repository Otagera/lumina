import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";

const COLLAGE = [
	"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=600",
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=600",
	"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=600",
	"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=600",
];

const TRUST_SIGNALS = [
	"1GB free storage",
	"QR contribution",
	"Privacy-first AI",
	"Custom themes",
];

export const HeroCollage = () => {
	return (
		<section className="relative overflow-hidden">
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute -top-[18%] left-[10%] h-96 w-96 rounded-full bg-sage/20 blur-[130px]" />
				<div className="absolute top-[20%] -right-[10%] h-96 w-96 rounded-full bg-plum/15 blur-[130px]" />
			</div>
			<div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center">
				<div className="space-y-7">
					<div className="space-y-5">
						<p className="text-[10px] font-black uppercase tracking-[0.25em] text-sage">
							For hosts of every event
						</p>
						<h1 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-[0.95]">
							Photos from everyone,
							<br />
							<span className="text-sage italic">organized for you.</span>
						</h1>
						<p className="max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
							Share one QR code. Guests upload directly. Anyone finds their
							own photos with a selfie — no accounts, no chaos.
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Button asChild size="lg" className="font-bold shadow-lg shadow-sage/20">
							<Link to="/signup">
								Start hosting events <ArrowRight className="h-4 w-4 ml-1.5" />
							</Link>
						</Button>
						<Button asChild variant="ghost" size="lg" className="font-bold">
							<Link to="/login">Sign in</Link>
						</Button>
					</div>
					<div className="flex flex-wrap gap-5 pt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
						{TRUST_SIGNALS.map((s) => (
							<div key={s} className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-sage" />
								{s}
							</div>
						))}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3">
					{COLLAGE.map((src, i) => (
						<div
							key={src}
							className={`rounded-tile overflow-hidden ${i === 0
								? "row-span-2 aspect-3/5"
								: "aspect-square"
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
		</section>
	);
};

export default HeroCollage;
