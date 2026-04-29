import {
	createRefreshToken as createToken,
	deleteRefreshToken as deleteToken,
	fetchRefreshToken as fetchToken,
} from "./refreshTokens.model";

export const createRefreshToken = async (data: {
	token: string;
	user_id: string;
	expires_at: Date;
}) => {
	return await createToken(data);
};

export const getRefreshToken = async (where: any) => {
	return await fetchToken(where);
};

export const removeRefreshToken = async (where: any) => {
	return await deleteToken(where);
};
