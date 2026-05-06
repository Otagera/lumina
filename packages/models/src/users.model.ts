import prisma from "../../config/src/db.config.ts";

const createNewUser = async (userData) => {
	return await prisma.users.create({
		data: {
			...userData,
		},
	});
};

const updateExistingUser = async (userId, userData) => {
	return await prisma.users.update({
		where: {
			user_id: userId,
		},
		data: {
			...userData,
		},
	});
};

const fetchUser = async (where) => {
	if (!where) {
		throw new Error("No where clause provided");
	}
	if (!where.user_id && !where.email) {
		throw new Error("No user_id or email provided");
	}

	return await prisma.users.findUnique({
		where,
		include: {
			storage_configs: true,
		},
	});
};

const fetchUserById = async (userId) => {
	return await prisma.users.findFirst({
		where: {
			user_id: userId,
		},
		include: {
			storage_configs: true,
		},
	});
};

const fetchUserByEmail = async (email) => {
	return await prisma.users.findFirst({
		where: {
			email,
		},
	});
};

const fetchUsersByIds = async (userIds) => {
	return await prisma.users.findMany({
		where: {
			user_id: {
				in: userIds,
			},
		},
	});
};

const fetchAllUsers = async () => {
	return await prisma.users.findMany();
};

const deleteUserById = async (userId) => {
	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.albums.deleteMany({
			where: {
				created_by: userId,
			},
		});
		await prisma.users.delete({
			where: {
				user_id: userId,
			},
		});
	});

	return transaction;
};

const deleteUsersByIds = async (userIds) => {
	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.users.deleteMany({
			where: {
				user_id: {
					in: userIds,
				},
			},
		});
	});

	return transaction;
};

const deleteAllUsers = async () => {
	const transaction = await prisma.$transaction(async (prisma) => {
		await prisma.users.deleteMany({});
	});

	return transaction;
};

// Storage Configs
const createStorageConfig = async (userId, data) => {
	const { name, is_active, ...rest } = data;
	return await prisma.user_storage_configs.create({
		data: {
			...rest,
			user_id: userId,
		},
	});
};

const updateStorageConfig = async (configId, data) => {
	const { name, is_active, ...rest } = data;
	return await prisma.user_storage_configs.update({
		where: { id: configId },
		data: rest,
	});
};

const deleteStorageConfig = async (configId) => {
	return await prisma.user_storage_configs.delete({
		where: { id: configId },
	});
};

const fetchStorageConfigs = async (userId) => {
	return await prisma.user_storage_configs.findMany({
		where: { user_id: userId },
	});
};

export {
	createNewUser,
	updateExistingUser,
	fetchUser,
	fetchUserById,
	fetchUserByEmail,
	fetchUsersByIds,
	fetchAllUsers,
	deleteUserById,
	deleteUsersByIds,
	deleteAllUsers,
	createStorageConfig,
	updateStorageConfig,
	deleteStorageConfig,
	fetchStorageConfigs,
};
