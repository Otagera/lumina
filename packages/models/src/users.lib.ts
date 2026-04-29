import { createNewUser, fetchUser, updateExistingUser } from "./users.model";

const createUser = async (userData) => {
	return await createNewUser(userData);
};

const getUser = async (where) => fetchUser(where);

const updateUser = async (userId, userData) =>
	updateExistingUser(userId, userData);

export { createUser, getUser, updateUser };
