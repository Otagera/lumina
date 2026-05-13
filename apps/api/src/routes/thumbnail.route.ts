import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { thumbnailService } from "../services/pictures/thumbnail.service.ts";

export const thumbnailRoutes = new Elysia({ prefix: "/thumbnail" }).get(
	"/:imageId",
	async ({ params, query, set }) => {
		try {
			const data = await thumbnailService({
				imageId: params.imageId,
				faceId: query.faceId,
			});

			set.headers["Content-Type"] = data.contentType;
			set.headers["Cache-Control"] = "public, max-age=86400";

			return data.imageBuffer;
		} catch (error: any) {
			console.error("[Thumbnail] Error:", error.message, error.stack);
			set.status = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
			return { status: "error", message: "Failed to generate thumbnail" };
		}
	},
	{
		params: t.Object({ imageId: t.String() }),
		query: t.Object({ faceId: t.Optional(t.String()) }),
	},
);

export default thumbnailRoutes;
