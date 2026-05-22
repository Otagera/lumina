import { Button } from "@lumina/ui/components/ui/button";
import { Download, Share, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
	const [deferredPrompt, setDeferredPrompt] =
		useState<InstallPromptEvent | null>(null);
	const [isInstalled, setIsInstalled] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

	useEffect(() => {
		const isStandalone = window.matchMedia(
			"(display-mode: standalone)",
		).matches;
		setIsInstalled(
			isStandalone || (window.navigator as any).standalone === true,
		);

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as InstallPromptEvent);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", () => setIsInstalled(true));

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	const isIOS = useMemo(
		() => /iPad|iPhone|iPod/.test(window.navigator.userAgent),
		[],
	);

	if (isInstalled || isDismissed) return null;

	if (deferredPrompt) {
		return (
			<div className="fixed bottom-4 left-1/2 z-300 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-card border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
				<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
					Install Lumina for faster loading offline.
				</p>
				<div className="mt-3 flex gap-2">
					<Button
						variant="outline"
						className="flex-1"
						onClick={() => setIsDismissed(true)}
					>
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
			<div className="fixed bottom-4 left-1/2 z-300 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 rounded-card border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
				<div className="flex justify-between items-start">
					<p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
						Add to Home Screen on iPhone/iPad.
					</p>
					<button
						type="button"
						onClick={() => setIsDismissed(true)}
						className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
					Tap <Share className="mx-1 inline h-3.5 w-3.5" /> then choose{" "}
					<b>Add to Home Screen</b>.
				</p>
			</div>
		);
	}

	return null;
}
