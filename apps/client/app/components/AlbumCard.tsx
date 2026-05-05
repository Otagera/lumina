import { Edit2, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Album } from "~/types";
import AlbumCover from "./AlbumCover";
import { Card } from "./standard/Card";

interface AlbumCardProps {
	album: Album;
	onEdit?: (album: Album) => void;
	onDelete?: (albumId: string) => void;
}

const AlbumCard = ({ album, onEdit, onDelete }: AlbumCardProps) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<Link to={`/album/${album.id}`} className="block group relative">
			<Card className="aspect-[3/4] p-0 border-none bg-zinc-100 dark:bg-zinc-800">
				<AlbumCover album={album} />
				<div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
			</Card>

			{(onEdit || onDelete) && (
				<div className="absolute top-2 right-2 z-10" ref={menuRef}>
					<button
						type="button"
						className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-lg opacity-60 group-hover:opacity-100 transition-all focus:opacity-100 shadow-lg"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setIsMenuOpen(!isMenuOpen);
						}}
					>
						<MoreVertical size={16} />
					</button>

					{isMenuOpen && (
						<div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 animate-in fade-in zoom-in duration-200">
							{onEdit && (
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setIsMenuOpen(false);
										onEdit(album);
									}}
								>
									<Edit2 size={14} />
									Edit
								</button>
							)}
							{onDelete && (
								<button
									type="button"
									className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 text-plum hover:bg-plum/10 transition-colors font-medium"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										setIsMenuOpen(false);
										onDelete(album.id);
									}}
								>
									<Trash2 size={14} />
									Delete
								</button>
							)}
						</div>
					)}
				</div>
			)}

			<div className="mt-4 flex justify-between items-start px-1">
				<div>
					<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-sage transition-colors truncate pr-2">
						{album.albumName}
					</h3>
					<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
						{album._count?.images || 0} photos
					</p>
				</div>
			</div>
		</Link>
	);
};

export default AlbumCard;
