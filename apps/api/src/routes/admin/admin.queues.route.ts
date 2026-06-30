import { Elysia } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import {
	getAllQueueStatsService,
	getQueueFailedJobsService,
	retryQueueJobService,
	clearQueueFailedService,
} from "../../services/admin/queueStats.service.ts";

const adminQueuesRoutes = new Elysia({ prefix: "/queues" })
	.get("/", async ({ adminUser, set }) => {
		try {
			const data = await getAllQueueStatsService();
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Queue stats retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.get("/:queueName/failed", async ({ adminUser, params, set }) => {
		try {
			const data = await getQueueFailedJobsService(params.queueName);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Failed jobs retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.post("/:queueName/retry/:jobId", async ({ adminUser, params, set }) => {
		try {
			const data = await retryQueueJobService(params.queueName, params.jobId);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Job queued for retry.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.delete("/:queueName/failed", async ({ adminUser, params, set }) => {
		try {
			const data = await clearQueueFailedService(params.queueName);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Failed jobs cleared.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	});

export default adminQueuesRoutes;
