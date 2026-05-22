import type { DefaultToastOptions } from "react-hot-toast";

export const toastOptions: DefaultToastOptions = {
	style: {
		background: "oklch(20% 0.02 250 / 80%)",
		backdropFilter: "blur(20px) saturate(160%)",
		color: "#fff",
		border: "1px solid rgba(255,255,255,0.1)",
		borderRadius: "1.5rem",
		padding: "12px 20px",
		fontSize: "14px",
		fontWeight: "600",
		boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
	},
	success: {
		iconTheme: {
			primary: "oklch(58% 0.031 107.3)",
			secondary: "#fff",
		},
	},
	error: {
		iconTheme: {
			primary: "oklch(36.4% 0.029 323.89)",
			secondary: "#fff",
		},
	},
	loading: {
		iconTheme: {
			primary: "oklch(44.6% 0.043 257.281)",
			secondary: "#fff",
		},
	},
};

export const toastPositions = {
	topLeft: "top-left",
	topCenter: "top-center",
	topRight: "top-right",
	bottomLeft: "bottom-left",
	bottomCenter: "bottom-center",
	bottomRight: "bottom-right",
} as const;
