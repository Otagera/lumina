import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { getUsageService } from "../services/usage/getUsage.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";

const usageRoutes = new Elysia({ prefix: "/usage" })
	.derive(authDerivation)
	.get("/", async ({ userId, set }) => {
		try {
			const data = await getUsageService({ userId });

			set.status = HTTP_STATUS_CODES.OK;
			return {
				status: "completed",
				message: "Usage statistics retrieved successfully.",
				data,
			};
		} catch (error: any) {
			set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
			return {
				status: "error",
				message: error?.message || "Internal server error",
				data: null,
			};
		}
	})
	.get(
		"/export",
		async ({ userId, set }) => {
			try {
				const data = await getUsageService({ userId });

				// Generate CSV
				const headers = [
					"Date",
					"Resource",
					"Operation",
					"Quantity",
					"Album ID",
				].join(",");

				const rows = data.history.map((day: any) =>
					[day.date, "storage", "daily_total", day.storageMB, ""].join(","),
				);

				const rows2 = data.history.map((day: any) =>
					[day.date, "compute", "daily_total", day.computeUnits, ""].join(","),
				);

				const csv = [headers, ...rows, ...rows2].join("\n");

				set.headers["Content-Type"] = "text/csv";
				set.headers["Content-Disposition"] =
					`attachment; filename="usage-report-${new Date().toISOString().split("T")[0]}.csv"`;

				return csv;
			} catch (error: any) {
				set.status = error?.statusCode || HTTP_STATUS_CODES.BAD_REQUEST;
				return {
					status: "error",
					message: error?.message || "Internal server error",
					data: null,
				};
			}
		},
		{
			detail: {
				summary: "Export Usage Report",
				description: "Export usage data as CSV",
			},
		},
	);

export default usageRoutes;
