import type React from "react";
import { useEffect } from "react";
import { useUpload } from "../utils/UploadContext";

export const UploadManager: React.FC = () => {
	const {
		tasks,
		isManagerOpen,
		setIsManagerOpen,
		pauseUpload,
		resumeUpload,
		retryUpload,
		removeTask,
	} = useUpload();

	if (tasks.length === 0) return null;

	const completedCount = tasks.filter((t) => t.status === "completed").length;
	const activeCount = tasks.filter(
		(t) => t.status === "uploading" || t.status === "pending",
	).length;
	const _errorCount = tasks.filter((t) => t.status === "error").length;

	useEffect(() => {
		if (activeCount === 0) {
			const timeout = setTimeout(() => {
				setIsManagerOpen(false);
			}, 3000);
			return () => clearTimeout(timeout);
		}
	}, [activeCount, setIsManagerOpen]);

	const clearCompleted = () => {
		tasks
			.filter((t) => t.status === "completed")
			.forEach((t) => removeTask(t.id));
	};

	return (
		<div
			className={`fixed bottom-6 right-6 z-60 w-80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl shadow-2xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-500 overflow-hidden ${isManagerOpen ? "max-h-[32rem]" : "max-h-14"}`}
		>
			{/* Header */}
			<div
				className="flex items-center justify-between p-4 cursor-pointer border-b border-zinc-100/50 dark:border-zinc-800/50 hover:bg-black/5 transition-colors"
				onClick={() => setIsManagerOpen(!isManagerOpen)}
			>
				<div className="flex items-center space-x-2">
					<div
						className={`w-2 h-2 rounded-full ${activeCount > 0 ? "bg-sage animate-pulse" : "bg-green-500"}`}
					/>
					<span className="font-semibold text-sm text-zinc-900 dark:text-white">
						{activeCount > 0
							? `Uploading ${activeCount} photos...`
							: "Uploads Complete"}
					</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-xs text-zinc-500 dark:text-zinc-400">
						{completedCount}/{tasks.length}
					</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className={`h-4 w-4 text-zinc-400 transition-transform ${isManagerOpen ? "rotate-180" : ""}`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M5 15l7-7 7 7"
						/>
					</svg>
				</div>
				<button
					onClick={() => clearCompleted()}
					className="text-xs text-zinc-500 hover:text-red-500 transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			</div>

			{/* Task List */}
			{isManagerOpen && (
				<div className="p-2 overflow-y-auto max-h-[28rem] space-y-1">
					{tasks.map((task) => (
						<div
							key={task.id}
							className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl group hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-colors"
						>
							<div className="flex items-center justify-between mb-1 min-w-0">
								<span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
									{task.fileName}
								</span>
								<div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
									{task.status === "uploading" && (
										<button
											onClick={() => pauseUpload(task.id)}
											className="p-1 text-zinc-500 hover:text-sage"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M10 9v6m4-6v6"
												/>
											</svg>
										</button>
									)}
									{task.status === "paused" && (
										<button
											onClick={() => resumeUpload(task.id)}
											className="p-1 text-zinc-500 hover:text-green-500"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
												/>
											</svg>
										</button>
									)}
									{task.status === "error" && (
										<button
											onClick={() => retryUpload(task.id)}
											className="p-1 text-zinc-500 hover:text-sage"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
												/>
											</svg>
										</button>
									)}
									<button
										onClick={() => removeTask(task.id)}
										className="p-1 text-zinc-500 hover:text-red-500"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-4 w-4"
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
							</div>

							{/* Status indicator */}
							<div className="flex items-center space-x-2">
								<div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
									<div
										className={`h-full transition-all duration-300 ${task.status === "error" ? "bg-red-500" : task.status === "completed" ? "bg-green-500" : "bg-sage"}`}
										style={{
											width: `${task.status === "completed" ? 100 : task.status === "uploading" ? task.progress : 0}%`,
										}}
									/>
								</div>
								<span
									className={`text-[10px] uppercase font-bold ${task.status === "error" ? "text-red-500" : task.status === "completed" ? "text-green-500" : "text-sage"}`}
								>
									{task.status}
								</span>
							</div>
							{task.error && (
								<p
									className="text-[10px] text-red-500 mt-1 truncate"
									title={task.error}
								>
									{task.error}
								</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
};
