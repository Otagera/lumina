import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchResultFace } from "~/types";

interface FaceZoomViewProps {
	face: SearchResultFace;
	width: number;
	height: number;
	onClick: () => void;
	padFactor?: number;
}

/**
 * Centers and spotlights a detected face within a fluid container using
 * ResizeObserver to react to layout changes.
 */
export const FaceZoomView = ({
	face,
	width,
	height,
	onClick,
	padFactor = 4.0,
}: FaceZoomViewProps) => {
	const containerRef = useRef<HTMLButtonElement>(null);
	const [containerSize, setContainerSize] = useState<{
		w: number;
		h: number;
	} | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver(([entry]) => {
			setContainerSize({
				w: entry.contentRect.width,
				h: entry.contentRect.height,
			});
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const { imgStyle, boxStyle } = useMemo(() => {
		if (!containerSize || !face.boundingBox)
			return { imgStyle: {}, boxStyle: {} };

		const { w: cW, h: cH } = containerSize;
		const { left, top, right, bottom } = face.boundingBox;

		const boxW = right - left;
		const boxH = bottom - top;

		const padW = boxW * padFactor;
		const padH = boxH * padFactor;

		const scale = Math.max(cW / padW, cH / padH);

		const faceCX = (left + right) / 2;
		const faceCY = (top + bottom) / 2;

		return {
			imgStyle: {
				position: "absolute" as const,
				width: `${width * scale}px`,
				height: `${height * scale}px`,
				left: `${cW / 2 - faceCX * scale}px`,
				top: `${cH / 2 - faceCY * scale}px`,
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			},
			boxStyle: {
				position: "absolute" as const,
				left: `${cW / 2 - faceCX * scale + left * scale}px`,
				top: `${cH / 2 - faceCY * scale + top * scale}px`,
				width: `${boxW * scale}px`,
				height: `${boxH * scale}px`,
				transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			},
		};
	}, [containerSize, face.boundingBox, width, height, padFactor]);

	return (
		<button
			type="button"
			ref={containerRef}
			className="w-full h-full overflow-hidden relative cursor-pointer bg-zinc-950 focus-ring"
			onClick={onClick}
			aria-label="Open matched photo"
		>
			{containerSize && (
				<>
					<img
						src={face.imagePath}
						alt=""
						style={imgStyle}
						className="max-w-none"
						draggable={false}
					/>
					<div className="absolute inset-0 bg-black/5 pointer-events-none" />
					{face.boundingBox && (
						<div
							className="border-2 border-sage/80 rounded-control pointer-events-none z-10"
							style={{
								...boxStyle,
								boxShadow: "0 0 0 9999px rgba(0,0,0,0.25)",
							}}
							aria-hidden="true"
						/>
					)}
				</>
			)}
		</button>
	);
};
