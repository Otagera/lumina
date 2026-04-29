import prisma from "../../config/src/db.config.ts";

export const createRefreshToken = async (data: {
	token: string;
	user_id: string;
	expires_at: Date;
}) => {
	return await prisma.refresh_tokens.create({
		data,
	});
};

export const fetchRefreshToken = async (where: any) => {
	return await prisma.refresh_tokens.findUnique({
		where,
	});
};

export const deleteRefreshToken = async (where: any) => {
	return await prisma.refresh_tokens.deleteMany({
		where,
	});
};
