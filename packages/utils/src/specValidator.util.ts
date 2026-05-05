import type { ObjectSchema, ValidationOptions } from "joi";

export const validateSpec = (
	spec: ObjectSchema,
	data: any = {},
	optionalConfig: ValidationOptions = {},
) => {
	const { error, value } = spec.validate(data, {
		allowUnknown: true,
		stripUnknown: true,
		errors: {
			wrap: {
				label: "",
			},
		},
		...optionalConfig,
	});

	if (error) {
		throw new Error(error.message);
	}
	return value;
};

export const aliaserSpec = (
	spec: { [key: string]: string },
	data: { [key: string]: any },
) => {
	if (!data || typeof data !== "object" || Array.isArray(data)) return data;

	const mappedObj: { [key: string]: any } = { ...data };
	Object.entries(spec).forEach(([key, value]) => {
		if (key in data) {
			mappedObj[value] = data[key];
			if (key !== value) delete mappedObj[key];
		}
	});

	return mappedObj;
};
