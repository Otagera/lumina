import { Check, ChevronDown, ChevronUp, Focus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { BackButton } from "~/components/BackButton";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Card } from "~/components/standard/Card";
import { EmptyState } from "~/components/standard/EmptyState";
import { Heading } from "~/components/standard/Heading";
import TagPersonModal from "~/components/TagPersonModal";
import ImageGridItem from "~/Images/ImageGridItem";
import ImageModal from "~/Images/ImageModal";
import { getBentoSpanClass } from "~/utils/bento";
import { cn } from "~/utils/cn";
import {
	ignoreFace,
	searchFaces,
	unignoreFace,
	updateFace,
} from "../utils/api";

/**
 * A high-performance face zoom component that uses ResizeObserver to
 * perfectly center and spotlight a detected face within a fluid container.
 */
const FaceZoomView = ({
	face,
	width,
	height,
	onClick,
	padFactor = 4.0,
}: {
	face: any;
	width: number;
	height: number;
	onClick: () => void;
	padFactor?: number;
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
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

		// Padded region around the face to show context
		const padW = boxW * padFactor;
		const padH = boxH * padFactor;

		// Scale the image so the padded region fills the container
		const scale = Math.max(cW / padW, cH / padH);

		// Center of the detected face
		const faceCX = (left + right) / 2;
		const faceCY = (top + bottom) / 2;

		return {
			imgStyle: {
				position: "absolute" as const,
				width: `${width * scale}px`,
				height: `${height * scale}px`,
				left: `${cW / 2 - faceCX * scale}px`,
				top: `${cH / 2 - faceCY * scale}px`,
				transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
			},
			boxStyle: {
				position: "absolute" as const,
				left: `${cW / 2 - faceCX * scale + left * scale}px`,
				top: `${cH / 2 - faceCY * scale + top * scale}px`,
				width: `${boxW * scale}px`,
				height: `${boxH * scale}px`,
				transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
			},
		};
	}, [containerSize, face.boundingBox, width, height, padFactor]);

	return (
		<div
			ref={containerRef}
			className="w-full h-full overflow-hidden relative cursor-pointer bg-zinc-950"
			onClick={onClick}
		>
			{containerSize && (
				<>
					<img
						src={face.imagePath}
						alt=""
						style={imgStyle}
						className="max-w-none transition-all duration-700"
						draggable={false}
					/>
					{/* Spotlight Overlay - Much lighter and more natural */}
					<div className="absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-500" />

					{/* The bright bounding box */}
					{face.boundingBox && (
						<div
							className="border-2 border-sage/80 rounded-xl pointer-events-none z-10"
							style={{
								...boxStyle,
								boxShadow:
									"0 0 0 9999px rgba(0,0,0,0.25), 0 0 30px rgba(182, 186, 68, 0.3) inset",
							}}
						>
							<div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-sage/90 backdrop-blur-md text-zinc-950 text-[9px] font-black uppercase tracking-widest py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap">
								Matched Face
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const [results, setResults] = useState<any[]>([]);
	const [sourceFace, setSourceFace] = useState<{
		faceId: number;
		personId: string | null;
		personName?: string;
		imagePath?: string;
		boundingBox?: { top: number; left: number; right: number; bottom: number };
		originalWidth?: number;
		originalHeight?: number;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showPossible, setShowPossible] = useState(false);
	const [showIgnored, setShowIgnored] = useState(false);
	const [taggingFaceId, setTaggingFaceId] = useState<number | null>(null);
	const [showFacesInGrid, setShowFacesInGrid] = useState(false);

	const faceId = searchParams.get("faceId");
	const albumId = searchParams.get("albumId");
	const shareToken = searchParams.get("shareToken");

	const selectedImageId = searchParams.get("imageId");
	const selectedImage = useMemo(() => {
		if (!selectedImageId || !results.length) return null;
		return results.find((img: any) => img.imageId === selectedImageId) || null;
	}, [selectedImageId, results]);

	const { confident, possible, ignored } = useMemo(() => {
		const filtered = results.filter((f) => !f.hidden);
		const nonIgnored = filtered.filter((f) => !f.isIgnored);

		const conf = nonIgnored.filter((f) => 1 - (f.distance || 0) >= 0.5);
		const poss = nonIgnored.filter(
			(f) => 1 - (f.distance || 0) < 0.5 && 1 - (f.distance || 0) >= 0.2,
		);
		const ign = filtered.filter((f) => f.isIgnored);

		return { confident: conf, possible: poss, ignored: ign };
	}, [results]);

	const setSelectedImage = (image: any | null) => {
		setSearchParams((prev) => {
			if (image) {
				prev.set("imageId", image.imageId);
			} else {
				prev.delete("imageId");
			}
			return prev;
		});
	};

	useEffect(() => {
		const performSearch = async () => {
			if (!faceId) {
				setError("No face ID provided for search.");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const response = await searchFaces({
					faceId: parseInt(faceId, 10),
					albumId: albumId || undefined,
					shareToken: shareToken || undefined,
				});

				if (response?.status === "completed") {
					setResults(response.data.faces || []);
					setSourceFace(response.data.sourceFace || null);
				} else {
					setError(response?.message || "Failed to fetch search results.");
				}
			} catch (err) {
				console.error("Search error:", err);
				setError("An error occurred while searching.");
			} finally {
				setLoading(false);
			}
		};

		performSearch();
	}, [faceId, albumId, shareToken]);

	const handleConfirm = async (face: any) => {
		if (!sourceFace) return;

		if (!sourceFace.personId) {
			setTaggingFaceId(sourceFace.faceId);
			return;
		}

		try {
			await updateFace(face.faceId, { personId: sourceFace.personId });
			setResults((prev) =>
				prev.map((f) =>
					f.faceId === face.faceId
						? { ...f, personId: sourceFace.personId, isConfirmed: true }
						: f,
				),
			);
			toast.success("Match confirmed");
		} catch (err) {
			console.error("Failed to confirm match:", err);
			toast.error("Failed to confirm match");
		}
	};

	const handleReject = async (faceId: number) => {
		if (sourceFace?.personId) {
			try {
				await ignoreFace(faceId, sourceFace.personId);
				setResults((prev) =>
					prev.map((f) =>
						f.faceId === faceId ? { ...f, isIgnored: true } : f,
					),
				);
				toast.success("Match ignored");
			} catch (err) {
				console.error("Failed to ignore face:", err);
				toast.error("Failed to ignore match");
			}
		} else {
			setResults((prev) =>
				prev.map((f) => (f.faceId === faceId ? { ...f, hidden: true } : f)),
			);
		}
	};

	const handleRestore = async (faceId: number) => {
		if (sourceFace?.personId) {
			try {
				await unignoreFace(faceId, sourceFace.personId);
				setResults((prev) =>
					prev.map((f) =>
						f.faceId === faceId ? { ...f, isIgnored: false } : f,
					),
				);
				toast.success("Match restored");
			} catch (err) {
				console.error("Failed to restore face:", err);
				toast.error("Failed to restore match");
			}
		}
	};

	const onTagComplete = () => {
		setTaggingFaceId(null);
		window.location.reload();
	};

	const renderFaceGrid = (faces: any[]) => (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full auto-rows-[160px] md:auto-rows-[280px] grid-flow-dense">
			{faces.map((face, index) => {
				const width = face.originalWidth || 0;
				const height = face.originalHeight || 0;
				const similarity = ((1 - (face.distance || 0)) * 100).toFixed(1);
				const isConfirmed =
					face.isConfirmed ||
					(!!face.personId && face.personId === sourceFace?.personId);

				const area = width * height;
				const isFeatured = area > 2000000;

				const spanClass = getBentoSpanClass(width, height, index, isFeatured);

				return (
					<div
						key={face.faceId || index}
						className={cn(
							"relative animate-in fade-in slide-in-from-bottom-4 duration-500",
							spanClass,
						)}
						style={{ animationDelay: `${index * 50}ms` }}
					>
						<Card className="w-full h-full p-0 group overflow-hidden">
							{/* Spotlight / Full Image Rendering */}
							{showFacesInGrid &&
							face.boundingBox &&
							width > 0 &&
							height > 0 ? (
								<FaceZoomView
									face={face}
									width={width}
									height={height}
									onClick={() => setSelectedImage(face)}
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
									onDelete={() => {}}
									shared={true}
									className="w-full h-full object-cover cursor-pointer"
									onClick={() => setSelectedImage(face)}
									variant="admin"
								/>
							)}

							{/* Match Info Overlay */}
							<div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="flex flex-col gap-3">
									<div className="flex flex-wrap items-center gap-2">
										<span
											className={cn(
												"px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border backdrop-blur-md shadow-sm",
												Number(similarity) > 70
													? "bg-sage text-zinc-950 border-sage"
													: Number(similarity) > 50
														? "bg-slate-blue text-white border-slate-blue"
														: "bg-zinc-800 text-zinc-100 border-zinc-700",
											)}
										>
											{similarity}% Match
										</span>
										{isConfirmed && (
											<span className="bg-emerald-500 text-white border border-emerald-400 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md shadow-sm">
												<Check size={12} strokeWidth={4} /> Confirmed
											</span>
										)}
									</div>

									<div>
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setTaggingFaceId(face.faceId);
											}}
											className="text-white font-bold truncate text-xl text-left hover:text-sage transition-all pointer-events-auto underline decoration-sage/0 hover:decoration-sage/50 decoration-2 underline-offset-4"
										>
											{face.personName || "Name this person"}
										</button>
									</div>
								</div>
							</div>

							{/* Feedback Actions */}
							{!isConfirmed && !shareToken && !face.isIgnored && (
								<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 pointer-events-auto">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleConfirm(face);
										}}
										className="p-3 bg-sage hover:bg-sage/90 text-zinc-950 rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90"
										title="Correct Match"
									>
										<Check size={20} strokeWidth={2.5} />
									</button>
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											handleReject(face.faceId);
										}}
										className="p-3 bg-plum hover:bg-plum/90 text-white rounded-2xl shadow-xl transition-all hover:scale-110 active:scale-90"
										title="Not a Match"
									>
										<X size={20} strokeWidth={2.5} />
									</button>
								</div>
							)}

							{/* Restore Action for Ignored Faces */}
							{face.isIgnored && !shareToken && (
								<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 pointer-events-auto">
									<Button
										size="sm"
										variant="secondary"
										onClick={(e) => {
											e.stopPropagation();
											handleRestore(face.faceId);
										}}
									>
										Restore Match
									</Button>
								</div>
							)}
						</Card>
					</div>
				);
			})}
		</div>
	);

	const SourceFaceThumbnail = ({ face }: { face: any }) => {
		if (!face?.imagePath) return null;

		const isCropped =
			face.boundingBox && face.originalWidth && face.originalHeight;

		return (
			<div className="relative group">
				<div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 ring-2 ring-sage/30 border border-white/5 transition-all duration-500 group-hover:ring-sage group-hover:shadow-[0_0_20px_rgba(182,186,68,0.3)]">
					{isCropped ? (
						<div
							className="w-full h-full bg-no-repeat transition-transform duration-700 group-hover:scale-110"
							style={{
								backgroundImage: `url(${face.imagePath})`,
								backgroundSize: `${(face.originalWidth / (face.boundingBox.right - face.boundingBox.left)) * 100}% ${(face.originalHeight / (face.boundingBox.bottom - face.boundingBox.top)) * 100}%`,
								backgroundPosition: `${(face.boundingBox.left / (face.originalWidth - (face.boundingBox.right - face.boundingBox.left))) * 100}% ${(face.boundingBox.top / (face.originalHeight - (face.boundingBox.bottom - face.boundingBox.top))) * 100}%`,
							}}
						/>
					) : (
						<img
							src={face.imagePath}
							alt="Source"
							className="w-full h-full object-cover"
						/>
					)}
				</div>
			</div>
		);
	};

	const StatBlock = ({
		label,
		value,
		subtext,
		color = "text-zinc-900 dark:text-white",
	}: {
		label: string;
		value: string | number;
		subtext?: string;
		color?: string;
	}) => (
		<div className="flex flex-col">
			<span className="text-zinc-500 text-[8px] font-black uppercase tracking-wider mb-0.5">
				{label}
			</span>
			<div className="flex items-baseline gap-1.5">
				<span
					className={cn("text-xl font-bold tabular-nums tracking-tight", color)}
				>
					{value}
				</span>
				{subtext && (
					<span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
						{subtext}
					</span>
				)}
			</div>
		</div>
	);

	return (
		<MainContainer className="space-y-12">
			<BackButton shareToken={shareToken || undefined} />

			<div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
				<div className="flex flex-wrap items-center gap-6">
					<div className="flex items-center gap-4">
						<div className="p-2.5 bg-sage text-zinc-950 rounded-xl border border-sage shadow-lg shadow-sage/10">
							<Search size={20} strokeWidth={3} />
						</div>
						<Heading level={1} className="text-2xl md:text-3xl m-0">
							Search Results
						</Heading>
					</div>

					{sourceFace?.imagePath && (
						<div className="flex items-center gap-4 pl-6 border-l border-zinc-200 dark:border-zinc-800">
							<SourceFaceThumbnail face={sourceFace} />
							<div className="flex flex-col">
								<span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
									Target Subject
								</span>
								<button
									onClick={() => setTaggingFaceId(sourceFace.faceId)}
									className="text-sm font-bold text-zinc-900 dark:text-white hover:text-sage transition-colors text-left"
								>
									{sourceFace?.personName ||
										sourceFace?.personId?.split("-")[0] ||
										"Unknown Subject"}
								</button>
							</div>
						</div>
					)}
				</div>

				{!loading && !error && results.length > 0 && (
					<div className="flex items-center gap-8 bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 px-6 backdrop-blur-sm">
						<div className="flex gap-8">
							<StatBlock
								label="Identified"
								value={confident.length + possible.length}
								subtext="Matches"
							/>
							<StatBlock label="Correlation" value="High" color="text-sage" />
						</div>
						<div className="w-px h-8 bg-zinc-200 dark:border-zinc-800 mx-2" />
						<Button
							variant={showFacesInGrid ? "primary" : "outline"}
							onClick={() => setShowFacesInGrid(!showFacesInGrid)}
							className="rounded-full h-10 px-5 text-xs border-zinc-300 dark:border-zinc-700"
						>
							<Focus size={16} className="mr-2" />
							{showFacesInGrid ? "Focus: ON" : "Focus Faces"}
						</Button>
					</div>
				)}
			</div>

			{loading ? (
				<div className="flex flex-col justify-center items-center py-40 gap-8">
					<div className="relative w-24 h-24">
						<div className="absolute inset-0 border-[4px] border-sage/10 rounded-full" />
						<div className="absolute inset-0 border-[4px] border-sage border-t-transparent rounded-full animate-spin" />
					</div>
					<div className="text-center">
						<Heading level={2} className="mb-2">
							Analyzing Biometrics
						</Heading>
						<p className="text-zinc-500 animate-pulse font-medium tracking-wide">
							Scanning neural embeddings...
						</p>
					</div>
				</div>
			) : error ? (
				<div className="bg-plum/5 border border-plum/20 text-plum p-10 rounded-[2.5rem] flex flex-col items-center gap-6 text-center">
					<div className="p-5 bg-plum text-white rounded-[2rem] shadow-xl shadow-plum/20">
						<X size={32} strokeWidth={3} />
					</div>
					<div>
						<Heading level={2} className="text-plum mb-2">
							Search Failed
						</Heading>
						<p className="text-plum/80 font-medium">{error}</p>
					</div>
				</div>
			) : confident.length === 0 && possible.length === 0 ? (
				<EmptyState
					title="No matches found"
					description="Try searching with a different face or album context. Our neural engine couldn't find a strong correlation."
					icon={<Search size={40} className="opacity-20" />}
				/>
			) : (
				<div className="space-y-32">
					{confident.length > 0 && (
						<section>
							<div className="flex items-center gap-4 mb-10">
								<div className="w-1.5 h-8 bg-sage rounded-full shadow-[0_0_15px_rgba(182,186,68,0.5)]" />
								<div>
									<Heading level={2} className="text-xl">
										Confident Matches
									</Heading>
									<span className="text-sage text-[9px] font-black uppercase tracking-[0.3em] block mt-0.5">
										Neural Correlation &gt; 95%
									</span>
								</div>
							</div>
							{renderFaceGrid(confident)}
						</section>
					)}

					{possible.length > 0 && (
						<section>
							<div className="flex flex-col gap-10">
								<div className="flex items-center justify-between flex-wrap gap-8">
									<div className="flex items-center gap-4">
										<div className="w-1.5 h-8 bg-terracotta rounded-full" />
										<div>
											<Heading level={2} className="text-xl">
												Possible Matches
											</Heading>
											<span className="text-terracotta text-[9px] font-black uppercase tracking-[0.2em] block mt-0.5">
												Probabilistic Suggestions
											</span>
										</div>
									</div>

									<Button
										variant={showPossible ? "outline" : "secondary"}
										onClick={() => setShowPossible(!showPossible)}
										className="rounded-full px-5 py-2.5 h-auto text-xs"
									>
										{showPossible ? "Hide Suggestions" : "Show Suggestions"}
										{showPossible ? (
											<ChevronUp className="ml-2 w-4 h-4" />
										) : (
											<ChevronDown className="ml-2 w-4 h-4" />
										)}
									</Button>
								</div>

								{showPossible && renderFaceGrid(possible)}
							</div>
						</section>
					)}

					{ignored.length > 0 && (
						<section className="opacity-60 hover:opacity-100 transition-opacity">
							<div className="flex flex-col gap-10">
								<div className="flex items-center justify-between flex-wrap gap-8">
									<div className="flex items-center gap-4">
										<div className="w-1.5 h-8 bg-zinc-500 rounded-full" />
										<div>
											<Heading level={2} className="text-xl">
												Ignored Matches
											</Heading>
											<span className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em] block mt-0.5">
												Excluded from Results
											</span>
										</div>
									</div>

									<Button
										variant="outline"
										onClick={() => setShowIgnored(!showIgnored)}
										className="rounded-full px-5 py-2.5 h-auto text-xs"
									>
										{showIgnored ? "Hide Ignored" : "Review Ignored"}
										{showIgnored ? (
											<ChevronUp className="ml-2 w-4 h-4" />
										) : (
											<ChevronDown className="ml-2 w-4 h-4" />
										)}
									</Button>
								</div>

								{showIgnored && renderFaceGrid(ignored)}
							</div>
						</section>
					)}
				</div>
			)}

			<ImageModal
				image={selectedImage}
				images={results}
				albumId={albumId || undefined}
				shareToken={shareToken || undefined}
				onClose={() => setSelectedImage(null)}
				onNavigate={(img) => setSelectedImage(img)}
				isSearchMode={true}
			/>

			{taggingFaceId && (
				<TagPersonModal
					faceId={taggingFaceId}
					currentPersonId={
						taggingFaceId === sourceFace?.faceId
							? sourceFace.personId
							: results.find((f) => f.faceId === taggingFaceId)?.personId
					}
					currentPersonName={
						taggingFaceId === sourceFace?.faceId
							? sourceFace.personName
							: results.find((f) => f.faceId === taggingFaceId)?.personName
					}
					onClose={() => setTaggingFaceId(null)}
					onCloseAfterSelection={onTagComplete}
				/>
			)}
		</MainContainer>
	);
};

export default SearchPage;
