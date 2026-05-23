import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Button } from "@lumina/ui/components/ui/button";
import { AlertTriangle, Camera, QrCode, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseEventToken } from "../utils/eventToken";

interface QrScanButtonProps {
	onScanned?: (token: string) => void;
}

/**
 * Big secondary scan button that opens an in-app camera viewport and
 * decodes event QR codes via @zxing/browser. On success, extracts the
 * event token from the payload and hands it back via `onScanned`.
 *
 * Falls back to a clear instruction panel when camera access is denied
 * or unavailable.
 */
export const QrScanButton = ({ onScanned }: QrScanButtonProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const controlsRef = useRef<IScannerControls | null>(null);

	const stopScanner = useCallback(() => {
		try {
			controlsRef.current?.stop();
		} catch {
			// noop
		}
		controlsRef.current = null;
	}, []);

	const close = useCallback(() => {
		stopScanner();
		setIsOpen(false);
		setError(null);
	}, [stopScanner]);

	useEffect(() => {
		if (!isOpen) return;
		let cancelled = false;
		const reader = new BrowserQRCodeReader();
		setError(null);

		const start = async () => {
			try {
				if (!videoRef.current) return;
				const controls = await reader.decodeFromConstraints(
					{ video: { facingMode: { ideal: "environment" } } },
					videoRef.current,
					(result, _err, scanControls) => {
						if (!result || cancelled) return;
						const token = parseEventToken(result.getText());
						if (!token) {
							setError(
								"QR code didn't include a valid event link. Try again.",
							);
							return;
						}
						scanControls.stop();
						controlsRef.current = null;
						setIsOpen(false);
						onScanned?.(token);
					},
				);
				if (cancelled) {
					controls.stop();
					return;
				}
				controlsRef.current = controls;
			} catch (err) {
				if (cancelled) return;
				const name = (err as { name?: string })?.name ?? "";
				if (name === "NotAllowedError" || name === "PermissionDeniedError") {
					setError(
						"Camera permission denied. Paste the event link above instead.",
					);
				} else if (name === "NotFoundError" || name === "OverconstrainedError") {
					setError(
						"No camera available. Paste the event link above instead.",
					);
				} else {
					setError(
						"Couldn't open the camera. Paste the event link above instead.",
					);
				}
			}
		};

		void start();

		return () => {
			cancelled = true;
			stopScanner();
		};
	}, [isOpen, onScanned, stopScanner]);

	return (
		<div className="space-y-3">
			<Button
				type="button"
				size="lg"
				variant="outline"
				className="w-full h-14 rounded-control border-2 border-sage/40 bg-sage/5 text-sage hover:bg-sage/10 font-black uppercase tracking-wider gap-2"
				onClick={() => setIsOpen(true)}
				aria-haspopup="dialog"
			>
				<QrCode className="w-4 h-4" />
				Scan event QR code
			</Button>
			{isOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Scan event QR code"
					className="fixed inset-0 z-140 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300"
				>
					<div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-modal overflow-hidden shadow-2xl flex flex-col">
						<button
							type="button"
							onClick={close}
							aria-label="Close scanner"
							className="absolute right-4 top-4 z-20 rounded-full p-3 bg-black/40 text-white hover:bg-black/60 transition-colors shadow-lg backdrop-blur-md focus-visible:ring-2 focus-visible:ring-sage"
						>
							<X className="w-5 h-5" />
						</button>
						<div className="relative aspect-square bg-zinc-950">
							<video
								ref={videoRef}
								className="absolute inset-0 w-full h-full object-cover"
								playsInline
								muted
								autoPlay
							>
								<track kind="captions" />
							</video>
							{!error && (
								<div className="absolute inset-0 pointer-events-none flex items-center justify-center">
									<div className="w-2/3 aspect-square rounded-tile border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
								</div>
							)}
							{error && (
								<div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 p-6">
									<div className="flex flex-col items-center gap-4 text-center max-w-xs">
										<AlertTriangle className="w-10 h-10 text-amber-500" />
										<p className="text-sm font-medium text-white/90">
											{error}
										</p>
									</div>
								</div>
							)}
						</div>
						<div className="p-4 bg-zinc-900 border-t border-white/5 flex items-center justify-between gap-3">
							<div className="flex items-center gap-2 text-white/70">
								<Camera className="w-4 h-4" />
								<span className="text-xs uppercase tracking-widest font-bold">
									Point at QR
								</span>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={close}
								className="h-10 rounded-control"
							>
								Cancel
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default QrScanButton;
