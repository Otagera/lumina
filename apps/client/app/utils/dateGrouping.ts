import type { AlbumImage } from "~/types";

export interface DateSection {
	label: string;
	key: string;
	images: AlbumImage[];
}

export function groupImagesByDate(images: AlbumImage[]): DateSection[] {
	if (!images.length) return [];

	const grouped: Record<string, AlbumImage[]> = {};
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);

	images.forEach((image) => {
		const dateStr = image.takenAt || image.uploadDate;
		if (!dateStr) return;

		const imgDate = new Date(dateStr);
		imgDate.setHours(0, 0, 0, 0);

		let label: string;
		if (imgDate.getTime() === today.getTime()) {
			label = "Today";
		} else if (imgDate.getTime() === yesterday.getTime()) {
			label = "Yesterday";
		} else {
			label = imgDate.toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			});
		}

		if (!grouped[label]) {
			grouped[label] = [];
		}
		grouped[label].push(image);
	});

	const sectionEntries = Object.entries(grouped);
	sectionEntries.sort((a, b) => {
		const getDateForLabel = (label: string) => {
			if (label === "Today") return today.getTime();
			if (label === "Yesterday") return yesterday.getTime();
			return new Date(label).getTime();
		};
		return getDateForLabel(b[0]) - getDateForLabel(a[0]);
	});

	return sectionEntries.map(([label, imgs]) => ({
		label,
		key: label,
		images: imgs,
	}));
}