import { Elysia } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import {
	listPlansService,
	createPlanService,
	updatePlanService,
	deletePlanService,
} from "../../services/admin/planCrud.service.ts";

const adminPlansRoutes = new Elysia({ prefix: "/plans" })
	.get("/", async ({ adminUser, set }) => {
		try {
			const data = await listPlansService();
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Plans retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.post("/", async ({ adminUser, body, set }) => {
		try {
			const data = await createPlanService(body as any);
			set.status = HTTP_STATUS_CODES.CREATED;
			return { status: "completed", message: "Plan created.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.patch("/:planId", async ({ adminUser, params, body, set }) => {
		try {
			const data = await updatePlanService(params.planId, body as any);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Plan updated.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.delete("/:planId", async ({ adminUser, params, set }) => {
		try {
			await deletePlanService(params.planId);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Plan deleted.", data: null };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	});

export default adminPlansRoutes;
