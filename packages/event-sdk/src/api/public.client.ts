export interface PublicAlbumSettings {
	is_event?: boolean;
	requires_approval?: boolean;
	tagging_policy?: "HOST_ONLY" | "GUESTS_SELF" | "ANYONE";
	expires_at?: string | null;
	allow_guest_uploads?: boolean;
	semantic_search_enabled?: boolean;
	[key: string]: unknown;
}

export interface PublicAlbum {
	id: string;
	albumName?: string;
	settings?: PublicAlbumSettings;
	[key: string]: unknown;
}

export interface EventFaceMatch {
	imageId: string;
	reactionCount?: number;
	[key: string]: unknown;
}

export interface SelfieSearchResult {
	faces: EventFaceMatch[];
	embedding?: number[];
}

export interface PublicEventClient {
	getPublicAlbum: (token: string) => Promise<PublicAlbum | undefined>;
	getPublicAlbumHighlights: (token: string) => Promise<EventFaceMatch[]>;
	searchPublicAlbumBySelfie: (
		token: string,
		selfie: File | Blob,
	) => Promise<SelfieSearchResult>;
}

export const createPublicEventClient = (transport: {
	getAlbum: (token: string) => Promise<any>;
	getHighlights: (token: string) => Promise<any>;
	searchByImage: (token: string, selfie: File | Blob) => Promise<any>;
}): PublicEventClient => ({
	getPublicAlbum: async (token: string) => {
		const response = await transport.getAlbum(token);
		return response?.data;
	},
	getPublicAlbumHighlights: async (token: string) => {
		const response = await transport.getHighlights(token);
		return response?.data || [];
	},
	searchPublicAlbumBySelfie: async (token: string, selfie: File | Blob) => {
		const response = await transport.searchByImage(token, selfie);
		return response?.data || { faces: [] };
	},
});

export default createPublicEventClient;
