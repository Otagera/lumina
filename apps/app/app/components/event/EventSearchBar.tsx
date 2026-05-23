import { Button } from "@lumina/ui/components/ui/button";
import { Search, X } from "lucide-react";

interface EventSearchBarProps {
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onClear: () => void;
	isSearchLoading: boolean;
}

export function EventSearchBar({
	searchQuery,
	setSearchQuery,
	onSubmit,
	onClear,
	isSearchLoading,
}: EventSearchBarProps) {
	return (
		<form
			onSubmit={onSubmit}
			className="relative max-w-lg mx-auto w-full px-4"
		>
			<label
				htmlFor="event-search-input"
				className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 mb-1.5"
			>
				Search Photos
			</label>
			<div className="group relative flex items-center gap-2 border-b-2 border-zinc-200 dark:border-zinc-800 focus-within:border-sage transition-colors">
				<Search size={18} className="text-zinc-400 shrink-0" aria-hidden />
				<input
					id="event-search-input"
					type="text"
					placeholder="e.g. 'dancing', 'sunset'"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="flex-1 bg-transparent border-0 outline-none focus:ring-0 py-2 text-base font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
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
	);
}
