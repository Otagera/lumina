import { Camera, ExternalLink, MonitorPlay, Sparkles, Upload } from "lucide-react";
import { QRCode } from "react-qrcode-logo";
import { useEffect, useState } from "react";
import type { AlbumPhase, SharedAlbum } from "~/types";
import { useTheme } from "~/utils/ThemeContext";
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
	onLiveDisplay?: () => void;
	onViewHighlights?: () => void;
	shareToken?: string;
}

const accentStyle = {
	backgroundColor: "var(--theme-accent)",
	color: "var(--theme-accent-fg)",
};

const accentHoverClass = "transition-all active:scale-95 hover:opacity-90";

const BrandingRow = ({ handle, url, light }: { handle?: string; url?: string; light?: boolean }) => {
	if (!handle) return null;
	const color = light ? "rgba(255,255,255,0.7)" : "var(--theme-text-muted)";
	return (
		<div className="mt-3 pt-3 border-t" style={{ borderColor: light ? "rgba(255,255,255,0.2)" : "var(--theme-border)" }}>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
					style={{ color }}
				>
					<ExternalLink size={11} />
					{handle}
				</a>
			) : (
				<span className="text-xs font-medium" style={{ color }}>{handle}</span>
			)}
		</div>
	);
};

const useSlideshowIndex = (slides: string[] | undefined, enabled: boolean) => {
	const [idx, setIdx] = useState(0);
	useEffect(() => {
		if (!enabled || !slides || slides.length < 2) return;
		const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 3500);
		return () => clearInterval(t);
	}, [slides, enabled]);
	return idx;
};

