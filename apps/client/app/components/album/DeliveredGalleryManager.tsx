import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import axiosAPI from "~/utils/axios";
import type { AlbumImage } from "~/types";

interface Props {
	sourceAlbumId: string;
	deliveredAlbumId: string;
	deliveredShareToken: string;
}

type GalleryItem = { images: AlbumImage; imageId: string };

function ImageCheckbox({
	image,
	selected,
	alreadyAdded,
	onToggle,
}: {
	image: AlbumImage;
	selected: boolean;
	alreadyAdded: boolean;
	onToggle: () => void;
}) {
	if (alreadyAdded) {
		return (
			<div className="relative aspect-square rounded-xl overflow-hidden opacity-40 cursor-not-allowed">
				<img src={image.imagePath} alt="" className="w-full h-full object-cover" />
				<div className="absolute inset-0 bg-black/30 flex items-end justify-end p-1.5">
					<span className="text-[10px] font-black text-white bg-sage rounded-full px-1.5 py-0.5 leading-none">
						Added
					</span>
				</div>
			</div>
		);
	}

	return (
		<button
			type="button"
			onClick={onToggle}
			className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
				selected
					? "border-sage ring-2 ring-sage/30"
					: "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
			}`}
		>
			<img src={image.imagePath} alt="" className="w-full h-full object-cover" />
			{selected && (
				<div className="absolute top-1.5 right-1.5 w-5 h-5 bg-sage rounded-full flex items-center justify-center">
					<Check size={12} className="text-white" />
				</div>
			)}
		</button>
	);
}

export function DeliveredGalleryManager({ sourceAlbumId, deliveredAlbumId, deliveredShareToken }: Props) {
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [copied, setCopied] = useState(false);
	const [localGallery, setLocalGallery] = useState<GalleryItem[]>([]);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const dragSrcId = useRef<string | null>(null);
	const isDragging = useRef(false);
	const localGalleryRef = useRef<GalleryItem[]>([]);

	const { data: sourceData, isLoading: sourceLoading } = useQuery({
		queryKey: ["album-images-source", sourceAlbumId],
		queryFn: async () => {
			const res = await axiosAPI.get(`/albums/${sourceAlbumId}/images`, {
				params: { limit: 200, status: "APPROVED" },
			});
			return (res?.data?.data?.imagesInAlbum ?? []) as GalleryItem[];
		},
	});

	const { data: galleryData, isLoading: galleryLoading } = useQuery({
		queryKey: ["album-images-delivered", deliveredAlbumId],
		queryFn: async () => {
			const res = await axiosAPI.get(`/albums/${deliveredAlbumId}/images`, {
				params: { limit: 200, sortBy: "position" },
			});
			return (res?.data?.data?.imagesInAlbum ?? []) as GalleryItem[];
		},
	});

	useEffect(() => {
		localGalleryRef.current = localGallery;
	}, [localGallery]);

	useEffect(() => {
		if (galleryData && !isDragging.current) setLocalGallery(galleryData);
	}, [galleryData]);

	const promoteMutation = useMutation({
		mutationFn: async (imageIds: string[]) => {
			await axiosAPI.post(`/albums/${deliveredAlbumId}/promote`, { imageIds });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["album-images-delivered", deliveredAlbumId] });
			setSelectedIds(new Set());
			toast.success("Photos added to gallery.");
		},
		onError: (e: any) => toast.error(e?.response?.data?.message || "Failed to promote photos"),
	});

	const reorderMutation = useMutation({
		mutationFn: async (order: Array<{ imageId: string; position: number }>) => {
			await axiosAPI.put(`/albums/${deliveredAlbumId}/images/reorder`, { order });
		},
		onError: () => {
			if (galleryData) setLocalGallery(galleryData);
			toast.error("Failed to save order.");
		},
	});

	const handleDragStart = (id: string) => {
		isDragging.current = true;
		dragSrcId.current = id;
		setDraggingId(id);
	};

	const handleDragEnter = (targetId: string) => {
		if (!dragSrcId.current || dragSrcId.current === targetId) return;
		setLocalGallery((prev) => {
			const srcIdx = prev.findIndex((item) => item.imageId === dragSrcId.current);
			const tgtIdx = prev.findIndex((item) => item.imageId === targetId);
			if (srcIdx === -1 || tgtIdx === -1) return prev;
			const next = [...prev];
			const [moved] = next.splice(srcIdx, 1);
			next.splice(tgtIdx, 0, moved);
			return next;
		});
	};

	const handleDragEnd = () => {
		isDragging.current = false;
		dragSrcId.current = null;
		setDraggingId(null);
		const order = localGalleryRef.current.map((item, i) => ({ imageId: item.imageId, position: i }));
		reorderMutation.mutate(order);
	};

	const toggleId = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const galleryIds = new Set(localGallery.map((item) => item.imageId));
	const galleryLink = `${window.location.origin}/share/${deliveredShareToken}`;

	const handleCopyLink = () => {
		navigator.clipboard.writeText(galleryLink);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-6">
			{/* Gallery link */}
			<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
				<div>
					<p className="text-sm font-bold text-zinc-900 dark:text-white">Official Gallery Link</p>
					<p className="text-xs text-zinc-400 mt-0.5 font-mono truncate max-w-sm">{galleryLink}</p>
				</div>
				<button
					type="button"
					onClick={handleCopyLink}
					className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-sage/10 text-sage hover:bg-sage/20 transition-all"
				>
					{copied ? <Check size={13} /> : <Copy size={13} />}
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Event photos panel */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
							Event Photos
						</h3>
						{selectedIds.size > 0 && (
							<button
								type="button"
								onClick={() => promoteMutation.mutate(Array.from(selectedIds))}
								disabled={promoteMutation.isPending}
								className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sage text-white disabled:opacity-50 transition-all"
							>
								{promoteMutation.isPending ? "Adding..." : `Add ${selectedIds.size} to Gallery`}
							</button>
						)}
					</div>
					{sourceLoading ? (
						<div className="flex justify-center py-10">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage" />
						</div>
					) : (
						<div className="grid grid-cols-3 gap-2 max-h-[calc(100vh-420px)] min-h-80 overflow-y-auto">
							{(sourceData ?? []).map((item) => (
								<ImageCheckbox
									key={item.imageId}
									image={item.images}
									selected={selectedIds.has(item.imageId)}
									alreadyAdded={galleryIds.has(item.imageId)}
									onToggle={() => toggleId(item.imageId)}
								/>
							))}
						</div>
					)}
				</div>

				{/* Gallery panel */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
							Official Gallery ({localGallery.length})
						</h3>
						{localGallery.length > 0 && (
							<span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
								<GripVertical size={11} />
								Drag to reorder
							</span>
						)}
					</div>
					{galleryLoading ? (
						<div className="flex justify-center py-10">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage" />
						</div>
					) : localGallery.length === 0 ? (
						<div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
							<p className="text-sm text-zinc-400">Select photos from the event album and add them here</p>
						</div>
					) : (
						<div className="grid grid-cols-3 gap-2 max-h-[calc(100vh-420px)] min-h-80 overflow-y-auto">
							{localGallery.map((item) => (
								<div
									key={item.imageId}
									draggable
									onDragStart={() => handleDragStart(item.imageId)}
									onDragEnter={() => handleDragEnter(item.imageId)}
									onDragEnd={handleDragEnd}
									onDragOver={(e) => e.preventDefault()}
									className={`relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${
										draggingId === item.imageId ? "opacity-40 scale-95" : "opacity-100"
									}`}
								>
									<img src={item.images?.imagePath} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" />
									<div className="absolute top-1 left-1 p-0.5 rounded-md bg-black/30 opacity-0 group-hover:opacity-100">
										<GripVertical size={12} className="text-white" />
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
