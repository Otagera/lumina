import { cn } from "@lumina/ui/lib/utils";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface FaceReviewCardProps {
	suggestion: {
		faceId: number;
		imageId: string;
		personId: string;
		personName: string;
		similarity: number;
		imagePath: string;
		boundingBox: { top: number; left: number; right: number; bottom: number };
	};
	onConfirm: (suggestion: any) => void;
	onIgnore: (suggestion: any) => void;
}

export const FaceReviewCard = ({ suggestion, onConfirm, onIgnore }: FaceReviewCardProps) => {
	const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

	const handleAction = (direction: "left" | "right") => {
		setSwipeDir(direction);
		setTimeout(() => {
			if (direction === "right") onConfirm(suggestion);
			else onIgnore(suggestion);
		}, 300);
	};

	const { top, left, right, bottom } = suggestion.boundingBox;
	const width = right - left;
	const height = bottom - top;
	const faceStyle = {
		backgroundImage: `url(${suggestion.imagePath})`,
		backgroundSize: `${(100 / width) * 100}% ${(100 / height) * 100}%`,
		backgroundPosition: `${(left / (100 - width)) * 100}% ${(top / (100 - height)) * 100}%`,
	};

	return (
		<div
			className={cn(
				"relative w-full max-w-sm aspect-[3/4] rounded-modal overflow-hidden shadow-2xl transition-all duration-300 transform-gpu",
				swipeDir === "right" && "translate-x-full rotate-12 opacity-0",
				swipeDir === "left" && "-translate-x-full -rotate-12 opacity-0",
				!swipeDir && "scale-100 opacity-100",
			)}
		>
			<div
				className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
				style={{ backgroundImage: `url(${suggestion.imagePath})` }}
			/>
			<div className="absolute inset-0 flex flex-col p-6">
				<div className="flex-1 rounded-tile shadow-inner border-2 border-white/20 overflow-hidden" style={faceStyle} />
				<div className="mt-6 space-y-2 text-center bg-black/40 backdrop-blur-md p-6 rounded-card border border-white/10">
					<p className="text-white/60 text-xs font-black uppercase tracking-widest">Is this...</p>
					<h3 className="text-2xl font-black text-white">{suggestion.personName}</h3>
					<div className="inline-flex items-center px-3 py-1 bg-sage/20 rounded-full text-sage text-[10px] font-bold">
						{Math.round(suggestion.similarity * 100)}% Confidence
					</div>
				</div>
				<div className="flex gap-4 mt-6">
					<button
						type="button"
						onClick={() => handleAction("left")}
						aria-label="Not me"
						className="flex-1 h-16 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-control border border-white/10 text-white transition-all active:scale-95"
					>
						<X size={32} aria-hidden />
					</button>
					<button
						type="button"
						onClick={() => handleAction("right")}
						aria-label="That's me"
						className="flex-1 h-16 flex items-center justify-center bg-sage hover:bg-sage/90 shadow-xl shadow-sage/20 rounded-control text-zinc-950 transition-all active:scale-95"
					>
						<Check size={32} strokeWidth={3} aria-hidden />
					</button>
				</div>
			</div>
		</div>
	);
};
