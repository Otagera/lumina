import { Calendar, User, X } from "lucide-react";
import { Button } from "./standard/Button";

interface AlbumFiltersProps {
	filters: {
		startDate?: string;
		endDate?: string;
		uploaderId?: string;
	};
	onFilterChange: (filters: any) => void;
	members?: any[];
}

export const AlbumFilters = ({
	filters,
	onFilterChange,
	members = [],
}: AlbumFiltersProps) => {
	const hasActiveFilters =
		filters.startDate || filters.endDate || filters.uploaderId;

	const clearFilters = () => {
		onFilterChange({
			startDate: undefined,
			endDate: undefined,
			uploaderId: undefined,
		});
	};

	return (
		<div className="flex flex-wrap items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
			<div className="flex items-center gap-2">
				<Calendar size={16} className="text-zinc-400" />
				<input
					type="date"
					value={filters.startDate || ""}
					onChange={(e) =>
						onFilterChange({
							...filters,
							startDate: e.target.value || undefined,
						})
					}
					className="bg-transparent border-none text-sm focus:ring-0 p-0 text-zinc-600 dark:text-zinc-300"
					placeholder="Start Date"
				/>
				<span className="text-zinc-400">to</span>
				<input
					type="date"
					value={filters.endDate || ""}
					onChange={(e) =>
						onFilterChange({ ...filters, endDate: e.target.value || undefined })
					}
					className="bg-transparent border-none text-sm focus:ring-0 p-0 text-zinc-600 dark:text-zinc-300"
				/>
			</div>

			<div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

			<div className="flex items-center gap-2">
				<User size={16} className="text-zinc-400" />
				<select
					value={filters.uploaderId || ""}
					onChange={(e) =>
						onFilterChange({
							...filters,
							uploaderId: e.target.value || undefined,
						})
					}
					className="bg-transparent border-none text-sm focus:ring-0 p-0 text-zinc-600 dark:text-zinc-300"
				>
					<option value="">All Uploaders</option>
					{members.map((member) => (
						<option key={member.user_id} value={member.user_id}>
							{member.user?.email || member.user_id}
						</option>
					))}
				</select>
			</div>

			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={clearFilters}
					className="ml-auto text-xs text-zinc-500 hover:text-red-500"
				>
					<X size={14} className="mr-1" />
					Clear Filters
				</Button>
			)}
		</div>
	);
};
