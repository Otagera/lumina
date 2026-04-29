import axiosAPI from "./axios";

export const fetchImages = async ({
	pageParam = null,
}: {
	pageParam?: string | null;
} = {}) => {
	try {
		const url = pageParam
			? `/images?paginationType=cursor&limit=25&nextCursor=${pageParam}`
			: "/images?paginationType=cursor&limit=25";
		const response = await axiosAPI.get(url);
		return response.data;
	} catch (error) {
		console.error("Error fetching images:", error);
	}
};

export const fetchImage = async (imageId: string) => {
	try {
		const response = await axiosAPI.get(`/images/${imageId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching image:", error);
	}
};

export const uploadImages = async (formData: FormData) => {
	try {
		const albumId = formData.get("albumId");
		const uploadResponse = await axiosAPI.post("/images", formData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		const uploadResponseData = uploadResponse.data;

		if (albumId && albumId !== "undefined" && albumId !== "null") {
			await axiosAPI.post(`/albums/${albumId}/images`, {
				imageIds: uploadResponseData.data.images.map(
					(image: any) => image.imageId,
				),
			});
		}

		return uploadResponseData;
	} catch (error) {
		console.error("Error uploading images:", error);
		throw error;
	}
};

export const deleteImage = async (imageId: string) => {
	try {
		const response = await axiosAPI.delete(`/images/${imageId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting image:", error);
	}
};

export const fetchAlbums = async () => {
	try {
		const response = await axiosAPI.get("/albums");
		return response.data;
	} catch (error) {
		console.error("Error fetching albums:", error);
	}
};

export const fetchPlans = async () => {
	try {
		const response = await axiosAPI.get("/public/plans");
		return response.data;
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
}: {
	albumId: string;
	pageParam?: string | null;
	status?: "APPROVED" | "PENDING" | "REJECTED";
	startDate?: string;
	endDate?: string;
	uploaderId?: string;
}) => {
	try {
		let url = `/albums/${albumId}/images?paginationType=cursor&limit=25&status=${status}`;
		if (pageParam) url += `&nextCursor=${pageParam}`;
		if (startDate) url += `&startDate=${startDate}`;
		if (endDate) url += `&endDate=${endDate}`;
		if (uploaderId) url += `&uploaderId=${uploaderId}`;

		const response = await axiosAPI.get(url);
		return response.data;
	} catch (error) {
		console.error("Error fetching images in album:", error);
	}
};

export const fetchAlbum = async (albumId: string) => {
	try {
		const response = await axiosAPI.get(`/albums/${albumId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching album:", error);
	}
};

export const login = async (credentials: any) => {
	try {
		const response = await axiosAPI.post("/auth/login", credentials);
		return response.data;
	} catch (error) {
		console.error("Error logging in:", error);
		throw error;
	}
};

export const signup = async (credentials: any) => {
	try {
		const response = await axiosAPI.post("/auth/signup", credentials);
		return response.data;
	} catch (error) {
		console.error("Error signing up:", error);
		throw error;
	}
};

export const forgotPassword = async (email: string) => {
	try {
		const response = await axiosAPI.post("/auth/forgot-password", { email });
		return response.data;
	} catch (error) {
		console.error("Error sending forgot password link:", error);
		throw error;
	}
};

export const resetPassword = async (data: any) => {
	try {
		const response = await axiosAPI.post("/auth/reset-password", data);
		return response.data;
	} catch (error) {
		console.error("Error resetting password:", error);
		throw error;
	}
};

export const createAlbum = async (albumName: string) => {
	try {
		const response = await axiosAPI.post("/albums", { albumName });
		return response.data;
	} catch (error) {
		console.error("Error creating album:", error);
	}
};

export const editAlbum = async ({
	albumId,
	albumName,
	shareToken,
}: {
	albumId: string;
	albumName?: string;
	shareToken?: string | null;
}) => {
	try {
		const response = await axiosAPI.put(`/albums/${albumId}`, {
			albumName,
			shareToken,
		});
		return response.data;
	} catch (error) {
		console.error("Error editing album:", error);
	}
};

export const deleteAlbum = async (albumId: string) => {
	try {
		const response = await axiosAPI.delete(`/albums/${albumId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting album:", error);
	}
};

export const triggerClustering = async (albumId: string) => {
	try {
		const response = await axiosAPI.post(`/albums/${albumId}/cluster`);
		return response.data;
	} catch (error) {
		console.error("Error triggering clustering:", error);
		throw error;
	}
};

export const reprocessImage = async (imageId: string) => {
	try {
		const response = await axiosAPI.post(`/images/${imageId}/reprocess`);
		return response.data;
	} catch (error) {
		console.error("Error reprocessing image:", error);
		throw error;
	}
};

export const downloadImage = async (imageId: string) => {
	try {
		const response = await axiosAPI.post(`/images/${imageId}/download`);
		return response.data;
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
		const url = shareToken ? "/public/faces/search" : "/faces/search";
		const body = shareToken
			? { faceId, shareToken, threshold, limit }
			: { faceId, albumId, threshold, limit };

		const response = await axiosAPI.post(url, body);
		return response.data;
	} catch (error) {
		console.error("Error searching faces:", error);
	}
};

export const fetchSharedAlbum = async (token: string) => {
	try {
		const response = await axiosAPI.get(`/public/albums/${token}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching shared album:", error);
	}
};

export const fetchSharedImage = async (token: string, imageId: string) => {
	try {
		const response = await axiosAPI.get(`/public/images/${token}/${imageId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching shared image:", error);
	}
};

export const fetchPeople = async () => {
	try {
		const response = await axiosAPI.get("/people");
		return response.data;
	} catch (error) {
		console.error("Error fetching people:", error);
	}
};

export const createPerson = async (name: string) => {
	try {
		const response = await axiosAPI.post("/people", { name });
		return response.data;
	} catch (error) {
		console.error("Error creating person:", error);
	}
};

export const updatePerson = async (personId: string, name: string) => {
	try {
		const response = await axiosAPI.put(`/people/${personId}`, { name });
		return response.data;
	} catch (error) {
		console.error("Error updating person:", error);
	}
};

export const deletePerson = async (personId: string) => {
	try {
		const response = await axiosAPI.delete(`/people/${personId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting person:", error);
		throw error;
	}
};

export const updateFace = async (
	faceId: number,
	data: { personId: string | null },
) => {
	try {
		const response = await axiosAPI.patch(`/faces/${faceId}`, data);
		return response.data;
	} catch (error) {
		console.error("Error updating face:", error);
	}
};

export const ignoreFace = async (faceId: number, personId: string) => {
	try {
		const response = await axiosAPI.post(`/faces/${faceId}/ignore`, {
			personId,
		});
		return response.data;
	} catch (error) {
		console.error("Error ignoring face:", error);
		throw error;
	}
};

export const unignoreFace = async (faceId: number, personId: string) => {
	try {
		const response = await axiosAPI.post(`/faces/${faceId}/unignore`, {
			personId,
		});
		return response.data;
	} catch (error) {
		console.error("Error un-ignoring face:", error);
		throw error;
	}
};

// Settings & Storage
export const fetchSettings = async () => {
	try {
		const response = await axiosAPI.get("/settings");
		return response.data;
	} catch (error) {
		console.error("Error fetching settings:", error);
		throw error;
	}
};

export const fetchUsage = async () => {
	try {
		const response = await axiosAPI.get("/usage");
		return response.data;
	} catch (error) {
		console.error("Error fetching usage:", error);
		throw error;
	}
};

export const createStorageConfig = async (data: any) => {
	try {
		const response = await axiosAPI.post("/settings/storage", data);
		return response.data;
	} catch (error) {
		console.error("Error creating storage config:", error);
		throw error;
	}
};

export const updateStorageConfig = async (configId: string, data: any) => {
	try {
		const response = await axiosAPI.put(`/settings/storage/${configId}`, data);
		return response.data;
	} catch (error) {
		console.error("Error updating storage config:", error);
		throw error;
	}
};

export const deleteStorageConfig = async (configId: string) => {
	try {
		const response = await axiosAPI.delete(`/settings/storage/${configId}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting storage config:", error);
		throw error;
	}
};

export const getPresignedUrl = async (data: {
	fileName: string;
	contentType: string;
	albumId?: string;
}) => {
	try {
		const response = await axiosAPI.post("/images/presigned-url", data);
		return response.data;
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
		const response = await axiosAPI.post(
			`/public/albums/${token}/presigned-url`,
			data,
		);
		return response.data;
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
		const response = await axiosAPI.post("/images/complete-multipart", data);
		return response.data;
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
		const response = await axiosAPI.post(`/public/images/complete-multipart`, {
			...data,
			shareToken: token,
		});
		return response.data;
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
		const response = await axiosAPI.post("/images/abort-multipart", data);
		return response.data;
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
		const response = await axiosAPI.post(`/public/images/abort-multipart`, {
			...data,
			shareToken: token,
		});
		return response.data;
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
				headers: { "Content-Type": "multipart/form-data" },
			},
		);
		return response.data;
	} catch (error) {
		console.error("Error uploading guest images:", error);
		throw error;
	}
};

export const editAlbumSettings = async (albumId: string, data: any) => {
	try {
		console.log("Editing album with data:", data);
		const response = await axiosAPI.put(`/albums/${albumId}`, {
			...data,
		});
		return response.data;
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
		const response = await axiosAPI.post(`/albums/${albumId}/moderate`, {
			imageIds,
			status,
			reason,
		});
		return response.data;
	} catch (error) {
		console.error("Error moderating images:", error);
		throw error;
	}
};

export const generateInvite = async (
	albumId: string,
	role: string,
	expiresInDays?: number,
) => {
	try {
		const response = await axiosAPI.post(`/albums/${albumId}/invites`, {
			role,
			expiresInDays,
		});
		return response.data;
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
		const response = await axiosAPI.patch(
			`/albums/${albumId}/members/${memberId}`,
			{
				role,
			},
		);
		return response.data;
	} catch (error) {
		console.error("Error updating member role:", error);
		throw error;
	}
};

export const removeMember = async (albumId: string, memberId: string) => {
	try {
		const response = await axiosAPI.delete(
			`/albums/${albumId}/members/${memberId}`,
		);
		return response.data;
	} catch (error) {
		console.error("Error removing member:", error);
		throw error;
	}
};

export const deleteInvite = async (albumId: string, memberId: string) => {
	try {
		const response = await axiosAPI.delete(
			`/albums/${albumId}/invites/${memberId}`,
		);
		return response.data;
	} catch (error) {
		console.error("Error deleting invite:", error);
		throw error;
	}
};

export const resendInvite = async (albumId: string, memberId: string) => {
	try {
		const response = await axiosAPI.post(
			`/albums/${albumId}/invites/${memberId}/resend`,
		);
		return response.data;
	} catch (error) {
		console.error("Error resending invite:", error);
		throw error;
	}
};

export const joinAlbum = async (inviteToken: string) => {
	try {
		const response = await axiosAPI.post("/albums/join", {
			inviteToken,
		});
		return response.data;
	} catch (error) {
		console.error("Error joining album:", error);
		throw error;
	}
};

export const fetchTrash = async () => {
	try {
		const response = await axiosAPI.get("/trash");
		return response.data;
	} catch (error) {
		console.error("Error fetching trash:", error);
		throw error;
	}
};

export const restoreImages = async (imageIds: string[]) => {
	try {
		const response = await axiosAPI.post("/trash/images/restore", {
			imageIds,
		});
		return response.data;
	} catch (error) {
		console.error("Error restoring images:", error);
		throw error;
	}
};

export const restoreAlbum = async (albumId: string) => {
	try {
		const response = await axiosAPI.post(`/trash/albums/${albumId}/restore`);
		return response.data;
	} catch (error) {
		console.error("Error restoring album:", error);
		throw error;
	}
};

export const permanentlyDeleteImages = async (imageIds: string[]) => {
	try {
		const response = await axiosAPI.delete("/trash/images", {
			data: { imageIds },
		});
		return response.data;
	} catch (error) {
		console.error("Error permanently deleting images:", error);
		throw error;
	}
};

export const permanentlyDeleteAlbums = async (albumIds: string[]) => {
	try {
		const response = await axiosAPI.delete("/trash/albums", {
			data: { albumIds },
		});
		return response.data;
	} catch (error) {
		console.error("Error permanently deleting albums:", error);
		throw error;
	}
};

export const emptyTrash = async () => {
	try {
		const response = await axiosAPI.delete("/trash");
		return response.data;
	} catch (error) {
		console.error("Error emptying trash:", error);
		throw error;
	}
};
