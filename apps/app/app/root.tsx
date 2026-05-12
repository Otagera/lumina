import { Button } from "@lumina/ui/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AlertCircle, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { InstallPrompt } from "~/components/InstallPrompt";
import {
	isRouteErrorResponse,
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from "react-router";

import "./index.css";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#09090b" />
				<Meta />
				<Links />
			</head>
			<body className="antialiased font-sans transition-colors duration-300">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export function ErrorBoundary() {
	const error = useRouteError();

	return (
		<div className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6 bg-zinc-50 dark:bg-zinc-950">
			<div className="p-6 bg-red-100 dark:bg-red-900/20 rounded-[3rem]">
				<AlertCircle className="w-16 h-16 text-red-500" />
			</div>
			<div className="space-y-2">
				<h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase">
					{isRouteErrorResponse(error)
						? `${error.status} ${error.statusText}`
						: error instanceof Error
							? error.message
							: "Unexpected Error"}
				</h1>
				<p className="text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
					Something went wrong. Our team of highly trained monkeys is
					investigating.
				</p>
			</div>
			<Link to="/">
				<Button size="lg" className="rounded-2xl px-8">
					Refresh Page
				</Button>
			</Link>
		</div>
	);
}

export default function Root() {
	const [isDark, setIsDark] = useState(false);
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
					},
				},
			}),
	);

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
					<Outlet />
				</main>
				<InstallPrompt />
			</div>
			<ReactQueryDevtools initialIsOpen={false} />
		</QueryClientProvider>
	);
}