export const SharedAlbumHero = ({
	album,
	phase,
	imageCount,
	filteredImageIds,
	onClearFilter,
	onFindMyFace,
	onContribute,
	onDownloadAll,
	onLiveDisplay,
	onViewHighlights,
	shareToken,
}: SharedAlbumHeroProps) => {
	const theme = useTheme();
	const showContribute = album.canUpload && phase === "collecting";
	const showDownloadAll = phase === "delivered" && onDownloadAll;
	const showLiveDisplay = !!onLiveDisplay;
	const showHighlights = !!onViewHighlights;
	const { heroLayout, heroMode, heroImage, heroSlideshow, brandingHandle, brandingUrl, showCoverInHero } = theme;

	const slideshowIdx = useSlideshowIndex(heroSlideshow, heroLayout === "banner" && heroMode === "slideshow");

	const coverUrl =
		typeof album.coverImage === "string"
			? album.coverImage
			: (album.coverImage as any)?.url ?? null;

	const countLine = filteredImageIds
		? `Showing ${imageCount} photos of you`
		: `${imageCount} photos · organized by the owner for you`;

	const desktopCtas = (
		<div className="hidden sm:flex flex-wrap gap-2 pt-2">
			<button
				type="button"
				style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
				className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-control ${accentHoverClass}`}
				onClick={onFindMyFace}
			>
				<Camera className="w-3.5 h-3.5" aria-hidden />
				{filteredImageIds ? "Change Photo" : "Find My Face"}
			</button>

			{showContribute && (
				<button
					type="button"
					className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95"
					style={{ borderRadius: "var(--theme-radius-control)" }}
					onClick={onContribute}
				>
					<Upload className="w-3.5 h-3.5" aria-hidden />
					Contribute
				</button>
			)}

			{showDownloadAll && (
				<Button size="sm" onClick={onDownloadAll} className="rounded-control" style={{ borderRadius: "var(--theme-radius-control)" }}>
					Download All
				</Button>
			)}

			{showLiveDisplay && (
				<button
					type="button"
					className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95"
					style={{ borderRadius: "var(--theme-radius-control)" }}
					onClick={onLiveDisplay}
				>
					<MonitorPlay className="w-3.5 h-3.5" aria-hidden />
					Live Display
				</button>
			)}

			{showHighlights && (
				<button
					type="button"
					className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95"
					style={{ borderRadius: "var(--theme-radius-control)" }}
					onClick={onViewHighlights}
				>
					<Sparkles className="w-3.5 h-3.5" aria-hidden />
					Highlights
				</button>
			)}
		</div>
	);

	const mobileCta = (
		<div
			role="region"
			aria-label="Guest actions"
			className="sm:hidden fixed bottom-0 inset-x-0 z-100 backdrop-blur-xl border-t pb-[env(safe-area-inset-bottom)] motion-safe:animate-in motion-safe:slide-in-from-bottom-2 duration-300"
			style={{
				background: "var(--theme-surface)",
				borderColor: "var(--theme-border)",
			}}
		>
			<div className="flex gap-2 px-4 py-3">
				<button
					type="button"
					style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
					className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-control ${accentHoverClass} min-h-[44px]`}
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
						className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-control transition-all active:scale-95 min-h-[44px]"
						style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
					>
						Download All
					</button>
				)}
			</div>
		</div>
	);

	if (heroLayout === "banner") {
		const hasBg = heroMode === "image" && !!heroImage;
		const hasSlideshow = heroMode === "slideshow" && !!heroSlideshow && heroSlideshow.length > 0;
		const forcedLight = hasBg || hasSlideshow;

		return (
			<>
				<div
					className="relative rounded-tile mb-6 flex flex-col items-center justify-center text-center px-8 py-16 min-h-[40vh] overflow-hidden"
					style={{
						background: hasBg ? undefined : "var(--theme-bg)",
						borderRadius: "var(--theme-radius-tile)",
					}}
				>
					{hasSlideshow && heroSlideshow?.map((src, i) => (
						<div
							key={src}
							className="absolute inset-0 transition-opacity duration-1000"
							style={{ opacity: i === slideshowIdx ? 1 : 0 }}
						>
							<img src={src} alt="" className="w-full h-full object-cover" />
						</div>
					))}

					{hasBg && (
						<div className="absolute inset-0">
							<img src={heroImage} alt="" className="w-full h-full object-cover" />
						</div>
					)}

					{forcedLight && <div className="absolute inset-0 bg-black/50" />}

					<div className="relative z-10 space-y-3 max-w-2xl">
						<PhaseBadge phase={phase} />
						{filteredImageIds && (
							<button
								type="button"
								onClick={onClearFilter}
								className="px-2 py-0.5 bg-white/20 text-white/80 rounded text-[10px] font-bold uppercase hover:bg-white/30 transition-colors"
							>
								Clear Filter &times;
							</button>
						)}
						<h1
							className="text-5xl md:text-7xl font-black tracking-tight break-words"
							style={{
								color: forcedLight ? "#FFFFFF" : "var(--theme-text)",
								fontFamily: "var(--theme-font)",
							}}
						>
							{album.albumName}
						</h1>
						{album.settings?.tagline && (
							<p className="text-lg italic" style={{ color: forcedLight ? "rgba(255,255,255,0.8)" : "var(--theme-text-muted)" }}>
								{album.settings.tagline}
							</p>
						)}
						<p className="text-sm font-medium" style={{ color: forcedLight ? "rgba(255,255,255,0.7)" : "var(--theme-text-muted)" }}>
							{countLine}
						</p>
						<div className="flex flex-wrap gap-2 pt-2 justify-center">
							<button
								type="button"
								style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
								className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold rounded-control ${accentHoverClass}`}
								onClick={onFindMyFace}
							>
								<Camera className="w-4 h-4" aria-hidden />
								{filteredImageIds ? "Change Photo" : "Find My Face"}
							</button>
							{showContribute && (
								<button
									type="button"
									className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-white/20 backdrop-blur-md border border-white/30 rounded-control text-white hover:bg-white/30 transition-all active:scale-95"
									style={{ borderRadius: "var(--theme-radius-control)" }}
									onClick={onContribute}
								>
									<Upload className="w-4 h-4" aria-hidden />
									Contribute
								</button>
							)}
							{showDownloadAll && (
								<Button size="sm" onClick={onDownloadAll} className="rounded-control" style={{ borderRadius: "var(--theme-radius-control)" }}>
									Download All
								</Button>
							)}
						</div>
						<BrandingRow handle={brandingHandle} url={brandingUrl} light={forcedLight} />
					</div>
				</div>
				{mobileCta}
			</>
		);
	}

	if (heroLayout === "centered") {
		return (
			<>
				<div
					className="rounded-tile backdrop-blur-xl border p-8 md:p-12 mb-6 flex flex-col items-center text-center space-y-3"
					style={{
						background: "var(--theme-surface)",
						borderColor: "var(--theme-border)",
						borderRadius: "var(--theme-radius-tile)",
					}}
				>
					<PhaseBadge phase={phase} />
					{showCoverInHero && coverUrl && (
						<div
							className="w-16 h-16 overflow-hidden mx-auto shadow-lg"
							style={{ borderRadius: "var(--theme-radius-control)" }}
						>
							<img src={coverUrl} alt="" className="w-full h-full object-cover" />
						</div>
					)}
					{filteredImageIds && (
						<button
							type="button"
							onClick={onClearFilter}
							className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded text-[10px] font-bold uppercase hover:bg-zinc-200 transition-colors"
						>
							Clear Filter &times;
						</button>
					)}
					<h1
						className="text-4xl md:text-5xl font-black tracking-tight break-words"
						style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font)" }}
					>
						{album.albumName}
					</h1>
					{album.settings?.tagline && (
						<p className="text-base italic" style={{ color: "var(--theme-text-muted)" }}>
							{album.settings.tagline}
						</p>
					)}
					{phase === "curating" && (
						<p className="text-sm font-medium text-amber-600 dark:text-amber-400">
							Your photographer is curating these photos.
						</p>
					)}
					<p className="text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
						{countLine}
					</p>
					<div className="flex flex-wrap gap-2 pt-2 justify-center">
						<button
							type="button"
							style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
							className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-control ${accentHoverClass}`}
							onClick={onFindMyFace}
						>
							<Camera className="w-3.5 h-3.5" aria-hidden />
							{filteredImageIds ? "Change Photo" : "Find My Face"}
						</button>
						{showContribute && (
							<button
								type="button"
								className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95"
								style={{ borderRadius: "var(--theme-radius-control)" }}
								onClick={onContribute}
							>
								<Upload className="w-3.5 h-3.5" aria-hidden />
								Contribute
							</button>
						)}
						{showDownloadAll && (
							<Button size="sm" onClick={onDownloadAll} className="rounded-control" style={{ borderRadius: "var(--theme-radius-control)" }}>
								Download All
							</Button>
						)}
					</div>
					<BrandingRow handle={brandingHandle} url={brandingUrl} />
				</div>
				{mobileCta}
			</>
		);
	}

	// Default: two-col
	return (
		<>
			<div
				className="rounded-tile backdrop-blur-xl border p-6 md:p-8 mb-6 grid gap-6 md:grid-cols-[1fr_auto] md:items-center"
				style={{
					background: "var(--theme-surface)",
					borderColor: "var(--theme-border)",
					borderRadius: "var(--theme-radius-tile)",
				}}
			>
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

					<h1
						className="text-3xl md:text-4xl font-black tracking-tight break-words"
						style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font)" }}
					>
						{album.albumName}
					</h1>

					{phase === "curating" && (
						<p className="text-sm font-medium text-amber-600 dark:text-amber-400">
							Your photographer is curating these photos.
						</p>
					)}

					<p className="text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>
						{countLine}
					</p>

					{album.settings?.tagline && (
						<p className="text-sm italic" style={{ color: "var(--theme-text-muted)" }}>
							{album.settings.tagline}
						</p>
					)}

					{desktopCtas}
					<BrandingRow handle={brandingHandle} url={brandingUrl} />
				</div>

				{showCoverInHero && coverUrl ? (
					<div
						className="w-20 h-20 md:w-24 md:h-24 overflow-hidden shrink-0 mx-auto md:mx-0 shadow-lg"
						style={{ borderRadius: "var(--theme-radius-control)" }}
					>
						<img src={coverUrl} alt="" className="w-full h-full object-cover" />
					</div>
				) : shareToken ? (
					<div
						className="w-20 h-20 md:w-24 md:h-24 rounded-control overflow-hidden shrink-0 mx-auto md:mx-0 bg-white p-1"
						style={{ borderRadius: "var(--theme-radius-control)" }}
					>
						<QRCode
							value={`${window.location.origin}/share/${shareToken}`}
							size={80}
							qrStyle="dots"
							eyeRadius={4}
							quietZone={2}
						/>
					</div>
				) : null}
			</div>

			{mobileCta}
		</>
	);
};
