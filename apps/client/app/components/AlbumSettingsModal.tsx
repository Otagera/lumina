import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import { editAlbumSettings, fetchSettings } from "../utils/api";
import { Button } from "./standard/Button";
import { Heading } from "./standard/Heading";
import "react-datepicker/dist/react-datepicker.css";

interface AlbumSettingsModalProps {
	albumId: string;
	albumName: string;
	settings: any; // album_settings object
	storageConfigId?: string | null;
	onClose: () => void;
}

export const AlbumSettingsModal = ({
	albumId,
	albumName,
	settings,
	storageConfigId,
	onClose,
}: AlbumSettingsModalProps) => {
	const queryClient = useQueryClient();
	const [localSettings, setLocalSettings] = useState(settings || {});
	const [selectedStorageId, setSelectedStorageId] = useState<string | null>(
		storageConfigId || null,
	);
	const [expiresAt, setExpiresAt] = useState<Date | null>(
		settings?.expires_at ? new Date(settings.expires_at) : null,
	);

	const { data: settingsData } = useQuery({
		queryKey: ["settings"],
		queryFn: fetchSettings,
	});

	useEffect(() => {
		setLocalSettings(settings || {});
		setExpiresAt(settings?.expires_at ? new Date(settings.expires_at) : null);
		setSelectedStorageId(storageConfigId || null);
	}, [settings, storageConfigId]);

	const updateSettingsMutation = useMutation({
		mutationFn: (data: { settings: any; storageConfigId: string | null }) =>
			editAlbumSettings(albumId, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: [`album-${albumId}`] });
			toast.success("Album settings updated successfully");
			onClose();
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update album settings");
		},
	});

	const handleSettingChange = (key: string, value: any) => {
		setLocalSettings((prev: any) => ({ ...prev, [key]: value }));
	};

	const handleDateChange = (date: Date | null) => {
		setExpiresAt(date);
		handleSettingChange("expires_at", date ? date.toISOString() : null);
	};

	const handleSave = () => {
		const { album_id, ...settingsToSave } = localSettings;
		updateSettingsMutation.mutate({
			settings: settingsToSave,
			storageConfigId: selectedStorageId,
		});
	};

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
			<div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
				<div className="flex justify-between items-start mb-6">
					<div>
						<Heading level={2}>Album Settings</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
							Configure collaboration, moderation, storage, and webhooks for
							this album.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="space-y-6 mt-6 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
					{/* Storage Selection */}
					<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
						<div className="flex items-center gap-2 mb-3">
							<HardDrive size={18} className="text-sage" />
							<p className="font-bold text-zinc-900 dark:text-white text-sm">
								Storage Destination
							</p>
						</div>
						<select
							className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-sage outline-none transition-all"
							value={selectedStorageId || ""}
							onChange={(e) => setSelectedStorageId(e.target.value || null)}
						>
							<option value="">Managed Cloudflare R2 (Default)</option>
							{settingsData?.data?.storageConfigs?.map((config: any) => (
								<option key={config.id} value={config.id}>
									BYOS: {config.name} ({config.bucket})
								</option>
							))}
						</select>
						<p className="text-[10px] text-zinc-500 mt-2 font-medium">
							Choose where photos uploaded to this album will be stored.
						</p>
					</div>

					{/* Event Mode */}
					<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
						<div>
							<p className="font-bold text-zinc-900 dark:text-white text-sm">
								Enable Collaborative Event
							</p>
							<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
								Allow guests to upload photos via a shared link.
							</p>
						</div>
						<input
							type="checkbox"
							checked={localSettings.is_event || false}
							onChange={(e) =>
								handleSettingChange("is_event", e.target.checked)
							}
							className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 checked:bg-sage focus:ring-sage focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer"
						/>
					</div>

					{localSettings.is_event && (
						<>
							{/* Allow Guest Uploads */}
							<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
								<div>
									<p className="font-bold text-zinc-900 dark:text-white text-sm">
										Allow Guest Uploads
									</p>
									<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
										If disabled, guests can only view and search.
									</p>
								</div>
								<input
									type="checkbox"
									checked={localSettings.allow_guest_uploads || false}
									onChange={(e) =>
										handleSettingChange("allow_guest_uploads", e.target.checked)
									}
									className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 checked:bg-sage focus:ring-sage focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer"
								/>
							</div>

							{localSettings.allow_guest_uploads && (
								<>
									{/* Requires Approval */}
									<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
										<div>
											<p className="font-bold text-zinc-900 dark:text-white text-sm">
												Require Host Approval for Uploads
											</p>
											<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
												New guest photos will be PENDING until approved by you.
											</p>
										</div>
										<input
											type="checkbox"
											checked={localSettings.requires_approval || false}
											onChange={(e) =>
												handleSettingChange(
													"requires_approval",
													e.target.checked,
												)
											}
											className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 checked:bg-sage focus:ring-sage focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer"
										/>
									</div>

									{/* Tagging Policy */}
									<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
										<p className="font-bold text-zinc-900 dark:text-white mb-3 text-sm">
											Who can tag faces?
										</p>
										<div className="space-y-3">
											<label className="flex items-center text-xs text-zinc-700 dark:text-zinc-300 font-bold">
												<input
													type="radio"
													name="tagging_policy"
													value="HOST_ONLY"
													checked={localSettings.tagging_policy === "HOST_ONLY"}
													onChange={() =>
														handleSettingChange("tagging_policy", "HOST_ONLY")
													}
													className="h-4 w-4 text-sage focus:ring-sage border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800"
												/>
												<span className="ml-2">Host Only</span>
											</label>
											<label className="flex items-center text-xs text-zinc-700 dark:text-zinc-300 font-bold">
												<input
													type="radio"
													name="tagging_policy"
													value="GUESTS_SELF"
													checked={
														localSettings.tagging_policy === "GUESTS_SELF"
													}
													onChange={() =>
														handleSettingChange("tagging_policy", "GUESTS_SELF")
													}
													className="h-4 w-4 text-sage focus:ring-sage border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800"
												/>
												<span className="ml-2">Guests Can Tag Themselves</span>
											</label>
											<label className="flex items-center text-xs text-zinc-700 dark:text-zinc-300 font-bold">
												<input
													type="radio"
													name="tagging_policy"
													value="ANYONE"
													checked={localSettings.tagging_policy === "ANYONE"}
													onChange={() =>
														handleSettingChange("tagging_policy", "ANYONE")
													}
													className="h-4 w-4 text-sage focus:ring-sage border-zinc-300 dark:border-zinc-600 dark:bg-zinc-800"
												/>
												<span className="ml-2">Anyone (Host & Guests)</span>
											</label>
										</div>
									</div>

									{/* Expiration Date */}
									<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
										<div className="flex items-center justify-between mb-3">
											<p className="font-bold text-zinc-900 dark:text-white text-sm">
												Uploads Close On
											</p>
											{expiresAt && (
												<button
													type="button"
													onClick={() => handleDateChange(null)}
													className="text-xs text-plum hover:text-plum/80 font-medium"
												>
													Clear to Never
												</button>
											)}
										</div>
										<DatePicker
											selected={expiresAt}
											onChange={handleDateChange}
											showTimeSelect
											dateFormat="Pp"
											className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-sage outline-none transition-all"
											placeholderText="Never"
										/>
									</div>
								</>
							)}
						</>
					)}

					{/* Webhooks */}
					<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
						<div className="flex items-center justify-between mb-3">
							<p className="font-bold text-zinc-900 dark:text-white text-sm">
								Webhook URL
							</p>
						</div>
						<input
							type="url"
							placeholder="https://your-server.com/webhook"
							value={localSettings.webhook_url || ""}
							onChange={(e) =>
								handleSettingChange("webhook_url", e.target.value)
							}
							className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-bold focus:ring-2 focus:ring-sage outline-none transition-all"
						/>
						<p className="text-[10px] text-zinc-500 mt-2 font-medium">
							Receive POST requests when guests upload photos or clustering
							completes.
						</p>
					</div>
				</div>

				<div className="mt-8 flex items-center space-x-3">
					<Button
						className="flex-1 rounded-xl py-6 font-bold"
						onClick={handleSave}
						disabled={updateSettingsMutation.isPending}
					>
						{updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
					</Button>
					<Button
						variant="ghost"
						onClick={onClose}
						className="rounded-xl font-bold"
					>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
};
