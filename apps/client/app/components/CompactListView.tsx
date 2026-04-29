import type React from "react";
import type { ImageFromDB } from "~/types";

interface CompactListViewProps {
	images: ImageFromDB[];
	selectedIds: Set<string>;
	onToggleSelect: (id: string) => void;
	onImageClick: (image: ImageFromDB) => void;
}

export const CompactListView: React.FC<CompactListViewProps> = ({
	images,
	selectedIds,
	onToggleSelect,
	onImageClick,
}) => {
	return (
		<div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
			<table className="w-full text-left border-collapse">
				<thead>
					<tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
						<th className="p-4 w-12 text-center">
							<div className="flex justify-center">
								<div className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-700" />
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
								className={`group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${
									isSelected ? "bg-sage/10" : ""
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
											className={`w-full h-full object-cover ${image.status === "QUOTA_EXCEEDED" ? "grayscale opacity-60" : ""}`}
										/>
										{image.status === "QUOTA_EXCEEDED" && (
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
											{image.status === "QUOTA_EXCEEDED" && (
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
										{image.originalSize.width} x {image.originalSize.height}
									</span>
								</td>
								<td className="p-4 text-right">
									<button
										className="p-2 text-zinc-400 hover:text-sage transition-colors"
										onClick={(e) => {
											e.stopPropagation();
											onImageClick(image);
										}}
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</button>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
