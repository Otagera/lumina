import type React from "react";
import { useState } from "react";

interface RejectReasonModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (reason: string) => void;
	isBatch?: boolean;
	count?: number;
}

const COMMON_REASONS = [
	"Blurry or low quality",
	"Duplicate photo",
	"Inappropriate content",
	"Not relevant to album",
	"Too many similar shots",
];

export const RejectReasonModal = ({
	isOpen,
	onClose,
	onConfirm,
	isBatch,
	count,
}: RejectReasonModalProps) => {
	const [reason, setReason] = useState("");

	const handleConfirm = () => {
		onConfirm(reason);
		setReason("");
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden="true"
			/>
			<div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 p-6 sm:p-8">
				<h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
					{isBatch ? `Reject ${count} Photos` : "Reject Photo"}
				</h2>
				<p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
					{isBatch
						? `Are you sure you want to reject these ${count} photos? You can optionally provide a reason for the uploaders.`
						: "Are you sure you want to reject this photo? You can optionally provide a reason for the uploader."}
				</p>
				<div className="space-y-4 mb-6">
					<div className="flex flex-wrap gap-2">
						{COMMON_REASONS.map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setReason(r)}
								className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
									reason === r
										? "bg-plum border-plum text-white shadow-lg shadow-plum/20"
										: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-plum/50"
								}`}
							>
								{r}
							</button>
						))}
					</div>
					<textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder="Or type a custom reason..."
						className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-plum/20 focus:border-plum outline-none min-h-[100px] text-zinc-900 dark:text-white"
					/>
				</div>
				<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-5 py-2.5 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-semibold active:scale-95 w-full sm:w-auto"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						className="px-5 py-2.5 text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all font-semibold active:scale-95 w-full sm:w-auto shadow-lg shadow-red-600/25"
					>
						Reject
					</button>
				</div>
			</div>
		</div>
	);
};
