import { ImageIcon, MoreHorizontal, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { AlbumImage } from "~/types";

interface CompactListViewProps {
	images: AlbumImage[];
	selectedIds: Set<string>;
	onToggleSelect: (id: string) => void;
	onSelectAll?: () => void;
	onImageClick: (image: AlbumImage) => void;
	onDelete?: (imageId: string) => void;
	onSetCover?: (imageId: string) => void;
	coverImageId?: string;
}

export const CompactListView: React.FC<CompactListViewProps> = ({
	images,
	selectedIds,
	onToggleSelect,
	onSelectAll,
	onImageClick,
	onDelete,
	onSetCover,
	coverImageId,
}) => {
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	return (
		<div className="w-full bg-white dark:bg-zinc-900 rounded-card border border-zinc-200 dark:border-zinc-800 overflow-x-auto shadow-sm no-scrollbar">
			<table className="w-full text-left border-collapse min-w-[600px]">
				<thead>
					<tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
						<th className="p-4 w-12 text-center">
							<div className="flex justify-center">
								<button
									type="button"
									onClick={onSelectAll}
									className="w-5 h-5 rounded border-2 border-zinc-300 dark:border-zinc-600 hover:border-sage transition-colors flex items-center justify-center"
								>
									{images.length > 0 && selectedIds.size === images.length ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-3.5 w-3.5 text-sage"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									) : selectedIds.size > 0 ? (
										<div className="w-2 h-2 bg-sage/50 rounded-sm" />
									) : null}
								</button>
							</div>
						</th>
						<th className="p-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
							Preview
						</th>
						<th className="p-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
							Filename
						</th>
						<th className="p-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden md:table-cell">
							Faces
						</th>
						<th className="p-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden lg:table-cell">
							Dimensions
						</th>
						<th className="p-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">
							Actions
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
					{images.map((image) => {
						const isSelected = selectedIds.has(image.imageId);
						const filename = image.imagePath.split("/").pop();

						return (
							<tr
								key={image.imageId}
								className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${isSelected ? "bg-sage/10" : ""
									}`}
								onClick={() => onImageClick(image)}
							>
								<td
									className="p-4 text-center"
									onClick={(e) => {
										e.stopPropagation();
										onToggleSelect(image.imageId);
									}}
								>
									<div className="flex justify-center">
										<input
											type="checkbox"
											checked={isSelected}
											readOnly
											className="w-5 h-5 rounded-lg accent-sage cursor-pointer"
										/>
									</div>
								</td>
								<td className="p-4">
									<div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 relative">
										<img
											src={image.imagePath}
											alt={filename}
											className={`w-full h-full object-cover ${(image.status as string) === "QUOTA_EXCEEDED" ? "grayscale opacity-60" : ""}`}
										/>
										{(image.status as string) === "QUOTA_EXCEEDED" && (
											<div className="absolute inset-0 flex items-center justify-center">
												<div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
											</div>
										)}
									</div>
								</td>
								<td className="p-4">
									<div className="flex flex-col">
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
												{filename}
											</span>
											{(image.status as string) === "QUOTA_EXCEEDED" && (
												<span className="px-1.5 py-0.5 bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-tighter rounded-md">
													Limit Reached
												</span>
											)}
										</div>
										<span className="text-[10px] text-zinc-500 font-mono">
											{image.imageId.substring(0, 8)}...
										</span>
									</div>
								</td>
								<td className="p-4 hidden md:table-cell">
									<div className="flex items-center space-x-1">
										<span className="text-sm font-bold text-sage">
											{image.faces?.length || 0}
										</span>
										<span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">
											Detected
										</span>
									</div>
								</td>
								<td className="p-4 hidden lg:table-cell">
									<span className="text-xs text-zinc-500">
										{image.originalSize?.width ?? 0} x{" "}
										{image.originalSize?.height ?? 0}
									</span>
								</td>
								<td
									className="p-4 text-right"
									onClick={(e) => e.stopPropagation()}
								>
									<div className="relative inline-block">
										<button
											type="button"
											className="p-2 text-zinc-400 hover:text-sage transition-colors"
											onClick={(e) => {
												e.stopPropagation();
												setOpenMenuId(
													openMenuId === image.imageId ? null : image.imageId,
												);
											}}
										>
											<MoreHorizontal size={20} />
										</button>
										{openMenuId === image.imageId && (
											<div
												className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-card shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20"
												onClick={(e) => e.stopPropagation()}
											>
												{onSetCover && (
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															onSetCover(image.imageId);
															setOpenMenuId(null);
														}}
														className={`w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2 ${coverImageId === image.imageId ? "bg-sage/10" : ""}`}
													>
														<ImageIcon size={14} />
														{coverImageId === image.imageId
															? "Remove Cover"
															: "Set as Cover"}
													</button>
												)}
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														onDelete?.(image.imageId);
														setOpenMenuId(null);
													}}
													className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
												>
													<Trash2 size={14} />
													Delete
												</button>
											</div>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
