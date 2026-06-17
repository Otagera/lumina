import { Download, Share, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "./standard/Button";

type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "lumina-install-dismissed";
const DISMISS_TTL = 30 * 1000;

export const InstallPrompt = () => {
	const { pathname } = useLocation();
	const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isDismissed, setIsDismissed] = useState(() => {
		const stored = localStorage.getItem(DISMISS_KEY);
		return stored ? Date.now() - Number(stored) < DISMISS_TTL : false;
	});

	useEffect(() => {
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any).standalone === true;
		setIsInstalled(isStandalone);

		const onBeforeInstall = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as InstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", () => setIsInstalled(true));
		return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
	}, []);

	const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

	const dismiss = () => {
		setIsDismissed(true);
		localStorage.setItem(DISMISS_KEY, String(Date.now()));
	};

	if (!pathname.startsWith("/share")) return null;
	if (isInstalled || isDismissed) return null;

	if (deferredPrompt) {
		return (
			<div className="fixed bottom-20 sm:bottom-4 left-1/2 z-110 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-card border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
				<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
					Install Lumina for faster loading offline.
				</p>
				<div className="mt-3 flex gap-2">
					<Button variant="outline" className="flex-1" onClick={dismiss}>
						Cancel
					</Button>
					<Button
						className="flex-[2]"
						onClick={async () => {
							await deferredPrompt.prompt();
							await deferredPrompt.userChoice;
							setDeferredPrompt(null);
						}}
					>
						<Download className="mr-2 h-4 w-4" /> Install app
					</Button>
				</div>
			</div>
		);
	}

	if (isIOS) {
		return (
			<div className="fixed bottom-20 sm:bottom-4 left-1/2 z-110 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-card border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 p-4 shadow-2xl backdrop-blur">
				<div className="flex justify-between items-start">
					<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
						Add to Home Screen on iPhone/iPad.
					</p>
					<button type="button" onClick={dismiss} className="text-zinc-400 hover:text-zinc-600 p-1 focus-ring rounded">
						<X className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
					Tap <Share className="mx-1 inline h-3.5 w-3.5" /> then choose <b>Add to Home Screen</b>.
				</p>
			</div>
		);
	}

	return null;
};
