import jwt from "jsonwebtoken";
import config from "../../config/src/index.config.ts";

const encryptPassword = async (password) => {
	return await Bun.password.hash(password);
};

const comparePasswords = async (password, userPassword) => {
	return await Bun.password.verify(password, userPassword);
};

const createAdminToken = () => {
	const env = config.env || "development";
	const secret = config[env].secret;
	const adminToken = jwt.sign({ userId: "admin", type: "admin" }, secret, {
		expiresIn: "1h",
	});
	return adminToken;
};

const createUserAuthToken = async (userId) => {
	const env = config.env || "development";
	const secret = config[env].secret;

	const accessToken = jwt.sign({ userId, type: "access" }, secret, {
		expiresIn: "24h",
	});
	const refreshToken = jwt.sign({ userId, type: "refresh" }, secret, {
		expiresIn: "30d",
	});
	return { accessToken, refreshToken };
};

const createUserResetPasswordToken = (email, userId) => {
	const env = config.env || "development";
	const secret = config[env].secret;
	const token = jwt.sign({ userId, email, type: "resetPassword" }, secret, {
		expiresIn: "24h",
	});
	return token;
};

const createCompanyAuthToken = async (companyId) => {
	const env = config.env || "development";
	const secret = config[env].secret;
	const accessToken = jwt.sign({ companyId, type: "access" }, secret, {
		expiresIn: "24h",
	});
	const refreshToken = jwt.sign({ companyId, type: "refresh" }, secret, {
		expiresIn: "30d",
	});
	return { accessToken, refreshToken };
};

const createCompanyActivationToken = (email, companyId) => {
	const env = config.env || "development";
	const secret = config[env].secret;
	const token = jwt.sign({ companyId, email, type: "activation" }, secret, {
		expiresIn: "48h",
	});
	return token;
};

const createCompanyResetPasswordToken = (email, companyId) => {
	const env = config.env || "development";
	const secret = config[env].secret;
	const token = jwt.sign({ companyId, email, type: "resetPassword" }, secret, {
		expiresIn: "24h",
	});
	return token;
};

const hashToken = async (token) => {
	return await Bun.password.hash(token);
};

const compareTokens = async (token, hashedToken) => {
	return await Bun.password.verify(token, hashedToken);
};

export {
	encryptPassword,
	comparePasswords,
	createAdminToken,
	createUserAuthToken,
	createUserResetPasswordToken,
	createCompanyAuthToken,
	createCompanyActivationToken,
	createCompanyResetPasswordToken,
	hashToken,
	compareTokens,
};
