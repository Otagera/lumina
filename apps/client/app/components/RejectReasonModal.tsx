import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";

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

	return (
		<ConfirmModal
			isOpen={isOpen}
			onClose={onClose}
			onConfirm={handleConfirm}
			title={isBatch ? `Reject ${count} Photos` : "Reject Photo"}
			message={
				isBatch
					? `Are you sure you want to reject these ${count} photos? You can optionally provide a reason for the uploaders.`
					: "Are you sure you want to reject this photo? You can optionally provide a reason for the uploader."
			}
			confirmText="Reject"
			variant="danger"
		>
			<div className="mt-4 space-y-4">
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
		</ConfirmModal>
	);
};
