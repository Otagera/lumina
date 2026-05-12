import type React from "react";
import { useRef, useState } from "react";
import { useSelfieSearch } from "@lumina/event-sdk";
import toast from "react-hot-toast";
import { publicEventClient } from "~/hooks/usePublicEventClient";

interface SelfieSearchModalProps {
	token: string;
	onClose: () => void;
	onResults: (results: any[]) => void;
}

export const SelfieSearchModal: React.FC<SelfieSearchModalProps> = ({
	token,
	onClose,
	onResults,
}) => {
	const [mode, setViewMode] = useState<"choice" | "camera" | "upload">(
		"choice",
	);
	const [isProcessing, setIsProcessing] = useState(false);
	const [capturedImage, setCapturedImage] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const startCamera = async () => {
		setViewMode("camera");
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "user" },
			});
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}
		} catch (err) {
			console.error("Camera access error:", err);
			toast.error("Could not access camera. Please try uploading a photo.");
			setViewMode("choice");
		}
	};

	const stopCamera = () => {
		if (videoRef.current?.srcObject) {
			const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
			for (const track of tracks) track.stop();
		}
	};

	const capturePhoto = () => {
		if (videoRef.current && canvasRef.current) {
			const video = videoRef.current;
			const canvas = canvasRef.current;
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext("2d");
			ctx?.drawImage(video, 0, 0);
			const dataUrl = canvas.toDataURL("image/jpeg");
			setCapturedImage(dataUrl);
			stopCamera();
		}
	};

	const searchMutation = useSelfieSearch({
	token,
	client: publicEventClient,
	onSuccess: (result) => {
		if (result.faces.length === 0) {
			toast.error("No matches found in this album.");
			return;
		}
		toast.success(`Found ${result.faces.length} photos of you!`);
		onResults(result.faces);
		onClose();
	},
	onError: (err: any) => {
		toast.error(err.response?.data?.message || err.message || "Search failed");
	},
});

const handleSearch = async (blob: Blob) => {
	setIsProcessing(true);
	try {
		await searchMutation.mutateAsync(blob);
	} finally {
		setIsProcessing(false);
	}
};

const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			handleSearch(file);
		}
	};

	const submitCaptured = () => {
		if (capturedImage) {
			fetch(capturedImage)
				.then((res) => res.blob())
				.then((blob) => handleSearch(blob));
		}
	};

	return (
		<div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4">
			<div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
				<button
					type="button"
					onClick={() => {
						stopCamera();
						onClose();
					}}
					className="absolute top-6 right-6 p-2 bg-zinc-800 text-zinc-400 hover:text-white rounded-full z-50 transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>

				<div className="p-8 sm:p-12">
					<div className="text-center mb-10">
						<div className="w-16 h-16 bg-sage/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-sage/20">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8 text-sage"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z"
								/>
							</svg>
						</div>
						<h2 className="text-3xl font-black text-white tracking-tight mb-2">
							Find your photos
						</h2>
						<p className="text-zinc-400 font-medium">
							Use AI to scan this album for your face
						</p>
					</div>

					{mode === "choice" && (
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<button
								type="button"
								onClick={startCamera}
								className="p-8 bg-zinc-800/50 border border-zinc-700/50 rounded-[32px] hover:border-sage/50 hover:bg-zinc-800 transition-all group flex flex-col items-center"
							>
								<div className="w-12 h-12 bg-sage rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-6 w-6 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</div>
								<span className="text-white font-bold">Take Selfie</span>
								<span className="text-[10px] text-zinc-500 uppercase mt-1">
									Live Preview
								</span>
							</button>

							<label className="p-8 bg-zinc-800/50 border border-zinc-700/50 rounded-[32px] hover:border-sage/50 hover:bg-zinc-800 transition-all group flex flex-col items-center cursor-pointer">
								<input
									type="file"
									className="hidden"
									accept="image/*"
									onChange={handleUpload}
								/>
								<div className="w-12 h-12 bg-zinc-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-6 w-6 text-white"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"
										/>
									</svg>
								</div>
								<span className="text-white font-bold">Upload Photo</span>
								<span className="text-[10px] text-zinc-500 uppercase mt-1">
									From Gallery
								</span>
							</label>
						</div>
					)}

					{mode === "camera" && (
						<div className="space-y-6">
							<div className="relative aspect-[4/3] bg-black rounded-[32px] overflow-hidden border border-zinc-800">
								{!capturedImage ? (
									<video
										ref={videoRef}
										autoPlay
										playsInline
										className="w-full h-full object-cover"
									/>
								) : (
									<img
										src={capturedImage}
										alt="Captured"
										className="w-full h-full object-cover"
									/>
								)}
								<canvas ref={canvasRef} className="hidden" />
							</div>

							<div className="flex space-x-3">
								{!capturedImage ? (
									<button
										type="button"
										onClick={capturePhoto}
										className="flex-1 py-4 bg-sage text-white font-bold rounded-2xl hover:bg-sage/90 transition-all shadow-lg active:scale-95"
									>
										Capture
									</button>
								) : (
									<>
										<button
											type="button"
											onClick={submitCaptured}
											disabled={isProcessing}
											className="flex-1 py-4 bg-sage text-white font-bold rounded-2xl hover:bg-sage/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
										>
											{isProcessing ? "Searching..." : "Use this photo"}
										</button>
										<button
											type="button"
											onClick={() => {
												setCapturedImage(null);
												startCamera();
											}}
											className="px-6 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
										>
											Retake
										</button>
									</>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
