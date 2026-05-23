import { useEffect, useState } from "react";

export const ThemeToggle = () => {
	const [theme, setTheme] = useState<"light" | "dark" | null>(null);

	// 1. Initial Load: Check localStorage and matchMedia
	useEffect(() => {
		const saved = localStorage.getItem("theme") as "light" | "dark" | null;
		if (saved) {
			setTheme(saved);
		} else {
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;
			setTheme(prefersDark ? "dark" : "light");
		}
	}, []);

	// 2. State Sync: Update document classes and localStorage
	useEffect(() => {
		if (!theme) return;

		const root = window.document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else {
			root.classList.remove("dark");
		}
		localStorage.setItem("theme", theme);
	}, [theme]);

	// 3. System Preference Watcher: Only update if user hasn't set a preference
	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e: MediaQueryListEvent) => {
			const hasUserPreference = localStorage.getItem("theme");
			if (!hasUserPreference) {
				setTheme(e.matches ? "dark" : "light");
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
	};

	// On the server and during initial hydration, theme is null.
	// We render a placeholder that matches what the server produces.
	if (!theme) return <div className="p-2 w-9 h-9" />;

	return (
		<button
			type="button"
			onClick={toggleTheme}
			className="p-2 rounded-control hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all focus:outline-none bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-95 group"
			aria-label={
				theme === "light" ? "Switch to dark theme" : "Switch to light theme"
			}
			title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
		>
			{theme === "light" ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-5 h-5 text-zinc-700 group-hover:text-sage transition-colors"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
					/>
				</svg>
			) : (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className="w-5 h-5 text-zinc-400 group-hover:text-yellow-400 transition-colors"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M3 12h2.25m.386-6.364l1.591 1.591M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
					/>
				</svg>
			)}
		</button>
	);
};
