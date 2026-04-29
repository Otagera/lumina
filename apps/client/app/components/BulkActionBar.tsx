import type React from "react";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { Button } from "./standard/Button";

interface BulkActionBarProps {
	selectedCount: number;
	totalCount?: number;
	onClear: () => void;
	onSelectAll?: () => void;
	onDelete?: () => void;
	onAddToAlbum?: () => void;
	onDownload?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
	selectedCount,
	totalCount,
	onClear,
	onSelectAll,
	onDelete,
	onAddToAlbum,
	onDownload,
}) => {
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);

	if (selectedCount === 0) return null;

	const isAllSelected = totalCount && selectedCount === totalCount;

	return (
		<>
			<div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] animate-in fade-in slide-in-from-bottom-8 duration-500 w-max max-w-[95vw]">
				<div className="bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/50 px-6 sm:px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar">
					<div className="flex items-center space-x-4 pr-6 sm:pr-8 border-r border-zinc-800/50">
						<button
							type="button"
							onClick={onSelectAll}
							className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90"
							title={isAllSelected ? "Unselect all" : "Select all"}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill={isAllSelected ? "currentColor" : "none"}
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d={isAllSelected ? "M5 12h14" : "M4 6h16v12H4z"}
								/>
							</svg>
						</button>
						<button
							type="button"
							onClick={onClear}
							className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-90"
							title="Clear selection"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2.5}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
						<span className="text-white font-black whitespace-nowrap text-sm sm:text-base tracking-tight">
							{selectedCount}{" "}
							<span className="text-zinc-500 font-medium ml-1">selected</span>
						</span>
					</div>

					<div className="flex items-center space-x-3">
						{onDownload && (
							<Button
								variant="primary"
								size="sm"
								onClick={onDownload}
								className="rounded-full shadow-lg shadow-sage/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								Download
							</Button>
						)}

						{onAddToAlbum && (
							<Button
								variant="outline"
								size="sm"
								onClick={onAddToAlbum}
								className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white rounded-full"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M12 4v16m8-8H4"
									/>
								</svg>
								Add to Album
							</Button>
						)}

						{onDelete && (
							<Button
								variant="danger"
								size="sm"
								onClick={() => setIsConfirmOpen(true)}
								className="rounded-full shadow-lg shadow-plum/10"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4 mr-2"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2.5}
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Delete
							</Button>
						)}
					</div>
				</div>
			</div>

			{onDelete && (
				<ConfirmModal
					isOpen={isConfirmOpen}
					title="Move to Trash"
					message={`Are you sure you want to move these ${selectedCount} photos to trash? They will be permanently deleted after 30 days if not restored.`}
					confirmText={`Move ${selectedCount} to Trash`}
					onConfirm={() => {
						onDelete();
						setIsConfirmOpen(false);
					}}
					onCancel={() => setIsConfirmOpen(false)}
					isDestructive={true}
				/>
			)}
		</>
	);
};
