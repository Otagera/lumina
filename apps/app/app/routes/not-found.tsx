import { Button } from "@lumina/ui/components/ui/button";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 antialiased font-sans overflow-hidden">
			<div className="text-center max-w-md w-full relative z-10">
				{/* Large 404 Graphic (Dashboard Style) */}
				<div className="relative mb-12 animate-in fade-in zoom-in duration-700">
					<div className="text-[150px] md:text-[200px] leading-none font-black text-zinc-200/50 dark:text-zinc-800/50 select-none tracking-tighter">
						404
					</div>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-sage to-sage/80 rounded-[3rem] flex items-center justify-center shadow-[0_20px_50px_rgba(151,165,145,0.4)] rotate-12 transition-transform hover:rotate-0 duration-500">
							<Search className="w-10 h-10 md:w-12 md:h-12 text-zinc-950" />
						</div>
					</div>
				</div>

				<div className="space-y-4 mb-10">
					<h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">
						Lost in the Crowd?
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
						We couldn't find the event or photo you're looking for. It might
						have expired or the link is incorrect.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<Button
						onClick={() => navigate(-1)}
						variant="outline"
						size="lg"
						className="w-full rounded-2xl h-14 font-bold border-2"
					>
						<ArrowLeft className="w-5 h-5 mr-2" />
						Go Back
					</Button>
					<Link to="/" className="w-full">
						<Button
							size="lg"
							className="w-full rounded-2xl h-14 font-bold bg-sage text-zinc-950 hover:bg-sage/90 border-none shadow-xl shadow-sage/20"
						>
							<Home className="w-5 h-5 mr-2" />
							Return Home
						</Button>
					</Link>
				</div>
			</div>

			{/* Decorative background elements */}
			<div className="fixed inset-0 pointer-events-none -z-10">
				<div className="absolute top-[-10%] -left-20 w-[400px] h-[400px] bg-sage/10 rounded-full blur-[100px] animate-pulse" />
				<div className="absolute bottom-[-10%] -right-20 w-[500px] h-[500px] bg-terracotta/5 rounded-full blur-[120px]" />
			</div>
		</div>
	);
}
