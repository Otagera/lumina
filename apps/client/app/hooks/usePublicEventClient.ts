import { createPublicEventClient } from "@lumina/event-sdk";
import axiosAPI from "~/utils/axios";
import { api } from "~/utils/eden";

export const publicEventClient = createPublicEventClient({
	getAlbum: async (token: string) => {
		const { data, error } = await api.public.albums[token].get({ $query: {} });
		if (error) throw error;
		return data;
	},
	getHighlights: async (token: string) => {
		const { data, error } = await api.public.albums[token].highlights.get();
		if (error) throw error;
		return data;
	},
	searchByImage: async (token: string, selfie: File | Blob) => {
		const formData = new FormData();
		formData.append("selfie", selfie, "selfie.jpg");
		const response = await axiosAPI.post(
			`/public/albums/${token}/search-by-image`,
			formData,
			{ headers: { "Content-Type": "multipart/form-data" } },
		);
		return response.data;
	},
});
