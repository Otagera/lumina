import { Elysia } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import { listPendingModerationService } from "../../services/admin/listPendingModeration.service.ts";
import { adminModerateImagesService } from "../../services/admin/adminModerateImages.service.ts";

const adminModerationRoutes = new Elysia({ prefix: "/moderation" })
	.get("/", async ({ adminUser, query, set }) => {
		try {
			const page = parseInt((query as any).page ?? "1", 10);
			const limit = parseInt((query as any).limit ?? "24", 10);
			const data = await listPendingModerationService({ page, limit });
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Pending images retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.patch("/", async ({ adminUser, body, set }) => {
		try {
			const data = await adminModerateImagesService(body as any);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: `Images ${(body as any).status?.toLowerCase()}.`, data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	});

export default adminModerationRoutes;
