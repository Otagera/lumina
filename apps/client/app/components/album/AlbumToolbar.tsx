import type { DisplayMode, ViewMode } from "~/types";

export interface AlbumToolbarProps {
	view: ViewMode;
	displayMode: DisplayMode;
	onViewChange: (view: ViewMode) => void;
	onDisplayModeChange: (mode: DisplayMode) => void;
	showModeration?: boolean;
	showDuplicates?: boolean;
	showAnalytics?: boolean;
}

export function AlbumToolbar({
	view,
	displayMode,
	onViewChange,
	onDisplayModeChange,
	showModeration = false,
	showDuplicates = false,
	showAnalytics = false,
}: AlbumToolbarProps) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full">
			{(showModeration || showDuplicates || showAnalytics) && (
				<div
					role="group"
					aria-label="Album view"
					className="bg-zinc-100 dark:bg-zinc-900/50 p-1 rounded-xl sm:p-1.5 sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center shadow-inner overflow-x-auto no-scrollbar w-full sm:w-auto"
				>
					<button
						type="button"
						onClick={() => onViewChange("gallery")}
						aria-pressed={view === "gallery"}
						className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "gallery"
								? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
								: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
							}`}
					>
						Gallery
					</button>
					{showModeration && (
						<button
							type="button"
							onClick={() => onViewChange("moderation")}
							aria-pressed={view === "moderation"}
							className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "moderation"
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
						>
							Moderation
						</button>
					)}
					{showDuplicates && (
						<button
							type="button"
							onClick={() => onViewChange("duplicates")}
							aria-pressed={view === "duplicates"}
							className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "duplicates"
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
						>
							Duplicates
						</button>
					)}
					{showAnalytics && (
						<button
							type="button"
							onClick={() => onViewChange("analytics")}
							aria-pressed={view === "analytics"}
							className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "analytics"
									? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
									: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
								}`}
						>
							Analytics
						</button>
					)}
				</div>
			)}

			<div
				role="group"
				aria-label="Display mode"
				className="bg-zinc-100 dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center shadow-inner ml-auto"
			>
				<button
					type="button"
					onClick={() => onDisplayModeChange("grid")}
					aria-pressed={displayMode === "grid"}
					aria-label="Grid view"
					className={`p-2 rounded-xl transition-all ${displayMode === "grid"
							? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
							: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
						}`}
					title="Grid view"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-labelledby="grid-view-title"
					>
						<title id="grid-view-title">Grid view</title>
						<path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
					</svg>
				</button>
				<button
					type="button"
					onClick={() => onDisplayModeChange("list")}
					aria-pressed={displayMode === "list"}
					aria-label="List view"
					className={`p-2 rounded-xl transition-all ${displayMode === "list"
							? "bg-white dark:bg-zinc-800 text-sage shadow-sm"
							: "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
						}`}
					title="List view"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-labelledby="list-view-title"
					>
						<title id="list-view-title">List view</title>
						<path
							fillRule="evenodd"
							d="M3 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
}
