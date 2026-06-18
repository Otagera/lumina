import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import axiosAPI from "~/utils/axios";
import type { AlbumImage } from "~/types";

interface Props {
	sourceAlbumId: string;
	deliveredAlbumId: string;
	deliveredShareToken: string;
}

function ImageCheckbox({
	image,
	selected,
	onToggle,
}: {
	image: AlbumImage;
	selected: boolean;
	onToggle: () => void;
}) {
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

	const { data: sourceData, isLoading: sourceLoading } = useQuery({
		queryKey: ["album-images-source", sourceAlbumId],
		queryFn: async () => {
			const res = await axiosAPI.get(`/albums/${sourceAlbumId}/images`, {
				params: { limit: 200, status: "APPROVED" },
			});
			return (res?.data?.data?.imagesInAlbum ?? []) as Array<{ images: AlbumImage; imageId: string }>;
		},
	});

	const { data: galleryData, isLoading: galleryLoading } = useQuery({
		queryKey: ["album-images-delivered", deliveredAlbumId],
		queryFn: async () => {
			const res = await axiosAPI.get(`/albums/${deliveredAlbumId}/images`, {
				params: { limit: 200 },
			});
			return (res?.data?.data?.imagesInAlbum ?? []) as Array<{ images: AlbumImage; imageId: string }>;
		},
	});

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

	const toggleId = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

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
						<div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
							{(sourceData ?? []).map((item) => (
								<ImageCheckbox
									key={item.imageId}
									image={item.images}
									selected={selectedIds.has(item.imageId)}
									onToggle={() => toggleId(item.imageId)}
								/>
							))}
						</div>
					)}
				</div>

				{/* Gallery panel */}
				<div>
					<h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-3">
						Official Gallery ({(galleryData ?? []).length})
					</h3>
					{galleryLoading ? (
						<div className="flex justify-center py-10">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage" />
						</div>
					) : (galleryData ?? []).length === 0 ? (
						<div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl">
							<p className="text-sm text-zinc-400">Select photos from the event album and add them here</p>
						</div>
					) : (
						<div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
							{(galleryData ?? []).map((item) => (
								<div key={item.imageId} className="relative aspect-square rounded-xl overflow-hidden">
									<img src={item.images?.imagePath} alt="" className="w-full h-full object-cover" />
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
