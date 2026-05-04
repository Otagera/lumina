import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import axiosAPI from "~/utils/axios";
import { imageKeys } from "~/utils/queryKeys";
import { deleteImage } from "~/utils/api";

export interface UseBatchActionsOptions {
	albumId: string;
}

export interface UseBatchActionsReturn {
	batchDelete: (imageIds: string[]) => Promise<void>;
	batchMove: (imageIds: string[], targetAlbumId: string) => Promise<void>;
	batchDownload: (imageIds: string[]) => Promise<void>;
	isProcessing: boolean;
}

export function useBatchActions({
	albumId,
}: UseBatchActionsOptions): UseBatchActionsReturn {
	const queryClient = useQueryClient();
	const [isProcessing, setIsProcessing] = useState(false);

	const deleteMutation = useMutation({
		mutationFn: deleteImage,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: imageKeys.album(albumId) });
		},
		onError: (error: Error) => {
			toast.error(error.message || "Failed to delete image");
		},
	});

	const batchDelete = async (imageIds: string[]) => {
		setIsProcessing(true);
		try {
			await Promise.all(imageIds.map((id) => deleteMutation.mutateAsync(id)));
			queryClient.invalidateQueries({ queryKey: imageKeys.album(albumId) });
			toast.success(`Successfully deleted ${imageIds.length} photos.`);
		} catch (error) {
			console.error("Batch deletion failed:", error);
			toast.error("Failed to delete some photos. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const batchMove = async (imageIds: string[], targetAlbumId: string) => {
		setIsProcessing(true);
		try {
			await axiosAPI.post(`/albums/${targetAlbumId}/images`, {
				imageIds,
			});
			queryClient.invalidateQueries({ queryKey: imageKeys.album(albumId) });
			queryClient.invalidateQueries({ queryKey: imageKeys.album(targetAlbumId) });
			toast.success(`Successfully moved ${imageIds.length} photos.`);
		} catch (error) {
			console.error("Batch add to album failed:", error);
			toast.error("Failed to move photos. Please try again.");
		} finally {
			setIsProcessing(false);
		}
	};

	const batchDownload = async (imageIds: string[]) => {
		if (imageIds.length === 0) {
			toast.error("No images selected");
			return;
		}

		const toastId = toast.loading(
			`Initiating ZIP generation for ${imageIds.length} photos...`,
		);

		try {
			const { data: res } = await axiosAPI.post("/images/bulk-download", {
				imageIds,
			});
			const jobId = res.data.jobId;

			let attempts = 0;
			const maxAttempts = 120;
			let completed = false;

			while (!completed && attempts < maxAttempts) {
				attempts++;
				const { data: statusRes } = await axiosAPI.get(
					`/images/bulk-download/${jobId}`,
				);
				const { state, downloadUrl } = statusRes.data;

				if (state === "completed" && downloadUrl) {
					toast.loading("Download ready, starting...", { id: toastId });

					const link = document.createElement("a");
					link.href = downloadUrl;
					link.download = `photos-${Date.now()}.zip`;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);

					toast.success("Download started!", { id: toastId });
					completed = true;
					break;
				}

				if (state === "failed") {
					throw new Error("ZIP generation failed on server.");
				}

				toast.loading(`Processing: ${state}...`, { id: toastId });
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}

			if (!completed) {
				throw new Error("Download generation timed out.");
			}
		} catch (error: unknown) {
			const err = error as Error;
			console.error("Bulk Download Error:", error);
			toast.error(err.message || "Failed to prepare download. Please try again.", {
				id: toastId,
			});
		}
	};

	return {
		batchDelete,
		batchMove,
		batchDownload,
		isProcessing,
	};
}