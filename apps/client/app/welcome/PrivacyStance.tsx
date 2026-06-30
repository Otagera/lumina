import { ShieldCheck, Clock, UserX } from "lucide-react";
import { Link } from "react-router-dom";

const ITEMS = [
	{
		icon: UserX,
		title: "Selfies are never stored",
		body: "The face vector is computed on upload and immediately discarded. No biometric data persists beyond your search session.",
	},
	{
		icon: Clock,
		title: "Auto-deletion on free events",
		body: "Free tier images expire after 14 days automatically. You're never unknowingly hosting old data.",
	},
	{
		icon: ShieldCheck,
		title: "No guest accounts",
		body: "Guests interact without signing up. No email harvested, no profile created, no tracking.",
	},
];

export const PrivacyStance = () => {
	return (
		<section className="py-10 space-y-10">
			<div className="text-center space-y-4">
				<div className="inline-flex items-center gap-2 rounded-full bg-plum/10 dark:bg-rose-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-plum dark:text-rose-300">
					Privacy
				</div>
				<h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight sm:text-5xl">
					Built with privacy as a constraint,
					<br className="hidden md:block" />
					<span className="text-plum dark:text-rose-400"> not an afterthought</span>
				</h2>
				<p className="mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400 font-medium">
					Face biometrics deserve a higher standard. Here's exactly what we do — and don't do — with your data.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-3">
				{ITEMS.map(({ icon: Icon, title, body }) => (
					<div
						key={title}
						className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-7 space-y-4 hover:border-plum/30 dark:hover:border-rose-500/30 transition-colors"
					>
						<div className="w-10 h-10 rounded-xl bg-plum/10 dark:bg-rose-500/10 flex items-center justify-center">
							<Icon className="h-5 w-5 text-plum dark:text-rose-400" />
						</div>
						<div className="space-y-2">
							<h3 className="font-black text-zinc-900 dark:text-white text-base">{title}</h3>
							<p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">{body}</p>
						</div>
					</div>
				))}
			</div>

			<p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
				Operating in Illinois, the EU, or anywhere with biometric data laws?{" "}
				<Link to="/privacy" className="text-sage font-bold hover:underline">
					Read our full data handling policy →
				</Link>
			</p>
		</section>
	);
};

export default PrivacyStance;
