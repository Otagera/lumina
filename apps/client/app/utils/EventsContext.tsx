import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth";

interface EventsContextType {
	lastEvent: any | null;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [lastEvent, setLastEvent] = useState<any>(null);
	const queryClient = useQueryClient();
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		if (!isAuthenticated || typeof window === "undefined") return;

		// Use relative URL to match whichever server the app is talking to
		const eventSource = new EventSource("/api/v1/events");

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				setLastEvent(data);

				// Automatically invalidate relevant queries
				if (data.imageId) {
					queryClient.invalidateQueries({ queryKey: ["image", data.imageId] });
				}
				if (data.albumId) {
					queryClient.invalidateQueries({ queryKey: ["images", data.albumId] });
				}
				if (data.type === "HIGHLIGHTS_READY" && data.albumId) {
					queryClient.invalidateQueries({ queryKey: ["album-highlights", data.albumId] });
				}
			} catch (err) {
				console.error("Failed to parse SSE event:", err);
			}
		};

		eventSource.onerror = (err) => {
			console.error("SSE Connection Error:", err);
			// Retry logic handled by browser automatically, but we close on fatal errors
		};

		return () => {
			eventSource.close();
		};
	}, [queryClient, isAuthenticated]);

	return (
		<EventsContext.Provider value={{ lastEvent }}>
			{children}
		</EventsContext.Provider>
	);
};

export const useEvents = () => {
	const context = useContext(EventsContext);
	if (!context)
		throw new Error("useEvents must be used within an EventsProvider");
	return context;
};
