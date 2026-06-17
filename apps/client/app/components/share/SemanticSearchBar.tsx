import type React from "react";
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
				<div
					className="flex items-center gap-2 border-b-2 transition-colors"
					style={{ borderColor: "var(--theme-border)" }}
				>
					<Search size={18} className="text-zinc-400 shrink-0" aria-hidden />
					<input
						id="semantic-search-input"
						type="text"
						placeholder='e.g. "dancing", "sunset"'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1 bg-transparent border-0 outline-none focus:ring-0 py-2 text-base font-medium placeholder:text-zinc-400"
						style={{ color: "var(--theme-text)" }}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={onClear}
							aria-label="Clear search"
							className="p-1 rounded-full text-zinc-400 shrink-0 focus-ring hover:opacity-70"
						>
							<X size={14} aria-hidden />
						</button>
					)}
					<Button
						type="submit"
						size="sm"
						disabled={isSearchLoading || !searchQuery.trim()}
						className="font-black tracking-tight shrink-0 mb-1 px-5"
						style={{ backgroundColor: "var(--theme-accent)", color: "var(--theme-accent-fg)" } as React.CSSProperties}
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
						className="snap-start shrink-0 px-3 py-1.5 rounded-control text-xs font-bold border transition-all focus-ring"
						style={
							searchQuery === chip
								? { backgroundColor: "var(--theme-accent)", color: "var(--theme-accent-fg)", borderColor: "var(--theme-accent)" }
								: { background: "var(--theme-surface)", color: "var(--theme-text-muted)", borderColor: "var(--theme-border)" }
						}
					>
						{chip}
					</button>
				))}
			</div>
		</div>
	);
};
