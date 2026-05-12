import { useMutation } from "@tanstack/react-query";
import type { PublicEventClient } from "../api/public.client";

export const selfieSearchKeys = {
	all: ["selfie-search"] as const,
	album: (token: string) => [...selfieSearchKeys.all, token] as const,
};

export const useSelfieSearch = ({
	token,
	client,
	onSuccess,
	onError,
}: {
	token?: string;
	client: PublicEventClient;
	onSuccess?: (result: { faces: any[] }) => void;
	onError?: (error: unknown) => void;
}) => {
	return useMutation({
		mutationKey: token ? selfieSearchKeys.album(token) : selfieSearchKeys.all,
		mutationFn: (selfie: File | Blob) =>
			client.searchPublicAlbumBySelfie(token as string, selfie),
		onSuccess,
		onError,
	});
};
