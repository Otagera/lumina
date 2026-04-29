import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
	isRouteErrorResponse,
	Link,
	NavLink,
	Outlet,
	useNavigate,
} from "react-router-dom";

import type { Route } from "./+types/root";

Sentry.init({
	dsn: import.meta.env.VITE_SENTRY_DSN,
	environment: import.meta.env.MODE,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	integrations: [
		Sentry.replayIntegration(),
		Sentry.browserTracingIntegration(),
	],
});

import "./index.css";
import "./app.css";
import { NotificationDropdown } from "./components/NotificationDropdown";
import { Button } from "./components/standard/Button";
import { Card } from "./components/standard/Card";
import { Heading } from "./components/standard/Heading";
import { ThemeToggle } from "./components/ThemeToggle";
import { UploadManager } from "./components/UploadManager";
import { UsageIndicator } from "./components/UsageIndicator";
import { AuthProvider, useAuth } from "./utils/auth";
import { EventsProvider } from "./utils/EventsContext";
import { UploadProvider } from "./utils/UploadContext";

const Navbar = () => {
	const { isAuthenticated, logout } = useAuth();
	const navigate = useNavigate();
	const [isHydrated, setIsHydrated] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	useEffect(() => {
		setIsHydrated(true);
	}, []);

	const handleLogout = () => {
		logout();
		navigate("/login");
		setIsMobileMenuOpen(false);
	};

	return (
		<nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300">
			<div className="max-w-6xl mx-auto px-2 sm:px-6 py-2 sm:py-4 flex flex-wrap justify-between items-center gap-2">
				<Link
					to="/"
					className="group flex items-center space-x-1.5 sm:space-x-2"
				>
					<div className="w-6 h-6 sm:w-8 sm:h-8 bg-sage rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-sage/20 transition-transform group-hover:scale-110">
						<div className="w-2 h-2 sm:w-3 sm:h-3 bg-zinc-950 rounded-full" />
					</div>
					<span className="text-base sm:text-xl font-black tracking-tighter text-zinc-900 dark:text-white">
						lumina<span className="text-sage hidden sm:inline">.</span>io
					</span>
				</Link>

				{/* Desktop Navigation */}
				<div className="hidden sm:flex items-center gap-2">
					{isHydrated && isAuthenticated && (
						<>
							<div className="flex items-center gap-1">
								<NavLink
									to="/home"
									className={({ isActive }) =>
										`px-3 py-1.5 text-sm font-bold transition-colors ${
											isActive
												? "text-sage underline underline-offset-4 decoration-2"
												: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
										}`
									}
								>
									Home
								</NavLink>
								<NavLink
									to="/people"
									className={({ isActive }) =>
										`px-3 py-1.5 text-sm font-bold transition-colors ${
											isActive
												? "text-sage underline underline-offset-4 decoration-2"
												: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
										}`
									}
								>
									People
								</NavLink>
								<NavLink
									to="/settings"
									className={({ isActive }) =>
										`px-3 py-1.5 text-sm font-bold transition-colors ${
											isActive
												? "text-sage underline underline-offset-4 decoration-2"
												: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
										}`
									}
								>
									Settings
								</NavLink>
								<NavLink
									to="/trash"
									className={({ isActive }) =>
										`px-3 py-1.5 text-sm font-bold transition-colors ${
											isActive
												? "text-sage underline underline-offset-4 decoration-2"
												: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
										}`
									}
								>
									Trash
								</NavLink>
							</div>
							<div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
							<div className="flex items-center gap-1">
								<UsageIndicator />
								<NotificationDropdown />
							</div>
							<div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
							<button
								type="button"
								onClick={handleLogout}
								className="text-zinc-500 dark:text-zinc-400 hover:text-plum dark:hover:text-plum font-bold text-sm transition-colors px-3 py-1.5"
							>
								Logout
							</button>
						</>
					)}
					<ThemeToggle />
				</div>

				{/* Mobile Menu Button */}
				{isHydrated && isAuthenticated && (
					<button
						type="button"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						className="sm:hidden p-2 text-zinc-500 dark:text-zinc-400 hover:text-sage transition-colors"
					>
						{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				)}

				{/* Mobile Menu Dropdown */}
				{isMobileMenuOpen && isHydrated && isAuthenticated && (
					<div className="w-full sm:hidden mt-2 pb-4 space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
						<UsageIndicator />
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<ThemeToggle />
								<span className="text-xs text-zinc-500">Theme</span>
							</div>
							<NotificationDropdown />
						</div>
						<NavLink
							to="/home"
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`block py-2 text-sm font-bold transition-colors ${
									isActive
										? "text-sage underline underline-offset-4 decoration-2"
										: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
								}`
							}
						>
							Home
						</NavLink>
						<NavLink
							to="/people"
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`block py-2 text-sm font-bold transition-colors ${
									isActive
										? "text-sage underline underline-offset-4 decoration-2"
										: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
								}`
							}
						>
							People
						</NavLink>
						<NavLink
							to="/settings"
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`block py-2 text-sm font-bold transition-colors ${
									isActive
										? "text-sage underline underline-offset-4 decoration-2"
										: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
								}`
							}
						>
							Settings
						</NavLink>
						<NavLink
							to="/trash"
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`block py-2 text-sm font-bold transition-colors ${
									isActive
										? "text-sage underline underline-offset-4 decoration-2"
										: "text-zinc-500 dark:text-zinc-400 hover:text-sage dark:hover:text-sage"
								}`
							}
						>
							Trash
						</NavLink>
						<button
							type="button"
							onClick={handleLogout}
							className="block text-zinc-500 dark:text-zinc-400 hover:text-plum dark:hover:text-plum font-bold text-sm transition-colors py-2"
						>
							Logout
						</button>
					</div>
				)}
			</div>
		</nav>
	);
};

