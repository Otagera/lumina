import { Elysia } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import { platformAnalyticsService } from "../../services/admin/platformAnalytics.service.ts";

const adminAnalyticsRoutes = new Elysia({ prefix: "/analytics" })
	.get("/", async ({ adminUser, set }) => {
		try {
			const data = await platformAnalyticsService();
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Analytics retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	});

export default adminAnalyticsRoutes;
