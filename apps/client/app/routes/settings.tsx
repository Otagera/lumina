import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2,
	Edit2,
	Gauge,
	HardDrive,
	Plus,
	Sparkles,
	Trash2,
	Zap,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { MainContainer } from "~/components/MainContainer";
import { Button } from "~/components/standard/Button";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import {
	createStorageConfig,
	deleteStorageConfig,
	fetchPlans,
	fetchSettings,
	updateStorageConfig,
} from "../utils/api";

const formatBytes = (bytes: number) => {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / k ** i).toFixed(1)) + " " + sizes[i];
};

const UsageBar = ({
	used,
	limit,
	label,
	color = "sage",
}: {
	used: number;
	limit: number;
	label: string;
	color?: "sage" | "plum" | "terracotta";
}) => {
	const percentage = Math.min((used / limit) * 100, 100);
	const colorClasses = {
		sage: "bg-sage",
		plum: "bg-plum",
		terracotta: "bg-terracotta",
	};
	const bgClasses = {
		sage: "bg-sage/10",
		plum: "bg-plum/10",
		terracotta: "bg-terracotta/10",
	};

	const getAlertLevel = () => {
		if (percentage >= 90) return "critical";
		if (percentage >= 80) return "warning";
		return null;
	};

	const alertLevel = getAlertLevel();
	const alertStyles = {
		warning: {
			bg: "bg-amber-500/10 dark:bg-amber-500/20",
			text: "text-amber-700 dark:text-amber-400",
			icon: "⚠️",
		},
		critical: {
			bg: "bg-red-500/10 dark:bg-red-500/20",
			text: "text-red-700 dark:text-red-400",
			icon: "🚨",
		},
	};

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm">
				<span className="font-medium text-zinc-600 dark:text-zinc-300">
					{label}
				</span>
				<span className="font-bold text-zinc-900 dark:text-white">
					{used.toLocaleString()} / {limit.toLocaleString()}
				</span>
			</div>
			<div className={`h-3 rounded-full overflow-hidden ${bgClasses[color]}`}>
				<div
					className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
			{alertLevel && (
				<div
					className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ${alertStyles[alertLevel].bg} ${alertStyles[alertLevel].text}`}
				>
					<span>{alertStyles[alertLevel].icon}</span>
					<span>
						{alertLevel === "critical"
							? `Critical: You've used ${Math.round(percentage)}% of your ${label.toLowerCase().replace(" this month", "")} limit!`
							: `Warning: Approaching ${Math.round(percentage)}% of your ${label.toLowerCase().replace(" this month", "")} limit`}
					</span>
				</div>
			)}
		</div>
	);
};

