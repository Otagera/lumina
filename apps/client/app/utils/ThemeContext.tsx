import { createContext, useContext, useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { ThemeConfig } from "~/types";
import { DEFAULT_THEME, PRESET_MAP } from "./themePresets";

export type { ThemeConfig };

interface ThemeTokens {
	accentBg: string;
	accentText: string;
	accentHover: string;
	accentShadow: string;
	heroLayout: "two-col" | "centered" | "banner";
	heroMode: "solid" | "image" | "slideshow";
	heroImage?: string;
	heroSlideshow?: string[];
	sections: Array<"hero" | "stats" | "search" | "grid">;
	showStats: boolean;
	showSearch: boolean;
	gridStyle: "bento" | "uniform" | "masonry";
	cornerRadius: "rounded" | "sharp" | "pill";
	backgroundTexture: "none" | "noise" | "dots" | "grid-lines";
	brandingHandle?: string;
	brandingUrl?: string;
	showCoverInHero: boolean;
	config: ThemeConfig;
}

const FONT_URLS: Record<string, string> = {
	playfair:
		"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&display=swap",
	raleway:
		"https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap",
	"dm-sans":
		"https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap",
};

const FONT_FAMILIES: Record<string, string> = {
	inter: "Inter, system-ui, sans-serif",
	playfair: "'Playfair Display', serif",
	raleway: "Raleway, sans-serif",
	"dm-sans": "'DM Sans', sans-serif",
};

const TEXTURE_CSS: Record<string, string> = {
	none: "none",
	noise: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
	dots: "radial-gradient(circle, rgba(128,128,128,0.15) 1px, transparent 1px)",
	"grid-lines":
		"linear-gradient(rgba(128,128,128,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.08) 1px, transparent 1px)",
};

const TEXTURE_SIZE: Record<string, string> = {
	dots: "20px 20px",
	"grid-lines": "40px 40px",
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1], 16),
				g: Number.parseInt(result[2], 16),
				b: Number.parseInt(result[3], 16),
			}
		: null;
}

function getContrastFg(hex?: string): string {
	if (!hex) return "#FFFFFF";
	const rgb = hexToRgb(hex);
	if (!rgb) return "#FFFFFF";
	const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
	return luminance > 0.55 ? "#09090B" : "#FAFAFA";
}

function resolveBg(config: ThemeConfig): string {
	if (config.background === "gradient" && config.gradientFrom && config.gradientTo) {
		return `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`;
	}
	if (config.background === "dark") return "#09090B";
	return "#FAFAFA";
}

function resolveSurface(config: ThemeConfig): string {
	if (config.background === "dark") return "rgba(24,24,27,0.85)";
	return "rgba(255,255,255,0.85)";
}

function resolveBorder(config: ThemeConfig): string {
	if (config.background === "dark") return "rgba(255,255,255,0.08)";
	return "rgba(0,0,0,0.08)";
}

function resolveTextPrimary(config: ThemeConfig): string {
	if (config.background === "dark") return "#F4F4F5";
	return "#09090B";
}

function resolveTextSecondary(config: ThemeConfig): string {
	if (config.background === "dark") return "#A1A1AA";
	return "#71717A";
}

function resolveCssVars(config: ThemeConfig): CSSProperties {
	const accent = config.accent ?? "#7C9A7E";
	const accentFg = getContrastFg(accent);
	const cr = config.cornerRadius ?? "rounded";
	return {
		"--theme-accent": accent,
		"--theme-accent-fg": accentFg,
		"--theme-bg": resolveBg(config),
		"--theme-surface": resolveSurface(config),
		"--theme-border": resolveBorder(config),
		"--theme-font": FONT_FAMILIES[config.font ?? "inter"] ?? FONT_FAMILIES.inter,
		"--theme-text": resolveTextPrimary(config),
		"--theme-text-muted": resolveTextSecondary(config),
		"--theme-radius-tile": cr === "sharp" ? "0px" : cr === "pill" ? "24px" : "20px",
		"--theme-radius-card": cr === "sharp" ? "0px" : cr === "pill" ? "20px" : "16px",
		"--theme-radius-control": cr === "sharp" ? "4px" : cr === "pill" ? "999px" : "10px",
	} as CSSProperties;
}

function resolveConfig(presetOrConfig?: string | ThemeConfig | null): ThemeConfig {
	if (!presetOrConfig) return DEFAULT_THEME;
	if (typeof presetOrConfig === "string") {
		return PRESET_MAP[presetOrConfig] ?? DEFAULT_THEME;
	}
	return presetOrConfig;
}

function buildTokens(config: ThemeConfig): ThemeTokens {
	const accent = config.accent ?? "#7C9A7E";
	const accentFg = getContrastFg(accent);

	return {
		accentBg: `bg-[${accent}]`,
		accentText: accentFg === "#09090B" ? "text-zinc-950" : "text-zinc-50",
		accentHover: "hover:opacity-90",
		accentShadow: "shadow-black/20",
		heroLayout: config.heroLayout ?? "two-col",
		heroMode: config.heroMode ?? "solid",
		heroImage: config.heroImage,
		heroSlideshow: config.heroSlideshow,
		sections: config.sections ?? ["hero", "stats", "search", "grid"],
		showStats: config.showStats !== false,
		showSearch: config.showSearch !== false,
		gridStyle: config.gridStyle ?? "bento",
		cornerRadius: config.cornerRadius ?? "rounded",
		backgroundTexture: config.backgroundTexture ?? "none",
		brandingHandle: config.brandingHandle,
		brandingUrl: config.brandingUrl,
		showCoverInHero: config.showCoverInHero ?? false,
		config,
	};
}

function injectFont(font?: string) {
	if (!font || font === "inter") return;
	const url = FONT_URLS[font];
	if (!url) return;
	if (document.querySelector(`link[href="${url}"]`)) return;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = url;
	document.head.appendChild(link);
}

const ThemeContext = createContext<ThemeTokens>(buildTokens(DEFAULT_THEME));

export const ThemeProvider = ({
	preset,
	config: configProp,
	children,
}: {
	preset?: string | null;
	config?: ThemeConfig | null;
	children: ReactNode;
}) => {
	const resolvedConfig = configProp ? configProp : resolveConfig(preset);

	const cssVars = resolveCssVars(resolvedConfig);
	const tokens = buildTokens(resolvedConfig);
	const texture = resolvedConfig.backgroundTexture ?? "none";

	const fontRef = useRef<string | undefined>(undefined);
	useEffect(() => {
		const font = resolvedConfig.font;
		if (font !== fontRef.current) {
			fontRef.current = font;
			injectFont(font);
		}
	}, [resolvedConfig.font]);

	return (
		<ThemeContext.Provider value={tokens}>
			<div style={cssVars as React.CSSProperties}>
				{texture !== "none" && (
					<div
						className="pointer-events-none fixed inset-0 z-0"
						style={{
							backgroundImage: TEXTURE_CSS[texture],
							backgroundSize: TEXTURE_SIZE[texture] ?? "auto",
						}}
						aria-hidden
					/>
				)}
				<div className={texture !== "none" ? "relative z-[1]" : undefined}>
					{children}
				</div>
			</div>
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
