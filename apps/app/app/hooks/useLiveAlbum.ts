import { useEffect, useState } from "react";

export interface LivePayload {
	type: string;
	data: any;
}

/**
 * useLiveAlbum hook now uses Server-Sent Events (SSE) to listen for reactions.
 * This unifies the real-time delivery mechanism across the monorepo.
 */
export const useLiveAlbum = (albumId?: string) => {
	const [reactions, setReactions] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!albumId) return;

		// Connect to the unified SSE endpoint
		const eventSource = new EventSource("/api/v1/events");

		eventSource.onmessage = (event) => {
			try {
				const payload: LivePayload = JSON.parse(event.data);
				
				// Only update if the reaction belongs to the current album
				if (payload.type === "REACTION_ADDED" && payload.data.albumId === albumId) {
					const { imageId, count } = payload.data;
					setReactions((prev) => ({
						...prev,
						[imageId]: count,
					}));
				}
			} catch (err) {
				console.error("[SSE] Parse error:", err);
			}
		};

		eventSource.onerror = (err) => {
			console.error("[SSE] Connection error:", err);
			eventSource.close();
		};

		return () => {
			eventSource.close();
		};
	}, [albumId]);

	return { reactions };
};
