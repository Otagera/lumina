import React, { useEffect, useState } from "react";
import { Camera, Upload } from "lucide-react";
import type { ThemeConfig } from "~/types";
import { ThemeProvider, useTheme } from "~/utils/ThemeContext";

interface PreviewProps {
	config: ThemeConfig;
	albumName?: string;
	tagline?: string;
	imageCount?: number;
}

const accentStyle = {
	backgroundColor: "var(--theme-accent)",
	color: "var(--theme-accent-fg)",
};

const PreviewHero = ({
	albumName,
	tagline,
	imageCount,
}: { albumName: string; tagline?: string; imageCount: number }) => {
	const theme = useTheme();
	const [slideIdx, setSlideIdx] = useState(0);

	const isSlideshow = theme.heroLayout === "banner" && theme.heroMode === "slideshow" && (theme.heroSlideshow?.length ?? 0) > 0;
	const isImage = theme.heroLayout === "banner" && theme.heroMode === "image" && theme.heroImage;

	useEffect(() => {
		if (!isSlideshow || !theme.heroSlideshow || theme.heroSlideshow.length < 2) return;
		const t = setInterval(() => setSlideIdx((i) => (i + 1) % (theme.heroSlideshow?.length ?? 1)), 3500);
		return () => clearInterval(t);
	}, [isSlideshow, theme.heroSlideshow]);

	if (theme.heroLayout === "banner") {
		const forcedLight = isSlideshow || isImage;
		return (
			<div
				className="rounded-xl mb-3 flex flex-col items-center justify-center text-center px-4 py-8 min-h-[120px] relative overflow-hidden"
				style={{ background: forcedLight ? undefined : "var(--theme-bg)", borderRadius: "var(--theme-radius-tile)" }}
			>
				{isSlideshow && theme.heroSlideshow?.map((src, i) => (
					<div key={src} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: i === slideIdx ? 1 : 0 }}>
						<img src={src} alt="" className="w-full h-full object-cover" />
					</div>
				))}
				{isImage && (
					<div className="absolute inset-0">
						<img src={theme.heroImage} alt="" className="w-full h-full object-cover" />
					</div>
				)}
				{forcedLight && <div className="absolute inset-0 bg-black/50" />}
				<div className="relative z-10">
					<h2
						className="text-xl font-black tracking-tight mb-1"
						style={{ color: forcedLight ? "#fff" : "var(--theme-text)", fontFamily: "var(--theme-font)" }}
					>
						{albumName}
					</h2>
					{tagline && (
						<p className="text-xs italic mb-2" style={{ color: forcedLight ? "rgba(255,255,255,0.8)" : "var(--theme-text-muted)" }}>
							{tagline}
						</p>
					)}
					<div className="flex gap-1.5 mt-1 justify-center">
						<button type="button" style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }} className="px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
							<Camera size={10} /> Find My Face
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (theme.heroLayout === "centered") {
		return (
			<div
				className="rounded-xl backdrop-blur-xl border mb-3 flex flex-col items-center text-center p-4 space-y-2"
				style={{ background: "var(--theme-surface)", borderColor: "var(--theme-border)", borderRadius: "var(--theme-radius-tile)" }}
			>
				<h2
					className="text-lg font-black tracking-tight"
					style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font)" }}
				>
					{albumName}
				</h2>
				{tagline && (
					<p className="text-[11px] italic" style={{ color: "var(--theme-text-muted)" }}>
						{tagline}
					</p>
				)}
				<p className="text-[10px]" style={{ color: "var(--theme-text-muted)" }}>
					{imageCount} photos
				</p>
				<button type="button" style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }} className="px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
					<Camera size={10} /> Find My Face
				</button>
			</div>
		);
	}

	return (
		<div
			className="rounded-xl backdrop-blur-xl border mb-3 grid grid-cols-[1fr_auto] gap-3 p-4 items-center"
			style={{ background: "var(--theme-surface)", borderColor: "var(--theme-border)", borderRadius: "var(--theme-radius-tile)" }}
		>
			<div className="space-y-1 min-w-0">
				<h2
					className="text-base font-black tracking-tight truncate"
					style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font)" }}
				>
					{albumName}
				</h2>
				{tagline && (
					<p className="text-[10px] italic" style={{ color: "var(--theme-text-muted)" }}>
						{tagline}
					</p>
				)}
				<p className="text-[10px]" style={{ color: "var(--theme-text-muted)" }}>
					{imageCount} photos
				</p>
				<div className="flex gap-1.5 pt-1">
					<button type="button" style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }} className="px-2 py-1 rounded text-[9px] font-bold flex items-center gap-0.5">
						<Camera size={9} /> Find My Face
					</button>
					<button
						type="button"
						className="px-2 py-1 rounded text-[9px] font-bold border flex items-center gap-0.5"
						style={{ borderColor: "var(--theme-border)", color: "var(--theme-text-muted)", borderRadius: "var(--theme-radius-control)" }}
					>
						<Upload size={9} /> Contribute
					</button>
				</div>
			</div>
			<div
				className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
				style={{ ...accentStyle, borderRadius: "var(--theme-radius-control)" }}
			>
				<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
					<rect x="3" y="3" width="7" height="7" />
					<rect x="14" y="3" width="7" height="7" />
					<rect x="3" y="14" width="7" height="7" />
					<path d="M14 14h3M14 17h3M17 14v3" />
				</svg>
			</div>
		</div>
	);
};

