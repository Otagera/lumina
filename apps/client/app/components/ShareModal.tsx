import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Link as LinkIcon, QrCode, Share2 } from "lucide-react";
import { useState } from "react";
import { QRCode } from "react-qrcode-logo";
import type { Album } from "~/types";
import { editAlbum } from "../utils/api";
import AlbumCover from "./AlbumCover";
import { Button } from "./standard/Button";
import { Modal } from "./standard/Modal";

interface ShareModalProps {
	album: Album;
	albumId: string;
	shareToken: string | null;
	qrColor?: string | null;
	qrLogoUrl?: string | null;
	creationDate?: string | Date | null;
	onClose: () => void;
	isOpen: boolean;
}

export const ShareModal = ({
	album,
	albumId,
	shareToken,
	qrColor,
	qrLogoUrl,
	creationDate,
	onClose,
	isOpen,
}: ShareModalProps) => {
	const albumName = album.albumName || "";
	const queryClient = useQueryClient();
	const [copied, setCopied] = useState(false);
	const [showQR, setShowQR] = useState(false);

	const shareMutation = useMutation({
		mutationFn: (token: string | null) =>
			editAlbum({ albumId, shareToken: token }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [`album-${albumId}`] });
		},
	});

	const handleToggleShare = () => {
		if (shareToken) {
			shareMutation.mutate(null);
		} else {
			// Generate a simple random token
			const newToken =
				Math.random().toString(36).substring(2, 15) +
				Math.random().toString(36).substring(2, 15);
			shareMutation.mutate(newToken);
		}
	};

	const guestAppUrl =
		import.meta.env.VITE_GUEST_APP_URL || "http://localhost:5174";
	const shareUrl = `${guestAppUrl}/e/${shareToken}`;

	const copyToClipboard = () => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const downloadQR = () => {
		const qrCanvas = document.querySelector(
			"#album-qr-canvas canvas",
		) as HTMLCanvasElement;
		if (!qrCanvas) return;

		const scale = 4;
		const width = 400 * scale;
		const height = 480 * scale; // No footer in download
		const cardRadius = 40 * scale;
		const margin = 30 * scale;

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// 1. Draw Card Background
		ctx.fillStyle = "#FFFFFF";
		ctx.beginPath();
		ctx.roundRect(0, 0, width, height, cardRadius);
		ctx.fill();

		// Helper to load images
		const loadImage = (src: string): Promise<HTMLImageElement> => {
			return new Promise((resolve, reject) => {
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			});
		};

		const drawCard = async () => {
			try {
				// 2. Draw Album Cover (Top Section)
				const coverSize = 60 * scale;
				const coverX = margin;
				const coverY = margin;
				const coverRadius = 12 * scale;

				const drawFallback = () => {
					ctx.fillStyle = "#F4F4F5"; // zinc-100
					ctx.beginPath();
					ctx.roundRect(coverX, coverY, coverSize, coverSize, coverRadius);
					ctx.fill();

					const initial = albumName ? albumName.charAt(0).toUpperCase() : "?";
					ctx.fillStyle = "#71717A"; // zinc-500
					ctx.font = `bold ${30 * scale}px Inter, system-ui, sans-serif`;
					ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillText(initial, coverX + coverSize / 2, coverY + coverSize / 2);
				};

				const coverImageUrl =
					typeof album.coverImage === "string"
						? album.coverImage
						: album.coverImage?.url || null;

				if (coverImageUrl) {
					try {
						const img = await loadImage(coverImageUrl);
						ctx.save();
						ctx.beginPath();
						ctx.roundRect(coverX, coverY, coverSize, coverSize, coverRadius);
						ctx.clip();

						const aspect = img.width / img.height;
						let drawW = coverSize;
						let drawH = coverSize;
						let offsetX = 0;
						let offsetY = 0;

						if (aspect > 1) {
							drawW = coverSize * aspect;
							offsetX = (coverSize - drawW) / 2;
						} else {
							drawH = coverSize / aspect;
							offsetY = (coverSize - drawH) / 2;
						}

						ctx.drawImage(
							img,
							coverX + offsetX,
							coverY + offsetY,
							drawW,
							drawH,
						);
						ctx.restore();
					} catch (e) {
						drawFallback();
					}
				} else {
					drawFallback();
				}

				// 3. Draw Album Name & Date
				const textX = coverX + coverSize + 15 * scale;
				ctx.fillStyle = "#18181B";
				ctx.font = `bold ${22 * scale}px Inter, system-ui, sans-serif`;
				ctx.textAlign = "left";
				ctx.textBaseline = "top";
				ctx.fillText(albumName, textX, coverY + 8 * scale);

				if (creationDate) {
					const dateStr = new Date(creationDate).toLocaleDateString("en-US", {
						month: "long",
						day: "numeric",
						year: "numeric",
					});
					ctx.fillStyle = "#71717A";
					ctx.font = `${14 * scale}px Inter, system-ui, sans-serif`;
					ctx.fillText(dateStr, textX, coverY + 36 * scale);
				}

				// 4. Draw Divider
				ctx.strokeStyle = "#F4F4F5";
				ctx.lineWidth = 1 * scale;
				ctx.beginPath();
				ctx.moveTo(margin, coverY + coverSize + 20 * scale);
				ctx.lineTo(width - margin, coverY + coverSize + 20 * scale);
				ctx.stroke();

				// 5. Draw QR Code (Center)
				const qrSize = 250 * scale;
				const qrX = (width - qrSize) / 2;
				const qrY = coverY + coverSize + 45 * scale;
				ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

				// 6. Download
				const pngFile = canvas.toDataURL("image/png");
				const downloadLink = document.createElement("a");
				downloadLink.download = `qr-${albumName}-gallery.png`;
				downloadLink.href = pngFile;
				downloadLink.click();
			} catch (err) {
				console.error("Failed to generate gallery card:", err);
				const downloadLink = document.createElement("a");
				downloadLink.download = `qr-${albumName}.png`;
				downloadLink.href = qrCanvas.toDataURL("image/png");
				downloadLink.click();
			}
		};

		drawCard();
	};

	const qrForeground = qrColor || "#6B8E7B"; // Sage color from app theme
	const qrLogo = qrLogoUrl || "/favicon-camera-color.svg";
	const formattedDate = creationDate
		? new Date(creationDate).toLocaleDateString("en-US", {
			month: "long",
			day: "numeric",
			year: "numeric",
		})
		: null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			title={
				<span className="flex items-center gap-2">
					<Share2 size={24} className="text-sage" /> Share Album
				</span>
			}
			description="Generate a public link for guests to view or contribute."
		>
			<div className="space-y-6 mt-4">
				<div className="flex items-center justify-between px-6 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-card">
					<div>
						<p className="font-bold text-zinc-900 dark:text-white">
							Public Sharing
						</p>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
							{shareToken ? "Link is active" : "Currently private"}
						</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={!!shareToken}
						aria-label={shareToken ? "Disable public sharing" : "Enable public sharing"}
						onClick={handleToggleShare}
						disabled={shareMutation.isPending}
						className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none ${shareToken
							? "bg-sage shadow-lg shadow-sage/20"
							: "bg-zinc-200 dark:bg-zinc-800"
							}`}
					>
						<span
							className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${shareToken ? "translate-x-7 shadow-sm" : "translate-x-1"
								}`}
						/>
					</button>
				</div>

				{shareToken && (
					<div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
						<div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-card">
							<button
								type="button"
								onClick={() => setShowQR(false)}
								aria-pressed={!showQR}
								className={`flex-1 py-2 rounded-control text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${!showQR ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
							>
								<LinkIcon size={14} /> Link
							</button>
							<button
								type="button"
								onClick={() => setShowQR(true)}
								aria-pressed={showQR}
								className={`flex-1 py-2 rounded-control text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showQR ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
							>
								<QrCode size={14} /> QR Code
							</button>
						</div>

						{!showQR ? (
							<div className="space-y-3">
								<p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
									Direct Access URL
								</p>
								<div className="flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-card">
									<input
										readOnly
										value={shareUrl}
										className="flex-1 px-3 bg-transparent text-xs text-zinc-600 dark:text-zinc-300 focus:outline-none font-mono truncate"
									/>
									<Button
										size="sm"
										onClick={copyToClipboard}
										className={`rounded-xl px-4 ${copied ? "bg-emerald-500 text-white" : ""}`}
									>
										{copied ? <Check size={16} /> : <Copy size={16} />}
									</Button>
								</div>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-2 animate-in zoom-in duration-300">
								<div className="p-4 bg-white dark:bg-zinc-900 rounded-modal shadow-xl border border-zinc-100 dark:border-zinc-800 w-full max-w-[280px]">
									<div className="flex items-center gap-3 mb-4">
										<div className="w-14 h-14 rounded-card overflow-hidden shadow-sm shrink-0">
											<AlbumCover album={album} className="w-full h-full" />
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="font-black text-base text-zinc-900 dark:text-white truncate">
												{albumName}
											</h3>
											{formattedDate && (
												<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
													{formattedDate}
												</p>
											)}
										</div>
									</div>

									<div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full mb-3" />

									<div className="flex justify-center p-1 bg-white rounded-card">
										<div id="album-qr-canvas">
											<QRCode
												value={shareUrl}
												size={180}
												qrStyle="dots"
												eyeRadius={12}
												fgColor={qrForeground}
												logoImage={qrLogo}
												logoWidth={36}
												logoHeight={36}
												logoPadding={5}
												logoPaddingStyle="square"
												quietZone={6}
											/>
										</div>
									</div>
								</div>

								<div className="flex items-center justify-center gap-2">
									<QrCode size={14} className="text-zinc-400" />
									<span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
										Scan to view album
									</span>
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={downloadQR}
									className="font-bold w-full"
								>
									Download QR Card
								</Button>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="mt-5">
				<Button
					variant="secondary"
					onClick={onClose}
					className="w-full py-3 font-bold"
				>
					Done
				</Button>
			</div>
		</Modal>
	);
};
