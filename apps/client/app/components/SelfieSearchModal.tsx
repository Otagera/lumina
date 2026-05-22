import { useSelfieSearch } from "@lumina/event-sdk";
import { InAppCamera } from "@lumina/ui/components/domain/InAppCamera";
import type React from "react";
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
		},
		onError: (err: any) => {
			toast.error(
				err.response?.data?.message || err.message || "Search failed",
			);
		},
	});

	const handleCapture = (file: File) => {
		const toastId = toast.loading("Finding matching photos...");
		searchMutation
			.mutateAsync(file)
			.finally(() => toast.dismiss(toastId));
	};

	return <InAppCamera isOpen onClose={onClose} onCapture={handleCapture} />;
};
