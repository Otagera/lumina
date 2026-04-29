import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Shield, Upload, Users } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/standard/Button";
import { Heading } from "../components/standard/Heading";
import { joinAlbum } from "../utils/api";
import { useAuth } from "../utils/auth";

const fetchInviteDetails = async (token: string) => {
	const response = await fetch(`/api/v1/public/invite/${token}`);
	const data = await response.json();
	if (!response.ok) throw new Error(data.message || "Failed to fetch invite");
	return data.data;
};

const JoinAlbum = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const queryClient = useQueryClient();
	const { isAuthenticated, isInitialized } = useAuth();
	const [error, setError] = useState<string | null>(null);

	const inviteToken =
		searchParams.get("token") || window.location.pathname.split("/join/")[1];

	const { data: invite, isLoading } = useQuery({
		queryKey: ["invite", inviteToken],
		queryFn: () => fetchInviteDetails(inviteToken),
		enabled: !!inviteToken && inviteToken.length > 10,
	});

	useEffect(() => {
		if (!isInitialized) return;

		if (!inviteToken || inviteToken.length < 10) {
			setError("Invalid invite token");
			return;
		}

		if (!isAuthenticated) {
			sessionStorage.setItem("pendingJoinToken", inviteToken);
			navigate(`/login?redirect=/join/${inviteToken}`);
			return;
		}

		const doJoin = async () => {
			try {
				const response = await joinAlbum(inviteToken);
				if (response.status === "completed" && response.data?.albumId) {
					queryClient.invalidateQueries({ queryKey: ["albums"] });
					toast.success("You joined the album!");
					navigate(`/album/${response.data.albumId}`);
				} else {
					setError(response.message || "Failed to join album");
				}
			} catch (err: any) {
				setError(err.message || "Failed to join album");
			}
		};

		if (invite) {
			doJoin();
		}
	}, [isInitialized, isAuthenticated, invite]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
				<div className="animate-pulse text-zinc-400">Loading...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
				<div className="max-w-md text-center">
					<div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield className="w-8 h-8 text-red-500" />
					</div>
					<Heading level={2}>Error</Heading>
					<p className="text-zinc-500 mt-2">{error}</p>
					<Link to="/">
						<Button className="mt-6">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Go Home
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	if (!invite) {
		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
				<div className="max-w-md text-center">
					<div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
						<Shield className="w-8 h-8 text-red-500" />
					</div>
					<Heading level={2}>Invalid Invite</Heading>
					<p className="text-zinc-500 mt-2">
						This invite link is invalid or has expired.
					</p>
					<Link to="/">
						<Button className="mt-6">
							<ArrowLeft className="w-4 h-4 mr-2" />
							Go Home
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				<Link
					to="/"
					className="inline-flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8"
				>
					<ArrowLeft className="w-4 h-4 mr-1" />
					Back
				</Link>

				<div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800">
					<div className="text-center mb-6">
						<div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
							<Users className="w-8 h-8 text-sage" />
						</div>
						<Heading level={2}>You've been invited!</Heading>
					</div>

					<div className="space-y-4 mb-6">
						<div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
							<p className="text-xs text-zinc-500 mb-1">Album</p>
							<p className="font-bold text-zinc-900 dark:text-white">
								{invite.albumName}
							</p>
						</div>
						<div className="flex gap-4">
							<div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
								<p className="text-xs text-zinc-500 mb-1">Your Role</p>
								<p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
									<Shield className="w-4 h-4 text-sage" />
									{invite.role}
								</p>
							</div>
							<div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl">
								<p className="text-xs text-zinc-500 mb-1">Access</p>
								<p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
									<Upload className="w-4 h-4 text-sage" />
									View & Upload
								</p>
							</div>
						</div>
					</div>

					<p className="text-sm text-zinc-500 text-center mb-4">
						Joining album...
					</p>
				</div>
			</div>
		</div>
	);
};

export default JoinAlbum;
