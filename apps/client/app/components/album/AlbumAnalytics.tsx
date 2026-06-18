import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "~/utils/eden";

interface AnalyticsData {
	views: { total: number; uniqueVisitors: number };
	searches: { selfie: number; text: number };
	uploads: { total: number; byGuests: number; byHost: number };
	reactions: { total: number; byType: Record<string, number> };
	topPhotos: Array<{ imageId: string; imagePath: string; reactionCount: number }>;
}

interface Props {
	albumId: string;
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
	return (
		<div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
			<p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
			<p className="text-3xl font-black text-zinc-900 dark:text-zinc-100">{value.toLocaleString()}</p>
			{sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
		</div>
	);
}

export function AlbumAnalytics({ albumId }: Props) {
	const [period, setPeriod] = useState<"all" | "7d">("all");

	const { data, isLoading } = useQuery({
		queryKey: ["album-analytics", albumId, period],
		queryFn: async () => {
			const res = await api.albums[albumId].analytics.get({ query: { period } });
			if (res.error) throw new Error((res.error as any).message ?? "Failed to load analytics");
			return res.data?.data as AnalyticsData;
		},
	});

	return (
		<div className="space-y-8">
			<div className="flex items-center justify-between">
				<h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Analytics</h2>
				<div className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-1">
					{(["all", "7d"] as const).map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => setPeriod(p)}
							className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
								period === p
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
							}`}
						>
							{p === "all" ? "All time" : "Last 7 days"}
						</button>
					))}
				</div>
			</div>

			{isLoading ? (
				<div className="flex justify-center py-20">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
				</div>
			) : data ? (
				<>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<StatCard
							label="Page Views"
							value={data.views.total}
							sub={`${data.views.uniqueVisitors} unique visitors`}
						/>
						<StatCard
							label="Selfie Searches"
							value={data.searches.selfie}
						/>
						<StatCard
							label="Uploads"
							value={data.uploads.total}
							sub={`${data.uploads.byGuests} by guests · ${data.uploads.byHost} by host`}
						/>
						<StatCard
							label="Reactions"
							value={data.reactions.total}
							sub={
								Object.entries(data.reactions.byType)
									.map(([type, count]) => `${type} ${count}`)
									.join(" · ") || undefined
							}
						/>
					</div>

					{data.topPhotos.length > 0 && (
						<div>
							<h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">
								Top Photos
							</h3>
							<div className="grid grid-cols-3 md:grid-cols-6 gap-3">
								{data.topPhotos.map((photo) => (
									<div key={photo.imageId} className="relative aspect-square rounded-xl overflow-hidden group">
										<img
											src={photo.imagePath}
											alt=""
											className="w-full h-full object-cover"
										/>
										{photo.reactionCount > 0 && (
											<div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
												{photo.reactionCount} ♥
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}
				</>
			) : (
				<p className="text-zinc-400 text-sm text-center py-20">No analytics data yet.</p>
			)}
		</div>
	);
}
