import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import AlbumCard from "~/components/AlbumCard";
import { ConfirmModal } from "~/components/ConfirmModal";
import EmptyAlbumsState from "~/components/home/EmptyAlbumsState";
import { MainContainer } from "~/components/MainContainer";
import CoachMark from "~/components/onboarding/CoachMark";
import WelcomeTourModal from "~/components/onboarding/WelcomeTourModal";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import { Input } from "~/components/standard/Input";
import { Modal } from "~/components/standard/Modal";
import { useOnboarding } from "~/hooks/useOnboarding";
import ImageGallery from "~/Images/ImageGallery";
import type { Album } from "~/types";
import { createAlbum, deleteAlbum, editAlbum, fetchAlbums } from "../utils/api";

const Home = () => {
	const queryClient = useQueryClient();
	const onboarding = useOnboarding();
	const { data: albumsData, isLoading: isAlbumsLoading } = useQuery({
		queryKey: ["albums"],
		queryFn: fetchAlbums,
	});
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [albumName, setAlbumName] = useState("");
	const [selectedAlbum, setSelectedAlbum] = useState<any>(null);

	// Confirmation Modal States
	const [confirmDeleteAlbumId, setConfirmDeleteAlbumId] = useState<
		string | null
	>(null);

	const createAlbumMutation = useMutation({
		mutationFn: createAlbum,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["albums"] });
			setIsCreateModalOpen(false);
			setAlbumName("");
			toast.success("Album created successfully");
			if (onboarding.isStep("create-album")) {
				onboarding.advance("share-qr");
			}
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to create album");
		},
	});

	const editAlbumMutation = useMutation({
		mutationFn: editAlbum,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["albums"] });
			setIsEditModalOpen(false);
			setAlbumName("");
			setSelectedAlbum(null);
			toast.success("Album updated");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update album");
		},
	});

	const deleteAlbumMutation = useMutation({
		mutationFn: deleteAlbum,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["albums"] });
			toast.success("Album deleted");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete album");
		},
	});

	const handleCreateAlbum = () => {
		if (!albumName.trim()) return;
		createAlbumMutation.mutate(albumName);
	};

	const handleEditAlbum = () => {
		if (!albumName.trim() || !selectedAlbum) return;
		editAlbumMutation.mutate({ albumId: selectedAlbum.id, albumName });
	};

	const handleDeleteAlbum = (albumId: string) => {
		deleteAlbumMutation.mutate(albumId);
		setConfirmDeleteAlbumId(null);
	};

	const albums: Album[] = albumsData?.data?.albums ?? [];

	return (
		<MainContainer className="space-y-24 pb-24">
			{/* Hero Section */}
			<section className="pt-10 md:pt-16 space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
				<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-4">
						<div className="inline-flex items-center px-4 py-1.5 bg-sage/10 text-sage rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
							Dashboard
						</div>
						<Heading
							level={1}
							className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]"
						>
							Welcome back<span className="text-sage">.</span>
						</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl font-medium max-w-xl text-pretty">
							Your photo library is up to date. Organize your memories, manage
							events, and find faces instantly.
						</p>
					</div>
					<div className="relative flex items-center gap-3">
						<Button
							size="md"
							className="font-bold shadow-lg shadow-sage/20 active:scale-95 transition-transform"
							onClick={() => setIsCreateModalOpen(true)}
						>
							+ New Album
						</Button>
						<CoachMark
							open={onboarding.isStep("create-album")}
							stepNumber={2}
							totalSteps={3}
							title="Create your first album"
							body="Albums are where your photos live. Make one to start collecting and matching faces."
							advanceLabel="Open create"
							onAdvance={() => {
								setIsCreateModalOpen(true);
							}}
							onDismiss={onboarding.dismiss}
							placement="bottom"
						/>
					</div>
				</div>
			</section>

			{/* Albums Section */}
			<section className="relative">
				<div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-sage/50 to-transparent rounded-full hidden md:block" />
				<div className="flex justify-between items-end mb-10">
					<div>
						<Heading level={2} className="text-3xl font-black tracking-tight">
							Albums
						</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
							Manage your collections and collaborative event galleries
						</p>
					</div>
				</div>

				{isAlbumsLoading ? (
					<div className="flex justify-center py-20">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
					</div>
				) : albums.length === 0 ? (
					<EmptyAlbumsState onCreateAlbum={() => setIsCreateModalOpen(true)} />
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 sm:gap-10">
						{albums.map((album: Album, idx: number) => (
							<div
								key={album.id}
								className={idx === 0 ? "relative" : undefined}
							>
								<AlbumCard
									album={album}
									onEdit={(albumToEdit) => {
										setSelectedAlbum(albumToEdit);
										setAlbumName(albumToEdit.albumName || "");
										setIsEditModalOpen(true);
									}}
									onDelete={(albumId) => {
										setConfirmDeleteAlbumId(albumId);
									}}
								/>
								{idx === 0 && (
									<CoachMark
										open={onboarding.isStep("share-qr")}
										stepNumber={3}
										totalSteps={3}
										title="Share with your guests"
										body="Open this album, flip it to an event, and share the QR code so guests can upload and find themselves."
										advanceLabel="Finish tour"
										onAdvance={() => onboarding.advance("complete")}
										onDismiss={onboarding.dismiss}
										placement="bottom"
									/>
								)}
							</div>
						))}
					</div>
				)}
			</section>

			{/* Recent Photos Section */}
			<section className="relative pt-10 border-t border-zinc-100 dark:border-zinc-800/50">
				<div className="absolute -left-4 top-10 bottom-0 w-1 bg-gradient-to-b from-sage/50 to-transparent rounded-full hidden md:block" />
				<ImageGallery />
			</section>

			{/* Modals */}
			<ConfirmModal
				isOpen={!!confirmDeleteAlbumId}
				title="Delete Album"
				message="Are you sure you want to delete this album? All photo associations will be removed. The actual photos will remain in your library."
				confirmText="Delete Album"
				onConfirm={() =>
					confirmDeleteAlbumId && handleDeleteAlbum(confirmDeleteAlbumId)
				}
				onCancel={() => setConfirmDeleteAlbumId(null)}
				isDestructive={true}
				isLoading={deleteAlbumMutation.isPending}
			/>

			<Modal
				isOpen={isCreateModalOpen || isEditModalOpen}
				onClose={() => {
					setIsCreateModalOpen(false);
					setIsEditModalOpen(false);
					setAlbumName("");
					setSelectedAlbum(null);
				}}
				size="md"
				title={isCreateModalOpen ? "Create Album" : "Edit Album"}
				description={
					isCreateModalOpen
						? "Give your new album a name to start organizing."
						: "Update the name of your album."
				}
			>
				<div className="mt-4">
					<Input
						type="text"
						label="Album Name"
						placeholder="e.g. Summer Vacation 2025"
						value={albumName}
						onChange={(e) => setAlbumName(e.target.value)}
						autoFocus
					/>
				</div>
				<div className="flex items-center space-x-3 mt-10">
					<Button
						className="flex-1 font-bold"
						onClick={isCreateModalOpen ? handleCreateAlbum : handleEditAlbum}
						disabled={
							(isCreateModalOpen
								? createAlbumMutation.isPending
								: editAlbumMutation.isPending) || !albumName.trim()
						}
					>
						{isCreateModalOpen
							? createAlbumMutation.isPending
								? "Creating..."
								: "Create Album"
							: editAlbumMutation.isPending
								? "Saving..."
								: "Save Changes"}
					</Button>
					<Button
						variant="ghost"
						className="rounded-control font-bold"
						onClick={() => {
							setIsCreateModalOpen(false);
							setIsEditModalOpen(false);
							setAlbumName("");
							setSelectedAlbum(null);
						}}
					>
						Cancel
					</Button>
				</div>
			</Modal>

			<WelcomeTourModal
				open={onboarding.isStep("welcome")}
				onStart={() => onboarding.advance("create-album")}
				onDismiss={onboarding.dismiss}
			/>
		</MainContainer>
	);
};

export default Home;
