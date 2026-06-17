import type { AlbumStats } from "~/types";

const formatRelative = (iso: string | null): string => {
	if (!iso) return "—";
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
};

interface StatCardProps {
	label: string;
	value: string | number;
}

const StatCard = ({ label, value }: StatCardProps) => (
	<div
		className="flex-1 min-w-0 rounded-card backdrop-blur-md px-4 py-3 text-center"
		style={{ background: "var(--theme-surface)", border: "1px solid var(--theme-border)", borderRadius: "var(--theme-radius-card)" }}
	>
		<p className="text-xl font-black tabular-nums" style={{ color: "var(--theme-accent)" }}>{value}</p>
		<p className="text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate" style={{ color: "var(--theme-text-muted)" }}>{label}</p>
	</div>
);

interface StatsStripProps {
	stats: AlbumStats | undefined;
	isLoading?: boolean;
}

export const StatsStrip = ({ stats, isLoading }: StatsStripProps) => {
	if (isLoading) {
		return (
			<div className="hidden md:flex gap-3 mb-6" aria-hidden>
				{[0, 1, 2].map((i) => (
					<div key={i} className="flex-1 h-16 rounded-card bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
				))}
			</div>
		);
	}

	if (!stats) return null;

	return (
		<div className="hidden md:flex gap-3 mb-6">
			<StatCard label="Guests" value={stats.guestCount} />
			<StatCard label="Photo reactions" value={stats.recentMatches} />
			<StatCard label="Last activity" value={formatRelative(stats.lastActivityAt)} />
		</div>
	);
};