const AppContent = () => {
	return (
		<>
			<Navbar />
			<main className="w-full h-full">
				<Outlet />
			</main>
		</>
	);
};

export default function App() {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<EventsProvider>
					<UploadProvider>
						<AppContent />
						<UploadManager />
						<Toaster
							position="bottom-center"
							toastOptions={{
								style: {
									background: "oklch(20% 0.02 250 / 80%)",
									backdropFilter: "blur(20px) saturate(160%)",
									color: "#fff",
									border: "1px solid rgba(255,255,255,0.1)",
									borderRadius: "1.5rem",
									padding: "12px 20px",
									fontSize: "14px",
									fontWeight: "600",
									boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
								},
								success: {
									iconTheme: {
										primary: "oklch(58% 0.031 107.3)",
										secondary: "#fff",
									},
								},
								error: {
									iconTheme: {
										primary: "oklch(36.4% 0.029 323.89)",
										secondary: "#fff",
									},
								},
							}}
						/>
					</UploadProvider>
				</EventsProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 antialiased font-sans">
			<Card
				className="max-w-md w-full p-12 text-center border-none shadow-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl"
				hoverable={false}
			>
				<div className="w-20 h-20 bg-plum/10 text-plum rounded-[2rem] flex items-center justify-center mx-auto mb-8">
					<span className="text-4xl font-black">
						{message === "404" ? "404" : "!"}
					</span>
				</div>
				<Heading level={1} className="mb-4">
					{message}
				</Heading>
				<p className="text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed font-medium">
					{details}
				</p>
				<div className="flex flex-col space-y-3">
					<Button onClick={() => (window.location.href = "/home")}>
						Return to Home
					</Button>
				</div>
				{stack && (
					<div className="mt-12 text-left">
						<details className="cursor-pointer group">
							<summary className="text-xs text-zinc-500 font-bold uppercase tracking-widest group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
								Technical Stack Trace
							</summary>
							<pre className="mt-4 w-full p-6 overflow-x-auto bg-zinc-950 rounded-2xl text-[10px] font-mono text-plum/80 border border-zinc-800 leading-relaxed">
								<code>{stack}</code>
							</pre>
						</details>
					</div>
				)}
			</Card>
		</main>
	);
}
