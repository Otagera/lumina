import { Heart } from "lucide-react";
import { useState } from "react";
import axiosAPI from "~/utils/axios";

interface ReactionButtonProps {
	imageId: string;
	shareToken: string;
	count: number;
}

export const ReactionButton = ({ imageId, shareToken, count }: ReactionButtonProps) => {
	const [optimisticCount, setOptimisticCount] = useState(count);
	const [reacted, setReacted] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const handleReact = async () => {
		if (isPending) return;
		setIsPending(true);
		setReacted((prev) => !prev);
		setOptimisticCount((prev) => (reacted ? prev - 1 : prev + 1));
		try {
			await axiosAPI.post(
				`/public/albums/${shareToken}/images/${imageId}/react`,
				{ type: "HEART" },
			);
		} catch {
			// revert on failure
			setReacted((prev) => !prev);
			setOptimisticCount(count);
		} finally {
			setIsPending(false);
		}
	};

	return (
		<button
			type="button"
			aria-label={`${reacted ? "Remove" : "Add"} heart reaction`}
			aria-pressed={reacted}
			onClick={handleReact}
			className={`flex items-center gap-1 px-2 py-1 rounded-control text-xs font-bold transition-all active:scale-90 focus-ring ${
				reacted
					? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
					: "bg-white/10 text-zinc-400 hover:text-rose-400 border border-transparent"
			}`}
		>
			<Heart className={`w-3.5 h-3.5 ${reacted ? "fill-rose-500" : ""}`} aria-hidden />
			{optimisticCount > 0 && <span>{optimisticCount}</span>}
		</button>
	);
};
