export interface PublicAlbum {
	id: string;
	albumName?: string;
	[key: string]: unknown;
}

export interface EventFaceMatch {
	imageId: string;
	reactionCount?: number;
	[key: string]: unknown;
}

export interface PublicEventClient {
	getPublicAlbum: (token: string) => Promise<PublicAlbum | undefined>;
	getPublicAlbumHighlights: (token: string) => Promise<EventFaceMatch[]>;
	searchPublicAlbumBySelfie: (
		token: string,
		selfie: File | Blob,
	) => Promise<{ faces: EventFaceMatch[] }>;
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
