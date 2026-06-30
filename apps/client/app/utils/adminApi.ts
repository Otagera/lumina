import axiosAPI from "./axios";

// Users
export const fetchAdminUsers = (params: { page?: number; limit?: number; search?: string }) =>
	axiosAPI.get("/admin/users", { params }).then((r) => r.data.data);

export const fetchAdminUserDetail = (userId: string) =>
	axiosAPI.get(`/admin/users/${userId}`).then((r) => r.data.data);

export const updateAdminUser = (
	userId: string,
	data: { role?: string; planId?: string; suspend?: boolean },
) => axiosAPI.patch(`/admin/users/${userId}`, data).then((r) => r.data.data);

export const deleteAdminUser = (userId: string) =>
	axiosAPI.delete(`/admin/users/${userId}`).then((r) => r.data);

// Analytics
export const fetchPlatformAnalytics = () =>
	axiosAPI.get("/admin/analytics").then((r) => r.data.data);

// Plans
export const fetchAdminPlans = () =>
	axiosAPI.get("/admin/plans").then((r) => r.data.data);

export const createAdminPlan = (data: {
	name: string;
	description?: string;
	storage_mb: number;
	compute_units_per_month: number;
	price_usd: string;
	price_ngn: string;
	is_highlighted?: boolean;
	order?: number;
	features?: string[];
}) => axiosAPI.post("/admin/plans", data).then((r) => r.data.data);

export const updateAdminPlan = (planId: string, data: Record<string, unknown>) =>
	axiosAPI.patch(`/admin/plans/${planId}`, data).then((r) => r.data.data);

export const deleteAdminPlan = (planId: string) =>
	axiosAPI.delete(`/admin/plans/${planId}`).then((r) => r.data);

// Moderation
export const fetchPendingModeration = (params: { page?: number; limit?: number }) =>
	axiosAPI.get("/admin/moderation", { params }).then((r) => r.data.data);

export const adminModerateImages = (data: {
	imageIds: string[];
	status: "APPROVED" | "REJECTED";
	reason?: string;
}) => axiosAPI.patch("/admin/moderation", data).then((r) => r.data.data);

export const clearAllPendingModeration = () =>
	axiosAPI.delete("/admin/moderation/pending").then((r) => r.data.data);

// Queues
export const fetchQueueStats = () =>
	axiosAPI.get("/admin/queues").then((r) => r.data.data);

export const fetchQueueFailedJobs = (queueName: string) =>
	axiosAPI.get(`/admin/queues/${queueName}/failed`).then((r) => r.data.data);

export const retryQueueJob = (queueName: string, jobId: string) =>
	axiosAPI.post(`/admin/queues/${queueName}/retry/${jobId}`).then((r) => r.data.data);

export const clearQueueFailed = (queueName: string) =>
	axiosAPI.delete(`/admin/queues/${queueName}/failed`).then((r) => r.data.data);