const DEMO_IMAGES = [
	"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/31464056/pexels-photo-31464056.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=400",
	"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=400",
];

const PreviewContent = ({
	albumName,
	tagline,
	config,
}: { albumName: string; tagline?: string; config: ThemeConfig }) => {
	const theme = useTheme();
	const sections = theme.sections;
	const gridStyle = config.gridStyle ?? "bento";

	const previewGrid =
		gridStyle === "masonry" ? (
			<div className="columns-2 gap-1.5 w-full">
				{DEMO_IMAGES.map((url, i) => (
					<div key={i} className="break-inside-avoid mb-1.5 w-full rounded-lg overflow-hidden bg-zinc-200">
						<img src={url} alt="" className="w-full object-cover" loading="lazy" />
					</div>
				))}
			</div>
		) : (
			<div className="grid grid-cols-2 gap-1.5">
				{DEMO_IMAGES.map((url, i) => (
					<div key={i} className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-200" style={{ borderRadius: "var(--theme-radius-card)" }}>
						<img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
					</div>
				))}
			</div>
		);

	const SECTION_MAP: Record<string, React.ReactNode> = {
		hero: (
			<PreviewHero albumName={albumName} tagline={tagline} imageCount={DEMO_IMAGES.length} />
		),
		stats: theme.showStats ? (
			<div
				className="rounded-xl border mb-3 px-4 py-2 flex gap-4"
				style={{ background: "var(--theme-surface)", borderColor: "var(--theme-border)", borderRadius: "var(--theme-radius-card)" }}
			>
				{[["12", "Guests"], ["4", "Matches"], ["24h", "Active"]].map(([val, label]) => (
					<div key={label} className="text-center">
						<p className="text-sm font-black" style={{ color: "var(--theme-accent)" }}>{val}</p>
						<p className="text-[9px]" style={{ color: "var(--theme-text-muted)" }}>{label}</p>
					</div>
				))}
			</div>
		) : null,
		search: theme.showSearch ? (
			<div
				className="rounded-xl border mb-3 px-3 py-2 flex items-center gap-2"
				style={{ background: "var(--theme-surface)", borderColor: "var(--theme-border)", borderRadius: "var(--theme-radius-card)" }}
			>
				<svg className="w-3 h-3" style={{ color: "var(--theme-text-muted)" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
					<circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
				</svg>
				<span className="text-[10px]" style={{ color: "var(--theme-text-muted)" }}>Search photos…</span>
			</div>
		) : null,
		grid: previewGrid,
	};

	return (
		<>
			{sections.map((key) =>
				SECTION_MAP[key] ? (
					<React.Fragment key={key}>{SECTION_MAP[key]}</React.Fragment>
				) : null,
			)}
		</>
	);
};

export const SharedAlbumPagePreview = ({
	config,
	albumName = "Summer Wedding 2025",
	tagline,
	imageCount: _imageCount = 4,
}: PreviewProps) => {
	return (
		<ThemeProvider config={config}>
			<div
				className="w-full h-full min-h-0 overflow-y-auto rounded-xl p-3"
				style={{ background: "var(--theme-bg)", fontFamily: "var(--theme-font)" }}
			>
				<PreviewContent albumName={albumName} tagline={tagline} config={config} />
			</div>
		</ThemeProvider>
	);
};
