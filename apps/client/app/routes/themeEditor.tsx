import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { PresetGrid } from "~/components/theme/PresetGrid";
import { SectionSorter } from "~/components/theme/SectionSorter";
import { SharedAlbumPagePreview } from "~/components/theme/SharedAlbumPagePreview";
import { StyleControls } from "~/components/theme/StyleControls";
import { Button } from "~/components/standard/Button";
import type { ThemeConfig } from "~/types";
import axiosAPI from "~/utils/axios";
import { albumKeys } from "~/utils/queryKeys";
import { DEFAULT_THEME, THEME_PRESETS } from "~/utils/themePresets";

const fetchAlbum = async (albumId: string) => {
	const res = await axiosAPI.get(`/albums/${albumId}`);
	return res.data;
};

const PANEL_SECTIONS = [
	{ id: "presets", label: "Presets" },
	{ id: "style", label: "Style" },
	{ id: "sections", label: "Sections" },
] as const;

type PanelSection = (typeof PANEL_SECTIONS)[number]["id"];

export default function ThemeEditor() {
	const { albumId } = useParams<{ albumId: string }>();
	const queryClient = useQueryClient();

	const { data: albumResponse, isLoading } = useQuery({
		queryKey: albumKeys.detail(albumId!),
		queryFn: () => fetchAlbum(albumId!),
		enabled: !!albumId,
	});

	const album = albumResponse?.data;

	const [draftConfig, setDraftConfig] = useState<ThemeConfig>(DEFAULT_THEME);
	const [isSaving, setIsSaving] = useState(false);
	const [activePanel, setActivePanel] = useState<PanelSection>("presets");

	useEffect(() => {
		if (album?.settings?.theme_config) {
			setDraftConfig(album.settings.theme_config as ThemeConfig);
		}
	}, [album]);

	const patch = useCallback((update: Partial<ThemeConfig>) => {
		setDraftConfig((prev) => ({ ...prev, ...update }));
	}, []);

	const handleSave = async () => {
		if (!albumId || !album) return;
		setIsSaving(true);
		try {
			await axiosAPI.put(`/albums/${albumId}`, {
				settings: { theme_config: draftConfig },
			});
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
			toast.success("Theme saved!");
		} catch {
			toast.error("Failed to save theme.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDiscard = () => {
		if (album?.settings?.theme_config) {
			setDraftConfig(album.settings.theme_config as ThemeConfig);
		} else {
			setDraftConfig(DEFAULT_THEME);
		}
		toast("Changes discarded", { icon: "↩" });
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white" />
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
			{/* Top bar */}
			<div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
				<div className="flex items-center gap-3">
					<Link
						to={`/album/${albumId}`}
						className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					>
						<ArrowLeft size={18} />
					</Link>
					<div>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
							{album?.albumName}
						</p>
						<h1 className="text-sm font-black text-zinc-900 dark:text-zinc-50">
							Customize Theme
						</h1>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={handleDiscard}
						className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
						title="Discard changes"
					>
						<RotateCcw size={16} />
					</button>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={isSaving}
						className="flex items-center gap-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
					>
						<Check size={14} />
						{isSaving ? "Saving…" : "Save"}
					</Button>
				</div>
			</div>

			{/* Main area */}
			<div className="flex flex-1 min-h-0">
				{/* Left panel */}
				<div className="w-full md:w-80 lg:w-96 shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
					{/* Panel tabs */}
					<div className="flex border-b border-zinc-200 dark:border-zinc-800 shrink-0">
						{PANEL_SECTIONS.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => setActivePanel(s.id)}
								className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
									activePanel === s.id
										? "text-zinc-900 dark:text-zinc-50 border-b-2 border-zinc-900 dark:border-white"
										: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
								}`}
							>
								{s.label}
							</button>
						))}
					</div>

					{/* Panel content */}
					<div className="flex-1 overflow-y-auto p-4">
						{activePanel === "presets" && (
							<div className="space-y-3">
								<p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
									Pick a starting point — then customize anything in Style and Sections.
								</p>
								<PresetGrid
									presets={THEME_PRESETS}
									activePreset={draftConfig.preset}
									onSelect={(config) => setDraftConfig(config)}
								/>
							</div>
						)}

						{activePanel === "style" && (
							<StyleControls config={draftConfig} onChange={patch} />
						)}

						{activePanel === "sections" && (
							<div className="space-y-3">
								<p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
									Drag to reorder sections. Click the eye icon to show or hide optional sections.
								</p>
								<SectionSorter config={draftConfig} onChange={patch} />
							</div>
						)}
					</div>
				</div>

				{/* Preview pane (hidden on mobile) */}
				<div className="hidden md:flex flex-1 flex-col min-h-0 bg-zinc-100 dark:bg-zinc-950 p-6 overflow-hidden">
					<div className="flex items-center justify-between mb-3 shrink-0">
						<p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
							Live Preview
						</p>
					</div>
					<div className="flex-1 min-h-0 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800">
						<SharedAlbumPagePreview
							config={draftConfig}
							albumName={album?.albumName ?? "Your Album"}
							tagline={album?.settings?.tagline ?? undefined}
							imageCount={album?._count?.images ?? 4}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
