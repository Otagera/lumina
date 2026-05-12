export const getBentoSpanClass = (
	width: number,
	height: number,
	index: number,
	isFeatured = false,
) => {
	// Fallback for missing dimensions
	if (!width || !height) return "";

	const aspectRatio = width / height;

	// 1. Explicitly featured or forced feature every 7th image
	// But ONLY if the aspect ratio is somewhat balanced to avoid weird stretching
	const shouldBeFeatured = isFeatured || index % 7 === 0;
	if (shouldBeFeatured && aspectRatio > 0.6 && aspectRatio < 1.6) {
		return "md:col-span-2 md:row-span-2";
	}

	// 2. Wide shots: Landscape orientation (16:9 or similar)
	if (aspectRatio > 1.4) {
		return "md:col-span-2";
	}

	// 3. Tall shots: Portrait orientation (e.g. typical smartphone photo)
	if (aspectRatio < 0.75) {
		return "md:row-span-2";
	}

	// 4. Default: Standard 1x1 grid cell
	return "";
};
