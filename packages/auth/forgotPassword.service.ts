import crypto from "node:crypto";
import { queueServices } from "../../apps/worker/src/queue/queue.service.ts";
import { createPasswordReset } from "../models/src/passwordResets.lib.ts";
import { getUser } from "../models/src/users.lib.ts";

export const forgotPasswordService = async (email: string) => {
	const user = await getUser({ email });

	if (!user) {
		// Return success to avoid user enumeration
		return true;
	}

	const token = crypto.randomBytes(32).toString("hex");
	const expires_at = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

	await createPasswordReset({
		token,
		user_id: user.user_id,
		expires_at,
	});

	await queueServices.emailQueueLib.addJob("email", {
		worker: "email",
		type: "reset_password",
		data: { email, token },
	});

	return true;
};
