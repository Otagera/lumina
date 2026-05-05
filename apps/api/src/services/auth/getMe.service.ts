import Joi from "joi";
import { getUser } from "../../../../../packages/models/src/users.lib.ts";
import { aliaserSpec, validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	token: Joi.string().required(),
});

const aliasSpec = {
	request: {},
	response: {
		user_id: "userId",
		email: "email",
		plan_name: "planName",
	},
};

const service = async (token: string) => {
	const params = validateSpec(spec, { token });

	try {
		const decoded = verify(token, config[config.env || "development"].secret || "default_secret") as any;
		const user = await getUser(decoded.userId);

		if (!user) {
			throw new Error("User not found.");
		}

		return aliaserSpec(aliasSpec.response, {
			user_id: user.user_id,
			email: user.email,
			plan_name: user.plan_name,
		});
	} catch (error: any) {
		if (error?.message === "User not found.") {
			throw { statusCode: 404, message: "User not found." };
		}
		throw { statusCode: 401, message: "Invalid token" };
	}
};

export const getMeService = service;
