import prisma from "../../config/src/db.config.ts";

export const createPasswordReset = async (data: {
	token: string;
	user_id: string;
	expires_at: Date;
}) => {
	return await prisma.password_resets.create({
		data,
	});
};

export const fetchPasswordReset = async (where: any) => {
	return await prisma.password_resets.findUnique({
		where,
		include: {
			users: true,
		},
	});
};

export const deletePasswordReset = async (where: any) => {
	return await prisma.password_resets.deleteMany({
		where,
	});
};
