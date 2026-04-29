import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	CheckCircle2,
	HardDrive,
	Search,
	Users,
	Zap,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { fetchPlans } from "../utils/api";
import { useAuth } from "../utils/auth";

const Welcome = () => {
	const { isAuthenticated, isInitialized } = useAuth();

	const { data: plansData, isLoading: isPlansLoading } = useQuery({
		queryKey: ["plans"],
		queryFn: fetchPlans,
	});

	if (isInitialized && isAuthenticated) {
		return <Navigate to="/home" replace />;
	}

	const features = [
		{
			icon: <Users className="h-5 w-5" />,
			title: "Collaborative Events",
			description:
				"Crowdsource photos for weddings or parties with QR codes. No guest accounts required.",
		},
		{
			icon: <Search className="h-5 w-5" />,
			title: "AI Face Search",
			description:
				"Find yourself in seconds across thousands of guest uploads with a simple selfie.",
		},
		{
			icon: <HardDrive className="h-5 w-5" />,
			title: "Free Managed Storage",
			description:
				"No setup required. Start uploading instantly with 1GB free storage.",
		},
	];

	const plans = plansData?.data || [];

	return (
		<div className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
			<div className="absolute inset-0 pointer-events-none">
				<div className="absolute -top-[18%] left-[10%] h-96 w-96 rounded-full bg-sage/20 blur-[130px]" />
				<div className="absolute top-[20%] -right-[10%] h-96 w-96 rounded-full bg-plum/15 blur-[130px]" />
				<div className="absolute -bottom-[18%] left-[35%] h-96 w-96 rounded-full bg-terracotta/20 blur-[130px]" />
			</div>

			<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-14 sm:px-10 lg:py-20">
				<section className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
					<div className="space-y-8">
						<div className="space-y-5">
							<h1 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-white sm:text-6xl">
								Collect, Organize & <br />
								<span className="text-sage font-black italic">
									Find Faces Instantly
								</span>
								.
							</h1>
							<p className="max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
								Lumina turns your photo library into a collaborative
								intelligence layer. Host events where everyone contributes, and
								anyone can find their own photos in seconds.
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-4">
							<Link
								to="/signup"
								className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm uppercase tracking-wide"
							>
								Start Hosting Events <ArrowRight className="h-4 w-4" />
							</Link>
							<Link
								to="/login"
								className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-sage hover:text-sage dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
							>
								Sign in
							</Link>
						</div>
						<div className="flex flex-wrap gap-5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-sage" />
								Free Managed Storage
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-sage" />
								QR Code Contribution
							</div>
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-sage" />
								Privacy-First AI
							</div>
						</div>
					</div>

					<div className="glass-panel rounded-[2rem] border border-zinc-200/80 p-8 dark:border-zinc-800/80">
						<p className="mb-6 text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
							How it works
						</p>
						<ol className="space-y-5">
							{[
								"Create an Event and share your custom QR code.",
								"Guests upload photos directly to your cloud storage.",
								"AI detects and clusters faces in the background.",
								"Anyone can find their photos with a quick selfie.",
							].map((step, index) => (
								<li key={step} className="flex items-start gap-3">
									<div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-plum/10 text-xs font-black text-plum">
										{index + 1}
									</div>
									<span className="text-sm font-bold leading-relaxed text-zinc-700 dark:text-zinc-300">
										{step}
									</span>
								</li>
							))}
						</ol>
					</div>
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					{features.map((feature) => (
						<article
							key={feature.title}
							className="glass-panel rounded-3xl border border-zinc-200/80 p-8 dark:border-zinc-800/80 hover:border-sage/50 transition-all group"
						>
							<div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/15 text-sage group-hover:bg-sage group-hover:text-white transition-all duration-500">
								{feature.icon}
							</div>
							<h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
								{feature.title}
							</h2>
							<p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">
								{feature.description}
							</p>
						</article>
					))}
				</section>

				<section className="space-y-12 py-10">
					<div className="text-center space-y-4">
						<div className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-sage">
							Fair & Simple
						</div>
						<h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight sm:text-5xl">
							Transparent Pricing
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 font-medium">
							Start free with 100 AI-processed images per month.{" "}
							<br className="hidden md:block" />
							Scale as you grow with Bring Your Own Storage.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
						{isPlansLoading ? (
							<div className="col-span-full flex justify-center py-20">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
							</div>
						) : (
							plans.map((plan: any) => (
								<div
									key={plan.name}
									className={`relative rounded-3xl border p-8 flex flex-col transition-all duration-500 hover:border-sage/30 ${
										plan.is_highlighted
											? "border-sage bg-sage/5 dark:bg-sage/5 scale-[1.02] shadow-xl shadow-sage/10"
											: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
									}`}
								>
									{plan.is_highlighted && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sage px-4 py-1 text-xs font-bold uppercase tracking-widest text-white">
											Most Popular
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
											{" "}
											/ month
										</span>
										<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1">
											{plan.price_ngn}
										</p>
									</div>
									<ul className="space-y-3 text-sm flex-1 mb-8">
										{plan.features?.map((feature: string) => (
											<li
												key={feature}
												className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"
											>
												<CheckCircle2 className="h-4 w-4 text-sage" />
												{feature}
											</li>
										))}
									</ul>
									<div>
										<Link
											to="/signup"
											className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center transition-all ${plan.is_highlighted ? "bg-sage text-white shadow-xl shadow-sage/20 hover:bg-sage/90" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
										>
											{plan.name === "free" ? "Get Started" : "Select Plan"}
										</Link>
									</div>
								</div>
							))
						)}
					</div>
				</section>
			</div>
		</div>
	);
};

export default Welcome;
