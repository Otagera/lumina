import joi from "joi";
import { createRefreshToken } from "../models/src/refreshTokens.lib.ts";
import { getUser } from "../models/src/users.lib.ts";
import {
	comparePasswords,
	createUserAuthToken,
} from "../utils/src/auth.util.ts";
import { AuthError } from "../utils/src/error.util.ts";
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
				"Invalid password. It must contain only alphanumeric characters, be at least 8 characters long, contain at least 1 uppercase character, 1 lowercase character, 1 number and 1 special character.",
		}),
});

const aliasSpec = {
	request: {
		email: "email",
		password: "password",
	},
	response: {
		id: "id",
		email: "email",
		accessToken: "accessToken",
		refreshToken: "refreshToken",
	},
};

const service = async (data) => {
	const aliasReq = aliaserSpec(aliasSpec.request, data);
	const { email, password } = validateSpec(spec, aliasReq);

	const user = await getUser({ email });

	if (!user) {
		throw new AuthError("Incorrect email or password");
	}

	const isPasswordValid = await comparePasswords(password, user.password);

	if (!isPasswordValid) {
		throw new AuthError("Incorrect email or password");
	}

	const { accessToken, refreshToken } = await createUserAuthToken(user.user_id);

	await createRefreshToken({
		token: refreshToken,
		user_id: user.user_id,
		expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
	});

	const aliasRes = aliaserSpec(aliasSpec.response, {
		...user,
		accessToken,
		refreshToken,
	});

	return aliasRes;
};

export const loginService = service;
