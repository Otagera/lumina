import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { Button } from "~/components/standard/Button";
import { fetchAdminUsers, updateAdminUser, deleteAdminUser } from "../../utils/adminApi";
import { useAuth } from "../../utils/auth";

const ROLES = ["USER", "ADMIN", "SUPER_ADMIN"] as const;

const RoleBadge = ({ role }: { role: string }) => {
	const map: Record<string, string> = {
		SUPER_ADMIN: "bg-plum/10 text-plum dark:bg-rose-500/15 dark:text-rose-300",
		ADMIN: "bg-sage/10 text-sage",
		USER: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
	};
	return (
		<span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${map[role] ?? map.USER}`}>
			{role.replace("_", " ")}
		</span>
	);
};

export default function AdminUsers() {
	const qc = useQueryClient();
	const { isSuperAdmin } = useAuth();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "users", page, search],
		queryFn: () => fetchAdminUsers({ page, limit: 20, search }),
	});

	const updateMutation = useMutation({
		mutationFn: ({ userId, updates }: { userId: string; updates: Record<string, unknown> }) =>
			updateAdminUser(userId, updates),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success("User updated.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to update user"),
	});

	const deleteMutation = useMutation({
		mutationFn: deleteAdminUser,
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "users"] });
			toast.success("User deleted.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed to delete user"),
	});

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchInput);
		setPage(1);
	};

	const users = data?.users ?? [];
	const total = data?.total ?? 0;
	const pages = data?.pages ?? 1;

	return (
		<div className="p-6 md:p-10 space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<Heading level={1} className="text-2xl font-black">Users</Heading>
					<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
						{total.toLocaleString()} total users
					</p>
				</div>
				<form onSubmit={handleSearch} className="flex gap-2">
					<div className="relative">
						<Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
						<input
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder="Search by email..."
							className="pl-8 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sage/30 w-64"
						/>
					</div>
					<Button type="submit" variant="secondary" size="sm">Search</Button>
				</form>
			</div>

			<Card hoverable={false} className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-zinc-200/50 dark:border-zinc-800/50">
								<th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Email</th>
								<th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Plan</th>
								<th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Role</th>
								<th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Status</th>
								<th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Albums</th>
								<th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-400">Actions</th>
							</tr>
						</thead>
						<tbody>
							{isLoading
								? [...Array(8)].map((_, i) => (
									<tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50">
										{[...Array(6)].map((_, j) => (
											<td key={j} className="px-4 py-3">
												<div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
											</td>
										))}
									</tr>
								))
								: users.map((u: any) => (
									<tr
										key={u.user_id}
										className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
									>
										<td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
											<Link to={`/admin/users/${u.user_id}`} className="hover:text-sage transition-colors">
												{u.email}
											</Link>
										</td>
										<td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 capitalize">
											{u.plan_name}
										</td>
										<td className="px-4 py-3">
											<RoleBadge role={u.role} />
										</td>
										<td className="px-4 py-3">
											{u.suspended_at ? (
												<span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold">
													<ShieldAlert size={12} /> Suspended
												</span>
											) : (
												<span className="text-xs font-bold text-zinc-400">Active</span>
											)}
										</td>
										<td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
											{u._count?.albums ?? 0}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center justify-end gap-1">
												<Link to={`/admin/users/${u.user_id}`}>
													<Button variant="ghost" size="sm">View</Button>
												</Link>
												{isSuperAdmin && (
													<>
														<select
															defaultValue={u.role}
															onChange={(e) => {
																if (e.target.value !== u.role) {
																	updateMutation.mutate({ userId: u.user_id, updates: { role: e.target.value } });
																}
															}}
															className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 focus:outline-none"
														>
															{ROLES.map((r) => (
																<option key={r} value={r}>{r.replace("_", " ")}</option>
															))}
														</select>
													</>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														const suspend = !u.suspended_at;
														updateMutation.mutate({ userId: u.user_id, updates: { suspend } });
													}}
												>
													{u.suspended_at ? "Unsuspend" : "Suspend"}
												</Button>
												{isSuperAdmin && (
													<Button
														variant="ghost"
														size="sm"
														className="text-plum dark:text-rose-400 hover:bg-plum/10"
														onClick={() => {
															if (confirm(`Delete ${u.email}? This cannot be undone.`)) {
																deleteMutation.mutate(u.user_id);
															}
														}}
													>
														Delete
													</Button>
												)}
											</div>
										</td>
									</tr>
								))}
						</tbody>
					</table>
				</div>
			</Card>

			{/* Pagination */}
			{pages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-zinc-500">
						Page {page} of {pages}
					</p>
					<div className="flex gap-2">
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							<ChevronLeft size={14} />
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setPage((p) => Math.min(pages, p + 1))}
							disabled={page === pages}
						>
							<ChevronRight size={14} />
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
