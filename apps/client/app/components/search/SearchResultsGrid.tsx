import type { SearchResultFace, SearchSourceFace } from "~/types";
import { SearchResultCard } from "./SearchResultCard";

interface SearchResultsGridProps {
	faces: SearchResultFace[];
	sourceFace: SearchSourceFace | null;
	showFacesInGrid: boolean;
	shareToken?: string;
	onSelect: (face: SearchResultFace) => void;
	onConfirm: (face: SearchResultFace) => void;
	onReject: (faceId: number) => void;
	onRestore: (faceId: number) => void;
	onTag: (faceId: number) => void;
}

export const SearchResultsGrid = ({
	faces,
	sourceFace,
	showFacesInGrid,
	shareToken,
	onSelect,
	onConfirm,
	onReject,
	onRestore,
	onTag,
}: SearchResultsGridProps) => {
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full auto-rows-[160px] md:auto-rows-[260px] grid-flow-dense">
			{faces.map((face, index) => (
				<SearchResultCard
					key={face.faceId || index}
					face={face}
					index={index}
					sourceFace={sourceFace}
					showFacesInGrid={showFacesInGrid}
					shareToken={shareToken}
					onSelect={onSelect}
					onConfirm={onConfirm}
					onReject={onReject}
					onRestore={onRestore}
					onTag={onTag}
				/>
			))}
		</div>
	);
};
