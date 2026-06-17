import type { ThemeConfig } from "~/types";

export interface PresetMeta {
	key: string;
	label: string;
	description: string;
	swatches: string[];
	config: ThemeConfig;
}

export const THEME_PRESETS: PresetMeta[] = [
	{
		key: "wedding",
		label: "Wedding Classic",
		description: "Elegant & timeless",
		swatches: ["#C8A97E", "#FAFAF5", "#1C1917"],
		config: {
			preset: "wedding",
			accent: "#C8A97E",
			background: "light",
			font: "playfair",
			heroLayout: "centered",
			showStats: true,
			showSearch: true,
			sections: ["hero", "stats", "search", "grid"],
		},
	},
	{
		key: "dark-luxe",
		label: "Dark Luxe",
		description: "Moody & sophisticated",
		swatches: ["#A78BFA", "#09090B", "#F4F4F5"],
		config: {
			preset: "dark-luxe",
			accent: "#A78BFA",
			background: "dark",
			font: "dm-sans",
			heroLayout: "two-col",
			showStats: true,
			showSearch: true,
			sections: ["hero", "stats", "search", "grid"],
		},
	},
	{
		key: "garden",
		label: "Garden Party",
		description: "Fresh & natural",
		swatches: ["#7C9A7E", "#E8F5E9", "#1B4332"],
		config: {
			preset: "garden",
			accent: "#7C9A7E",
			background: "gradient",
			gradientFrom: "#E8F5E9",
			gradientTo: "#F0FDF4",
			font: "raleway",
			heroLayout: "centered",
			showStats: true,
			showSearch: true,
			sections: ["hero", "stats", "search", "grid"],
		},
	},
	{
		key: "minimal",
		label: "Minimal",
		description: "Clean & focused",
		swatches: ["#18181B", "#FAFAFA", "#71717A"],
		config: {
			preset: "minimal",
			accent: "#18181B",
			background: "light",
			font: "inter",
			heroLayout: "two-col",
			showStats: false,
			showSearch: true,
			sections: ["hero", "search", "grid"],
		},
	},
	{
		key: "editorial",
		label: "Editorial",
		description: "Bold & dramatic",
		swatches: ["#E11D48", "#09090B", "#FFF1F2"],
		config: {
			preset: "editorial",
			accent: "#E11D48",
			background: "dark",
			font: "playfair",
			heroLayout: "banner",
			heroMode: "slideshow",
			heroSlideshow: [
				"https://images.pexels.com/photos/6579100/pexels-photo-6579100.jpeg?auto=compress&cs=tinysrgb&w=1200",
				"https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=1200",
			],
			showStats: true,
			showSearch: false,
			sections: ["hero", "grid", "stats"],
		},
	},
	{
		key: "party",
		label: "Party Mode",
		description: "Vibrant & energetic",
		swatches: ["#F59E0B", "#1C1917", "#FEF3C7"],
		config: {
			preset: "party",
			accent: "#F59E0B",
			background: "dark",
			font: "dm-sans",
			heroLayout: "banner",
			heroMode: "slideshow",
			heroSlideshow: [
				"https://images.pexels.com/photos/31851041/pexels-photo-31851041.jpeg?auto=compress&cs=tinysrgb&w=1200",
				"https://images.pexels.com/photos/7114417/pexels-photo-7114417.jpeg?auto=compress&cs=tinysrgb&w=1200",
			],
			showStats: true,
			showSearch: false,
			sections: ["hero", "grid", "stats"],
		},
	},
];

export const PRESET_MAP: Record<string, ThemeConfig> = Object.fromEntries(
	THEME_PRESETS.map((p) => [p.key, p.config]),
);

export const DEFAULT_THEME: ThemeConfig = PRESET_MAP.garden;
