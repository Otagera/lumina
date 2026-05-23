import { Button } from "@lumina/ui/components/ui/button";
import { Camera, Scan } from "lucide-react";

interface EventSelfieActionProps {
	selfiePreview: string | null;
	isPending: boolean;
	onOpenCamera: () => void;
	onClearSelfie: () => void;
}

export function EventSelfieAction({
	selfiePreview,
	isPending,
	onOpenCamera,
	onClearSelfie,
}: EventSelfieActionProps) {
	return (
		<div className="flex flex-col items-center justify-center space-y-6 px-4">
			{!selfiePreview ? (
				<Button
					size="md"
					className="w-full sm:w-auto h-12 px-6 sm:px-8 rounded-control shadow-xl shadow-sage/20 bg-sage hover:bg-sage/90 text-zinc-950 border-none font-bold"
					onClick={onOpenCamera}
					disabled={isPending}
				>
					{isPending ? (
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
							Finding you...
						</div>
					) : (
						<>
							<Scan className="w-4 h-4 mr-2" aria-hidden />
							Find My Photos
						</>
					)}
				</Button>
			) : (
				<div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-500">
					<div className="relative">
						<img
							src={selfiePreview}
							alt="Your selfie"
							className="w-24 h-24 rounded-tile object-cover border-4 border-sage shadow-2xl"
						/>
						<button
							type="button"
							onClick={onOpenCamera}
							aria-label="Retake selfie"
							className="absolute -bottom-1 -right-1 p-3 bg-white dark:bg-zinc-800 rounded-control shadow-lg border border-zinc-200 dark:border-zinc-700 focus-ring"
						>
							<Camera className="w-4 h-4 text-zinc-600 dark:text-zinc-400" aria-hidden />
						</button>
					</div>
					<div className="flex flex-col items-center">
						<p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tighter">
							Matched Results
						</p>
						<Button
							variant="link"
							size="sm"
							onClick={onClearSelfie}
							className="text-zinc-400 h-auto p-0"
						>
							Clear & view highlights
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
