import { useQuery } from "@tanstack/react-query";
import type { PublicEventClient } from "../api/public.client";

export const eventAlbumKeys = {
	all: ["event-album"] as const,
	detail: (token: string) => [...eventAlbumKeys.all, token] as const,
	highlights: (token: string) => [...eventAlbumKeys.detail(token), "highlights"] as const,
};

export const useEventAlbum = ({
	token,
	client,
}: {
	token?: string;
	client: PublicEventClient;
}) => {
	return useQuery({
		queryKey: token ? eventAlbumKeys.detail(token) : eventAlbumKeys.all,
		queryFn: () => client.getPublicAlbum(token as string),
		enabled: Boolean(token),
	});
};

export const useEventAlbumHighlights = ({
	token,
	client,
}: {
	token?: string;
	client: PublicEventClient;
}) => {
	return useQuery({
		queryKey: token ? eventAlbumKeys.highlights(token) : eventAlbumKeys.all,
		queryFn: () => client.getPublicAlbumHighlights(token as string),
		enabled: Boolean(token),
	});
};
