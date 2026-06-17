import { createContext, useContext } from "react";
import type { ReactNode } from "react";

export type ThemePreset = "sage" | "rose" | "gold" | "dark";

interface ThemeTokens {
	accentBg: string;
	accentText: string;
	accentHover: string;
	accentShadow: string;
}

const PRESETS: Record<ThemePreset, ThemeTokens> = {
	sage: {
		accentBg: "bg-sage",
		accentText: "text-zinc-950",
		accentHover: "hover:bg-sage/90",
		accentShadow: "shadow-sage/25",
	},
	rose: {
		accentBg: "bg-rose-400",
		accentText: "text-white",
		accentHover: "hover:bg-rose-300",
		accentShadow: "shadow-rose-400/25",
	},
	gold: {
		accentBg: "bg-yellow-400",
		accentText: "text-zinc-950",
		accentHover: "hover:bg-yellow-300",
		accentShadow: "shadow-yellow-400/25",
	},
	dark: {
		accentBg: "bg-zinc-800",
		accentText: "text-zinc-50",
		accentHover: "hover:bg-zinc-700",
		accentShadow: "shadow-zinc-800/25",
	},
};

const ThemeContext = createContext<ThemeTokens>(PRESETS.sage);

export const ThemeProvider = ({
	preset,
	children,
}: {
	preset?: string | null;
	children: ReactNode;
}) => {
	const tokens = PRESETS[(preset as ThemePreset) ?? "sage"] ?? PRESETS.sage;
	return (
		<ThemeContext.Provider value={tokens}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
