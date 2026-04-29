import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Copy,
	MoreVertical,
	Plus,
	RefreshCw,
	Shield,
	Trash2,
	User,
	X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import {
	deleteInvite,
	generateInvite,
	removeMember,
	resendInvite,
	updateMemberRole,
} from "../utils/api";
import { Button } from "./standard/Button";
import { Heading } from "./standard/Heading";

interface AlbumPermissionsModalProps {
	albumId: string;
	members: any[];
	onClose: () => void;
}

export const AlbumPermissionsModal = ({
	albumId,
	members = [],
	onClose,
}: AlbumPermissionsModalProps) => {
	const queryClient = useQueryClient();
	const [selectedRole, setSelectedRole] = useState("VIEWER");
	const [expiresInDays, setExpiresInDays] = useState(7);
	const [generatedToken, setGeneratedToken] = useState<string | null>(null);
	const [openMenu, setOpenMenu] = useState<string | null>(null);

	const generateInviteMutation = useMutation({
		mutationFn: ({
			role,
			expiresInDays,
		}: {
			role: string;
			expiresInDays: number;
		}) => generateInvite(albumId, role, expiresInDays),
		onSuccess: (data) => {
			setGeneratedToken(data.data.inviteToken);
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Invite link generated!");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to generate invite");
		},
	});

	const updateRoleMutation = useMutation({
		mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
			updateMemberRole(albumId, memberId, role),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Role updated!");
			setOpenMenu(null);
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update role");
		},
	});

	const removeMemberMutation = useMutation({
		mutationFn: ({ memberId }: { memberId: string }) =>
			removeMember(albumId, memberId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Member removed!");
			setOpenMenu(null);
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to remove member");
		},
	});

	const deleteInviteMutation = useMutation({
		mutationFn: ({ memberId }: { memberId: string }) =>
			deleteInvite(albumId, memberId),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Invite deleted!");
			setOpenMenu(null);
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete invite");
		},
	});

	const resendInviteMutation = useMutation({
		mutationFn: ({ memberId }: { memberId: string }) =>
			resendInvite(albumId, memberId),
		onSuccess: (data) => {
			setGeneratedToken(data.data.inviteToken);
			queryClient.invalidateQueries({
				queryKey: [`album-${albumId}`, albumId],
			});
			toast.success("Invite resent!");
			setOpenMenu(null);
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to resend invite");
		},
	});

	const copyInviteLink = () => {
		if (!generatedToken) return;
		const link = `${window.location.origin}/join/${generatedToken}`;
		navigator.clipboard.writeText(link);
		toast.success("Link copied to clipboard!");
	};

	const copyMemberLink = (token: string) => {
		const link = `${window.location.origin}/join/${token}`;
		navigator.clipboard.writeText(link);
		toast.success("Link copied to clipboard!");
	};

	const formatExpiry = (date: string | null) => {
		if (!date) return null;
		const expiry = new Date(date);
		const now = new Date();
		const diffDays = Math.ceil(
			(expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (diffDays < 0) return "Expired";
		if (diffDays === 0) return "Expires today";
		if (diffDays === 1) return "Expires tomorrow";
		return `Expires in ${diffDays} days`;
	};

	const isExpired = (date: string | null) => {
		if (!date) return false;
		return new Date(date) < new Date();
	};

	const joinedMembers = members.filter((m: any) => m.user_id);
	const pendingInvites = members.filter((m: any) => !m.user_id);

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
			<div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-hidden flex flex-col">
				<div className="flex justify-between items-start mb-6">
					<div>
						<Heading level={2}>Album Permissions</Heading>
						<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 font-medium">
							Manage who has access to this album and their roles.
						</p>
					</div>
					<button
						onClick={onClose}
						className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
					>
						<X size={20} />
					</button>
				</div>

				<div className="space-y-6 overflow-y-auto flex-1 pr-1">
					{/* Generate Invite Section */}
					<div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
						<div className="flex items-center gap-2 mb-3">
							<Plus size={18} className="text-sage" />
							<p className="font-bold text-zinc-900 dark:text-white text-sm">
								Invite a Member
							</p>
						</div>

						{!generatedToken ? (
							<div className="space-y-4">
								<div className="flex gap-2">
									{["VIEWER", "CONTRIBUTOR", "ADMIN"].map((role) => (
										<button
											key={role}
											type="button"
											onClick={() => setSelectedRole(role)}
											className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
												selectedRole === role
													? "bg-sage border-sage text-zinc-950 shadow-lg shadow-sage/20"
													: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500"
											}`}
										>
											{role}
										</button>
									))}
								</div>
								<div className="flex items-center gap-2">
									<span className="text-xs text-zinc-500">Expires in:</span>
									<select
										value={expiresInDays}
										onChange={(e) => setExpiresInDays(Number(e.target.value))}
										className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1"
									>
										<option value={1}>1 day</option>
										<option value={3}>3 days</option>
										<option value={7}>7 days</option>
										<option value={14}>14 days</option>
										<option value={30}>30 days</option>
									</select>
								</div>
								<Button
									className="w-full py-4 font-bold"
									onClick={() =>
										generateInviteMutation.mutate({
											role: selectedRole,
											expiresInDays,
										})
									}
									disabled={generateInviteMutation.isPending}
								>
									{generateInviteMutation.isPending
										? "Generating..."
										: "Generate Invite Link"}
								</Button>
							</div>
						) : (
							<div className="space-y-3">
								<div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
									<p className="text-xs font-mono text-zinc-500 truncate flex-1">
										{window.location.origin}/join/{generatedToken}
									</p>
									<button
										onClick={copyInviteLink}
										className="p-2 text-sage hover:bg-sage/10 rounded-lg transition-colors"
									>
										<Copy size={16} />
									</button>
								</div>
								<button
									onClick={() => setGeneratedToken(null)}
									className="text-xs text-sage hover:underline font-medium"
								>
									Generate another link
								</button>
							</div>
						)}
					</div>

					{/* Members List */}
					<div className="space-y-3">
						<p className="font-bold text-zinc-900 dark:text-white text-sm px-1">
							Members ({joinedMembers.length})
						</p>
						<div className="space-y-2">
							{joinedMembers.map((member: any) => (
								<div
									key={member.id}
									className="relative flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl"
								>
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center text-sage">
											<User size={16} />
										</div>
										<div>
											<p className="text-xs font-bold text-zinc-900 dark:text-white">
												{member.user?.email || "Unknown"}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="relative">
											<button
												onClick={() =>
													setOpenMenu(openMenu === member.id ? null : member.id)
												}
												className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
											>
												<Shield size={12} className="text-zinc-400" />
												<span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
													{member.role}
												</span>
											</button>
											{openMenu === member.id && (
												<div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-10 py-1">
													{["VIEWER", "CONTRIBUTOR", "ADMIN"].map((role) => (
														<button
															key={role}
															onClick={() =>
																updateRoleMutation.mutate({
																	memberId: member.id,
																	role,
																})
															}
															disabled={member.role === role}
															className="w-full px-3 py-2 text-xs text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
														>
															{role}
														</button>
													))}
													<hr className="my-1 border-zinc-200 dark:border-zinc-800" />
													<button
														onClick={() =>
															removeMemberMutation.mutate({
																memberId: member.id,
															})
														}
														className="w-full px-3 py-2 text-xs text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
													>
														<Trash2 size={12} />
														Remove
													</button>
												</div>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Pending Invites */}
					{pendingInvites.length > 0 && (
						<div className="space-y-3">
							<p className="font-bold text-zinc-900 dark:text-white text-sm px-1">
								Pending Invites ({pendingInvites.length})
							</p>
							<div className="space-y-2">
								{pendingInvites.map((member: any) => {
									const expired = isExpired(member.expires_at);
									return (
										<div
											key={member.id}
											className="relative flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl"
										>
											<div className="flex items-center gap-3">
												<div
													className={`w-8 h-8 rounded-full flex items-center justify-center ${
														expired
															? "bg-red-100 text-red-500"
															: "bg-yellow-100 text-yellow-600"
													}`}
												>
													{expired ? <X size={16} /> : <Plus size={16} />}
												</div>
												<div>
													<p className="text-xs font-bold text-zinc-900 dark:text-white">
														{member.role} Invite
													</p>
													<p
														className={`text-[10px] font-medium ${
															expired ? "text-red-500" : "text-zinc-500"
														}`}
													>
														{formatExpiry(member.expires_at)}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-1">
												<button
													onClick={() => copyMemberLink(member.invite_token)}
													className="p-2 text-zinc-400 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
													title="Copy link"
												>
													<Copy size={14} />
												</button>
												{!expired && (
													<button
														onClick={() =>
															resendInviteMutation.mutate({
																memberId: member.id,
															})
														}
														disabled={resendInviteMutation.isPending}
														className="p-2 text-zinc-400 hover:text-sage hover:bg-sage/10 rounded-lg transition-colors"
														title="Resend invite"
													>
														<RefreshCw size={14} />
													</button>
												)}
												<button
													onClick={() =>
														deleteInviteMutation.mutate({ memberId: member.id })
													}
													className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-10 rounded-lg transition-colors"
													title="Delete invite"
												>
													<Trash2 size={14} />
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
					<Button
						variant="ghost"
						onClick={onClose}
						className="w-full rounded-xl py-4 font-bold"
					>
						Done
					</Button>
				</div>
			</div>
		</div>
	);
};
