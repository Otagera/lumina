import { Button } from "@lumina/ui/components/ui/button";
import { Input } from "@lumina/ui/components/ui/input";
import { Camera, Link as LinkIcon, QrCode, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import QrScanButton from "../components/QrScanButton";
import { parseEventToken } from "../utils/eventToken";

export default function Home() {
	const [, setLocation] = useLocation();
	const [eventLink, setEventLink] = useState("");

	const goToEvent = useCallback(
		(token: string) => setLocation(`/e/${token}`),
		[setLocation],
	);

	const handleContinue = () => {
		const token = parseEventToken(eventLink);
		if (token) goToEvent(token);
	};

	return (
		<div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 px-4 py-6 sm:py-8 md:py-14">
			<div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-14">
				<header className="text-center space-y-4 md:space-y-6">
					<div className="inline-flex items-center px-3 py-1 font-black uppercase tracking-widest">
						Friendly Event Experience
					</div>
					<h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white text-balance">
						Find your event photos in seconds
					</h1>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-lg max-w-xl mx-auto text-pretty">
						Open your event link, take a selfie, and instantly discover every
						photo you are in.
					</p>
				</header>

				<section className="rounded-tile md:rounded-modal border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-5 md:p-8 space-y-5 shadow-xl">
					<Input
						id="event-link"
						type="text"
						label="Paste event link"
						value={eventLink}
						onChange={(e) => setEventLink(e.target.value)}
						placeholder="https://.../e/your-event-token"
						inputMode="url"
						autoCapitalize="none"
						autoCorrect="off"
						icon={<LinkIcon className="w-4 h-4" />}
					/>
					<Button
						type="button"
						size="lg"
						className="w-full h-12 rounded-control bg-sage text-zinc-950 hover:bg-sage/90 font-black uppercase tracking-wider"
						onClick={handleContinue}
						disabled={!eventLink.trim()}
					>
						Open event
					</Button>
					<div className="flex items-center gap-3">
						<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
						<span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
							or
						</span>
						<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
					</div>
					<QrScanButton onScanned={goToEvent} />
				</section>

				<section className="grid gap-4 sm:grid-cols-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
					{[
						{
							icon: <QrCode className="w-5 h-5 text-sage" />,
							title: "Join from QR",
							body: "Open the shared QR code from the event host.",
						},
						{
							icon: <Camera className="w-5 h-5 text-sage" />,
							title: "Take a Selfie",
							body: "Use camera or upload a clear face photo.",
						},
						{
							icon: <Sparkles className="w-5 h-5 text-sage" />,
							title: "Get Matches",
							body: "Instantly view photos where you appear.",
						},
					].map((item) => (
						<article
							key={item.title}
							className="rounded-card border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
						>
							<div className="w-10 h-10 rounded-control bg-sage/10 flex items-center justify-center">
								{item.icon}
							</div>
							<h2 className="font-bold text-zinc-900 dark:text-white">
								{item.title}
							</h2>
							<p className="text-sm text-zinc-500 dark:text-zinc-400">
								{item.body}
							</p>
						</article>
					))}
				</section>
			</div>
		</div>
	);
}
