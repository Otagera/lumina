import {
	createPasswordReset as createReset,
	deletePasswordReset as deleteReset,
	fetchPasswordReset as fetchReset,
} from "./passwordResets.model";

export const createPasswordReset = async (data: {
	token: string;
	user_id: string;
	expires_at: Date;
}) => {
	return await createReset(data);
};

export const getPasswordReset = async (where: any) => {
	return await fetchReset(where);
};

export const removePasswordReset = async (where: any) => {
	return await deleteReset(where);
};
