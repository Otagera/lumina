import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { get, set } from "idb-keyval";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import toast from "react-hot-toast";
import {
	abortMultipartUpload,
	abortPublicMultipartUpload,
	completeMultipartUpload,
	completePublicMultipartUpload,
	fetchUsage,
	getPresignedUrl,
	getPublicPresignedUrl,
	uploadGuestImages,
	uploadImages,
} from "./api";

export interface UploadTask {
	id: string;
	fileName: string;
	file: File;
	progress: number;
	status: "pending" | "uploading" | "completed" | "error" | "paused";
	error?: string;
	albumId: string;
	initialStatus?: "PENDING" | "APPROVED";
	shareToken?: string; // If present, it's a guest upload
}

interface UploadContextType {
	tasks: UploadTask[];
	addUploads: (
		files: FileList,
		albumId: string,
		initialStatus?: "PENDING" | "APPROVED",
		shareToken?: string,
	) => void;
	pauseUpload: (id: string) => void;
	resumeUpload: (id: string) => void;
	retryUpload: (id: string) => void;
	removeTask: (id: string) => void;
	isManagerOpen: boolean;
	setIsManagerOpen: (open: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const IDB_KEY = "facematch-upload-queue";
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [tasks, setTasks] = useState<UploadTask[]>([]);
	const [isManagerOpen, setIsManagerOpen] = useState(false);
	const queryClient = useQueryClient();
	const abortControllers = useRef<Map<string, AbortController>>(new Map());
	const processingRef = useRef(false);

	// Load persisted tasks from IndexedDB on mount
	useEffect(() => {
		const loadTasks = async () => {
			const saved = await get<UploadTask[]>(IDB_KEY);
			if (saved) {
				// Status cleanup: reset uploading to pending on refresh
				const cleaned = saved.map((t) =>
					t.status === "uploading"
						? { ...t, status: "pending" as const, progress: 0 }
						: t,
				);
				setTasks(cleaned);
			}
		};
		loadTasks();
	}, []);

	// Persist tasks to IndexedDB whenever they change
	useEffect(() => {
		set(IDB_KEY, tasks);
	}, [tasks]);

	const addUploads = useCallback(
		async (
			files: FileList,
			albumId: string,
			initialStatus?: "PENDING" | "APPROVED",
			shareToken?: string,
		) => {
			try {
				const usageRes = await fetchUsage();
				const usage = usageRes?.data;
				const computeUsed = usage?.computeUnitsUsed || 0;
				const computeLimit = usage?.computeUnitsLimit || 100;

				// -1 means unlimited
				if (computeLimit !== -1) {
					const remaining = computeLimit - computeUsed;

					if (remaining <= 0) {
						toast.error(
							`Monthly processing limit reached (${computeLimit} images). Your images will be uploaded but NOT processed by AI.`,
							{ duration: 5000 },
						);
					} else if (files.length > remaining) {
						toast.error(
							`You only have ${remaining} processing units left. Only the first ${remaining} images will be processed by AI.`,
							{ duration: 5000 },
						);
					}
				}

				const newTasks: UploadTask[] = Array.from(files).map((file) => ({
					id: Math.random().toString(36).substring(2, 11),
					fileName: file.name,
					file,
					progress: 0,
					status: "pending",
					albumId,
					initialStatus,
					shareToken,
				}));
				setTasks((prev) => [...prev, ...newTasks]);
				setIsManagerOpen(true);
			} catch (error) {
				console.error("Error checking quota:", error);
				toast.error("Could not verify quota. Proceeding with upload.");
				const newTasks: UploadTask[] = Array.from(files).map((file) => ({
					id: Math.random().toString(36).substring(2, 11),
					fileName: file.name,
					file,
					progress: 0,
					status: "pending",
					albumId,
					initialStatus,
					shareToken,
				}));
				setTasks((prev) => [...prev, ...newTasks]);
				setIsManagerOpen(true);
			}
		},
		[],
	);

	const processNextTask = useCallback(async () => {
		if (processingRef.current) return;
		processingRef.current = true;

		const nextTask = tasks.find((t) => t.status === "pending");
		if (!nextTask) {
			processingRef.current = false;
			return;
		}

		setTasks((prev) =>
			prev.map((t) =>
				t.id === nextTask.id ? { ...t, status: "uploading" } : t,
			),
		);

		const controller = new AbortController();
		abortControllers.current.set(nextTask.id, controller);

		let uploadId: string | undefined;
		let uploadKey: string | undefined;

		try {
			const isLargeFile = nextTask.file.size > MULTIPART_THRESHOLD;

			if (isLargeFile) {
				// --- MULTIPART UPLOAD FLOW ---

				// 1. Initialize Multipart Upload
				let initData;
				if (nextTask.shareToken) {
					const res = await getPublicPresignedUrl(nextTask.shareToken, {
						fileName: nextTask.fileName,
						contentType: nextTask.file.type,
						isMultipart: true,
					});
					initData = res.data;
				} else {
					const res = await getPresignedUrl({
						fileName: nextTask.fileName,
						contentType: nextTask.file.type,
						albumId: nextTask.albumId,
						isMultipart: true,
					});
					initData = res.data;
				}

				uploadId = initData.uploadId;
				uploadKey = initData.key;

				const totalParts = Math.ceil(nextTask.file.size / CHUNK_SIZE);
				const parts: { ETag: string; PartNumber: number }[] = [];

				for (let i = 0; i < totalParts; i++) {
					if (controller.signal.aborted) throw new Error("Upload aborted");

					const start = i * CHUNK_SIZE;
					const end = Math.min(start + CHUNK_SIZE, nextTask.file.size);
					const chunk = nextTask.file.slice(start, end);
					const partNumber = i + 1;

					// 2. Get Presigned URL for this part
					let partData;
					if (nextTask.shareToken) {
						const res = await getPublicPresignedUrl(nextTask.shareToken, {
							fileName: nextTask.fileName,
							contentType: nextTask.file.type,
							isMultipart: true,
							uploadId,
							partNumber,
							key: uploadKey,
						});
						partData = res.data;
					} else {
						const res = await getPresignedUrl({
							fileName: nextTask.fileName,
							contentType: nextTask.file.type,
							albumId: nextTask.albumId,
							isMultipart: true,
							uploadId,
							partNumber,
							key: uploadKey,
						});
						partData = res.data;
					}

					// 3. Upload the chunk
					const uploadRes = await axios.put(partData.uploadUrl, chunk, {
						signal: controller.signal,
						headers: { "Content-Type": nextTask.file.type },
						onUploadProgress: (progressEvent) => {
							const chunkProgress =
								(progressEvent.loaded / nextTask.file.size) * 100;
							setTasks((prev) =>
								prev.map((t) =>
									t.id === nextTask.id
										? {
												...t,
												progress: Math.min(
													Math.round(
														(start / nextTask.file.size) * 100 + chunkProgress,
													),
													99,
												),
											}
										: t,
								),
							);
						},
					});

					const etag = uploadRes.headers.etag;
					if (!etag) throw new Error("No ETag received from part upload");

					parts.push({ ETag: etag.replace(/"/g, ""), PartNumber: partNumber });
				}

				// 4. Complete Multipart Upload
				if (nextTask.shareToken) {
					await completePublicMultipartUpload(nextTask.shareToken, {
						key: uploadKey!,
						uploadId: uploadId!,
						parts,
					});
				} else {
					await completeMultipartUpload({
						albumId: nextTask.albumId,
						key: uploadKey!,
						uploadId: uploadId!,
						parts,
					});
				}
			} else {
				// --- SINGLE FILE UPLOAD FLOW (Original) ---
				let presignedData;
				if (nextTask.shareToken) {
					const res = await getPublicPresignedUrl(nextTask.shareToken, {
						fileName: nextTask.fileName,
						contentType: nextTask.file.type,
					});
					presignedData = res.data;
				} else {
					const res = await getPresignedUrl({
						fileName: nextTask.fileName,
						contentType: nextTask.file.type,
						albumId: nextTask.albumId,
					});
					presignedData = res.data;
				}

				uploadKey = presignedData.key;

				await axios.put(presignedData.uploadUrl, nextTask.file, {
					signal: controller.signal,
					headers: {
						"Content-Type": nextTask.file.type,
					},
					onUploadProgress: (progressEvent) => {
						const progress = Math.round(
							(progressEvent.loaded * 100) / (progressEvent.total || 1),
						);
						setTasks((prev) =>
							prev.map((t) => (t.id === nextTask.id ? { ...t, progress } : t)),
						);
					},
				});
			}

			// 5. Notify backend to process the uploaded file (Same for both flows)
			const formData = new FormData();
			formData.append("key", uploadKey!);
			formData.append("albumId", nextTask.albumId);
			if (nextTask.initialStatus) {
				formData.append("status", nextTask.initialStatus);
			}

			let uploadResponse;
			if (nextTask.shareToken) {
				uploadResponse = await uploadGuestImages(nextTask.shareToken, formData);
				queryClient.invalidateQueries({
					queryKey: ["shared-album", nextTask.shareToken],
				});
			} else {
				uploadResponse = await uploadImages(formData);
				queryClient.invalidateQueries({
					queryKey: ["images", nextTask.albumId],
				});
				queryClient.invalidateQueries({ queryKey: ["settings"] });
				queryClient.invalidateQueries({ queryKey: ["usage"] });
			}

			// Handle duplicate detection toast
			if (uploadResponse?.data?.data?.duplicateCount > 0) {
				toast(
					`${uploadResponse.data.data.duplicateCount} duplicate photo(s) skipped`,
					{
						icon: "ℹ️",
					},
				);
			}

			setTasks((prev) =>
				prev.map((t) =>
					t.id === nextTask.id
						? { ...t, status: "completed", progress: 100 }
						: t,
				),
			);
		} catch (err: any) {
			const isQuotaError =
				err.response?.status === 402 ||
				err.message?.includes("limit") ||
				err.message?.includes("quota") ||
				err.message?.includes("Monthly compute limit reached");

			if (isQuotaError) {
				const quotaMessage =
					err.response?.data?.message ||
					"Monthly image limit reached. Please upgrade your plan.";

				// We don't show a toast here because we either showed a proactive warning
				// in addUploads, or the global axios interceptor will show a consolidated one.
				console.warn("Upload quota exceeded:", quotaMessage);

				setTasks((prev) =>
					prev.map((t) =>
						t.id === nextTask.id
							? { ...t, status: "error", error: quotaMessage }
							: t.status === "pending"
								? {
										...t,
										status: "paused",
										error: "Upload paused: quota limit reached",
									}
								: t,
					),
				);

				processingRef.current = false;
				return;
			}

			if (axios.isCancel(err) || err.message === "Upload aborted") {
				console.log("Upload cancelled:", nextTask.fileName);

				// Try to cleanup multipart upload on server if it was started
				if (uploadId && uploadKey) {
					if (nextTask.shareToken) {
						abortPublicMultipartUpload(nextTask.shareToken, {
							key: uploadKey,
							uploadId,
						}).catch(console.error);
					} else {
						abortMultipartUpload({
							albumId: nextTask.albumId,
							key: uploadKey,
							uploadId,
						}).catch(console.error);
					}
				}
				return;
			}
			setTasks((prev) =>
				prev.map((t) =>
					t.id === nextTask.id
						? { ...t, status: "error", error: err.message }
						: t,
				),
			);
		} finally {
			abortControllers.current.delete(nextTask.id);
			processingRef.current = false;
		}
	}, [tasks, queryClient]);

	useEffect(() => {
		const activeUploads = tasks.filter((t) => t.status === "uploading").length;
		if (activeUploads < 2) {
			processNextTask();
		}
	}, [tasks, processNextTask]);

	const cancelUpload = useCallback((id: string) => {
		const controller = abortControllers.current.get(id);
		if (controller) {
			controller.abort();
			abortControllers.current.delete(id);
		}
		setTasks((prev) =>
			prev.map((t) =>
				t.id === id ? { ...t, status: "paused", progress: 0 } : t,
			),
		);
	}, []);

	const resumeUpload = useCallback((id: string) => {
		setTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, status: "pending" } : t)),
		);
	}, []);

	const retryUpload = useCallback((id: string) => {
		setTasks((prev) =>
			prev.map((t) =>
				t.id === id
					? { ...t, status: "pending", error: undefined, progress: 0 }
					: t,
			),
		);
	}, []);

	const removeTask = useCallback((id: string) => {
		const controller = abortControllers.current.get(id);
		if (controller) {
			controller.abort();
			abortControllers.current.delete(id);
		}
		setTasks((prev) => prev.filter((t) => t.id !== id));
	}, []);

	return (
		<UploadContext.Provider
			value={{
				tasks,
				addUploads,
				pauseUpload: cancelUpload,
				resumeUpload,
				retryUpload,
				removeTask,
				isManagerOpen,
				setIsManagerOpen,
			}}
		>
			{children}
		</UploadContext.Provider>
	);
};

export const useUpload = () => {
	const context = useContext(UploadContext);
	if (!context)
		throw new Error("useUpload must be used within an UploadProvider");
	return context;
};
