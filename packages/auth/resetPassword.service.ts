import joi from "joi";
import {
	getPasswordReset,
	removePasswordReset,
} from "../models/src/passwordResets.lib.ts";
import { updateUser } from "../models/src/users.lib.ts";
import { encryptPassword } from "../utils/src/auth.util.ts";
import { AuthError } from "../utils/src/error.util.ts";
import { validateSpec } from "../utils/src/specValidator.util.ts";

const spec = joi.object({
	token: joi.string().required(),
	password: joi
		.string()
		.trim()
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^0-9a-zA-Z]).{8,128}$/)
		.required()
		.messages({
			"string.pattern.base":
				"Invalid password. It must be 8-128 characters long, contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
		}),
});

export const resetPasswordService = async (data: any) => {
	const { token, password } = validateSpec(spec, data);

	const resetEntry = await getPasswordReset({ token });

	if (!resetEntry) {
		throw new AuthError("Invalid or expired password reset token");
	}

	if (new Date() > new Date(resetEntry.expires_at)) {
		await removePasswordReset({ token });
		throw new AuthError("Password reset token has expired");
	}

	const encryptedPassword = await encryptPassword(password);
	await updateUser(resetEntry.user_id, { password: encryptedPassword });

	// Cleanup all tokens for this user for security
	await removePasswordReset({ user_id: resetEntry.user_id });

	return true;
};
