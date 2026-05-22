import { publicEventClient } from "~/hooks/usePublicEventClient";
import type { SharedAlbum } from "~/types";
import axiosAPI from "./axios";
import { api } from "./eden";

export const fetchImages = async ({
	pageParam = null,
}: {
	pageParam?: string | null;
} = {}) => {
	try {
		const { data, error } = await api.images.get({
			$query: {
				paginationType: "cursor",
				limit: 25,
				...(pageParam ? { nextCursor: pageParam } : {}),
			},
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || error.message || "API request failed",
		);
	}
};

export const fetchImage = async (imageId: string) => {
	try {
		const { data, error } = await api.images[imageId].get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching image:", error);
	}
};

export const uploadImages = async (formData: FormData) => {
	try {
		const albumId = formData.get("albumId") as string | undefined;
		// Use axiosAPI for FormData to ensure correct multipart handling and visibility in DevTools
		const response = await axiosAPI.post("/images", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});

		const uploadResponseData = response.data;

		if (albumId && albumId !== "undefined" && albumId !== "null") {
			const { error: albumError } = await api.albums[albumId].images.post({
				imageIds: uploadResponseData.data.images.map(
					(image: any) => image.imageId,
				),
			});
			if (albumError) throw albumError;
		}

		return uploadResponseData;
	} catch (error: any) {
		console.error("Error uploading images:", error);
		throw new Error(
			error.response?.data?.message || error.message || "Upload failed",
		);
	}
};

