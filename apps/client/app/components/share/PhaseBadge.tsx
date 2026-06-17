import type { AlbumPhase } from "~/types";

const PHASE_CONFIG: Record<AlbumPhase, { label: string; className: string }> = {
	collecting: {
		label: "Collecting",
		className: "bg-sage/10 text-sage border-sage/20",
	},
	curating: {
		label: "Curating",
		className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
	},
	delivered: {
		label: "Delivered",
		className: "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
	},
};

interface PhaseBadgeProps {
	phase: AlbumPhase;
	className?: string;
}

export const PhaseBadge = ({ phase, className = "" }: PhaseBadgeProps) => {
	const { label, className: phaseClass } = PHASE_CONFIG[phase];
	return (
		<span
			aria-label={`Album phase: ${label}`}
			className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${phaseClass} ${className}`}
		>
			{label}
		</span>
	);
};
