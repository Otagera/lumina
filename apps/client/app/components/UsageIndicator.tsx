import { useQuery } from "@tanstack/react-query";
import { HardDrive, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchUsage } from "~/utils/api";

export const UsageIndicator = () => {
	const { data: usageResponse } = useQuery({
		queryKey: ["usage"],
		queryFn: fetchUsage,
		refetchInterval: 30000,
	});

	const usage = usageResponse?.data;

	if (!usage) {
		return (
			<div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
				<span className="text-[9px] sm:text-[10px] font-bold text-zinc-400">
					Loading...
				</span>
			</div>
		);
	}

	const computeUnitsUsed = usage.computeUnitsUsed ?? 0;
	const computeUnitsLimit = usage.computeUnitsLimit ?? 100;
	const storageUsedMB = usage.storageUsedMB ?? 0;
	const storageLimitMB = usage.storageLimitMB ?? 5 * 1024;

	const computePercentage = Math.min(
		100,
		(computeUnitsUsed / computeUnitsLimit) * 100,
	);

	const storagePercentage = Math.min(
		100,
		(storageUsedMB / storageLimitMB) * 100,
	);

	const isComputeNearLimit = computePercentage > 80;
	const isComputeOverLimit = computePercentage >= 100;

	const isStorageNearLimit = storagePercentage > 80;
	const isStorageOverLimit = storagePercentage >= 100;

	return (
		<div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
			{/* Images Usage */}
			<div className="flex items-center gap-1.5 sm:gap-2">
				<div
					className={`p-1 rounded-md sm:rounded-lg ${
						isComputeOverLimit
							? "bg-red-500/10 text-red-500"
							: isComputeNearLimit
								? "bg-amber-500/10 text-amber-500"
								: "bg-sage/10 text-sage"
					}`}
				>
					<Zap size={12} className="fill-current sm:w-3.5 sm:h-3.5" />
				</div>
				<div className="flex flex-col">
					<div className="flex items-center gap-1 sm:gap-2 mb-0.5">
						<span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-500">
							Img
						</span>
						<span className="text-[9px] sm:text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
							{computeUnitsUsed}/{computeUnitsLimit}
						</span>
					</div>
					<div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
						<div
							className={`h-full transition-all duration-1000 ${
								isComputeOverLimit
									? "bg-red-500"
									: isComputeNearLimit
										? "bg-amber-500"
										: "bg-sage"
							}`}
							style={{ width: `${computePercentage}%` }}
						/>
					</div>
				</div>
			</div>

			<div className="h-4 sm:h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

			{/* Storage Usage */}
			<div className="flex items-center gap-1.5 sm:gap-2">
				<div
					className={`p-1 rounded-md sm:rounded-lg ${
						isStorageOverLimit
							? "bg-red-500/10 text-red-500"
							: isStorageNearLimit
								? "bg-amber-500/10 text-amber-500"
								: "bg-sage/10 text-sage"
					}`}
				>
					<HardDrive size={12} className="fill-current sm:w-3.5 sm:h-3.5" />
				</div>
				<div className="flex flex-col">
					<div className="flex items-center gap-1 sm:gap-2 mb-0.5">
						<span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-500">
							Store
						</span>
						<span className="text-[9px] sm:text-[10px] font-bold text-zinc-900 dark:text-zinc-100">
							{storageUsedMB >= 1024
								? `${(storageUsedMB / 1024).toFixed(1)}GB`
								: `${storageUsedMB}MB`}
						</span>
					</div>
					<div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
						<div
							className={`h-full transition-all duration-1000 ${
								isStorageOverLimit
									? "bg-red-500"
									: isStorageNearLimit
										? "bg-amber-500"
										: "bg-sage"
							}`}
							style={{ width: `${storagePercentage}%` }}
						/>
					</div>
				</div>
			</div>
			<Link
				to="/usage"
				className="ml-2 text-xs text-sage hover:underline"
				title="View full usage dashboard"
			>
				→
			</Link>
		</div>
	);
};
