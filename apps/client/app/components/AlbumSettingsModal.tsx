import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "~/utils/eden";
import DatePicker from "react-datepicker";
import toast from "react-hot-toast";
import { editAlbumSettings, fetchSettings } from "../utils/api";
import { albumKeys, settingsKeys } from "../utils/queryKeys";
import { Button } from "./standard/Button";
import { Input } from "./standard/Input";
import { Modal } from "./standard/Modal";
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
	const [displayPin, setDisplayPin] = useState<string | null>(settings?.display_pin ?? null);
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
			editAlbumSettings(albumId, {
				settings: data.settings,
				storageConfigId: data.storageConfigId,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: albumKeys.detail(albumId) });
			queryClient.invalidateQueries({ queryKey: settingsKeys.all });
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

	const generatePinMutation = useMutation({
		mutationFn: async () => {
			const res = await api.albums[albumId]["display-pin"].post({});
			return (res as any)?.data?.data?.pin as string;
		},
		onSuccess: (pin) => {
			setDisplayPin(pin);
			toast.success("New PIN generated");
		},
		onError: () => toast.error("Failed to generate PIN"),
	});

	const handleDateChange = (date: Date | null) => {
		setExpiresAt(date);
		handleSettingChange("expires_at", date ? date.toISOString() : null);
	};

	const handleSave = () => {
		const { album_id, albumId: id, ...settingsToSave } = localSettings;
		updateSettingsMutation.mutate({
			settings: settingsToSave,
			storageConfigId: selectedStorageId,
		});
	};

	return (
		<Modal
			isOpen
			onClose={onClose}
			size="lg"
			title="Album Settings"
			description="Configure collaboration, moderation, storage, and webhooks for this album."
		>
			<div className="space-y-6 mt-4">
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
												className="text-xs text-plum dark:text-rose-300 hover:text-plum/80 dark:hover:text-rose-300/80 font-medium"
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

				{/* Allow Downloads */}
				<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
					<div>
						<p className="font-bold text-zinc-900 dark:text-white text-sm">
							Allow Photo Downloads
						</p>
						<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
							Guests can download photos from the shared album. Only active after album is delivered.
						</p>
					</div>
					<input
						type="checkbox"
						checked={localSettings.allow_downloads !== false}
						onChange={(e) =>
							handleSettingChange("allow_downloads", e.target.checked)
						}
						className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 checked:bg-sage focus:ring-sage focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer"
					/>
				</div>

				{/* Live Display PIN */}
				{localSettings.is_event && (
					<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
						<div>
							<p className="font-bold text-zinc-900 dark:text-white text-sm">
								Live Display PIN
							</p>
							<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
								{displayPin ? (
									<>Current PIN: <span className="font-black tracking-widest text-zinc-700 dark:text-zinc-200">{displayPin}</span></>
								) : "No PIN set. Generate one to enable live display mode."}
							</p>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => generatePinMutation.mutate()}
							disabled={generatePinMutation.isPending}
						>
							{generatePinMutation.isPending ? "Generating..." : displayPin ? "Regenerate" : "Generate PIN"}
						</Button>
					</div>
				)}

				{/* Webhooks */}
				<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
					<Input
						type="url"
						label="Webhook URL"
						placeholder="https://your-server.com/webhook"
						value={localSettings.webhook_url || ""}
						onChange={(e) =>
							handleSettingChange("webhook_url", e.target.value)
						}
						hint="Receive POST requests when guests upload photos or clustering completes."
					/>
				</div>

				{/* Semantic Search */}
				<div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
					<div>
						<p className="font-bold text-zinc-900 dark:text-white text-sm">
							Enable Semantic Search
						</p>
						<p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
							Use AI to search photos with natural language. (Higher Compute
							Cost)
						</p>
					</div>
					<input
						type="checkbox"
						checked={localSettings.semantic_search_enabled || false}
						onChange={(e) =>
							handleSettingChange("semantic_search_enabled", e.target.checked)
						}
						className="h-6 w-11 rounded-full bg-zinc-200 dark:bg-zinc-700 checked:bg-sage focus:ring-sage focus:ring-offset-2 transition-colors duration-200 ease-in-out cursor-pointer"
					/>
				</div>

				{/* Guest Tagline */}
				<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
					<p className="font-bold text-zinc-900 dark:text-white text-sm mb-2">
						Guest Message
					</p>
					<textarea
						rows={2}
						maxLength={120}
						placeholder="A short message shown to guests on the shared album page."
						value={localSettings.tagline || ""}
						onChange={(e) => handleSettingChange("tagline", e.target.value)}
						className="w-full px-4 py-3 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-medium focus:ring-2 focus:ring-sage outline-none transition-all resize-none"
					/>
					<p className="text-[10px] text-zinc-500 mt-1 font-medium">
						{(localSettings.tagline || "").length}/120 characters
					</p>
				</div>

			</div>

			<div className="mt-8 flex items-center space-x-3">
				<Button
					className="flex-1 rounded-control py-6 font-bold"
					onClick={handleSave}
					disabled={updateSettingsMutation.isPending}
				>
					{updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
				</Button>
				<Button
					variant="ghost"
					onClick={onClose}
					className="rounded-control font-bold"
				>
					Cancel
				</Button>
			</div>
		</Modal>
	);
};
