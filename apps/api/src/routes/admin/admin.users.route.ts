import { Elysia } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../../packages/utils/src/constants.util.ts";
import { listUsersService } from "../../services/admin/listUsers.service.ts";
import { getUserDetailService } from "../../services/admin/getUserDetail.service.ts";
import { updateUserService } from "../../services/admin/updateUser.service.ts";
import { deleteUserService } from "../../services/admin/deleteUser.service.ts";

const adminUsersRoutes = new Elysia({ prefix: "/users" })
	.get("/", async ({ adminUser, query, set }) => {
		try {
			const page = parseInt((query as any).page ?? "1", 10);
			const limit = parseInt((query as any).limit ?? "20", 10);
			const search = (query as any).search ?? "";
			const data = await listUsersService({ page, limit, search });
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "Users retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.get("/:userId", async ({ adminUser, params, set }) => {
		try {
			const data = await getUserDetailService(params.userId);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "User retrieved.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.patch("/:userId", async ({ adminUser, params, body, set }) => {
		try {
			const data = await updateUserService(adminUser, params.userId, body as any);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "User updated.", data };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	})
	.delete("/:userId", async ({ adminUser, params, set }) => {
		try {
			await deleteUserService(adminUser, params.userId);
			set.status = HTTP_STATUS_CODES.OK;
			return { status: "completed", message: "User deleted.", data: null };
		} catch (error: any) {
			set.status = error?.statusCode ?? HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: error?.message ?? "Internal server error", data: null };
		}
	});

export default adminUsersRoutes;
