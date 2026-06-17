import { Plus } from "lucide-react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { useUpload } from "~/utils/UploadContext";

interface QuickContributeProps {
	albumId: string;
	requiresApproval: boolean;
}

export const QuickContribute = ({ albumId, requiresApproval }: QuickContributeProps) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { addUploads } = useUpload();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const toastId = toast.loading("Uploading photo...");
		try {
			const fileList = e.target.files!;
			addUploads(
				fileList,
				albumId,
				requiresApproval ? "PENDING" : "APPROVED",
			);
			toast.success(
				requiresApproval ? "Photo submitted for approval!" : "Photo added!",
				{ id: toastId },
			);
		} catch {
			toast.error("Upload failed. Please try again.", { id: toastId });
		} finally {
			if (inputRef.current) inputRef.current.value = "";
		}
	};

	return (
		<label className="flex-1 cursor-pointer">
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="sr-only"
				aria-label="Add a photo from your gallery"
				onChange={handleChange}
			/>
			<span className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 rounded-control text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 min-h-[44px] w-full">
				<Plus className="w-4 h-4" aria-hidden />
				Add Photo
			</span>
		</label>
	);
};
