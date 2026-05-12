import { useEffect, useState } from "react";

export interface LivePayload {
	type: string;
	data: any;
}

export const useLiveAlbum = (albumId?: string) => {
	const [reactions, setReactions] = useState<Record<string, number>>({});

	useEffect(() => {
		if (!albumId) return;

		// Use relative path for proxy
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const host = window.location.host;
		const wsUrl = `${protocol}//${host}/api/ws?albumId=${albumId}`;

		const ws = new WebSocket(wsUrl);

		ws.onmessage = (event) => {
			try {
				const payload: LivePayload = JSON.parse(event.data);
				if (payload.type === "REACTION_ADDED") {
					const { imageId, count } = payload.data;
					setReactions((prev) => ({
						...prev,
						[imageId]: count,
					}));
				}
			} catch (err) {
				console.error("WS parse error:", err);
			}
		};

		ws.onopen = () => {
			console.log(`[WS] Connected to album:${albumId}`);
		};

		ws.onclose = () => {
			console.log(`[WS] Disconnected from album:${albumId}`);
		};

		return () => {
			ws.close();
		};
	}, [albumId]);

	return { reactions };
};
