import { Check, X } from "lucide-react";
import { Button } from "~/components/standard/Button";
import { Card } from "~/components/standard/Card";
import ImageGridItem from "~/Images/ImageGridItem";
import type { SearchResultFace, SearchSourceFace } from "~/types";
import { getBentoSpanClass } from "~/utils/bento";
import { cn } from "~/utils/cn";
import { FaceZoomView } from "./FaceZoomView";

interface SearchResultCardProps {
	face: SearchResultFace;
	index: number;
	sourceFace: SearchSourceFace | null;
	showFacesInGrid: boolean;
	shareToken?: string;
	onSelect: (face: SearchResultFace) => void;
	onConfirm: (face: SearchResultFace) => void;
	onReject: (faceId: number) => void;
	onRestore: (faceId: number) => void;
	onTag: (faceId: number) => void;
}

export const SearchResultCard = ({
	face,
	index,
	sourceFace,
	showFacesInGrid,
	shareToken,
	onSelect,
	onConfirm,
	onReject,
	onRestore,
	onTag,
}: SearchResultCardProps) => {
	const width = face.originalWidth || 0;
	const height = face.originalHeight || 0;
	const similarity = ((1 - (face.distance || 0)) * 100).toFixed(0);
	const isConfirmed =
		face.isConfirmed ||
		(!!face.personId && face.personId === sourceFace?.personId);

	const area = width * height;
	const isFeatured = area > 2_000_000;
	const spanClass = getBentoSpanClass(width, height, index, isFeatured);

	const showFeedback = !isConfirmed && !shareToken && !face.isIgnored;
	const showRestore = !!face.isIgnored && !shareToken;

	return (
		<div
			className={cn(
				"relative cv-tile animate-in fade-in slide-in-from-bottom-4 duration-300",
				spanClass,
			)}
			style={{ animationDelay: `${(index % 12) * 40}ms` }}
		>
			<Card className="w-full h-full p-0 group overflow-hidden">
				{showFacesInGrid && face.boundingBox && width > 0 && height > 0 ? (
					<FaceZoomView
						face={face}
						width={width}
						height={height}
						onClick={() => onSelect(face)}
						padFactor={4.0}
					/>
				) : (
					<ImageGridItem
						image={{
							id: face.imageId || `face-${index}`,
							width,
							height,
							url: face.imagePath,
							alt: `Match ${index + 1}`,
						}}
						onDelete={() => { }}
						shared={true}
						className="w-full h-full object-cover cursor-pointer"
						onClick={() => onSelect(face)}
						variant="admin"
					/>
				)}

				<div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-zinc-950/85 via-zinc-950/30 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<span
								className={cn(
									"px-2.5 py-1 rounded-control text-[11px] font-semibold tracking-wide",
									Number(similarity) >= 70
										? "bg-sage text-zinc-950"
										: Number(similarity) >= 50
											? "bg-slate-blue text-white"
											: "bg-zinc-800 text-zinc-100",
								)}
							>
								{similarity}% match
							</span>
							{isConfirmed && (
								<span className="flex items-center gap-1 px-2.5 py-1 rounded-control text-[11px] font-semibold bg-emerald-500 text-white">
									<Check size={12} strokeWidth={3} aria-hidden="true" />
									Confirmed
								</span>
							)}
						</div>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onTag(face.faceId);
							}}
							className="text-white text-base font-semibold text-left hover:text-sage transition-colors pointer-events-none group-hover:pointer-events-auto focus-within:pointer-events-auto truncate focus-ring"
						>
							{face.personName || "Name this person"}
						</button>
					</div>
				</div>

				{showFeedback && (
					<div className="absolute top-3 right-3 flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity duration-200">
						<Button
							size="icon-sm"
							variant="primary"
							aria-label={`Confirm match ${index + 1}`}
							onClick={(e) => {
								e.stopPropagation();
								onConfirm(face);
							}}
						>
							<Check size={16} strokeWidth={2.5} aria-hidden="true" />
						</Button>
						<Button
							size="icon-sm"
							variant="danger"
							aria-label={`Reject match ${index + 1}`}
							onClick={(e) => {
								e.stopPropagation();
								onReject(face.faceId);
							}}
						>
							<X size={16} strokeWidth={2.5} aria-hidden="true" />
						</Button>
					</div>
				)}

				{showRestore && (
					<div className="absolute top-3 right-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto transition-opacity duration-200">
						<Button
							size="sm"
							variant="secondary"
							onClick={(e) => {
								e.stopPropagation();
								onRestore(face.faceId);
							}}
						>
							Restore
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
};
