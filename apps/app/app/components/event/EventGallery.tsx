import { ImageGrid } from "@lumina/ui/components/domain/ImageGrid";
import { Button } from "@lumina/ui/components/ui/button";
import {
	Camera,
	Heart,
	Image as ImageIcon,
	Sparkles,
	Trophy,
} from "lucide-react";

interface EventGalleryProps {
	images: any[];
	mergedReactions: Record<string, number>;
	selfiePreview: string | null;
	isSearching: boolean;
	searchQuery: string;
	isSearchLoading: boolean;
	isSelfieSearchPending: boolean;
	isNoMatchesState: boolean;
	onClearSearch: () => void;
	onReaction: (id: string) => void;
	onImageClick: (img: any) => void;
	onOpenCamera: () => void;
	onClearSelfie: () => void;
}

export function EventGallery({
	images,
	mergedReactions,
	selfiePreview,
	isSearching,
	searchQuery,
	isSearchLoading,
	isSelfieSearchPending,
	isNoMatchesState,
	onClearSearch,
	onReaction,
	onImageClick,
	onOpenCamera,
	onClearSelfie,
}: EventGalleryProps) {
	return (
		<section className="space-y-8">
			{isSearching && (
				<div className="flex items-center justify-between px-2 mb-4">
					<div className="flex items-center gap-2 text-sage">
						<Sparkles size={18} aria-hidden />
						<p className="text-sm font-black uppercase tracking-widest">
							AI Results for "{searchQuery}"
						</p>
					</div>
					<button
						type="button"
						onClick={onClearSearch}
						className="text-xs font-bold text-zinc-400 underline underline-offset-4 focus-ring"
					>
						Clear
					</button>
				</div>
			)}

			{!isSearching && (
				<div className="flex items-center justify-between gap-2 px-2">
					<div className="flex items-center gap-3">
						{!selfiePreview ? (
							<div className="p-2 bg-sage/10 rounded-control">
								<Trophy className="w-5 h-5 text-sage" aria-hidden />
							</div>
						) : (
							<div className="p-2 bg-rose-500/10 rounded-control">
								<Heart className="w-5 h-5 text-rose-500" aria-hidden />
							</div>
						)}
						<h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words">
							{selfiePreview ? "Photos of You" : "Event Highlights"}
						</h3>
					</div>
					<span className="hidden sm:inline-flex px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest shrink-0">
						{selfiePreview ? `${images.length} results` : "Trending Now"}
					</span>
				</div>
			)}

			{isSelfieSearchPending || isSearchLoading ? (
				<div className="columns-2 sm:columns-3 lg:columns-4 gap-0 px-2 *:mb-0">
					{[
						"h-44", "h-64", "h-52", "h-72",
						"h-56", "h-48", "h-68", "h-60",
						"h-52", "h-64", "h-44", "h-56",
					].map((h, idx) => (
						<div
							key={`result-slot-${idx}`}
							className={`break-inside-avoid bg-zinc-200 dark:bg-zinc-800 animate-pulse ${h}`}
							style={{ animationDelay: `${(idx % 6) * 80}ms` }}
						/>
					))}
				</div>
			) : images.length > 0 ? (
				<div className="px-2">
					<ImageGrid
						images={images}
						reactions={mergedReactions}
						onReaction={onReaction}
						onImageClick={onImageClick}
					/>
				</div>
			) : isNoMatchesState || (isSearching && images.length === 0) ? (
				<div className="p-8 md:p-12 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-modal border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2 space-y-5">
					{isSearching ? (
						<>
							<ImageIcon className="w-12 h-12 mx-auto text-zinc-300" aria-hidden />
							<p className="text-zinc-700 dark:text-zinc-200 font-bold">
								No results for your search.
							</p>
							<Button variant="outline" onClick={onClearSearch}>
								Clear Search
							</Button>
						</>
					) : (
						<>
							<ImageIcon
								className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-300 mb-2"
								aria-hidden
							/>
							<div className="space-y-2 max-w-sm mx-auto">
								<p className="text-zinc-700 dark:text-zinc-200 font-bold text-base md:text-lg">
									No face matches yet
								</p>
								<p className="text-zinc-500 font-medium text-sm md:text-base">
									Try a clear front-facing selfie with good lighting and minimal
									obstructions.
								</p>
							</div>
							<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
								<Button
									onClick={onOpenCamera}
									className="w-full sm:w-auto rounded-control bg-sage text-zinc-950 hover:bg-sage/90 px-6"
								>
									<Camera className="w-4 h-4 mr-2" aria-hidden />
									Retake Selfie
								</Button>
								<Button
									variant="outline"
									onClick={onClearSelfie}
									className="w-full sm:w-auto rounded-control"
								>
									View Highlights Instead
								</Button>
							</div>
						</>
					)}
				</div>
			) : (
				<div className="p-10 md:p-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-modal border-2 border-dashed border-zinc-200 dark:border-zinc-800 mx-2">
					<ImageIcon
						className="w-12 h-12 md:w-16 md:h-16 mx-auto text-zinc-200 mb-6"
						aria-hidden
					/>
					<p className="text-zinc-500 font-medium max-w-[200px] md:max-w-xs mx-auto text-sm md:text-base">
						The gallery is empty or face search failed to find matches.
					</p>
				</div>
			)}
		</section>
	);
}
