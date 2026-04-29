import axios from "axios";

const getCurrentOrigin = () => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return "";
};

const rewriteImageUrls = (data: unknown, origin: string): unknown => {
	if (!origin || origin.includes("localhost")) return data;
	if (typeof data !== "object" || data === null) return data;

	const rewrite = (obj: unknown): unknown => {
		if (Array.isArray(obj)) {
			return obj.map(rewrite);
		}
		if (typeof obj === "object" && obj !== null) {
			const result: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(obj)) {
				if (
					(key === "coverImages" ||
						key === "imagePath" ||
						key === "url" ||
						key === "src") &&
					typeof value === "string" &&
					value.includes("localhost")
				) {
					result[key] = value.replace(/^http:\/\/localhost:\d+/, origin);
				} else if (key === "coverImages" && Array.isArray(value)) {
					result[key] = (value as string[]).map((url) =>
						url.includes("localhost")
							? url.replace(/^http:\/\/localhost:\d+/, origin)
							: url,
					);
				} else {
					result[key] = rewrite(value);
				}
			}
			return result;
		}
		return obj;
	};

	return rewrite(data);
};

// Create an Axios instance
const axiosAPI = axios.create({
	baseURL: "/api/v1",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Add a response interceptor (optional: to handle errors globally)
axiosAPI.interceptors.response.use(
	(response) => {
		const origin = getCurrentOrigin();
		if (origin && !origin.includes("localhost")) {
			response.data = rewriteImageUrls(response.data, origin);
		}
		return response;
	},
	(error) => {
		const status = error.response?.status;
		const message = error.response?.data?.message;

		if (status === 401 || message?.includes("jwt expired")) {
			if (typeof window !== "undefined") {
				const url = error.config?.url || "";
				const isLoginPage = window.location.pathname === "/login";
				const isAuthMe = url.includes("/auth/me");
				const isPublicEndpoint =
					url.includes("/public/") ||
					url.includes("/share/") ||
					url.includes("/join/");

				if (!isLoginPage && !isAuthMe && !isPublicEndpoint) {
					window.location.href = "/login";
				}
			}
		}

		if (status === 402) {
			if (typeof window !== "undefined") {
				window.dispatchEvent(new CustomEvent("quota-exceeded"));
				import("react-hot-toast").then(({ default: toast }) => {
					toast.error("Processing limit reached. Please upgrade your plan.", {
						id: "quota-limit-reached",
					});
				});
			}
		}

		console.error(
			"API Error:",
			error.response?.data || error.message,
			error.response?.data?.data,
		);
		return Promise.reject(error);
	},
);

export default axiosAPI;
