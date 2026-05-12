import { Elysia, t } from "elysia";
import { HTTP_STATUS_CODES } from "../../../../packages/utils/src/constants.util.ts";
import { addReactionService } from "../services/reactions/addReaction.service.ts";
import { authDerivation } from "./middleware/auth.plugin.ts";
import { guestPlugin } from "./middleware/guest.plugin.ts";

const reactionsRoutes = new Elysia({ prefix: "/reactions" })
  .use(guestPlugin)
  .derive(authDerivation)
  .post(
    "/",
    async ({ body, userId, guestSessionId, set }) => {
      try {
        const data = await addReactionService({
          ...body,
          userId,
          guestSessionId,
        });

        set.status = HTTP_STATUS_CODES.CREATED;
        return {
          status: "completed",
          message: "Reaction added successfully.",
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
    },
    {
      body: t.Object({
        imageId: t.String(),
        type: t.Optional(t.String()),
      }),
    }
  );

export { reactionsRoutes };
