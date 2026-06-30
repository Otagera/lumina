import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "~/components/standard/Card";
import { Heading } from "~/components/standard/Heading";
import { Button } from "~/components/standard/Button";
import {
	fetchQueueStats,
	fetchQueueFailedJobs,
	retryQueueJob,
	clearQueueFailed,
} from "../../utils/adminApi";

const QUEUE_LABELS: Record<string, string> = {
	default: "Default",
	image_optimization: "Image Optimization",
	face_recognition: "Face Recognition",
	face_search: "Face Search",
	face_clustering: "Face Clustering",
	bulk_download: "Bulk Download",
	file_deletion: "File Deletion",
	email: "Email",
	trash_cleanup: "Trash Cleanup",
	semantic_embedding: "Semantic Embedding",
};

const CountBadge = ({
	label,
	value,
	variant = "neutral",
}: {
	label: string;
	value: number;
	variant?: "sage" | "terracotta" | "neutral";
}) => {
	const variantMap = {
		sage: "bg-sage/10 text-sage",
		terracotta: value > 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
		neutral: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
	};
	return (
		<div className="text-center">
			<div className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black ${variantMap[variant]}`}>
				{value}
			</div>
			<p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wider">{label}</p>
		</div>
	);
};

function FailedJobsPanel({ queueName }: { queueName: string }) {
	const qc = useQueryClient();

	const { data: jobs = [], isLoading } = useQuery({
		queryKey: ["admin", "queue-failed", queueName],
		queryFn: () => fetchQueueFailedJobs(queueName),
	});

	const retryMutation = useMutation({
		mutationFn: (jobId: string) => retryQueueJob(queueName, jobId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "queues"] });
			qc.invalidateQueries({ queryKey: ["admin", "queue-failed", queueName] });
			toast.success("Job queued for retry.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	const clearMutation = useMutation({
		mutationFn: () => clearQueueFailed(queueName),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["admin", "queues"] });
			qc.invalidateQueries({ queryKey: ["admin", "queue-failed", queueName] });
			toast.success("Failed jobs cleared.");
		},
		onError: (e: any) => toast.error(e.response?.data?.message ?? "Failed"),
	});

	if (isLoading) {
		return (
			<div className="mt-4 space-y-2">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
				))}
			</div>
		);
	}

	if (jobs.length === 0) {
		return (
			<p className="mt-4 text-xs text-zinc-400 text-center py-4">No failed jobs.</p>
		);
	}

	return (
		<div className="mt-4 space-y-2">
			<div className="flex justify-end mb-2">
				<Button
					variant="ghost"
					size="sm"
					className="text-plum dark:text-rose-400 hover:bg-plum/10 text-xs"
					onClick={() => {
						if (confirm("Clear all failed jobs for this queue?")) {
							clearMutation.mutate();
						}
					}}
					disabled={clearMutation.isPending}
				>
					<Trash2 size={12} className="mr-1" /> Clear All Failed
				</Button>
			</div>
			{jobs.map((job: any) => (
				<div
					key={job.id}
					className="flex items-start justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
				>
					<div className="flex-1 min-w-0">
						<p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
							{job.name} <span className="text-zinc-400 font-normal">#{job.id}</span>
						</p>
						<p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">
							{job.failedReason ?? "Unknown error"}
						</p>
						<p className="text-[10px] text-zinc-400 mt-0.5">
							{job.attemptsMade} attempt{job.attemptsMade !== 1 ? "s" : ""}
							{job.timestamp
								? ` · ${new Date(job.timestamp).toLocaleString()}`
								: ""}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => retryMutation.mutate(job.id)}
						disabled={retryMutation.isPending}
						className="shrink-0"
					>
						<RotateCcw size={12} />
					</Button>
				</div>
			))}
		</div>
	);
}

function QueueCard({ queue }: { queue: Record<string, number | string> }) {
	const [expanded, setExpanded] = useState(false);
	const name = queue.name as string;
	const failed = (queue.failed as number) ?? 0;
	const active = (queue.active as number) ?? 0;

	return (
		<Card hoverable={false} className="p-5">
			<div className="flex items-start justify-between gap-2 mb-4">
				<div>
					<Heading level={2} className="text-sm font-black">
						{QUEUE_LABELS[name] ?? name}
					</Heading>
					<p className="text-[10px] text-zinc-400 font-mono mt-0.5">{name}</p>
				</div>
				{failed > 0 && (
					<span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 uppercase tracking-wider">
						{failed} failed
					</span>
				)}
			</div>
			<div className="flex gap-3 justify-between">
				<CountBadge label="Active" value={active} variant={active > 0 ? "sage" : "neutral"} />
				<CountBadge label="Waiting" value={(queue.waiting as number) ?? 0} variant="neutral" />
				<CountBadge label="Completed" value={(queue.completed as number) ?? 0} variant="neutral" />
				<CountBadge label="Failed" value={failed} variant="terracotta" />
				<CountBadge label="Delayed" value={(queue.delayed as number) ?? 0} variant="neutral" />
			</div>
			<button
				type="button"
				onClick={() => setExpanded((v) => !v)}
				className="mt-4 flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
			>
				{expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
				{expanded ? "Hide" : "Show"} failed jobs
			</button>
			{expanded && <FailedJobsPanel queueName={name} />}
		</Card>
	);
}

export default function AdminQueues() {
	const { data: queues = [], isLoading } = useQuery({
		queryKey: ["admin", "queues"],
		queryFn: fetchQueueStats,
		refetchInterval: 30000,
	});

	return (
		<div className="p-6 md:p-10 space-y-6">
			<div>
				<Heading level={1} className="text-2xl font-black">Queues</Heading>
				<p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
					BullMQ job queue monitoring. Auto-refreshes every 30s.
				</p>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{[...Array(9)].map((_, i) => (
						<div key={i} className="h-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
					{queues.map((q: any) => (
						<QueueCard key={q.name} queue={q} />
					))}
				</div>
			)}
		</div>
	);
}
