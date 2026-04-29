import joi from "joi";
import { queueServices } from "../../apps/worker/src/queue/queue.service.ts";
import { createRefreshToken } from "../models/src/refreshTokens.lib.ts";
import { createUser, getUser } from "../models/src/users.lib.ts";
import {
	createUserAuthToken,
	encryptPassword,
} from "../utils/src/auth.util.ts";
import { ResourceInUseError } from "../utils/src/error.util.ts";
import { aliaserSpec, validateSpec } from "../utils/src/specValidator.util.ts";

const spec = joi.object({
	email: joi.string().email().required(),
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

const aliasSpec = {
	request: {
		email: "email",
		password: "password",
	},
	response: {
		user_id: "id",
		email: "email",
		accessToken: "accessToken",
		refreshToken: "refreshToken",
		isFirstSignup: "isFirstSignup",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const { email, password } = validateSpec(spec, aliasReq);

	const existingUser = await getUser({ email });

	if (existingUser) {
		console.log("Signup failed: Email in use", email);
		throw new ResourceInUseError("Email is in use");
	}

	const encryptedPassword = await encryptPassword(password);

	const user = await createUser({ email, password: encryptedPassword });

	const { accessToken, refreshToken } = await createUserAuthToken(user.user_id);

	await createRefreshToken({
		token: refreshToken,
		user_id: user.user_id,
		expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
	});

	// Enqueue welcome email
	queueServices.emailQueueLib.addJob("email", {
		worker: "email",
		type: "welcome",
		data: { email },
	});

	const aliasRes = aliaserSpec(aliasSpec.response, {
		...user,
		accessToken,
		refreshToken,
		isFirstSignup: true,
	});
	return aliasRes;
};

export const signupService = service;