export const deleteImage = async (imageId: string) => {
	try {
		const { data, error } = await api.images[imageId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error deleting image:", error);
	}
};

export const fetchAlbums = async () => {
	try {
		const { data, error } = await api.albums.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching albums:", error);
	}
};

export const fetchPlans = async () => {
	try {
		const { data, error } = await api.public.plans.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching plans:", error);
	}
};

export const fetchImagesInAlbum = async ({
	albumId,
	pageParam = null,
	status = "APPROVED",
	startDate,
	endDate,
	uploaderId,
	sortBy,
}: {
	albumId: string;
	pageParam?: string | null;
	status?: "APPROVED" | "PENDING" | "REJECTED";
	startDate?: string;
	endDate?: string;
	uploaderId?: string;
	sortBy?: string;
}) => {
	try {
		const { data, error } = await api.albums[albumId].images.get({
			$query: {
				paginationType: "cursor",
				limit: 25,
				status,
				...(pageParam ? { nextCursor: pageParam } : {}),
				...(startDate ? { startDate } : {}),
				...(endDate ? { endDate } : {}),
				...(uploaderId ? { uploaderId } : {}),
				...(sortBy ? { sortBy } : {}),
			},
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching images in album:", error);
	}
};

export const fetchAlbum = async (albumId: string) => {
	try {
		const { data, error, status } = await api.albums[albumId].get();
		if (status === 404) {
			throw new Error("Album not found");
		}
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching album:", error);
		throw error;
	}
};

export const login = async (credentials: {
	email: string;
	password: string;
}) => {
	const { data, error } = await api.auth.login.post(credentials);
	if (error) {
		const err = new Error(error.value?.message || "Login failed");
		throw err;
	}
	return data;
};

export const signup = async (credentials: {
	email: string;
	password: string;
}) => {
	const { data, error } = await api.auth.signup.post(credentials);
	if (error) {
		const err = new Error(error.value?.message || "Signup failed");
		throw err;
	}
	return data;
};

export const forgotPassword = async (email: string) => {
	try {
		const { data, error } = await api.auth["forgot-password"].post({ email });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error: any) {
		throw new Error(
			error.response?.data?.message || error.message || "Request failed",
		);
	}
};

export const resetPassword = async (data: {
	token: string;
	password: string;
}) => {
	try {
		const { data: responseData, error } =
			await api.auth["reset-password"].post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error resetting password:", error);
		throw error;
	}
};

export const createAlbum = async (albumName: string) => {
	try {
		const { data, error } = await api.albums.post({ albumName });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error creating album:", error);
	}
};

export const editAlbum = async ({
	albumId,
	albumName,
	shareToken,
	coverImageId,
}: {
	albumId: string;
	albumName?: string;
	shareToken?: string | null;
	coverImageId?: string | null;
}) => {
	try {
		const { data, error } = await api.albums[albumId].put({
			albumName,
			shareToken,
			coverImageId,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error editing album:", error);
	}
};

export const deleteAlbum = async (albumId: string) => {
	try {
		const { data, error } = await api.albums[albumId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error deleting album:", error);
	}
};

export const triggerClustering = async (albumId: string) => {
	try {
		const { data, error } = await api.albums[albumId].cluster.post();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error triggering clustering:", error);
		throw error;
	}
};

export const reprocessImage = async (imageId: string) => {
	try {
		const { data, error } = await api.images[imageId].reprocess.post();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error reprocessing image:", error);
		throw error;
	}
};

export const downloadImage = async (imageId: string) => {
	try {
		const { data, error } = await api.images[imageId].download.post();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error downloading image:", error);
		throw error;
	}
};

export const searchFaces = async ({
	faceId,
	albumId,
	threshold,
	limit,
	shareToken,
}: {
	faceId: number;
	albumId?: string;
	threshold?: number;
	limit?: number;
	shareToken?: string;
}) => {
	try {
		if (shareToken) {
			const { data, error } = await api.public.faces.search.post({
				faceId,
				shareToken,
				threshold,
				limit,
			});
			if (error) throw new Error(error.value?.message || "Request failed");
			return data;
		} else {
			const { data, error } = await api.faces.search.post({
				faceId,
				albumId,
				threshold,
				limit,
			});
			if (error) throw new Error(error.value?.message || "Request failed");
			return data;
		}
	} catch (error) {
		console.error("Error searching faces:", error);
	}
};

export const fetchSharedAlbum = async (
	token: string,
): Promise<{ data: SharedAlbum | undefined } | undefined> => {
	try {
		return {
			data: (await publicEventClient.getPublicAlbum(token)) as
				| SharedAlbum
				| undefined,
		};
	} catch (error) {
		console.error("Error fetching shared album:", error);
	}
};

export const fetchSharedImage = async (token: string, imageId: string) => {
	try {
		const { data, error } = await api.public.images[token][imageId].get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching shared image:", error);
	}
};

export const fetchPeople = async () => {
	try {
		const { data, error } = await api.people.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching people:", error);
	}
};

export const createPerson = async (name: string) => {
	try {
		const { data, error } = await api.people.post({ name });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error creating person:", error);
	}
};

export const updatePerson = async (personId: string, name: string) => {
	try {
		const { data, error } = await api.people[personId].put({ name });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error updating person:", error);
	}
};

export const deletePerson = async (personId: string) => {
	try {
		const { data, error } = await api.people[personId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error deleting person:", error);
		throw error;
	}
};

export const fetchSuggestions = async () => {
	try {
		const { data, error } = await api.faces.suggestions.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching suggestions:", error);
		throw error;
	}
};

export const updateFace = async (
	faceId: number,
	data: { personId: string | null },
) => {
	try {
		const { data: responseData, error } = await api.faces[faceId].patch(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error updating face:", error);
	}
};

export const ignoreFace = async (faceId: number, personId: string) => {
	try {
		const { data, error } = await api.faces[faceId].ignore.post({
			personId,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error ignoring face:", error);
		throw error;
	}
};

export const unignoreFace = async (faceId: number, personId: string) => {
	try {
		const { data, error } = await api.faces[faceId].unignore.post({
			personId,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error un-ignoring face:", error);
		throw error;
	}
};

// Settings & Storage
export const fetchSettings = async () => {
	try {
		const { data, error } = await api.settings.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching settings:", error);
		throw error;
	}
};

export const fetchUsage = async () => {
	try {
		const { data, error } = await api.usage.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching usage:", error);
		throw error;
	}
};

export const createStorageConfig = async (data: {
	provider: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	bucket?: string;
	endpoint?: string;
	region?: string;
	isActive?: boolean;
}) => {
	try {
		const { data: responseData, error } = await api.settings.storage.post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error creating storage config:", error);
		throw error;
	}
};

export const updateStorageConfig = async (
	configId: string,
	data: {
		provider?: string;
		accessKeyId?: string;
		secretAccessKey?: string;
		bucket?: string;
		endpoint?: string;
		region?: string;
		isActive?: boolean;
	},
) => {
	try {
		const { data: responseData, error } =
			await api.settings.storage[configId].put(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error updating storage config:", error);
		throw error;
	}
};

export const deleteStorageConfig = async (configId: string) => {
	try {
		const { data, error } = await api.settings.storage[configId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error deleting storage config:", error);
		throw error;
	}
};

export const getPresignedUrl = async (data: {
	fileName: string;
	contentType: string;
	albumId?: string;
	isMultipart?: boolean;
	uploadId?: string;
	partNumber?: number;
	key?: string;
}) => {
	try {
		const { data: responseData, error } =
			await api.images["presigned-url"].post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error getting presigned URL:", error);
		throw error;
	}
};

export const getPublicPresignedUrl = async (
	token: string,
	data: {
		fileName: string;
		contentType: string;
		isMultipart?: boolean;
		uploadId?: string;
		partNumber?: number;
		key?: string;
	},
) => {
	try {
		const { data: responseData, error } =
			await api.public.albums[token]["presigned-url"].post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error getting public presigned URL:", error);
		throw error;
	}
};

export const completeMultipartUpload = async (data: {
	albumId?: string;
	key: string;
	uploadId: string;
	parts: { ETag: string; PartNumber: number }[];
}) => {
	try {
		const { data: responseData, error } =
			await api.images["complete-multipart"].post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error completing multipart upload:", error);
		throw error;
	}
};

export const completePublicMultipartUpload = async (
	token: string,
	data: {
		key: string;
		uploadId: string;
		parts: { ETag: string; PartNumber: number }[];
	},
) => {
	try {
		const { data: responseData, error } = await api.public.images[
			"complete-multipart"
		].post({
			...data,
			shareToken: token,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error completing public multipart upload:", error);
		throw error;
	}
};

export const abortMultipartUpload = async (data: {
	albumId?: string;
	key: string;
	uploadId: string;
}) => {
	try {
		const { data: responseData, error } =
			await api.images["abort-multipart"].post(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error aborting multipart upload:", error);
		throw error;
	}
};

export const abortPublicMultipartUpload = async (
	token: string,
	data: {
		key: string;
		uploadId: string;
	},
) => {
	try {
		const { data: responseData, error } = await api.public.images[
			"abort-multipart"
		].post({
			...data,
			shareToken: token,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error aborting public multipart upload:", error);
		throw error;
	}
};

// Events & Guest Uploads
export const uploadGuestImages = async (token: string, formData: FormData) => {
	try {
		const response = await axiosAPI.post(
			`/public/albums/${token}/upload`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			},
		);
		return response.data;
	} catch (error) {
		console.error("Error uploading guest images:", error);
		throw error;
	}
};

export const editAlbumSettings = async (
	albumId: string,
	data: {
		albumName?: string;
		shareToken?: string | null;
		coverImageId?: string | null;
		storageConfigId?: string | null;
		settings?: any;
	},
) => {
	try {
		const { data: responseData, error } = await api.albums[albumId].put(data);
		if (error) throw new Error(error.value?.message || "Request failed");
		return responseData;
	} catch (error) {
		console.error("Error editing album settings:", error);
		throw error;
	}
};

export const moderateImages = async (
	albumId: string,
	imageIds: string[],
	status: "APPROVED" | "REJECTED",
	reason?: string,
) => {
	try {
		const { data, error } = await api.albums[albumId].moderate.post({
			imageIds,
			status,
			reason,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error moderating images:", error);
		throw error;
	}
};

export const generateInvite = async (
	albumId: string,
	role: string,
	_expiresInDays?: number,
) => {
	try {
		const { data, error } = await api.albums[albumId].invites.post({
			role,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error generating invite:", error);
		throw error;
	}
};

export const updateMemberRole = async (
	albumId: string,
	memberId: string,
	role: string,
) => {
	try {
		const { data, error } = await api.albums[albumId].members[memberId].patch({
			role,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error updating member role:", error);
		throw error;
	}
};

export const removeMember = async (albumId: string, memberId: string) => {
	try {
		const { data, error } =
			await api.albums[albumId].members[memberId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error removing member:", error);
		throw error;
	}
};

export const deleteInvite = async (albumId: string, memberId: string) => {
	try {
		const { data, error } =
			await api.albums[albumId].invites[memberId].delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error deleting invite:", error);
		throw error;
	}
};

export const resendInvite = async (albumId: string, memberId: string) => {
	try {
		const { data, error } =
			await api.albums[albumId].invites[memberId].resend.post();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error resending invite:", error);
		throw error;
	}
};

export const joinAlbum = async (inviteToken: string) => {
	try {
		const { data, error } = await api.albums.join.post({
			inviteToken,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error joining album:", error);
		throw error;
	}
};

export const fetchTrash = async () => {
	try {
		const { data, error } = await api.trash.get();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error fetching trash:", error);
		throw error;
	}
};

export const restoreImages = async (imageIds: string[]) => {
	try {
		const { data, error } = await api.trash.images.restore.post({
			imageIds,
		});
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error restoring images:", error);
		throw error;
	}
};

export const restoreAlbum = async (albumId: string) => {
	try {
		const { data, error } = await api.trash.albums[albumId].restore.post();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error restoring album:", error);
		throw error;
	}
};

export const permanentlyDeleteImages = async (imageIds: string[]) => {
	try {
		const { data, error } = await api.trash.images.delete({ imageIds });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error permanently deleting images:", error);
		throw error;
	}
};

export const permanentlyDeleteAlbums = async (albumIds: string[]) => {
	try {
		const { data, error } = await api.trash.albums.delete({ albumIds });
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error permanently deleting albums:", error);
		throw error;
	}
};

export const emptyTrash = async () => {
	try {
		const { data, error } = await api.trash.delete();
		if (error) throw new Error(error.value?.message || "Request failed");
		return data;
	} catch (error) {
		console.error("Error emptying trash:", error);
		throw error;
	}
};
