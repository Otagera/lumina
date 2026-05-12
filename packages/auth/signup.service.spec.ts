import { beforeEach, describe, expect, it, mock } from "bun:test";

const addJobMock = mock(() => undefined);
const getUserMock = mock(async () => null);
const createUserMock = mock(async ({ email }) => ({ user_id: "user-1", email }));
const encryptPasswordMock = mock(async () => "encrypted-password");
const createUserAuthTokenMock = mock(async () => ({
	accessToken: "access-token",
	refreshToken: "refresh-token",
}));
const createRefreshTokenMock = mock(async () => undefined);
const mergeGuestDataServiceMock = mock(async () => undefined);

const joiChain = {
	email: () => joiChain,
	required: () => joiChain,
	trim: () => joiChain,
	regex: () => joiChain,
	messages: () => joiChain,
	uuid: () => joiChain,
	optional: () => joiChain,
};

mock.module("joi", () => ({
	default: {
		string: () => joiChain,
		object: () => ({})
	},
}));

mock.module("../utils/src/specValidator.util.ts", () => ({
	aliaserSpec: (_spec: any, data: any) => data,
	validateSpec: (_spec: any, data: any) => data,
}));


mock.module("../utils/src/error.util.ts", () => ({
	ResourceInUseError: class ResourceInUseError extends Error {},
}));


mock.module("../../apps/worker/src/queue/queue.service.ts", () => ({
	queueServices: {
		emailQueueLib: {
			addJob: addJobMock,
		},
	},
}));

mock.module("../models/src/users.lib.ts", () => ({
	getUser: getUserMock,
	createUser: createUserMock,
}));

mock.module("../utils/src/auth.util.ts", () => ({
	encryptPassword: encryptPasswordMock,
	createUserAuthToken: createUserAuthTokenMock,
}));

mock.module("../models/src/refreshTokens.lib.ts", () => ({
	createRefreshToken: createRefreshTokenMock,
}));

mock.module("../../apps/api/src/services/auth/mergeGuestData.service.ts", () => ({
	mergeGuestDataService: mergeGuestDataServiceMock,
}));

const { signupService } = await import("./signup.service.ts");

describe("signupService", () => {
	beforeEach(() => {
		addJobMock.mockClear();
		getUserMock.mockClear();
		createUserMock.mockClear();
		encryptPasswordMock.mockClear();
		createUserAuthTokenMock.mockClear();
		createRefreshTokenMock.mockClear();
		mergeGuestDataServiceMock.mockClear();
	});

	it("signs up without guestSessionId", async () => {
		const result = await signupService({
			email: "without-guest@example.com",
			password: "ValidPassword123!",
		});

		expect(result.email).toBe("without-guest@example.com");
		expect(mergeGuestDataServiceMock).not.toHaveBeenCalled();
		expect(createUserMock).toHaveBeenCalledTimes(1);
	});

	it("signs up with guestSessionId and merges guest data", async () => {
		const guestSessionId = "11111111-1111-1111-1111-111111111111";
		const result = await signupService({
			email: "with-guest@example.com",
			password: "ValidPassword123!",
			guestSessionId,
		});

		expect(result.email).toBe("with-guest@example.com");
		expect(mergeGuestDataServiceMock).toHaveBeenCalledTimes(1);
		expect(mergeGuestDataServiceMock).toHaveBeenCalledWith({
			guestSessionId,
			userId: "user-1",
		});
	});
});
