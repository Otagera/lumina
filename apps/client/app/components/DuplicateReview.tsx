import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import axiosAPI from "../utils/axios";
import { Button } from "./standard/Button";
import { Heading } from "./standard/Heading";

interface DuplicateGroup {
	original: {
		imageId: string;
		imagePath: string;
		uploadDate: string;
	};
	duplicates: Array<{
		imageId: string;
		imagePath: string;
		uploadDate: string;
		distance: number;
		isExact: boolean;
	}>;
}

export const DuplicateReview = ({ albumId }: { albumId: string }) => {
	const queryClient = useQueryClient();
	const [selectedForDeletion, setSelectedForDeletion] = useState<Set<string>>(
		new Set(),
	);

	const { data: response, isLoading } = useQuery({
		queryKey: ["album-duplicates", albumId],
		queryFn: async () => {
			const res = await axiosAPI.get(`/albums/${albumId}/duplicates`);
			return res.data;
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async (imageIds: string[]) => {
			await axiosAPI.post(`/albums/${albumId}/images/delete-batch`, {
				imageIds,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["album-duplicates", albumId],
			});
			queryClient.invalidateQueries({ queryKey: ["album-images", albumId] });
			setSelectedForDeletion(new Set());
			toast.success("Duplicate photos removed");
		},
		onError: () => {
			toast.error("Failed to remove duplicates");
		},
	});

	const groups: DuplicateGroup[] = response?.data || [];

	const toggleSelection = (imageId: string) => {
		const newSet = new Set(selectedForDeletion);
		if (newSet.has(imageId)) {
			newSet.delete(imageId);
		} else {
			newSet.add(imageId);
		}
		setSelectedForDeletion(newSet);
	};

	const selectAllDuplicates = () => {
		const allDupes = groups.flatMap((g) => g.duplicates.map((d) => d.imageId));
		setSelectedForDeletion(new Set(allDupes));
	};

	const handleDeleteSelected = () => {
		if (selectedForDeletion.size === 0) return;
		if (
			confirm(
				`Are you sure you want to delete ${selectedForDeletion.size} duplicate photos?`,
			)
		) {
			deleteMutation.mutate(Array.from(selectedForDeletion));
		}
	};

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-20 gap-4">
				<div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin" />
				<p className="text-zinc-500 font-medium italic">
					Analyzing for duplicates...
				</p>
			</div>
		);
	}

	if (groups.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center px-6">
				<div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
					<Check className="w-8 h-8 text-sage" />
				</div>
				<Heading level={2} className="text-xl font-bold mb-2">
					No Duplicates Found
				</Heading>
				<p className="text-zinc-500 max-w-md">
					Great! Your album is looking clean. We couldn't find any exact or
					visually similar duplicate photos.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-500">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
				<div>
					<Heading
						level={2}
						className="text-xl font-bold flex items-center gap-2"
					>
						<Copy className="w-5 h-5 text-sage" />
						Review Potential Duplicates
					</Heading>
					<p className="text-sm text-zinc-500 mt-1">
						We found {groups.length} groups of similar photos. Keep the best
						ones and remove the rest.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						onClick={selectAllDuplicates}
						className="text-sm font-bold h-11"
					>
						Select All Duplicates
					</Button>
					<Button
						onClick={handleDeleteSelected}
						disabled={
							selectedForDeletion.size === 0 || deleteMutation.isPending
						}
						className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 h-11"
					>
						<Trash2 className="w-4 h-4 mr-2" />
						Remove Selected ({selectedForDeletion.size})
					</Button>
				</div>
			</div>

			<div className="space-y-12">
				{groups.map((group, idx) => (
					<div key={group.original.imageId} className="relative">
						<div className="flex items-center gap-2 mb-4 px-2">
							<span className="flex items-center justify-center w-6 h-6 rounded-full bg-sage/10 text-sage text-xs font-bold">
								{idx + 1}
							</span>
							<h3 className="text-sm font-bold text-zinc-900 dark:text-white">
								Similarity Group
							</h3>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
							{/* Original */}
							<div className="flex flex-col gap-2">
								<div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-sage shadow-lg shadow-sage/5">
									<img
										src={group.original.imagePath}
										alt="Original"
										className="w-full h-full object-cover"
									/>
									<div className="absolute top-3 left-3 px-2 py-1 bg-sage text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
										Keep
									</div>
								</div>
								<p className="text-[10px] text-zinc-400 font-bold px-1 italic">
									Original •{" "}
									{new Date(group.original.uploadDate).toLocaleDateString()}
								</p>
							</div>

							{/* Duplicates */}
							{group.duplicates.map((dupe) => (
								<div
									key={dupe.imageId}
									className="flex flex-col gap-2 cursor-pointer group"
									onClick={() => toggleSelection(dupe.imageId)}
								>
									<div
										className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
											selectedForDeletion.has(dupe.imageId)
												? "border-red-500 scale-95 shadow-xl shadow-red-500/10"
												: "border-transparent group-hover:border-zinc-300 dark:group-hover:border-zinc-700"
										}`}
									>
										<img
											src={dupe.imagePath}
											alt="Duplicate"
											className={`w-full h-full object-cover transition-opacity ${
												selectedForDeletion.has(dupe.imageId)
													? "opacity-40 grayscale"
													: ""
											}`}
										/>
										<div
											className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
												selectedForDeletion.has(dupe.imageId)
													? "bg-red-500 text-white"
													: "bg-black/20 text-white opacity-0 group-hover:opacity-100"
											}`}
										>
											{selectedForDeletion.has(dupe.imageId) ? (
												<Trash2 className="w-3 h-3" />
											) : (
												<div className="w-2 h-2 rounded-full border border-white" />
											)}
										</div>
										<div className="absolute bottom-3 left-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg flex items-center justify-between">
											<span className="text-[9px] text-white font-black uppercase tracking-widest">
												{dupe.isExact ? "Exact Match" : "Visual Match"}
											</span>
											{!dupe.isExact && (
												<span className="text-[9px] text-zinc-300 font-bold">
													{Math.round((1 - dupe.distance / 64) * 100)}%
												</span>
											)}
										</div>
									</div>
									<p className="text-[10px] text-zinc-400 font-bold px-1 italic">
										Added {new Date(dupe.uploadDate).toLocaleDateString()}
									</p>
								</div>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex gap-4">
				<AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
				<div>
					<p className="text-sm font-bold text-amber-900 dark:text-amber-200">
						About Similar Photos
					</p>
					<p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed opacity-80 font-medium">
						Our AI identifies photos that look very similar or are exact file
						matches. We recommend keeping the one marked "Keep" (usually the
						oldest one) to save on your storage quota and keep your gallery
						clean.
					</p>
				</div>
			</div>
		</div>
	);
};
