import { Focus, Search } from "lucide-react";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import type { SearchSourceFace } from "~/types";
import { SourceFaceThumbnail } from "./SourceFaceThumbnail";

interface SearchResultsHeaderProps {
	sourceFace: SearchSourceFace | null;
	confidentCount: number;
	possibleCount: number;
	showFaces: boolean;
	hasResults: boolean;
	onToggleFaces: () => void;
	onEditSource: (faceId: number) => void;
}

export const SearchResultsHeader = ({
	sourceFace,
	confidentCount,
	possibleCount,
	showFaces,
	hasResults,
	onToggleFaces,
	onEditSource,
}: SearchResultsHeaderProps) => {
	return (
		<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
			<div className="flex flex-wrap items-center gap-5">
				<div className="flex items-center gap-3">
					<div className="p-2 bg-sage text-zinc-950 rounded-control">
						<Search size={18} strokeWidth={2.5} aria-hidden="true" />
					</div>
					<Heading level={1} className="text-2xl md:text-3xl m-0">
						Search results
					</Heading>
				</div>

				{sourceFace?.imagePath && (
					<div className="flex items-center gap-3 pl-5 border-l border-zinc-200 dark:border-zinc-800">
						<SourceFaceThumbnail face={sourceFace} />
						<div className="flex flex-col">
							<span className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
								Searching for
							</span>
							<button
								type="button"
								onClick={() => onEditSource(sourceFace.faceId)}
								className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-sage transition-colors text-left focus-ring rounded-control"
							>
								{sourceFace.personName ||
									sourceFace.personId?.split("-")[0] ||
									"Unknown person"}
							</button>
						</div>
					</div>
				)}
			</div>

			{hasResults && (
				<div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-card px-4 py-3">
					<div className="flex items-baseline gap-2">
						<span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-white">
							{confidentCount + possibleCount}
						</span>
						<span className="text-xs text-zinc-500 dark:text-zinc-400">
							{confidentCount + possibleCount === 1 ? "match" : "matches"}
						</span>
					</div>
					<div
						className="w-px h-7 bg-zinc-200 dark:bg-zinc-800"
						aria-hidden="true"
					/>
					<Button
						size="sm"
						variant={showFaces ? "primary" : "outline"}
						onClick={onToggleFaces}
						aria-pressed={showFaces}
					>
						<Focus size={14} aria-hidden="true" />
						{showFaces ? "Focus on" : "Focus faces"}
					</Button>
				</div>
			)}
		</div>
	);
};
