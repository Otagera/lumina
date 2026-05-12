import { ArrowUpDown, Calendar, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./standard/Button";

interface AlbumFiltersProps {
	filters: {
		startDate?: string;
		endDate?: string;
		uploaderId?: string;
	};
	onFilterChange: (filters: any) => void;
	members?: any[];
	sortBy?: string;
	onSortChange?: (sort: string) => void;
}

export const AlbumFilters = ({
	filters,
	onFilterChange,
	members = [],
	sortBy = "newest",
	onSortChange,
}: AlbumFiltersProps) => {
	const [showDateMenu, setShowDateMenu] = useState(false);
	const [showUploaderMenu, setShowUploaderMenu] = useState(false);
	const [showSortMenu, setShowSortMenu] = useState(false);
	const dateRef = useRef<HTMLDivElement>(null);
	const uploaderRef = useRef<HTMLDivElement>(null);
	const sortRef = useRef<HTMLDivElement>(null);

	const hasActiveFilters =
		filters.startDate || filters.endDate || filters.uploaderId;

	// Close menus when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
				setShowDateMenu(false);
			}
			if (
				uploaderRef.current &&
				!uploaderRef.current.contains(e.target as Node)
			) {
				setShowUploaderMenu(false);
			}
			if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
				setShowSortMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const getDatePresetLabel = () => {
		if (!filters.startDate && !filters.endDate) return "Date";
		if (filters.startDate && !filters.endDate) {
			const d = new Date(filters.startDate);
			return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
		}
		if (!filters.startDate && filters.endDate) {
			const d = new Date(filters.endDate);
			return `Until ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
		}
		const start = filters.startDate ? new Date(filters.startDate) : null;
		const end = filters.endDate ? new Date(filters.endDate) : null;
		return `${start?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
	};

	const applyDatePreset = (preset: string) => {
		const today = new Date();
		const todayStr = today.toISOString().split("T")[0];

		// Format: YYYY-MM-DD for database comparison
		const formatDate = (d: string | undefined) => (d ? d : undefined);

		switch (preset) {
			case "today":
				// "Today" means from start of today to end of today
				onFilterChange({
					...filters,
					startDate: formatDate(todayStr),
					endDate: formatDate(todayStr),
				});
				break;
			case "week": {
				const weekAgo = new Date(today);
				weekAgo.setDate(today.getDate() - 7);
				onFilterChange({
					...filters,
					startDate: weekAgo.toISOString().split("T")[0],
					endDate: formatDate(todayStr),
				});
				break;
			}
			case "month": {
				const monthAgo = new Date(today);
				monthAgo.setMonth(today.getMonth() - 1);
				onFilterChange({
					...filters,
					startDate: monthAgo.toISOString().split("T")[0],
					endDate: formatDate(todayStr),
				});
				break;
			}
		}
		setShowDateMenu(false);
	};

	const getSortLabel = () => {
		switch (sortBy) {
			case "newest":
				return "Newest";
			case "oldest":
				return "Oldest";
			case "size":
				return "Size";
			default:
				return "Newest";
		}
	};

	const activeFilters: { label: string; onRemove: () => void }[] = [];

	if (filters.startDate || filters.endDate) {
		activeFilters.push({
			label: getDatePresetLabel(),
			onRemove: () =>
				onFilterChange({
					...filters,
					startDate: undefined,
					endDate: undefined,
				}),
		});
	}

	if (filters.uploaderId) {
		const member = members.find((m) => m.user_id === filters.uploaderId);
		activeFilters.push({
			label: member?.user?.email?.split("@")[0] || "User",
			onRemove: () =>
				onFilterChange({
					...filters,
					uploaderId: undefined,
				}),
		});
	}

	return (
		<div className="space-y-3">
			{/* Filter Controls */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Date Filter */}
				<div className="relative" ref={dateRef}>
					<button
						type="button"
						onClick={() => {
							setShowDateMenu(!showDateMenu);
							setShowUploaderMenu(false);
							setShowSortMenu(false);
						}}
						className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
							filters.startDate || filters.endDate
								? "bg-sage/10 text-sage border border-sage/30"
								: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
						}`}
					>
						<Calendar size={14} />
						{getDatePresetLabel()}
						<ChevronDown
							size={12}
							className={`transition-transform ${showDateMenu ? "rotate-180" : ""}`}
						/>
					</button>
					{showDateMenu && (
						<div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
							<button
								type="button"
								onClick={() => applyDatePreset("today")}
								className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
							>
								Today
							</button>
							<button
								type="button"
								onClick={() => applyDatePreset("week")}
								className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
							>
								Last 7 days
							</button>
							<button
								type="button"
								onClick={() => applyDatePreset("month")}
								className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
							>
								Last 30 days
							</button>
							<div className="border-t border-zinc-200 dark:border-zinc-700 my-1" />
							<div className="px-4 py-2">
								<div className="flex items-center gap-2 mb-2">
									<span className="text-xs text-zinc-500">From</span>
									<input
										type="date"
										value={filters.startDate || ""}
										onChange={(e) =>
											onFilterChange({
												...filters,
												startDate: e.target.value || undefined,
											})
										}
										className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2 py-1 text-xs border-0"
									/>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-zinc-500">To</span>
									<input
										type="date"
										value={filters.endDate || ""}
										onChange={(e) =>
											onFilterChange({
												...filters,
												endDate: e.target.value || undefined,
											})
										}
										className="flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg px-2 py-1 text-xs border-0"
									/>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Uploader Filter */}
				{members.length > 0 && (
					<div className="relative" ref={uploaderRef}>
						<button
							type="button"
							onClick={() => {
								setShowUploaderMenu(!showUploaderMenu);
								setShowDateMenu(false);
								setShowSortMenu(false);
							}}
							className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
								filters.uploaderId
									? "bg-sage/10 text-sage border border-sage/30"
									: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
							}`}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-3.5 w-3.5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
							{members
								.find((m) => m.user_id === filters.uploaderId)
								?.user?.email?.split("@")[0] || "Uploader"}
							<ChevronDown
								size={12}
								className={`transition-transform ${showUploaderMenu ? "rotate-180" : ""}`}
							/>
						</button>
						{showUploaderMenu && (
							<div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20 max-h-60 overflow-y-auto">
								<button
									type="button"
									onClick={() => {
										onFilterChange({ ...filters, uploaderId: undefined });
										setShowUploaderMenu(false);
									}}
									className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
								>
									All Uploaders
								</button>
								{members.map((member) => (
									<button
										type="button"
										key={member.user_id}
										onClick={() => {
											onFilterChange({
												...filters,
												uploaderId: member.user_id,
											});
											setShowUploaderMenu(false);
										}}
										className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
											filters.uploaderId === member.user_id
												? "bg-sage/10 text-sage"
												: "text-zinc-700 dark:text-zinc-200"
										}`}
									>
										{member.user?.email || member.user_id}
									</button>
								))}
							</div>
						)}
					</div>
				)}

				{/* Sort */}
				{onSortChange && (
					<div className="relative ml-auto" ref={sortRef}>
						<button
							type="button"
							onClick={() => {
								setShowSortMenu(!showSortMenu);
								setShowDateMenu(false);
								setShowUploaderMenu(false);
							}}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
						>
							<ArrowUpDown size={14} />
							{getSortLabel()}
							<ChevronDown
								size={12}
								className={`transition-transform ${showSortMenu ? "rotate-180" : ""}`}
							/>
						</button>
						{showSortMenu && (
							<div className="absolute top-full right-0 mt-2 w-36 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
								<button
									type="button"
									onClick={() => {
										onSortChange("newest");
										setShowSortMenu(false);
									}}
									className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
										sortBy === "newest"
											? "bg-sage/10 text-sage"
											: "text-zinc-700 dark:text-zinc-200"
									}`}
								>
									Newest
								</button>
								<button
									type="button"
									onClick={() => {
										onSortChange("oldest");
										setShowSortMenu(false);
									}}
									className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
										sortBy === "oldest"
											? "bg-sage/10 text-sage"
											: "text-zinc-700 dark:text-zinc-200"
									}`}
								>
									Oldest
								</button>
							</div>
						)}
					</div>
				)}

				{/* Clear All */}
				{hasActiveFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							onFilterChange({
								startDate: undefined,
								endDate: undefined,
								uploaderId: undefined,
							})
						}
						className="text-xs text-zinc-500 hover:text-red-500 ml-2"
					>
						<X size={12} className="mr-1" />
						Clear
					</Button>
				)}
			</div>

			{/* Active Filter Pills */}
			{activeFilters.length > 0 && (
				<div className="flex flex-wrap items-center gap-2">
					{activeFilters.map((filter, i) => (
						<div
							key={i}
							className="flex items-center gap-1 px-2 py-1 bg-sage/10 text-sage text-xs font-medium rounded-full"
						>
							{filter.label}
							<button
								type="button"
								onClick={filter.onRemove}
								className="hover:text-red-500 ml-1"
							>
								<X size={12} />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
