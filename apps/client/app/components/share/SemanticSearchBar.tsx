import { Search, X } from "lucide-react";
import { Button } from "../standard/Button";

const CHIPS = ["dancing", "cake cutting", "speeches", "first dance", "group photo"];

interface SemanticSearchBarProps {
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onClear: () => void;
	isSearchLoading: boolean;
}

export const SemanticSearchBar = ({
	searchQuery,
	setSearchQuery,
	onSubmit,
	onClear,
	isSearchLoading,
}: SemanticSearchBarProps) => {
	return (
		<div className="mb-6">
			<form onSubmit={onSubmit} className="relative w-full">
				<label
					htmlFor="semantic-search-input"
					className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-1.5"
				>
					Search Photos
				</label>
				<div className="flex items-center gap-2 border-b-2 border-zinc-200 dark:border-zinc-800 focus-within:border-sage transition-colors">
					<Search size={18} className="text-zinc-400 shrink-0" aria-hidden />
					<input
						id="semantic-search-input"
						type="text"
						placeholder='e.g. "dancing", "sunset"'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 bg-transparent border-0 outline-none focus:ring-0 py-2 text-base font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={onClear}
							aria-label="Clear search"
							className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 shrink-0 focus-ring"
						>
							<X size={14} aria-hidden />
						</button>
					)}
					<Button
						type="submit"
						size="sm"
						disabled={isSearchLoading || !searchQuery.trim()}
						className="bg-sage text-zinc-950 font-black tracking-tight shrink-0 mb-1 px-5"
					>
						{isSearchLoading ? "..." : "Search"}
					</Button>
				</div>
			</form>

			<div
				role="list"
				aria-label="Search suggestions"
				className="flex gap-2 mt-3 overflow-x-auto snap-x pb-1 no-scrollbar"
			>
				{CHIPS.map((chip) => (
					<button
						key={chip}
						type="button"
						role="listitem"
						aria-pressed={searchQuery === chip}
						onClick={() => setSearchQuery(chip)}
						className={`snap-start shrink-0 px-3 py-1.5 rounded-control text-xs font-bold border transition-all focus-ring ${
							searchQuery === chip
								? "bg-sage text-zinc-950 border-sage"
								: "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-sage"
						}`}
					>
						{chip}
					</button>
				))}
			</div>
		</div>
	);
};
