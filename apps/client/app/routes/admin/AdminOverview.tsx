import { useQuery } from "@tanstack/react-query";
import {
	Users,
	Image,
	FolderOpen,
	Zap,
	Calendar,
	TrendingUp,
	HardDrive,
	Activity,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { fetchPlatformAnalytics } from "../../utils/adminApi";

const fmt = (mb: number) =>
	mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;

const CapacityBar = ({
	label,
	used,
	limit,
	pct,
	color,
}: {
	label: string;
	used: string;
	limit: string;
	pct: number;
	color: string;
}) => (
	<div className="space-y-1.5">
		<div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
			<span className="font-medium">{label}</span>
			<span>
				{used} / {limit}
			</span>
		</div>
		<div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
			<div
				className="h-full rounded-full transition-all duration-500"
				style={{ width: `${Math.max(pct, 0.5)}%`, backgroundColor: color }}
			/>
		</div>
		<p className="text-xs text-zinc-400 dark:text-zinc-500 text-right">{pct}% used</p>
	</div>
);

const StatCard = ({
	label,
	value,
	icon: Icon,
	accent = "sage",
}: {
	label: string;
	value: string | number;
	icon: React.ElementType;
	accent?: "sage" | "plum" | "terracotta";
}) => {
	const accentMap = {
		sage: "bg-sage/10 text-sage",
		plum: "bg-plum/10 text-plum dark:bg-rose-500/15 dark:text-rose-300",
		terracotta: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
	};
	return (
		<Card className="p-6" hoverable={false}>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-1">
						{label}
					</p>
					<p className="text-3xl font-black text-zinc-900 dark:text-white">
						{typeof value === "number" ? value.toLocaleString() : value}
					</p>
				</div>
				<div className={`p-3 rounded-xl ${accentMap[accent]}`}>
					<Icon size={20} />
				</div>
			</div>
		</Card>
	);
};

export default function AdminOverview() {
	const { data, isLoading } = useQuery({
		queryKey: ["admin", "analytics"],
		queryFn: fetchPlatformAnalytics,
		refetchInterval: 60000,
	});

	return (
		<div className="p-6 md:p-10 space-y-8">
			<div>
				<Heading level={1} className="text-2xl font-black">
					Overview
				</Heading>
				<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
					Platform-wide metrics at a glance.
				</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
					{[...Array(6)].map((_, i) => (
						<div
							key={i}
							className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse"
						/>
					))}
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<StatCard label="Total Users" value={data?.userCount ?? 0} icon={Users} accent="sage" />
						<StatCard label="Total Albums" value={data?.albumCount ?? 0} icon={FolderOpen} accent="sage" />
						<StatCard label="Total Images" value={data?.imageCount ?? 0} icon={Image} accent="sage" />
						<StatCard label="Compute This Month" value={data?.computeThisMonth ?? 0} icon={Zap} accent="plum" />
						<StatCard label="Active Events" value={data?.activeEventCount ?? 0} icon={Calendar} accent="terracotta" />
						<StatCard
							label="Signups (30d)"
							value={
								(data?.signupsByDay ?? []).reduce(
									(sum: number, d: { count: number }) => sum + d.count,
									0,
								)
							}
							icon={TrendingUp}
							accent="sage"
						/>
					</div>

					<Card className="p-6" hoverable={false}>
						<Heading level={2} className="text-base font-black mb-6">
							Daily Signups (last 30 days)
						</Heading>
						<ResponsiveContainer width="100%" height={220}>
							<BarChart data={data?.signupsByDay ?? []}>
								<CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.15)" />
								<XAxis
									dataKey="date"
									tick={{ fontSize: 10, fill: "currentColor" }}
									tickFormatter={(v) => v.slice(5)}
									interval={6}
								/>
								<YAxis tick={{ fontSize: 10, fill: "currentColor" }} allowDecimals={false} />
								<Tooltip
									contentStyle={{
										background: "rgba(24,24,27,0.9)",
										border: "none",
										borderRadius: "12px",
										color: "#fff",
										fontSize: 12,
									}}
									formatter={(v) => [v ?? 0, "Signups"]}
									labelFormatter={(l) => `Date: ${l}`}
								/>
								<Bar dataKey="count" fill="#7CA982" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</Card>

					{/* Free Tier Capacity */}
					{data?.capacity && (
						<div className="space-y-4">
							<div>
								<Heading level={2} className="text-base font-black">
									Free Tier Capacity (Cloudflare R2)
								</Heading>
								<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
									14-day rolling deletion keeps active storage well below the 5 GB/user ceiling.
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Storage + Ops bars */}
								<Card className="p-6 space-y-6" hoverable={false}>
									<CapacityBar
										label="R2 Storage"
										used={fmt(data.capacity.totalStorageMB)}
										limit={fmt(data.capacity.storageLimitMB)}
										pct={data.capacity.storageUsedPct}
										color={
											data.capacity.storageUsedPct >= 80
												? "#E07A5F"
												: data.capacity.storageUsedPct >= 50
													? "#F2CC8F"
													: "#7CA982"
										}
									/>
									<CapacityBar
										label="Class A Ops (est.)"
										used={data.capacity.estimatedClassAOpsThisMonth.toLocaleString()}
										limit={data.capacity.classAOpsLimit.toLocaleString()}
										pct={data.capacity.classAOpsPct}
										color={
											data.capacity.classAOpsPct >= 80
												? "#E07A5F"
												: data.capacity.classAOpsPct >= 50
													? "#F2CC8F"
													: "#7CA982"
										}
									/>

									{/* Visual breakdown bar */}
									<div className="pt-2">
										<p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
											Storage breakdown
										</p>
										<ResponsiveContainer width="100%" height={100}>
											<BarChart
												layout="vertical"
												data={[
													{
														label: "Storage",
														used: data.capacity.totalStorageMB,
														free: data.capacity.storageHeadroomMB,
													},
												]}
												barCategoryGap="40%"
											>
												<XAxis
													type="number"
													domain={[0, data.capacity.storageLimitMB]}
													tickFormatter={(v) => fmt(v)}
													tick={{ fontSize: 10, fill: "currentColor" }}
												/>
												<YAxis type="category" dataKey="label" hide />
												<Tooltip
													contentStyle={{
														background: "rgba(24,24,27,0.9)",
														border: "none",
														borderRadius: "12px",
														color: "#fff",
														fontSize: 12,
													}}
													formatter={(v, name) => [fmt(v as number), name === "used" ? "Used" : "Free"]}
												/>
												<Bar dataKey="used" stackId="a" fill="#7CA982" radius={[4, 0, 0, 4]}>
													<Cell fill={data.capacity.storageUsedPct >= 80 ? "#E07A5F" : "#7CA982"} />
												</Bar>
												<Bar dataKey="free" stackId="a" fill="#e4e4e7" radius={[0, 4, 4, 0]} />
											</BarChart>
										</ResponsiveContainer>
									</div>
								</Card>

								{/* Derived capacity metrics */}
								<Card className="p-6" hoverable={false}>
									<p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-4">
										Capacity Estimates
									</p>
									<div className="space-y-3">
										{[
											{
												icon: HardDrive,
												label: "Storage headroom",
												value: fmt(data.capacity.storageHeadroomMB),
											},
											{
												icon: Users,
												label: "Active users (with live images)",
												value: data.capacity.activeUsersWithImages.toLocaleString(),
											},
											{
												icon: Image,
												label: "Avg storage per active user",
												value: data.capacity.avgStoragePerActiveUserMB > 0
													? fmt(data.capacity.avgStoragePerActiveUserMB)
													: "—",
											},
											{
												icon: Activity,
												label: "Est. max concurrent users",
												value: data.capacity.estimatedMaxConcurrentUsers != null
													? data.capacity.estimatedMaxConcurrentUsers.toLocaleString()
													: "—",
											},
										].map(({ icon: Icon, label, value }) => (
											<div
												key={label}
												className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
											>
												<div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
													<Icon size={14} />
													<span className="text-xs">{label}</span>
												</div>
												<span className="text-sm font-black text-zinc-900 dark:text-white">
													{value}
												</span>
											</div>
										))}
									</div>
									<p className="text-xs text-zinc-400 dark:text-zinc-500 mt-4 leading-relaxed">
										Max concurrent users = storage limit ÷ avg per active user.
										14-day expiry resets inactive users to 0 MB, freeing capacity daily.
									</p>
								</Card>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
