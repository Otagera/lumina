import { X } from "lucide-react";
import { Button } from "~/components/standard/Button";

type Placement = "top" | "bottom" | "left" | "right";

interface CoachMarkProps {
	open: boolean;
	title: string;
	body: string;
	stepNumber: number;
	totalSteps: number;
	advanceLabel?: string;
	onAdvance: () => void;
	onDismiss: () => void;
	placement?: Placement;
}

const PLACEMENT_CLASSES: Record<Placement, string> = {
	top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
	bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
	left: "right-full mr-3 top-1/2 -translate-y-1/2",
	right: "left-full ml-3 top-1/2 -translate-y-1/2",
};

const ARROW_CLASSES: Record<Placement, string> = {
	top: "top-full left-1/2 -translate-x-1/2 -mt-px border-t-sage border-x-transparent border-b-0",
	bottom:
		"bottom-full left-1/2 -translate-x-1/2 -mb-px border-b-sage border-x-transparent border-t-0",
	left: "left-full top-1/2 -translate-y-1/2 -ml-px border-l-sage border-y-transparent border-r-0",
	right:
		"right-full top-1/2 -translate-y-1/2 -mr-px border-r-sage border-y-transparent border-l-0",
};

/**
 * Non-blocking step popover anchored to its parent (must be position:relative).
 * Renders an aria-live region so screen-reader users hear the prompt when it
 * appears. Pair with useOnboarding() to advance through the first-run journey.
 */
export const CoachMark = ({
	open,
	title,
	body,
	stepNumber,
	totalSteps,
	advanceLabel = "Got it",
	onAdvance,
	onDismiss,
	placement = "bottom",
}: CoachMarkProps) => {
	if (!open) return null;

	return (
		<div
			role="status"
			aria-live="polite"
			className={`absolute z-30 w-72 ${PLACEMENT_CLASSES[placement]}`}
		>
			<div className="relative rounded-card border-2 border-sage bg-white dark:bg-zinc-900 shadow-xl shadow-sage/20 p-4 space-y-3">
				<span
					aria-hidden="true"
					className={`absolute w-0 h-0 border-solid border-8 ${ARROW_CLASSES[placement]}`}
				/>
				<div className="flex items-start justify-between gap-3">
					<div className="space-y-1 flex-1 min-w-0">
						<p className="text-[10px] font-black uppercase tracking-widest text-sage">
							Step {stepNumber} of {totalSteps}
						</p>
						<p className="font-bold text-zinc-900 dark:text-white text-sm">
							{title}
						</p>
					</div>
					<button
						type="button"
						aria-label="Dismiss onboarding"
						onClick={onDismiss}
						className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-control focus-visible:ring-2 focus-visible:ring-sage shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
				<p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
					{body}
				</p>
				<div className="flex items-center justify-between gap-3 pt-1">
					<button
						type="button"
						onClick={onDismiss}
						className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-sage rounded-control"
					>
						Skip tour
					</button>
					<Button
						size="sm"
						className="font-bold text-xs"
						onClick={onAdvance}
					>
						{advanceLabel}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default CoachMark;
