import { Camera, Link as LinkIcon, QrCode } from "lucide-react";
import { useState } from "react";

const PHONE_WRAP =
	"mx-auto w-full max-w-md rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-5";

const HEADING = (
	<>
		<p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
			Guest landing
		</p>
		<h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
			Find your photos
		</h2>
		<p className="text-sm text-zinc-500 dark:text-zinc-400">
			Open your event link or scan the QR code.
		</p>
	</>
);

export function QrBigButton() {
	return (
		<div className={PHONE_WRAP}>
			<div className="space-y-1.5">{HEADING}</div>
			<div className="space-y-2">
				<label
					htmlFor="qr-a-link"
					className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
				>
					Paste event link
				</label>
				<div className="relative">
					<LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
					<input
						id="qr-a-link"
						type="text"
						placeholder="https://.../e/your-event-token"
						className="w-full h-12 rounded-control border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-10 pr-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-sage"
					/>
				</div>
			</div>
			<button
				type="button"
				className="w-full h-12 rounded-control bg-sage text-zinc-950 text-sm font-black uppercase tracking-wider"
			>
				Open event
			</button>
			<div className="flex items-center gap-3">
				<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
				<span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
					or
				</span>
				<div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
			</div>
			<button
				type="button"
				className="w-full h-12 rounded-control border-2 border-sage/40 bg-sage/5 text-sage text-sm font-black uppercase tracking-wider inline-flex items-center justify-center gap-2"
			>
				<QrCode className="w-4 h-4" />
				Scan QR code
			</button>
		</div>
	);
}

export function QrInputIntegrated() {
	return (
		<div className={PHONE_WRAP}>
			<div className="space-y-1.5">{HEADING}</div>
			<div className="relative">
				<LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
				<input
					type="text"
					placeholder="Paste link or tap scan"
					className="w-full h-14 rounded-control border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-10 pr-14 text-sm text-zinc-900 dark:text-white outline-none focus:border-sage"
				/>
				<button
					type="button"
					aria-label="Scan QR code"
					className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-control bg-sage/15 text-sage flex items-center justify-center focus-visible:ring-2 focus-visible:ring-sage"
				>
					<QrCode className="w-5 h-5" />
				</button>
			</div>
			<button
				type="button"
				className="w-full h-12 rounded-control bg-sage text-zinc-950 text-sm font-black uppercase tracking-wider"
			>
				Continue
			</button>
			<p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
				Tap the QR icon to scan instead.
			</p>
		</div>
	);
}

export function QrTabSwitcher() {
	const [tab, setTab] = useState<"paste" | "scan">("paste");
	return (
		<div className={PHONE_WRAP}>
			<div className="space-y-1.5">{HEADING}</div>
			<div className="grid grid-cols-2 gap-1 p-1 rounded-control bg-zinc-100 dark:bg-zinc-800">
				{(["paste", "scan"] as const).map((t) => (
					<button
						key={t}
						type="button"
						onClick={() => setTab(t)}
						aria-pressed={tab === t}
						className={`h-10 rounded-control text-xs font-black uppercase tracking-wider transition-colors ${
							tab === t
								? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
								: "text-zinc-500 dark:text-zinc-400"
						}`}
					>
						{t === "paste" ? "Paste link" : "Scan QR"}
					</button>
				))}
			</div>
			{tab === "paste" ? (
				<div className="relative">
					<LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
					<input
						type="text"
						placeholder="https://.../e/your-event-token"
						className="w-full h-12 rounded-control border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 pl-10 pr-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-sage"
					/>
				</div>
			) : (
				<div className="aspect-square rounded-tile border-2 border-dashed border-sage/40 bg-sage/5 flex items-center justify-center text-sage">
					<div className="text-center space-y-2">
						<Camera className="w-10 h-10 mx-auto" />
						<p className="text-xs font-bold uppercase tracking-widest">
							Camera viewfinder
						</p>
					</div>
				</div>
			)}
			<button
				type="button"
				className="w-full h-12 rounded-control bg-sage text-zinc-950 text-sm font-black uppercase tracking-wider"
			>
				{tab === "paste" ? "Open event" : "Start scan"}
			</button>
		</div>
	);
}
