import { useMemo } from "react";
import type { SearchSourceFace } from "~/types";

interface SourceFaceThumbnailProps {
	face: SearchSourceFace;
}

const CONTAINER_W = 56;
const CONTAINER_H = 80;
const PAD_FACTOR = 1.8;

export const SourceFaceThumbnail = ({ face }: SourceFaceThumbnailProps) => {
	const cropStyle = useMemo(() => {
		if (
			!face?.boundingBox ||
			!face.originalWidth ||
			!face.originalHeight
		) {
			return null;
		}
		const { left, top, right, bottom } = face.boundingBox;
		const boxW = right - left;
		const boxH = bottom - top;
		const padW = boxW * PAD_FACTOR;
		const padH = boxH * PAD_FACTOR;
		const scale = Math.max(CONTAINER_W / padW, CONTAINER_H / padH);
		const faceCX = (left + right) / 2;
		const faceCY = (top + bottom) / 2;
		return {
			width: `${face.originalWidth * scale}px`,
			height: `${face.originalHeight * scale}px`,
			left: `${CONTAINER_W / 2 - faceCX * scale}px`,
			top: `${CONTAINER_H / 2 - faceCY * scale}px`,
		};
	}, [face?.boundingBox, face?.originalWidth, face?.originalHeight]);

	if (!face?.imagePath) return null;

	return (
		<div
			className="relative w-14 h-20 rounded-card overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 shrink-0"
			role="img"
			aria-label="Source face"
		>
			{cropStyle ? (
				<img
					src={face.imagePath}
					alt=""
					className="absolute max-w-none"
					style={cropStyle}
					draggable={false}
				/>
			) : (
				<img
					src={face.imagePath}
					alt=""
					className="w-full h-full object-cover"
				/>
			)}
		</div>
	);
};
