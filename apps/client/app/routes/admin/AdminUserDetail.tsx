import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, FolderOpen, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { Button } from "~/components/standard/Button";
import { fetchAdminUserDetail, updateAdminUser } from "../../utils/adminApi";
import { useAuth } from "../../utils/auth";

const RoleBadge = ({ role }: { role: string }) => {
	const map: Record<string, string> = {
		SUPER_ADMIN: "bg-plum/10 text-plum dark:bg-rose-500/15 dark:text-rose-300",
		ADMIN: "bg-sage/10 text-sage",
		USER: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
	};
	return (
		<span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${map[role] ?? map.USER}`}>
			{role.replace("_", " ")}
		</span>
	);
};

export default function AdminUserDetail() {
	const { userId } = useParams<{ userId: string }>();
	const qc = useQueryClient();
	const { isSuperAdmin } = useAuth();

	const { data: user, isLoading } = useQuery({
		queryKey: ["admin", "user", userId],
		queryFn: () => fetchAdminUserDetail(userId!),
		enabled: !!userId,
	});

	const updateMutation = useMutation({
		mutationFn: (updates: Record<string, unknown>) => updateAdminUser(userId!, updates),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
			qc.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success("User updated.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to update user"),
	});

	const computePercent = user?.plan
		? user.plan.compute_units_per_month > 0
			? Math.min(100, Math.round((user.computeThisMonth / user.plan.compute_units_per_month) * 100))
			: 0
		: 0;

	if (isLoading) {
		return (
			<div className="p-6 md:p-10 space-y-4">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
				))}
			</div>
		);
	}

	if (!user) {
		return (
			<div className="p-6 md:p-10">
				<p className="text-zinc-500">User not found.</p>
			</div>
		);
	}

	return (
		<div className="p-6 md:p-10 space-y-6">
			<div>
				<Link
					to="/admin/users"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
				>
					<ChevronLeft size={14} /> Back to users
				</Link>
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div>
						<Heading level={1} className="text-2xl font-black">{user.email}</Heading>
						<div className="flex items-center gap-2 mt-2">
							<RoleBadge role={user.role} />
							{user.suspended_at && (
								<span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
									Suspended
								</span>
							)}
						</div>
					</div>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() =>
								updateMutation.mutate({ suspend: !user.suspended_at })
							}
						>
							{user.suspended_at ? "Unsuspend" : "Suspend"}
						</Button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
				{[
					{ label: "Plan", value: user.plan_name },
					{ label: "Albums", value: user.albumCount ?? 0 },
					{ label: "Images", value: user.imageCount ?? 0 },
					{ label: "Compute (mo)", value: user.computeThisMonth ?? 0 },
				].map(({ label, value }) => (
					<Card key={label} hoverable={false} className="p-4">
						<p className="text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">{label}</p>
						<p className="text-2xl font-black text-zinc-900 dark:text-white capitalize">
							{typeof value === "number" ? value.toLocaleString() : value}
						</p>
					</Card>
				))}
			</div>

			{/* Compute usage bar */}
			{user.plan && user.plan.compute_units_per_month > 0 && (
				<Card hoverable={false} className="p-6">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<Zap size={16} className="text-plum dark:text-rose-300" />
							<span className="text-sm font-bold">Compute Usage This Month</span>
						</div>
						<span className="text-sm font-bold text-zinc-500">
							{user.computeThisMonth} / {user.plan.compute_units_per_month} units
						</span>
					</div>
					<div className="w-full h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
						<div
							className={`h-full rounded-full transition-all ${computePercent > 90 ? "bg-plum dark:bg-rose-500" : "bg-sage"}`}
							style={{ width: `${computePercent}%` }}
						/>
					</div>
				</Card>
			)}

			{/* Recent albums */}
			{user.albums && user.albums.length > 0 && (
				<Card hoverable={false} className="p-6">
					<div className="flex items-center gap-2 mb-4">
						<FolderOpen size={16} className="text-sage" />
						<Heading level={2} className="text-base font-black">Recent Albums</Heading>
					</div>
					<div className="space-y-2">
						{user.albums.map((album: any) => (
							<div
								key={album.album_id}
								className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
							>
								<div>
									<p className="text-sm font-bold text-zinc-900 dark:text-white">
										{album.album_name ?? "Untitled"}
									</p>
									<p className="text-xs text-zinc-400">
										{album._count?.album_images ?? 0} images
									</p>
								</div>
								<p className="text-xs text-zinc-400">
									{album.creation_date
										? new Date(album.creation_date).toLocaleDateString()
										: "—"}
								</p>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