const Settings = () => {
	const queryClient = useQueryClient();
	const { data: settingsData, isLoading } = useQuery({
		queryKey: ["settings"],
		queryFn: fetchSettings,
	});

	const { data: plansData, isLoading: isPlansLoading } = useQuery({
		queryKey: ["plans"],
		queryFn: fetchPlans,
	});

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		name: "",
		provider: "r2",
		bucket: "",
		endpoint: "",
		accessKeyId: "",
		secretAccessKey: "",
		region: "auto",
	});

	const resetForm = () => {
		setFormData({
			name: "",
			provider: "r2",
			bucket: "",
			endpoint: "",
			accessKeyId: "",
			secretAccessKey: "",
			region: "auto",
		});
		setEditingConfigId(null);
		setIsFormOpen(false);
	};

	const addMutation = useMutation({
		mutationFn: createStorageConfig,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["settings"] });
			resetForm();
			toast.success("Storage configuration added successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to add storage configuration");
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			updateStorageConfig(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["settings"] });
			resetForm();
			toast.success("Storage configuration updated successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update storage configuration");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: deleteStorageConfig,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["settings"] });
			toast.success("Storage configuration deleted");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete storage configuration");
		},
	});

	const handleEdit = (config: any) => {
		setFormData({
			name: config.name,
			provider: config.provider,
			bucket: config.bucket,
			endpoint: config.endpoint,
			accessKeyId: "", // Don't populate sensitive data
			secretAccessKey: "",
			region: config.region || "auto",
		});
		setEditingConfigId(config.id);
		setIsFormOpen(true);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (editingConfigId) {
			const { accessKeyId, secretAccessKey, ...rest } = formData;
			const dataToSave: any = { ...rest };
			if (accessKeyId) dataToSave.accessKeyId = accessKeyId;
			if (secretAccessKey) dataToSave.secretAccessKey = secretAccessKey;
			updateMutation.mutate({ id: editingConfigId, data: dataToSave });
		} else {
			addMutation.mutate(formData);
		}
	};

	if (isLoading) {
		return (
			<MainContainer>
				<div className="flex justify-center py-20">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500" />
				</div>
			</MainContainer>
		);
	}

	return (
		<MainContainer className="max-w-4xl mx-auto space-y-12 pb-20">
			<div>
				<Heading
					level={1}
					className="text-4xl md:text-5xl font-black tracking-tight"
				>
					Settings
				</Heading>
				<p className="text-zinc-500 dark:text-zinc-400 mt-3 text-lg font-medium">
					Manage your account preferences and storage configurations.
				</p>
			</div>

			{/* Profile Section */}
			<section className="space-y-6">
				<Heading level={2} className="text-2xl font-bold">
					Account
				</Heading>
				<Card className="p-8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
								Email Address
							</p>
							<p className="text-xl font-bold text-zinc-900 dark:text-white">
								{settingsData?.data?.email}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled
							className="rounded-xl font-bold opacity-50"
						>
							Change Email
						</Button>
					</div>
				</Card>
			</section>

			{/* Plan & Usage Section */}
			<section className="space-y-6">
				<Heading level={2} className="text-2xl font-bold">
					Plan & Usage
				</Heading>
				<div className="grid gap-6 md:grid-cols-2">
					<Card className="p-8 bg-gradient-to-br from-sage/10 to-sage/5 dark:from-sage/5 dark:to-transparent border-sage/20">
						<div className="flex items-center gap-4 mb-6">
							<div className="w-12 h-12 rounded-2xl bg-sage/15 flex items-center justify-center text-sage">
								<Zap size={24} />
							</div>
							<div>
								<p className="text-xs font-black uppercase tracking-widest text-zinc-400">
									Current Plan
								</p>
								<p className="text-2xl font-black text-zinc-900 dark:text-white capitalize">
									{settingsData?.data?.usage?.plan || "Free"}
								</p>
							</div>
						</div>
						<div className="space-y-4">
							<UsageBar
								used={settingsData?.data?.usage?.computeUnitsUsed || 0}
								limit={settingsData?.data?.usage?.computeUnitsLimit || 100}
								label="Images processed this month"
								color="sage"
							/>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
								Resets on the 1st of each month
							</p>
						</div>
					</Card>

					<Card className="p-8 bg-gradient-to-br from-plum/10 to-plum/5 dark:from-plum/5 dark:to-transparent border-plum/20">
						<div className="flex items-center gap-4 mb-6">
							<div className="w-12 h-12 rounded-2xl bg-plum/15 flex items-center justify-center text-plum">
								<Gauge size={24} />
							</div>
							<div>
								<p className="text-xs font-black uppercase tracking-widest text-zinc-400">
									Storage Used
								</p>
								<p className="text-2xl font-black text-zinc-900 dark:text-white">
									{formatBytes(
										(settingsData?.data?.usage?.storageUsedMB || 0) *
											1024 *
											1024,
									)}
								</p>
							</div>
						</div>
						<div className="space-y-4">
							<UsageBar
								used={settingsData?.data?.usage?.storageUsedMB || 0}
								limit={settingsData?.data?.usage?.storageLimitMB || 5120}
								label="Storage this month"
								color="plum"
							/>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
								{settingsData?.data?.usage?.storageLimitMB >= 1024
									? `${Math.round(settingsData.data.usage.storageLimitMB / 1024)} GB`
									: `${settingsData?.data?.usage?.storageLimitMB} MB`}{" "}
								included on {settingsData?.data?.usage?.plan || "Free"} plan
							</p>
						</div>
					</Card>
				</div>
			</section>

			{/* Storage / BYOS Section */}
			<section className="space-y-6">
				<div className="flex justify-between items-end">
					<div>
						<Heading level={2} className="text-2xl font-bold">
							Storage (BYOS)
						</Heading>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
							Connect your own S3-compatible storage to own your files.
						</p>
					</div>
					{!isFormOpen && (
						<Button
							onClick={() => setIsFormOpen(true)}
							className="rounded-xl font-bold py-4 px-4"
						>
							<Plus size={20} className="mr-2" /> Add Storage
						</Button>
					)}
				</div>

				{isFormOpen && (
					<Card className="p-10 border-sage-500/30 bg-sage-500/5 backdrop-blur-xl rounded-[2.5rem]">
						<form onSubmit={handleSubmit} className="space-y-8">
							<div className="flex justify-between items-center mb-2">
								<Heading level={3} className="text-xl font-bold">
									{editingConfigId
										? "Edit Storage"
										: "New Storage Configuration"}
								</Heading>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Config Name
									</label>
									<input
										type="text"
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-medium"
										placeholder="e.g. My R2 Bucket"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Provider
									</label>
									<select
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-bold"
										value={formData.provider}
										onChange={(e) =>
											setFormData({ ...formData, provider: e.target.value })
										}
									>
										<option value="r2">Cloudflare R2</option>
										<option value="s3">AWS S3</option>
									</select>
								</div>
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Bucket Name
									</label>
									<input
										type="text"
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-medium"
										value={formData.bucket}
										onChange={(e) =>
											setFormData({ ...formData, bucket: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Endpoint
									</label>
									<input
										type="text"
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-medium"
										placeholder="https://<id>.r2.cloudflarestorage.com"
										value={formData.endpoint}
										onChange={(e) =>
											setFormData({ ...formData, endpoint: e.target.value })
										}
										required
									/>
								</div>
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Access Key ID {editingConfigId && "(Optional if unchanged)"}
									</label>
									<input
										type="password"
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-medium"
										value={formData.accessKeyId}
										onChange={(e) =>
											setFormData({ ...formData, accessKeyId: e.target.value })
										}
										required={!editingConfigId}
									/>
								</div>
								<div className="space-y-3">
									<label className="text-xs font-black uppercase tracking-widest text-zinc-500">
										Secret Access Key{" "}
										{editingConfigId && "(Optional if unchanged)"}
									</label>
									<input
										type="password"
										className="w-full px-6 py-4 rounded-2xl border bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-sage-500 outline-none transition-all font-medium"
										value={formData.secretAccessKey}
										onChange={(e) =>
											setFormData({
												...formData,
												secretAccessKey: e.target.value,
											})
										}
										required={!editingConfigId}
									/>
								</div>
							</div>
							<div className="flex gap-4 justify-end pt-4">
								<Button
									variant="ghost"
									type="button"
									onClick={resetForm}
									className="rounded-xl font-bold"
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={addMutation.isPending || updateMutation.isPending}
									className="rounded-xl font-bold px-8"
								>
									{addMutation.isPending || updateMutation.isPending
										? "Saving..."
										: editingConfigId
											? "Update Configuration"
											: "Create Configuration"}
								</Button>
							</div>
						</form>
					</Card>
				)}

				<div className="grid gap-6">
					{settingsData?.data?.storageConfigs?.map((config: any) => (
						<Card
							key={config.id}
							className="p-8 flex items-center justify-between group hover:border-sage-500/50 transition-all rounded-[2rem] bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 shadow-sm"
						>
							<div className="flex items-center gap-6">
								<div className="w-14 h-14 rounded-2xl bg-sage-500/10 flex items-center justify-center text-sage-500 group-hover:bg-sage-500 group-hover:text-white transition-all duration-500">
									<HardDrive size={28} />
								</div>
								<div>
									<p className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
										{config.name}
									</p>
									<p className="text-sm text-zinc-500 font-bold mt-0.5">
										{config.bucket} • {config.provider.toUpperCase()}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={() => handleEdit(config)}
									className="p-3 text-zinc-400 hover:text-sage-500 hover:bg-sage-500/10 rounded-xl transition-all"
									title="Edit"
								>
									<Edit2 size={20} />
								</button>
								<button
									onClick={() => {
										if (confirm("Delete this storage configuration?")) {
											deleteMutation.mutate(config.id);
										}
									}}
									className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
									title="Delete"
								>
									<Trash2 size={20} />
								</button>
							</div>
						</Card>
					))}

					{(!settingsData?.data?.storageConfigs ||
						settingsData.data.storageConfigs.length === 0) &&
						!isFormOpen && (
							<div className="text-center py-20 border-2 border-dashed rounded-[3rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
								<div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 text-zinc-400">
									<HardDrive size={32} />
								</div>
								<p className="text-xl font-bold text-zinc-500">
									No external storage connected.
								</p>
								<p className="text-sm text-zinc-400 mt-2 font-medium">
									Managed Cloudflare R2 storage is being used by default.
								</p>
							</div>
						)}
				</div>
			</section>

			{/* Plans & Upgrades Section */}
			<section className="space-y-12 pt-10">
				<div>
					<Heading level={2} className="text-3xl font-black">
						Plans & Upgrades
					</Heading>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
						Scale your storage and AI processing limits.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-10">
					{isPlansLoading ? (
						<div className="col-span-full flex justify-center py-10">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
						</div>
					) : (
						plansData?.data?.map((plan: any) => {
							const isCurrentPlan =
								settingsData?.data?.usage?.plan?.toLowerCase() ===
								plan.name.toLowerCase();
							return (
								<div
									key={plan.name}
									className={`relative rounded-[2.5rem] border p-8 flex flex-col transition-all duration-500 ${
										isCurrentPlan
											? "border-sage bg-sage/5 dark:bg-sage/5 shadow-xl shadow-sage/5"
											: "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
									}`}
								>
									{plan.is_highlighted && (
										<div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-plum px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white">
											Most Popular
										</div>
									)}
									<h3 className="text-xl font-black text-zinc-900 dark:text-white capitalize">
										{plan.name === "byos" ? "BYOS" : plan.name} Tier
									</h3>
									<div className="mt-4 mb-6">
										<span className="text-3xl font-black text-zinc-900 dark:text-white">
											{plan.price_usd}
										</span>
										<span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
											{" "}
											/ month
										</span>
									</div>
									<ul className="space-y-3 text-sm flex-1 mb-8">
										{plan.features?.map((feature: string) => (
											<li
												key={feature}
												className="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-300"
											>
												<CheckCircle2 className="h-4 w-4 text-sage" />
												{feature}
											</li>
										))}
									</ul>
									<div>
										{isCurrentPlan ? (
											<div className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
												<CheckCircle2 size={14} />
												Current Plan
											</div>
										) : (
											<Button
												className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
												variant={plan.is_highlighted ? "default" : "outline"}
												onClick={() =>
													toast.success(
														`Contact support to upgrade to ${plan.name}`,
													)
												}
											>
												Upgrade to {plan.name}
											</Button>
										)}
									</div>
								</div>
							);
						})
					)}
				</div>
			</section>
		</MainContainer>
	);
};

export default Settings;
