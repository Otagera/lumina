import { useQuery } from "@tanstack/react-query";
import {
	Download,
	HardDrive,
	PieChart as PieChartIcon,
	Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { fetchUsage } from "../utils/api";

const COLORS = [
	"#7CA982",
	"#8B5CF6",
	"#F97316",
	"#EC4899",
	"#06B6D4",
	"#84CC16",
];

export default function UsageDashboard() {
	const { data: usageResponse, isLoading } = useQuery({
		queryKey: ["usage"],
		queryFn: fetchUsage,
		refetchInterval: 60000,
	});

	const usage = usageResponse?.data;

	if (isLoading) {
		return (
			<MainContainer>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
				</div>
			</MainContainer>
		);
	}

	if (!usage) {
		return (
			<MainContainer>
				<div className="text-center py-12">
					<p className="text-zinc-500">Unable to load usage data</p>
				</div>
			</MainContainer>
		);
	}

	const storageUsedMB = usage.storageUsedMB ?? 0;
	const storageLimitMB = usage.storageLimitMB ?? 5 * 1024;
	const computeUnitsUsed = usage.computeUnitsUsed ?? 0;
	const computeUnitsLimit = usage.computeUnitsLimit ?? 100;

	const storagePercentage = (storageUsedMB / storageLimitMB) * 100;
	const computePercentage = (computeUnitsUsed / computeUnitsLimit) * 100;

	const isStorageWarning = storagePercentage >= 80;
	const isComputeWarning = computePercentage >= 80;
	const isStorageCritical = storagePercentage >= 100;
	const isComputeCritical = computePercentage >= 100;

	const storageByAlbumData =
		usage.storageByAlbum?.map((item: any) => ({
			name: item.albumName?.substring(0, 20) || "Unknown",
			value: item.storageMB,
		})) || [];

	const computeByOperationData =
		usage.computeByOperation?.map((item: any) => ({
			name: item.operationLabel,
			value: item.units,
		})) || [];

	const historyData =
		usage.history?.slice(-14).map((day: any) => ({
			date: new Date(day.date).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			}),
			Storage: day.storageTotalMB || day.storageMB,
			Compute: day.computeTotalUnits || day.computeUnits,
		})) || [];

	const handleExport = async () => {
		try {
			const response = await fetch("/api/v1/usage/export", {
				credentials: "include",
			});
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `usage-report-${new Date().toISOString().split("T")[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			a.remove();
		} catch (error) {
			console.error("Export failed:", error);
		}
	};

	return (
		<MainContainer>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<Heading level={1}>Usage Dashboard</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 mt-1">
							View your storage and compute usage
						</p>
					</div>
					<Button variant="outline" onClick={handleExport}>
						<Download size={16} className="mr-2" />
						Export CSV
					</Button>
				</div>

				{/* Plan Badge */}
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-zinc-500">Plan:</span>
					<span
						className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
							usage.plan === "pro"
								? "bg-sage/20 text-sage"
								: "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
						}`}
					>
						{usage.plan}
					</span>
					<Link to="/settings" className="text-xs text-sage hover:underline">
						Upgrade
					</Link>
				</div>

				{/* Overview Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Storage Card */}
					<Card className="p-6">
						<div className="flex items-start justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-sage/10 rounded-lg">
									<HardDrive className="w-5 h-5 text-sage" />
								</div>
								<div>
									<h3 className="font-semibold text-zinc-900 dark:text-white">
										Storage
									</h3>
									<p className="text-sm text-zinc-500">Total used</p>
								</div>
							</div>
							{isStorageCritical && (
								<span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded">
									Over Limit
								</span>
							)}
							{isStorageWarning && !isStorageCritical && (
								<span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-medium rounded">
									Warning
								</span>
							)}
						</div>
						<div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
							{storageUsedMB >= 1024
								? `${(storageUsedMB / 1024).toFixed(2)} GB`
								: `${storageUsedMB} MB`}
						</div>
						<div className="text-sm text-zinc-500 mb-4">
							of{" "}
							{storageLimitMB >= 1024
								? `${(storageLimitMB / 1024).toFixed(0)} GB`
								: `${storageLimitMB} MB`}{" "}
							limit
						</div>
						<div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
							<div
								className={`h-full transition-all ${
									isStorageCritical
										? "bg-red-500"
										: isStorageWarning
											? "bg-amber-500"
											: "bg-sage"
								}`}
								style={{ width: `${Math.min(storagePercentage, 100)}%` }}
							/>
						</div>
						<div className="mt-2 text-xs text-zinc-400">
							{Math.round(storagePercentage)}% used
						</div>
					</Card>

					{/* Compute Card */}
					<Card className="p-6">
						<div className="flex items-start justify-between mb-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-plum/10 rounded-lg">
									<Zap className="w-5 h-5 text-plum" />
								</div>
								<div>
									<h3 className="font-semibold text-zinc-900 dark:text-white">
										Compute Units
									</h3>
									<p className="text-sm text-zinc-500">This month</p>
								</div>
							</div>
							{usage.computeUnitsLimit === -1 && (
								<span className="px-2 py-1 bg-sage/10 text-sage text-xs font-medium rounded">
									Unlimited
								</span>
							)}
							{isComputeCritical && usage.computeUnitsLimit !== -1 && (
								<span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-medium rounded">
									Over Limit
								</span>
							)}
							{isComputeWarning && !isComputeCritical && (
								<span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs font-medium rounded">
									Warning
								</span>
							)}
						</div>
						<div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
							{computeUnitsUsed.toLocaleString()}
						</div>
						<div className="text-sm text-zinc-500 mb-4">
							{computeUnitsLimit === -1
								? "Unlimited plan"
								: `of ${computeUnitsLimit.toLocaleString()} limit`}
						</div>
						{computeUnitsLimit !== -1 && (
							<>
								<div className="w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
									<div
										className={`h-full transition-all ${
											isComputeCritical
												? "bg-red-500"
												: isComputeWarning
													? "bg-amber-500"
													: "bg-plum"
										}`}
										style={{ width: `${Math.min(computePercentage, 100)}%` }}
									/>
								</div>
								<div className="mt-2 text-xs text-zinc-400">
									{Math.round(computePercentage)}% used
								</div>
							</>
						)}
					</Card>
				</div>

				{/* Charts Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Storage by Album */}
					<Card className="p-6">
						<div className="flex items-center gap-2 mb-4">
							<PieChartIcon size={18} className="text-sage" />
							<h3 className="font-semibold text-zinc-900 dark:text-white">
								Storage by Album
							</h3>
						</div>
						{storageByAlbumData.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<PieChart>
									<Pie
										data={storageByAlbumData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
										dataKey="value"
										label={({ name, percent }) =>
											`${name} (${(percent * 100).toFixed(0)}%)`
										}
									>
										{storageByAlbumData.map((entry: any, index: number) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => [
											`${Math.round(value)} MB`,
											"Storage",
										]}
									/>
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="h-[250px] flex items-center justify-center text-zinc-400">
								No storage data by album yet
							</div>
						)}
					</Card>

					{/* Compute by Operation */}
					<Card className="p-6">
						<div className="flex items-center gap-2 mb-4">
							<Zap size={18} className="text-plum" />
							<h3 className="font-semibold text-zinc-900 dark:text-white">
								Compute by Operation
							</h3>
						</div>
						{computeByOperationData.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<PieChart>
									<Pie
										data={computeByOperationData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
										dataKey="value"
										label={({ name, percent }) =>
											`${name} (${(percent * 100).toFixed(0)}%)`
										}
									>
										{computeByOperationData.map((entry: any, index: number) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip
										formatter={(value: number) => [`${value} units`, "Compute"]}
									/>
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="h-[250px] flex items-center justify-center text-zinc-400">
								No compute usage yet
							</div>
						)}
					</Card>
				</div>

				{/* History Chart */}
				<Card className="p-6">
					<h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
						Usage History (Last 14 Days)
					</h3>
					{historyData.length > 0 ? (
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={historyData}>
								<CartesianGrid strokeDasharray="3 3" className="opacity-30" />
								<XAxis
									dataKey="date"
									tick={{ fontSize: 12 }}
									className="text-zinc-500"
								/>
								<YAxis tick={{ fontSize: 12 }} className="text-zinc-500" />
								<Tooltip
									contentStyle={{
										backgroundColor: "#27272a",
										border: "none",
										borderRadius: "8px",
										color: "#fff",
									}}
								/>
								<Legend />
								<Bar dataKey="Storage" fill="#7CA982" radius={[4, 4, 0, 0]} />
								<Bar dataKey="Compute" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="h-[300px] flex items-center justify-center text-zinc-400">
							No history data available
						</div>
					)}
				</Card>

				{/* Recent Activity */}
				<Card className="p-6">
					<h3 className="font-semibold text-zinc-900 dark:text-white mb-4">
						Recent Activity
					</h3>
					{usage.recentLogs?.length > 0 ? (
						<div className="space-y-2">
							{usage.recentLogs.slice(0, 10).map((log: any) => (
								<div
									key={log.id}
									className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
								>
									<div className="flex items-center gap-3">
										<div
											className={`w-2 h-2 rounded-full ${
												log.resource === "storage" ? "bg-sage" : "bg-plum"
											}`}
										/>
										<div>
											<p className="text-sm font-medium text-zinc-900 dark:text-white">
												{log.operation}
											</p>
											<p className="text-xs text-zinc-500">
												{new Date(log.timestamp).toLocaleString()}
											</p>
										</div>
									</div>
									<div className="text-right">
										<p className="text-sm font-medium text-zinc-900 dark:text-white">
											{log.resource === "storage"
												? `${Math.round(log.quantity / 1024 / 1024)} MB`
												: `${log.quantity} units`}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-zinc-400 text-center py-4">No recent activity</p>
					)}
				</Card>
			</div>
		</MainContainer>
	);
}
