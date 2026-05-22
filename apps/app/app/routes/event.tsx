import { SkeletonImageGrid } from "@lumina/ui/components/domain/Skeleton";
import { Heart } from "lucide-react";
import { useParams } from "wouter";
import { EventFaceReview } from "~/components/event/EventFaceReview";
import { EventGallery } from "~/components/event/EventGallery";
import { EventHostCta } from "~/components/event/EventHostCta";
import { EventOfflineFallback } from "~/components/event/EventOfflineFallback";
import { EventSearchBar } from "~/components/event/EventSearchBar";
import { EventSelfieAction } from "~/components/event/EventSelfieAction";
import { GuestImageModal } from "~/components/GuestImageModal";
import { InAppCamera } from "@lumina/ui/components/domain/InAppCamera";
import { useEventLogic } from "~/hooks/event/useEventLogic";

export default function EventPage() {
	const { token } = useParams();
	const logic = useEventLogic(token);
	const {
		albumData,
		images,
		mergedReactions,
		suggestions,
		currentSuggestion,
		currentSuggestionIndex,
		selfiePreview,
		setSelfiePreview,
		selectedImage,
		isCameraOpen,
		setIsCameraOpen,
		ctaVisible,
		searchQuery,
		setSearchQuery,
		isSearching,
		isReviewMode,
		setIsReviewMode,
		isLoading,
		isSearchLoading,
		isNoMatchesState,
		showOfflineFallback,
		searchMutation,
		reactMutation,
		ctaMilestone,
		ctaUrl,
		handleSearch,
		clearSearch,
		handleCapture,
		handleIgnoreSuggestion,
		handleConfirmSuggestion,
		handleImageClick,
		handleCloseModal,
		handleActiveImageChange,
		queryClient,
	} = logic;

	return (
		<div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 space-y-10 md:space-y-12">
			{showOfflineFallback ? (
				<EventOfflineFallback
					onRetry={() => {
						queryClient.invalidateQueries({ queryKey: ["album", token] });
						queryClient.invalidateQueries({
							queryKey: ["album-highlights", token],
						});
					}}
				/>
			) : isLoading && !isSearching ? (
				<div className="p-6 space-y-6">
					<div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-control" />
					<SkeletonImageGrid count={12} />
				</div>
			) : (
				<>
					<header className="text-center space-y-4">
						<div className="inline-flex items-center px-3 py-1 text-xs font-black uppercase tracking-widest">
							Live Event Gallery
						</div>
						<h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white px-2 sm:px-4 text-balance wrap-break-word">
							{albumData?.albumName || "Event Gallery"}
						</h1>
						<p className="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto px-4 sm:px-6 text-pretty">
							Take a selfie and let our AI find every photo you're in,
							instantly.
						</p>
					</header>

					{albumData?.settings?.semantic_search_enabled && (
						<EventSearchBar
							searchQuery={searchQuery}
							setSearchQuery={setSearchQuery}
							onSubmit={handleSearch}
							onClear={clearSearch}
							isSearchLoading={isSearchLoading}
						/>
					)}

					<EventSelfieAction
						selfiePreview={selfiePreview}
						isPending={searchMutation.isPending}
						onOpenCamera={() => setIsCameraOpen(true)}
						onClearSelfie={() => {
							searchMutation.reset();
							setSelfiePreview(null);
						}}
					/>

					<EventFaceReview
						selfiePreview={selfiePreview}
						isReviewMode={isReviewMode}
						setIsReviewMode={setIsReviewMode}
						suggestions={suggestions}
						currentSuggestion={currentSuggestion}
						currentSuggestionIndex={currentSuggestionIndex}
						onConfirm={handleConfirmSuggestion}
						onIgnore={handleIgnoreSuggestion}
					/>

					<EventGallery
						images={images}
						mergedReactions={mergedReactions}
						selfiePreview={selfiePreview}
						isSearching={isSearching}
						searchQuery={searchQuery}
						isSearchLoading={isSearchLoading}
						isSelfieSearchPending={searchMutation.isPending}
						isNoMatchesState={isNoMatchesState}
						onClearSearch={clearSearch}
						onReaction={(id) => reactMutation.mutate(id)}
						onImageClick={handleImageClick}
						onOpenCamera={() => setIsCameraOpen(true)}
						onClearSelfie={() => {
							searchMutation.reset();
							setSelfiePreview(null);
						}}
					/>

					{ctaVisible && (
						<EventHostCta
							ctaUrl={ctaUrl}
							ctaMilestone={ctaMilestone}
							token={token}
							albumId={albumData?.id}
						/>
					)}
				</>
			)}

			<footer className="pt-16 sm:pt-20 pb-[max(env(safe-area-inset-bottom),2rem)] border-t border-zinc-100 dark:border-zinc-800 text-center px-4">
				<p className="text-xs md:text-sm text-zinc-400 flex items-center justify-center gap-2">
					Experience by{" "}
					<span className="font-black text-zinc-900 dark:text-white tracking-tighter">
						LUMINA
					</span>{" "}
					• Shared with{" "}
					<Heart
						className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse"
						aria-hidden
					/>
				</p>
			</footer>

			<InAppCamera
				isOpen={isCameraOpen}
				onClose={() => setIsCameraOpen(false)}
				onCapture={handleCapture}
			/>

			<GuestImageModal
				initialImage={selectedImage}
				images={images}
				onClose={handleCloseModal}
				onReaction={(id) => reactMutation.mutate(id)}
				reactions={mergedReactions}
				onActiveImageChange={handleActiveImageChange}
			/>
		</div>
	);
}
