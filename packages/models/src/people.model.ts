import prisma from "../../config/src/db.config.ts";

const createPerson = async (name: string, user_id: string) => {
	return await prisma.people.create({
		data: {
			name,
			user_id,
		},
	});
};

const getPeople = async (user_id: string) => {
	return await prisma.people.findMany({
		where: {
			user_id,
		},
		include: {
			faces: {
				take: 1,
				include: {
					images: true,
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});
};

const getPersonById = async (person_id: string, user_id: string) => {
	return await prisma.people.findFirst({
		where: {
			person_id,
			user_id,
		},
		include: {
			faces: true,
		},
	});
};

const updatePerson = async (
	person_id: string,
	user_id: string,
	data: { name?: string },
) => {
	// First try to update with user_id (new people)
	let result = await prisma.people.updateMany({
		where: {
			person_id,
			user_id,
		},
		data,
	});

	// If not found, try updating legacy people without user_id
	if (result.count === 0) {
		result = await prisma.people.updateMany({
			where: {
				person_id,
				user_id: null,
			},
			data,
		});
	}

	return result;
};

export { createPerson, getPeople, getPersonById, updatePerson };
