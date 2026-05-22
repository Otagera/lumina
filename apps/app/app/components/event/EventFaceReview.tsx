import { Button } from "@lumina/ui/components/ui/button";
import { Heart, Sparkles, X } from "lucide-react";
import { FaceReviewCard } from "~/components/FaceReviewCard";

interface EventFaceReviewProps {
	selfiePreview: string | null;
	isReviewMode: boolean;
	setIsReviewMode: (v: boolean) => void;
	suggestions: any[];
	currentSuggestion: any;
	currentSuggestionIndex: number;
	onConfirm: () => void;
	onIgnore: () => void;
}

export function EventFaceReview({
	selfiePreview,
	isReviewMode,
	setIsReviewMode,
	suggestions,
	currentSuggestion,
	currentSuggestionIndex,
	onConfirm,
	onIgnore,
}: EventFaceReviewProps) {
	return (
		<>
			{selfiePreview && !isReviewMode && suggestions.length > 0 && (
				<section className="px-4">
					<button
						type="button"
						onClick={() => setIsReviewMode(true)}
						className="w-full rounded-card border border-sage/30 bg-gradient-to-br from-sage/10 to-rose-500/5 p-5 flex items-center gap-4 shadow-lg shadow-sage/10 transition-shadow hover:shadow-xl focus-ring"
					>
						<div className="w-12 h-12 rounded-tile bg-sage/20 flex items-center justify-center">
							<Sparkles className="w-6 h-6 text-sage" aria-hidden />
						</div>
						<div className="flex-1 text-left">
							<p className="text-xs font-black uppercase tracking-widest text-sage">
								Help Improve AI
							</p>
							<p className="text-sm font-bold text-zinc-900 dark:text-white">
								Is this you in these photos?
							</p>
						</div>
						<div className="px-3 py-1 bg-sage text-zinc-950 text-xs font-black rounded-full">
							Review {suggestions.length}
						</div>
					</button>
				</section>
			)}

			{isReviewMode && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Face review"
					className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
				>
					<button
						type="button"
						onClick={() => setIsReviewMode(false)}
						aria-label="Close face review"
						className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors focus-ring"
					>
						<X size={24} aria-hidden />
					</button>

					<div className="w-full max-w-sm flex-1 flex flex-col items-center justify-center">
						{currentSuggestion ? (
							<FaceReviewCard
								suggestion={{
									...currentSuggestion,
									personName: "You",
								}}
								onConfirm={onConfirm}
								onIgnore={onIgnore}
							/>
						) : (
							<div className="text-center space-y-4 animate-in zoom-in duration-500">
								<div className="w-20 h-20 bg-sage/20 rounded-full flex items-center justify-center mx-auto text-sage">
									<Heart size={40} aria-hidden />
								</div>
								<h3 className="text-3xl font-black text-white tracking-tight">
									All Caught Up!
								</h3>
								<p className="text-zinc-400 font-medium max-w-xs mx-auto">
									Thank you for helping organize the event gallery. The AI is
									getting smarter.
								</p>
								<Button
									onClick={() => setIsReviewMode(false)}
									className="mt-6 rounded-control bg-sage text-zinc-950 hover:bg-sage/90"
								>
									Back to Gallery
								</Button>
							</div>
						)}
					</div>

					{currentSuggestion && (
						<div className="pb-10 pt-6">
							<p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
								{currentSuggestionIndex + 1} of {suggestions.length}
							</p>
						</div>
					)}
				</div>
			)}
		</>
	);
}
