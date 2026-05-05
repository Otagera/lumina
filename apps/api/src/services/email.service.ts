import Joi from "joi";
import {
	aliaserSpec,
	validateSpec,
} from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({});
const aliasSpec = { request: {}, response: {} };

// Wrapper to maintain compatibility
const service = async (data: any) => {
	validateSpec(spec, aliaserSpec(aliasSpec.request, data));
	return aliaserSpec(aliasSpec.response, {});
};

export {
	sendClusteringCompleteEmail,
	sendPhotoApprovedEmail,
	sendResetPasswordEmail,
	sendWelcomeEmail,
} from "@lumina/email/email.service";
