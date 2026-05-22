import { Search } from "lucide-react";
import { useState } from "react";
import { BackButton } from "~/components/BackButton";
import { MainContainer } from "~/components/MainContainer";
import { SearchResultsGrid } from "~/components/search/SearchResultsGrid";
import { SearchResultsHeader } from "~/components/search/SearchResultsHeader";
import { SearchResultsSection } from "~/components/search/SearchResultsSection";
import {
	SearchErrorState,
	SearchLoadingState,
} from "~/components/search/SearchResultsStates";
import { EmptyState } from "~/components/standard/EmptyState";
import TagPersonModal from "~/components/TagPersonModal";
import { useSearchResults } from "~/hooks/search/useSearchResults";
import ImageModal from "~/Images/ImageModal";

const SearchPage = () => {
	const {
		albumId,
		shareToken,
		results,
		sourceFace,
		loading,
		error,
		confident,
		possible,
		ignored,
		selectedImage,
		setSelectedImage,
		handleConfirm,
		handleReject,
		handleRestore,
		refetch,
	} = useSearchResults();

	const [showPossible, setShowPossible] = useState(false);
	const [showIgnored, setShowIgnored] = useState(false);
	const [taggingFaceId, setTaggingFaceId] = useState<number | null>(null);
	const [showFacesInGrid, setShowFacesInGrid] = useState(false);

	const onTagComplete = () => {
		setTaggingFaceId(null);
		refetch();
	};

	const hasMatches = confident.length > 0 || possible.length > 0;

	return (
		<MainContainer className="space-y-10">
			<BackButton shareToken={shareToken || undefined} />

			<SearchResultsHeader
				sourceFace={sourceFace}
				confidentCount={confident.length}
				possibleCount={possible.length}
				showFaces={showFacesInGrid}
				hasResults={!loading && !error && results.length > 0}
				onToggleFaces={() => setShowFacesInGrid(!showFacesInGrid)}
				onEditSource={(faceId) => setTaggingFaceId(faceId)}
			/>

			{loading ? (
				<SearchLoadingState />
			) : error ? (
				<SearchErrorState message={error} />
			) : !hasMatches ? (
				<EmptyState
					title="No matches found"
					description="Try searching with a different face or album."
					icon={<Search size={36} className="opacity-30" aria-hidden="true" />}
				/>
			) : (
				<div className="space-y-16">
					{confident.length > 0 && (
						<SearchResultsSection
							title="Confident matches"
							caption="At least 50% similarity"
							count={confident.length}
							markerColor="bg-sage"
						>
							<SearchResultsGrid
								faces={confident}
								sourceFace={sourceFace}
								showFacesInGrid={showFacesInGrid}
								shareToken={shareToken || undefined}
								onSelect={setSelectedImage}
								onConfirm={(face) =>
									handleConfirm(face, (id) => setTaggingFaceId(id))
								}
								onReject={handleReject}
								onRestore={handleRestore}
								onTag={(id) => setTaggingFaceId(id)}
							/>
						</SearchResultsSection>
					)}

					{possible.length > 0 && (
						<SearchResultsSection
							title="Possible matches"
							caption="Between 20% and 50% similarity"
							count={possible.length}
							markerColor="bg-terracotta"
							collapsible
							collapsed={!showPossible}
							onToggle={() => setShowPossible(!showPossible)}
							toggleLabel={{ collapsed: "Show", expanded: "Hide" }}
						>
							<SearchResultsGrid
								faces={possible}
								sourceFace={sourceFace}
								showFacesInGrid={showFacesInGrid}
								shareToken={shareToken || undefined}
								onSelect={setSelectedImage}
								onConfirm={(face) =>
									handleConfirm(face, (id) => setTaggingFaceId(id))
								}
								onReject={handleReject}
								onRestore={handleRestore}
								onTag={(id) => setTaggingFaceId(id)}
							/>
						</SearchResultsSection>
					)}

					{ignored.length > 0 && (
						<SearchResultsSection
							title="Ignored matches"
							caption="Excluded from results"
							count={ignored.length}
							markerColor="bg-zinc-400 dark:bg-zinc-600"
							collapsible
							collapsed={!showIgnored}
							onToggle={() => setShowIgnored(!showIgnored)}
							toggleLabel={{ collapsed: "Review", expanded: "Hide" }}
							className="opacity-70 hover:opacity-100 transition-opacity"
						>
							<SearchResultsGrid
								faces={ignored}
								sourceFace={sourceFace}
								showFacesInGrid={showFacesInGrid}
								shareToken={shareToken || undefined}
								onSelect={setSelectedImage}
								onConfirm={(face) =>
									handleConfirm(face, (id) => setTaggingFaceId(id))
								}
								onReject={handleReject}
								onRestore={handleRestore}
								onTag={(id) => setTaggingFaceId(id)}
							/>
						</SearchResultsSection>
					)}
				</div>
			)}

			<ImageModal
				image={selectedImage}
				images={results}
				albumId={albumId || undefined}
				shareToken={shareToken || undefined}
				onClose={() => setSelectedImage(null)}
				onNavigate={(img) => setSelectedImage(img)}
				isSearchMode={true}
			/>

			{taggingFaceId && (
				<TagPersonModal
					faceId={taggingFaceId}
					currentPersonId={
						taggingFaceId === sourceFace?.faceId
							? sourceFace.personId
							: results.find((f) => f.faceId === taggingFaceId)?.personId
					}
					currentPersonName={
						taggingFaceId === sourceFace?.faceId
							? sourceFace.personName
							: results.find((f) => f.faceId === taggingFaceId)?.personName
					}
					onClose={() => setTaggingFaceId(null)}
					onCloseAfterSelection={onTagComplete}
				/>
			)}
		</MainContainer>
	);
};

export default SearchPage;
