import { useQuery } from "@tanstack/react-query";
import {
	Users,
	Image,
	FolderOpen,
	Zap,
	Calendar,
	TrendingUp,
} from "lucide-react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { fetchPlatformAnalytics } from "../../utils/adminApi";

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
				</>
			)}
		</div>
	);
}
