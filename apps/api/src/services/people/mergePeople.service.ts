import Joi from "joi";
import prisma from "../../../../../packages/config/src/db.config.ts";
import {
	BadRequestError,
	NotFoundError,
} from "../../../../../packages/utils/src/error.util.ts";
import { validateSpec } from "../../../../../packages/utils/src/specValidator.util.ts";

const spec = Joi.object({
	sourcePersonId: Joi.string().uuid().required(),
	targetPersonId: Joi.string().uuid().required(),
	userId: Joi.string().uuid().required(),
});

const service = async (data: any) => {
	const params = validateSpec(spec, data);

	if (params.sourcePersonId === params.targetPersonId) {
		throw new BadRequestError("Source and target person cannot be the same.");
	}

	// Verify both people belong to the user
	const [sourcePerson, targetPerson] = await Promise.all([
		prisma.people.findFirst({
			where: { person_id: params.sourcePersonId, user_id: params.userId },
		}),
		prisma.people.findFirst({
			where: { person_id: params.targetPersonId, user_id: params.userId },
		}),
	]);

	if (!sourcePerson) throw new NotFoundError("Source person not found.");
	if (!targetPerson) throw new NotFoundError("Target person not found.");

	// Transaction to move faces and delete source person
	await prisma.$transaction(async (tx) => {
		// 1. Move faces
		await tx.faces.updateMany({
			where: { person_id: params.sourcePersonId },
			data: { person_id: params.targetPersonId },
		});

		// 2. Move ignored_faces (handle unique constraint)
		const sourceIgnored = await tx.ignored_faces.findMany({
			where: { person_id: params.sourcePersonId },
		});

		for (const ignored of sourceIgnored) {
			try {
				await tx.ignored_faces.upsert({
					where: {
						person_id_face_id: {
							person_id: params.targetPersonId,
							face_id: ignored.face_id,
						},
					},
					create: {
						person_id: params.targetPersonId,
						face_id: ignored.face_id,
					},
					update: {}, // No update needed if already exists
				});
			} catch (e) {
				// Handle race conditions or constraint errors gracefully
			}
		}

		// 3. Delete ignored_faces for source person
		await tx.ignored_faces.deleteMany({
			where: { person_id: params.sourcePersonId },
		});

		// 4. Finally delete source person
		await tx.people.delete({
			where: { person_id: params.sourcePersonId },
		});
	});

	return { success: true, targetPersonId: params.targetPersonId };
};

export const mergePeopleService = service;
