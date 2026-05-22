import { AlertTriangle, Info } from "lucide-react";
import type React from "react";
import { Modal } from "./standard/Modal";

interface ConfirmModalProps {
	isOpen: boolean;
	title: string;
	message: React.ReactNode;
	confirmText?: string;
	cancelText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	isDestructive?: boolean;
	isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
	isOpen,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	onConfirm,
	onCancel,
	isDestructive = true,
	isLoading = false,
}) => {
	if (!isOpen) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onCancel}
			size="sm"
			showCloseButton={false}
			closeOnBackdrop={!isLoading}
			title={
				<span className="flex items-center gap-4">
					<span
						className={`p-3 rounded-card flex-shrink-0 ${isDestructive
							? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
							: "bg-sage/10 text-sage"
							}`}
					>
						{isDestructive ? (
							<AlertTriangle className="h-6 w-6" />
						) : (
							<Info className="h-6 w-6" />
						)}
					</span>
					<span>{title}</span>
				</span>
			}
		>
			<div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
				{message}
			</div>

			<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					disabled={isLoading}
					className="px-5 py-2.5 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-control hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-semibold disabled:opacity-50 w-full sm:w-auto"
				>
					{cancelText}
				</button>
				<button
					type="button"
					onClick={onConfirm}
					disabled={isLoading}
					className={`px-5 py-2.5 text-white rounded-control transition-colors font-semibold disabled:opacity-50 w-full sm:w-auto flex items-center justify-center space-x-2 ${isDestructive
						? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/25"
						: "bg-sage hover:bg-sage/90 shadow-lg shadow-sage/25"
						}`}
				>
					{isLoading && (
						<svg
							className="animate-spin h-4 w-4 text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								className="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								strokeWidth="4"
							/>
							<path
								className="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							/>
						</svg>
					)}
					<span>{isLoading ? "Processing..." : confirmText}</span>
				</button>
			</div>
		</Modal>
	);
};
