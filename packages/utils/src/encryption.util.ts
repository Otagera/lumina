import crypto from "node:crypto";
import config from "../../config/src/index.config.ts";

const envConfig = config[config.env || "development"];

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = crypto.scryptSync(envConfig.encryption_key, "salt", 32);

/**
 * Encrypts a string using AES-256-GCM
 */
export const encrypt = (text: string): string => {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

	const encrypted = Buffer.concat([
		cipher.update(text, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();

	return Buffer.concat([iv, tag, encrypted]).toString("base64");
};

/**
 * Decrypts a string encrypted with AES-256-GCM
 */
export const decrypt = (data: string): string => {
	const buffer = Buffer.from(data, "base64");

	const iv = buffer.subarray(0, IV_LENGTH);
	const tag = buffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
	const encrypted = buffer.subarray(IV_LENGTH + TAG_LENGTH);

	const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv, {
		authTagLength: TAG_LENGTH,
	});
	decipher.setAuthTag(tag);

	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);
	return decrypted.toString("utf8");
};
