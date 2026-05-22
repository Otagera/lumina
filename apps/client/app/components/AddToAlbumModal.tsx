import { useQuery } from "@tanstack/react-query";
import { Check, Folder } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { fetchAlbums } from "../utils/api";
import { Modal } from "./standard/Modal";

interface AddToAlbumModalProps {
	onClose: () => void;
	onConfirm: (albumId: string) => void;
	isProcessing?: boolean;
}

interface Album {
	id: string;
	albumName: string;
}

export const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({
	onClose,
	onConfirm,
	isProcessing,
}) => {
	const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

	const { data: albumsData, isLoading } = useQuery({
		queryKey: ["albums"],
		queryFn: fetchAlbums,
	});

	const albums: Album[] = albumsData?.data?.albums || [];

	return (
		<Modal isOpen onClose={onClose} size="md" title="Add to Album">
			<div className="-mx-1 max-h-[50vh] overflow-y-auto py-2 space-y-2">
				{isLoading ? (
					<div className="flex justify-center py-8">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sage" />
					</div>
				) : albums.length === 0 ? (
					<p className="text-center py-8 text-zinc-500 text-sm">
						No albums found. Create one first.
					</p>
				) : (
					albums.map((album) => (
						<button
							type="button"
							key={album.id}
							onClick={() => setSelectedAlbumId(album.id)}
							className={`w-full flex items-center justify-between p-4 rounded-card border transition-colors ${selectedAlbumId === album.id
								? "bg-sage/10 border-sage text-sage"
								: "bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
								}`}
						>
							<div className="flex items-center space-x-3">
								<div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-control flex items-center justify-center">
									<Folder className="h-5 w-5 text-zinc-400" />
								</div>
								<span className="font-bold text-sm">{album.albumName}</span>
							</div>
							{selectedAlbumId === album.id && (
								<Check className="h-5 w-5" />
							)}
						</button>
					))
				)}
			</div>

			<div className="flex space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800 mt-2">
				<button
					type="button"
					onClick={() => selectedAlbumId && onConfirm(selectedAlbumId)}
					disabled={!selectedAlbumId || isProcessing}
					className="flex-1 py-3 bg-sage text-zinc-950 rounded-control font-bold shadow-lg shadow-sage/25 hover:bg-sage/90 transition-colors disabled:opacity-50"
				>
					{isProcessing ? "Adding..." : "Add to Album"}
				</button>
				<button
					type="button"
					onClick={onClose}
					className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-control font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
				>
					Cancel
				</button>
			</div>
		</Modal>
	);
};
