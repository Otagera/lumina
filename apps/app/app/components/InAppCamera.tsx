import { Button } from "@lumina/ui/components/ui/button";
import {
	Camera,
	Image as ImageIcon,
	RefreshCw,
	Sparkles,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

interface InAppCameraProps {
	isOpen: boolean;
	onClose: () => void;
	onCapture: (file: File) => void;
}

export const InAppCamera = ({
	isOpen,
	onClose,
	onCapture,
}: InAppCameraProps) => {
	const webcamRef = useRef<Webcam>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
	const [isCapturing, setIsCapturing] = useState(false);
	const [mode, setMode] = useState<"camera" | "upload">("camera");
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (isOpen && mode === "camera") {
			setIsLoaded(false);
		}
	}, [isOpen, mode]);

	const toggleFacingMode = useCallback(() => {
		setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
	}, []);

	const handleCapture = useCallback(() => {
		if (!webcamRef.current) return;

		setIsCapturing(true);
		const imageSrc = webcamRef.current.getScreenshot();

		if (imageSrc) {
			fetch(imageSrc)
				.then((res) => res.blob())
				.then((blob) => {
					const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
					onCapture(file);
					onClose();
				})
				.finally(() => setIsCapturing(false));
		} else {
			setIsCapturing(false);
		}
	}, [webcamRef, onCapture, onClose]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onCapture(file);
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[140] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300"
			role="dialog"
			aria-modal="true"
			aria-label="Find your photos"
		>
			<div className="relative w-full max-w-[95vw] md:max-w-xl h-[85dvh] overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
				<button
					onClick={onClose}
					className="absolute right-4 top-4 z-20 rounded-full p-3 bg-zinc-100/80 dark:bg-black/40 text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-black/60 transition-colors shadow-lg backdrop-blur-md"
					aria-label="Close camera modal"
				>
					<X className="h-5 w-5" />
				</button>

				<div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950 overflow-hidden pt-12">
					{mode === "camera" ? (
						<>
							<Webcam
								audio={false}
								ref={webcamRef}
								screenshotFormat="image/jpeg"
								videoConstraints={{
									facingMode,
									width: 1280,
									height: 720,
								}}
								className="absolute inset-0 w-full h-full object-cover z-0"
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
								}}
								mirrored={facingMode === "user"}
								onUserMedia={() => setIsLoaded(true)}
								onUserMediaError={() => setIsLoaded(false)}
							/>
							{!isLoaded && (
								<div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-20">
									<div className="flex flex-col items-center gap-4">
										<div className="w-12 h-12 border-4 border-sage border-t-transparent rounded-full animate-spin" />
										<span className="text-zinc-500 dark:text-white/60 text-sm font-black uppercase tracking-widest">
											Initializing...
										</span>
									</div>
								</div>
							)}

							{/* Visual Guides */}
							<div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 z-30">
								<div className="w-full max-w-[260px] aspect-[3/4] border-2 border-white/20 rounded-[4rem] bg-white/5 backdrop-blur-[1px]" />
								<div className="mt-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
									<Sparkles className="w-4 h-4 text-sage" />
									<span className="text-white text-[10px] font-black uppercase tracking-widest">
										Face Search Active
									</span>
								</div>
							</div>
						</>
					) : (
						<div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
							<div className="w-24 h-24 bg-sage/10 rounded-[2.5rem] flex items-center justify-center animate-in zoom-in duration-500">
								<ImageIcon className="w-10 h-10 text-sage" />
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
									Upload Selfie
								</h3>
								<p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
									Pick a clear photo of your face from your device.
								</p>
							</div>
							<Button
								onClick={() => fileInputRef.current?.click()}
								size="lg"
								className="rounded-2xl px-10 h-14 bg-sage text-zinc-950 hover:bg-sage/90 font-black shadow-xl shadow-sage/20 border-none"
							>
								Select Photo
							</Button>
						</div>
					)}

					<input
						type="file"
						ref={fileInputRef}
						className="hidden"
						accept="image/*"
						onChange={handleFileChange}
					/>
				</div>

				{/* Controls */}
				<div className="p-6 pb-10 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40">
					<button
						onClick={() => setMode(mode === "camera" ? "upload" : "camera")}
						className="p-4 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 flex flex-col items-center gap-1 shadow-sm min-w-[70px]"
					>
						{mode === "camera" ? <Upload size={20} /> : <Camera size={20} />}
						<span className="text-[10px] font-black uppercase opacity-60 tracking-tighter">
							{mode === "camera" ? "Gallery" : "Camera"}
						</span>
					</button>

					{mode === "camera" ? (
						<button
							onClick={handleCapture}
							disabled={isCapturing}
							className="group relative p-1 bg-zinc-900 dark:bg-white rounded-full transition-all active:scale-95 disabled:opacity-50 shadow-2xl"
						>
							<div className="w-16 h-16 rounded-full border-4 border-zinc-100 dark:border-zinc-900 flex items-center justify-center bg-zinc-900 dark:bg-white group-hover:bg-zinc-800 dark:group-hover:bg-zinc-100 transition-colors">
								<div className="w-12 h-12 rounded-full border-2 border-zinc-700 dark:border-zinc-200" />
							</div>
							{isCapturing && (
								<div className="absolute inset-0 flex items-center justify-center">
									<RefreshCw className="w-8 h-8 text-sage animate-spin" />
								</div>
							)}
						</button>
					) : (
						<div className="w-16 h-16" />
					)}

					<button
						onClick={mode === "camera" ? toggleFacingMode : onClose}
						className="p-4 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-90 flex flex-col items-center gap-1 shadow-sm min-w-[70px]"
					>
						{mode === "camera" ? <RefreshCw size={20} /> : <X size={20} />}
						<span className="text-[10px] font-black uppercase opacity-60 tracking-tighter">
							{mode === "camera" ? "Flip" : "Close"}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};
