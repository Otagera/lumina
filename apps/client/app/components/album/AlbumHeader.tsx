import {
	MoreVertical,
	Pencil,
	Settings2,
	Trash2,
	Upload,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AlbumCover from "~/components/AlbumCover";
import { Button } from "~/components/standard/Button";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import type { Album } from "~/types";

export interface AlbumHeaderProps {
	album: Album | undefined;
	imageCount: number;
	isEditingName: boolean;
	editAlbumName: string;
	onEditName: (value: string) => void;
	onStartEditing: () => void;
	onCancelEditing: () => void;
	onSaveName: () => void;
	onUpload: () => void;
	onOpenPermissions: () => void;
	onOpenSettings: () => void;
	onOpenShare: () => void;
	onDelete: () => void;
	onTriggerClustering: () => void;
	isRenamePending: boolean;
}

export function AlbumHeader({
	album,
	imageCount,
	isEditingName,
	editAlbumName,
	onEditName,
	onStartEditing,
	onCancelEditing,
	onSaveName,
	onUpload,
	onOpenPermissions,
	onOpenSettings,
	onOpenShare,
	onDelete,
	onTriggerClustering,
	isRenamePending,
}: AlbumHeaderProps) {
	const [moreMenuOpen, setMoreMenuOpen] = useState(false);

	useEffect(() => {
		if (!moreMenuOpen) return;
		const handleClickOutside = () => setMoreMenuOpen(false);
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, [moreMenuOpen]);

	const handleDeleteClick = () => {
		setMoreMenuOpen(false);
		onDelete();
	};

	return (
		<div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
			<div className="flex-1">
				<div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
					<Card className="group relative w-28 md:w-32 aspect-[3/4] p-0 border-none overflow-hidden bg-zinc-100 dark:bg-zinc-800">
						<div className="w-full h-full">
							<AlbumCover album={album} />
						</div>
						<div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
					</Card>

					<div className="flex flex-col items-start gap-2">
						<div className="flex flex-wrap items-center gap-3 group justify-between w-full lg:w-auto">
							<div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
								<div
									className={`transition-all duration-300 ease-out flex items-center gap-2 w-full ${isEditingName
										? "translate-x-0 opacity-100"
										: "-translate-x-4 opacity-0 absolute pointer-events-none"
										}`}
								>
									<input
										type="text"
										value={editAlbumName}
										onChange={(e) => onEditName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") onSaveName();
											else if (e.key === "Escape") onCancelEditing();
										}}
										onBlur={() => {
											if (!editAlbumName.trim()) onCancelEditing();
										}}
										className="flex-1 text-3xl md:text-5xl lg:text-6xl font-black text-zinc-900 dark:text-white bg-transparent border-b-2 border-sage focus:outline-none px-1 min-w-0"
										autoFocus
									/>
									<Button
										size="sm"
										onClick={onSaveName}
										disabled={!editAlbumName.trim() || isRenamePending}
										className="text-xs sm:text-sm shrink-0"
									>
										{isRenamePending ? "..." : "Save"}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={onCancelEditing}
										className="shrink-0"
									>
										<XCircle size={16} />
									</Button>
								</div>
								<div
									className={`transition-all duration-300 ease-out flex items-center gap-2 ${isEditingName
										? "translate-x-4 opacity-0 absolute pointer-events-none"
										: "translate-x-0 opacity-100"
										}`}
								>
									<Heading level={1} className="text-3xl md:text-5xl lg:text-6xl truncate">
										{album?.albumName}
									</Heading>
									<button
										type="button"
										onClick={onStartEditing}
										className="p-2 text-zinc-400 hover:text-sage opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
										title="Rename album"
									>
										<Pencil size={18} />
									</button>
								</div>
							</div>
							
							<div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
								<Button
									variant="outline"
									size="sm"
									onClick={onTriggerClustering}
									className="text-xs flex-1 sm:flex-initial h-9"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-4 w-4 mr-1.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									Group
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={onOpenPermissions}
									className="text-xs flex-1 sm:flex-initial h-9"
								>
									<Settings2 size={14} className="mr-1.5" />
									<span>Permissions</span>
								</Button>
								<Button
									variant="primary"
									size="sm"
									onClick={onUpload}
									className="text-xs flex-1 sm:flex-initial h-9"
								>
									<Upload size={14} className="mr-1.5" />
									Upload
								</Button>
								<div className="relative">
									<button
										type="button"
										onClick={(e) => {
											e.stopPropagation();
											setMoreMenuOpen(!moreMenuOpen);
										}}
										className="p-2 text-zinc-400 hover:text-sage transition-colors rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
										title="More actions"
									>
										<MoreVertical size={20} />
									</button>
									{moreMenuOpen && (
										<div
											className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-50"
											onClick={(e) => e.stopPropagation()}
										>
											<button
												type="button"
												onClick={() => {
													onOpenSettings();
													setMoreMenuOpen(false);
												}}
												className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
											>
												<Settings2 size={16} />
												Album Settings
											</button>
											<button
												type="button"
												onClick={() => {
													onOpenShare();
													setMoreMenuOpen(false);
												}}
												className="w-full px-4 py-2 text-left text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center gap-2"
											>
												Share Album
											</button>
											<button
												type="button"
												onClick={handleDeleteClick}
												className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
											>
												<Trash2 size={16} />
												Delete Album
											</button>
										</div>
									)}
								</div>
							</div>
						</div>
						<p className="text-zinc-500 dark:text-zinc-400 mt-1">
							{imageCount} photos curated in this collection
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
