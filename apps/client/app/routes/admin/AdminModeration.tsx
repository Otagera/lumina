import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { Button } from "~/components/standard/Button";
import { fetchPendingModeration, adminModerateImages } from "../../utils/adminApi";

export default function AdminModeration() {
	const qc = useQueryClient();
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<Set<string>>(new Set());

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "moderation", page],
		queryFn: () => fetchPendingModeration({ page, limit: 24 }),
	});

	const moderateMutation = useMutation({
		mutationFn: adminModerateImages,
		onSuccess: (_, vars) => {
			qc.invalidateQueries({ queryKey: ["admin", "moderation"] });
			setSelected(new Set());
			toast.success(`${vars.imageIds.length} image(s) ${vars.status.toLowerCase()}.`);
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	const images = data?.images ?? [];
	const total = data?.total ?? 0;
	const pages = data?.pages ?? 1;

	const toggleSelect = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const toggleAll = () => {
		if (selected.size === images.length) {
			setSelected(new Set());
		} else {
			setSelected(new Set(images.map((i: any) => i.image_id)));
		}
	};

	const getImageUrl = (img: any) => img.imagePath ?? "";

	return (
		<div className="p-6 md:p-10 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<Heading level={1} className="text-2xl font-black">Moderation</Heading>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
						{total} pending image{total !== 1 ? "s" : ""} across all albums.
					</p>
				</div>
				{selected.size > 0 && (
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={toggleAll}
						>
							{selected.size === images.length ? "Deselect all" : `Selected (${selected.size})`}
						</Button>
						<Button
							size="sm"
							onClick={() =>
								moderateMutation.mutate({
									imageIds: Array.from(selected),
									status: "APPROVED",
								})
							}
							disabled={moderateMutation.isPending}
							className="bg-sage text-zinc-900 hover:bg-sage/90"
						>
							<CheckCircle2 size={14} className="mr-1.5" /> Approve
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-plum dark:text-rose-400 hover:bg-plum/10"
							onClick={() =>
								moderateMutation.mutate({
									imageIds: Array.from(selected),
									status: "REJECTED",
								})
							}
							disabled={moderateMutation.isPending}
						>
							<XCircle size={14} className="mr-1.5" /> Reject
						</Button>
					</div>
				)}
			</div>

			{isLoading ? (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
					{[...Array(12)].map((_, i) => (
						<div key={i} className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
					))}
				</div>
			) : images.length === 0 ? (
				<Card hoverable={false} className="p-12 text-center">
					<CheckCircle2 size={40} className="text-sage mx-auto mb-4" />
					<Heading level={2} className="text-base font-black">All caught up</Heading>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">No pending images across any album.</p>
				</Card>
			) : (
				<>
					<div className="flex items-center gap-2 mb-2">
						<button
							type="button"
							onClick={toggleAll}
							className="text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
						>
							{selected.size === images.length ? "Deselect all" : "Select all"}
						</button>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
						{images.map((img: any) => {
							const isSelected = selected.has(img.image_id);
							const album = img.album_images?.[0]?.albums;
							return (
								<button
									key={img.image_id}
									type="button"
									onClick={() => toggleSelect(img.image_id)}
									className={`relative aspect-square rounded-2xl overflow-hidden ring-2 transition-all ${
										isSelected
											? "ring-sage scale-[0.97]"
											: "ring-transparent hover:ring-zinc-300 dark:hover:ring-zinc-600"
									}`}
								>
									<img
										src={getImageUrl(img)}
										alt=""
										className="w-full h-full object-cover"
										loading="lazy"
										onError={(e) => {
											(e.target as HTMLImageElement).src = "";
										}}
									/>
									{isSelected && (
										<div className="absolute inset-0 bg-sage/20 flex items-center justify-center">
											<CheckCircle2 size={24} className="text-sage drop-shadow-md" />
										</div>
									)}
									<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
										<p className="text-[10px] font-bold text-white truncate">
											{album?.album_name ?? "Unknown album"}
										</p>
										{img.users?.email && (
											<p className="text-[9px] text-white/60 truncate">{img.users.email}</p>
										)}
									</div>
								</button>
							);
						})}
					</div>
				</>
			)}

			{pages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-zinc-500">Page {page} of {pages}</p>
					<div className="flex gap-2">
						<Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
							<ChevronLeft size={14} />
						</Button>
						<Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
							<ChevronRight size={14} />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
