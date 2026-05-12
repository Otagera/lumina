import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { InstallPrompt } from "~/components/InstallPrompt";
import { Route, Switch } from "wouter";
import EventPage from "./routes/event";
import Home from "./routes/home";
import NotFound from "./routes/not-found";

import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
		},
	},
});

export default function App() {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const savedTheme = localStorage.getItem("theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;

		if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
			setIsDark(true);
			document.documentElement.classList.add("dark");
		}
	}, []);

	const toggleTheme = () => {
		const newDark = !isDark;
		setIsDark(newDark);
		if (newDark) {
			document.documentElement.classList.add("dark");
			localStorage.setItem("theme", "dark");
		} else {
			document.documentElement.classList.remove("dark");
			localStorage.setItem("theme", "light");
		}
	};

	return (
		<QueryClientProvider client={queryClient}>
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
				{/* Global Theme Toggle */}
				<button
					onClick={toggleTheme}
					className="fixed top-4 left-4 z-[200] p-3 bg-white/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white rounded-2xl backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 shadow-xl transition-all active:scale-90"
					aria-label="Toggle dark mode"
				>
					{isDark ? <Sun size={20} /> : <Moon size={20} />}
				</button>

				<main>
					<Switch>
						<Route path="/" component={Home} />
						<Route path="/e/:token" component={EventPage} />
						<Route component={NotFound} />
					</Switch>
				</main>
				<InstallPrompt />
			</div>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
