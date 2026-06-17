import { useState } from "react";
import axiosAPI from "~/utils/axios";
import { api } from "~/utils/eden";

export const useSharedAlbumSearch = (token: string | undefined) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchLoading, setIsSearchLoading] = useState(false);
	const [filteredImageIds, setFilteredImageIds] = useState<Set<string> | null>(null);
	const [suggestions, setSuggestions] = useState<any[]>([]);

	const handleSemanticSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token || !searchQuery.trim()) return;

		setIsSearchLoading(true);
		try {
			const { data, error } = await api.search.semantic.public.post({
				query: searchQuery.trim(),
				shareToken: token,
			});
			if (error) throw error;
			const ids = new Set<string>(
				(data?.data?.results ?? []).map((r: any) => r.imageId as string),
			);
			setFilteredImageIds(ids.size > 0 ? ids : null);
		} catch {
			setFilteredImageIds(null);
		} finally {
			setIsSearchLoading(false);
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		setFilteredImageIds(null);
	};

	const handleSuggestionClick = (chip: string) => {
		setSearchQuery(chip);
	};

	const fetchSuggestions = async (embedding: number[]) => {
		if (!token) return;
		try {
			const { data, error } = await api.public.albums[token].suggestions.post({
				embedding,
			});
			if (!error && data?.data) setSuggestions(data.data);
		} catch {
			// suggestions are best-effort
		}
	};

	return {
		searchQuery,
		setSearchQuery,
		isSearchLoading,
		filteredImageIds,
		setFilteredImageIds,
		suggestions,
		handleSemanticSearch,
		clearSearch,
		handleSuggestionClick,
		fetchSuggestions,
	};
};
