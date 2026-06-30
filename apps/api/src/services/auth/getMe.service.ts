import Joi from "joi";
import { verify } from "jsonwebtoken";
import config from "../../../../../packages/config/src/index.config.ts";
import { getUser } from "../../../../../packages/models/src/users.lib.ts";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
});

const aliasSpec = {
	request: {},
	response: {
		user_id: "id",
		email: "email",
		plan_name: "planName",
		role: "role",
	},
};

const service = async (token: string) => {
	const params = validateSpec(spec, { token });

	const env = config.env || "development";
	const secret = config[env].secret || "default_secret";

	try {
		const decoded = verify(token, secret) as any;

		const user = await getUser({ user_id: decoded.userId });

		if (!user) {
			throw new Error("User not found.");
		}

		return aliaserSpec(aliasSpec.response, {
			user_id: user.user_id,
			email: user.email,
			plan_name: user.plan_name,
			role: user.role,
		});
	} catch (error: any) {
		if (error?.message === "User not found.") {
			throw { statusCode: 404, message: "User not found." };
		}
		throw { statusCode: 401, message: "Invalid token" };
	}
};

export const getMeService = service;
