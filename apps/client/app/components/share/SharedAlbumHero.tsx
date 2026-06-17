import { Camera, QrCode, Upload } from "lucide-react";
import type { AlbumPhase, SharedAlbum } from "~/types";
import { Button } from "../standard/Button";
import { PhaseBadge } from "./PhaseBadge";
import { QuickContribute } from "./QuickContribute";

interface SharedAlbumHeroProps {
	album: SharedAlbum;
	phase: AlbumPhase;
	imageCount: number;
	filteredImageIds: Set<string> | null;
	onClearFilter: () => void;
	onFindMyFace: () => void;
	onContribute: () => void;
	onDownloadAll?: () => void;
}

export const SharedAlbumHero = ({
	album,
	phase,
	imageCount,
	filteredImageIds,
	onClearFilter,
	onFindMyFace,
	onContribute,
	onDownloadAll,
}: SharedAlbumHeroProps) => {
	const showContribute = album.canUpload && phase === "collecting";
	const showDownloadAll = phase === "delivered" && onDownloadAll;

	return (
		<>
			{/* Hero card — desktop layout */}
			<div className="rounded-tile bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 mb-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
				<div className="space-y-3 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<PhaseBadge phase={phase} />
						{filteredImageIds && (
							<button
								type="button"
								onClick={onClearFilter}
								className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded text-[10px] font-bold uppercase hover:bg-zinc-200 transition-colors"
							>
								Clear Filter &times;
							</button>
						)}
					</div>

					<h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight break-words">
						{album.albumName}
					</h1>

					{phase === "curating" && (
						<p className="text-sm font-medium text-amber-600 dark:text-amber-400">
							Your photographer is curating these photos.
						</p>
					)}

					<p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
						{filteredImageIds
							? `Showing ${imageCount} photos of you`
							: `${imageCount} photos · organized by the owner for you`}
					</p>

					{/* Desktop CTAs */}
					<div className="hidden sm:flex flex-wrap gap-2 pt-2">
						<button
							type="button"
							className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-sage text-zinc-950 rounded-control transition-all active:scale-95 hover:bg-sage/90"
							onClick={onFindMyFace}
						>
							<Camera className="w-3.5 h-3.5" aria-hidden />
							{filteredImageIds ? "Change Photo" : "Find My Face"}
						</button>

						{showContribute && (
							<button
								type="button"
								className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95"
								onClick={onContribute}
							>
								<Upload className="w-3.5 h-3.5" aria-hidden />
								Contribute
							</button>
						)}

						{showDownloadAll && (
							<Button
								size="sm"
								onClick={onDownloadAll}
								className="rounded-control"
							>
								Download All
							</Button>
						)}
					</div>
				</div>

				<div
					className="w-20 h-20 md:w-24 md:h-24 rounded-control bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0 mx-auto md:mx-0"
					aria-hidden
				>
					<QrCode className="w-10 h-10 md:w-12 md:h-12 text-white dark:text-zinc-900" />
				</div>
			</div>

			{/* Mobile sticky bottom CTA bar */}
			<div
				role="region"
				aria-label="Guest actions"
				className="sm:hidden fixed bottom-0 inset-x-0 z-100 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] motion-safe:animate-in motion-safe:slide-in-from-bottom-2 duration-300"
			>
				<div className="flex gap-2 px-4 py-3">
					<button
						type="button"
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-sage text-zinc-950 rounded-control transition-all active:scale-95 hover:bg-sage/90 min-h-[44px]"
						onClick={onFindMyFace}
					>
						<Camera className="w-4 h-4" aria-hidden />
						{filteredImageIds ? "Change Photo" : "Find My Face"}
					</button>

					{showContribute && (
						<QuickContribute
							albumId={album.id}
							requiresApproval={!!album.settings?.requires_approval}
						/>
					)}

					{showDownloadAll && (
						<button
							type="button"
							onClick={onDownloadAll}
							className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-zinc-900 text-white rounded-control transition-all active:scale-95 min-h-[44px]"
						>
							Download All
						</button>
					)}
				</div>
			</div>
		</>
	);
};
