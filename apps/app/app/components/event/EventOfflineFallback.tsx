import { Button } from "@lumina/ui/components/ui/button";
import { WifiOff } from "lucide-react";

interface EventOfflineFallbackProps {
	onRetry: () => void;
}

export function EventOfflineFallback({ onRetry }: EventOfflineFallbackProps) {
	return (
		<div className="mx-2 rounded-card border border-amber-300/50 bg-amber-50 p-6 text-center dark:border-amber-700/40 dark:bg-amber-950/30">
			<WifiOff className="mx-auto mb-3 h-10 w-10 text-amber-600" aria-hidden />
			<h2 className="text-xl font-bold">Connection is weak or offline</h2>
			<p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600 dark:text-zinc-300">
				We could not refresh this event right now. Cached photos will appear
				when available, and we'll retry automatically once signal returns.
			</p>
			<Button className="mt-4" onClick={onRetry}>
				Retry now
			</Button>
		</div>
	);
}
