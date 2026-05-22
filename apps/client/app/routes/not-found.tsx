import { Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 antialiased font-sans">
			<div className="text-center max-w-md">
				{/* Large 404 */}
				<div className="relative mb-8">
					<div className="text-[150px] leading-none font-black text-zinc-100 dark:text-zinc-800 select-none">
						404
					</div>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="w-24 h-24 bg-gradient-to-br from-sage to-terracotta rounded-tile flex items-center justify-center shadow-2xl shadow-sage/20">
							<Search className="w-10 h-10 text-white" />
						</div>
					</div>
				</div>

				<Heading level={1} className="text-4xl mb-4">
					Page Not Found
				</Heading>
				<p className="text-zinc-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
					The page you're looking for doesn't exist or has been moved.
				</p>

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Button
						onClick={() => window.history.back()}
						variant="outline"
						className="w-full sm:w-auto"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="w-4 h-4 mr-2"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Go Back
					</Button>
					<Link to="/home" className="w-full sm:w-auto">
						<Button className="w-full">
							<Home className="w-4 h-4 mr-2" />
							Go Home
						</Button>
					</Link>
				</div>
			</div>

			{/* Decorative background */}
			<div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
				<div className="absolute top-1/4 -left-32 w-64 h-64 bg-sage/5 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-terracotta/5 rounded-full blur-3xl" />
			</div>
		</div>
	);
}
