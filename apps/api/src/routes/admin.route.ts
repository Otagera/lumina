import { Elysia } from "elysia";
import { adminPlugin } from "./middleware/admin.plugin.ts";
import adminUsersRoutes from "./admin/admin.users.route.ts";
import adminAnalyticsRoutes from "./admin/admin.analytics.route.ts";
import adminPlansRoutes from "./admin/admin.plans.route.ts";
import adminModerationRoutes from "./admin/admin.moderation.route.ts";
import adminQueuesRoutes from "./admin/admin.queues.route.ts";

const adminRoutes = new Elysia({ prefix: "/admin" })
	.use(adminPlugin)
	.use(adminUsersRoutes)
	.use(adminAnalyticsRoutes)
	.use(adminPlansRoutes)
	.use(adminModerationRoutes)
	.use(adminQueuesRoutes);

export default adminRoutes;
