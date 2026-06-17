import { useEffect, useState } from "react";

export interface LivePayload {
	type: string;
	data: any;
}

export const useLiveAlbum = (albumId?: string) => {
	const [reactions, setReactions] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!albumId) return;

		const eventSource = new EventSource("/api/v1/events");

		eventSource.onmessage = (event) => {
			try {
				const payload: LivePayload = JSON.parse(event.data);

				if (
					payload.type === "REACTION_ADDED" &&
					payload.data.albumId === albumId
				) {
					const { imageId, count } = payload.data;
					setReactions((prev) => ({ ...prev, [imageId]: count }));
				}
			} catch (err) {
				console.error("[SSE] Parse error:", err);
			}
		};

		eventSource.onerror = () => {
			eventSource.close();
		};

		return () => {
			eventSource.close();
		};
	}, [albumId]);

	return { reactions };
};
