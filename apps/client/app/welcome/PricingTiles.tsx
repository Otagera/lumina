import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";

interface Plan {
	name: string;
	price_usd: string;
	price_ngn?: string;
	features?: string[];
	is_highlighted?: boolean;
}

interface PricingTilesProps {
	plans: Plan[];
	isLoading: boolean;
}

export const PricingTiles = ({ plans, isLoading }: PricingTilesProps) => {
	return (
		<section className="space-y-12 py-10">
			<div className="text-center space-y-4">
				<div className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sage">
					Fair & Simple
				</div>
				<h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight sm:text-5xl">
					Transparent pricing
				</h2>
				<p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 font-medium">
					Start free with 100 AI-processed images per month.{" "}
					<br className="hidden md:block" />
					Scale as you grow with Bring Your Own Storage.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
				{isLoading ? (
					<div className="col-span-full flex justify-center py-20">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
					</div>
				) : (
					plans.map((plan) => (
						<div
							key={plan.name}
							className={`relative rounded-tile border p-8 flex flex-col transition-all duration-500 hover:border-sage/30 ${plan.is_highlighted
								? "border-sage bg-sage/5 dark:bg-sage/5 scale-[1.02] shadow-xl shadow-sage/10"
								: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
								}`}
						>
							{plan.is_highlighted && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
									Most popular
								</div>
							)}
							<h3 className="text-xl font-black text-zinc-900 dark:text-white capitalize">
								{plan.name === "byos" ? "BYOS" : plan.name}
							</h3>
							<div className="mt-4 mb-6">
								<span className="text-3xl font-black text-zinc-900 dark:text-white">
									{plan.price_usd}
								</span>
								<span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
									{" "}/ month
								</span>
								{plan.price_ngn && (
									<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
										{plan.price_ngn}
									</p>
								)}
							</div>
							<ul className="space-y-3 text-sm flex-1 mb-8">
								{plan.features?.map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"
									>
										<CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
										{feature}
									</li>
								))}
							</ul>
							<Button
								asChild
								variant={plan.is_highlighted ? "primary" : "ghost"}
								size="lg"
								className="font-black uppercase tracking-widest text-xs w-full"
							>
								<Link to="/signup">
									{plan.name === "free" ? "Get started" : "Select plan"}
								</Link>
							</Button>
						</div>
					))
				)}
			</div>
		</section>
	);
};

export default PricingTiles;
