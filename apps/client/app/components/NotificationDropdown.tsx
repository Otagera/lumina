import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X } from "lucide-react";
import { useState } from "react";
import axiosAPI from "../utils/axios";
import { Button } from "./standard/Button";

interface Notification {
	id: string;
	type: string;
	is_read: boolean;
	metadata: any;
	created_at: string;
}

export const NotificationDropdown = () => {
	const queryClient = useQueryClient();
	const [isOpen, setIsOpen] = useState(false);

	const { data: response } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const res = await axiosAPI.get("/notifications?limit=10");
			return res.data;
		},
		refetchInterval: 30000, // Poll every 30s
	});

	const markReadMutation = useMutation({
		mutationFn: async (data: {
			notificationIds?: string[];
			markAll?: boolean;
		}) => {
			await axiosAPI.post("/notifications/mark-read", data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	const notifications: Notification[] = response?.data?.notifications || [];
	const unreadCount = notifications.filter((n) => !n.is_read).length;

	const handleMarkAllRead = () => {
		if (unreadCount === 0) return;
		markReadMutation.mutate({ markAll: true });
	};

	const formatMessage = (notification: Notification) => {
		const { type, metadata } = notification;
		switch (type) {
			case "CLUSTERING_COMPLETE":
				return `Face clustering finished for "${metadata?.albumName}". Found ${metadata?.newPeople} new people and tagged ${metadata?.taggedFaces} faces.`;
			case "PHOTO_APPROVED":
			case "IMAGE_APPROVED":
				return `Your photo was approved in "${metadata?.albumName}".`;
			case "IMAGE_REJECTED":
				return `Your photo was not approved in "${metadata?.albumName}".`;
			default:
				return "You have a new notification.";
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
			Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
			"day",
		);
	};

	return (
		<div className="relative">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
				aria-label="Notification Dropdown"
			>
				<Bell className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
				{unreadCount > 0 && (
					<span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
				)}
			</button>

			{isOpen && (
				<>
					{/* Overlay to close dropdown */}
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>

					{/* Dropdown panel */}
					<div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
						<div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
							<h3 className="font-bold text-sm text-zinc-900 dark:text-white">
								Notifications
							</h3>
							{unreadCount > 0 && (
								<button
									onClick={handleMarkAllRead}
									disabled={markReadMutation.isPending}
									className="text-xs text-sage hover:text-sage/80 font-medium flex items-center gap-1"
								>
									<Check className="w-3 h-3" /> Mark all read
								</button>
							)}
						</div>

						<div className="max-h-80 overflow-y-auto custom-scrollbar">
							{notifications.length === 0 ? (
								<div className="p-8 text-center">
									<div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
										<Bell className="w-5 h-5 text-zinc-400" />
									</div>
									<p className="text-sm text-zinc-500 font-medium">
										All caught up!
									</p>
								</div>
							) : (
								<div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
												!notification.is_read ? "bg-sage/5 dark:bg-sage/10" : ""
											}`}
											onClick={() => {
												if (!notification.is_read) {
													markReadMutation.mutate({
														notificationIds: [notification.id],
													});
												}
											}}
										>
											<div className="flex items-start gap-3">
												<div
													className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notification.is_read ? "bg-sage" : "bg-transparent"}`}
												/>
												<div>
													<p
														className={`text-sm ${!notification.is_read ? "font-bold text-zinc-900 dark:text-white" : "font-medium text-zinc-600 dark:text-zinc-300"}`}
													>
														{formatMessage(notification)}
													</p>
													<p className="text-xs text-zinc-400 mt-1">
														{formatDate(notification.created_at)}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
};
