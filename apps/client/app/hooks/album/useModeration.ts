import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { imageKeys } from "~/utils/queryKeys";
import { moderateImages } from "~/utils/api";
import type { ImageStatus } from "~/types";

export interface UseModerationOptions {
	albumId: string;
}

export interface UseModerationReturn {
	moderate: (status: ImageStatus, imageIds: string[], reason?: string) => void;
	moderateSingle: (status: ImageStatus, imageId: string, reason?: string) => void;
	isPending: boolean;
}

export function useModeration({ albumId }: UseModerationOptions): UseModerationReturn {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: ({
			imageIds,
			status,
			reason,
		}: {
			imageIds: string[];
			status: ImageStatus;
			reason?: string;
		}) => moderateImages(albumId, imageIds, status, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.album(albumId) });
			toast.success("Action completed successfully");
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to moderate images");
		},
	});

	const moderate = (status: ImageStatus, imageIds: string[], reason?: string) => {
		if (imageIds.length === 0) return;
		mutation.mutate({ 
			imageIds, 
			status: status === "REJECTED" ? "REJECTED" : "APPROVED", 
			reason 
		});
	};

	const moderateSingle = (status: ImageStatus, imageId: string, reason?: string) => {
		moderate(status, [imageId], reason);
	};

	return {
		moderate,
		moderateSingle,
		isPending: mutation.isPending,
	};
}