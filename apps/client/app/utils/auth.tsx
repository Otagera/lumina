import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { login as apiLogin, signup as apiSignup } from "./api";
import { api } from "./eden";

interface User {
	id: string;
	email: string;
	planName?: string;
	role?: "USER" | "ADMIN" | "SUPER_ADMIN";
}

interface AuthContextType {
	user: User | null;
	login: (credentials: { email: string; password: string }) => Promise<void>;
	signup: (credentials: { email: string; password: string }) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
	isInitialized: boolean;
	isAdmin: boolean;
	isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const authCheckRef = useRef(false);

	useEffect(() => {
		const checkAuth = async () => {
			if (authCheckRef.current) return;
			authCheckRef.current = true;

			try {
				const { data, error } = await api.auth.me.get();
				if (!error && data?.status === "completed" && data?.data) {
					setUser(data.data as User);
				}
			} catch (error) {
				setUser(null);
			} finally {
				authCheckRef.current = false;
				setIsInitialized(true);
			}
		};

		if (!isInitialized) {
			checkAuth();
		}
	}, [isInitialized]);

	const login = async (credentials: { email: string; password: string }) => {
		try {
			const response = await apiLogin(credentials);

			if (response?.status === "completed" && response?.data) {
				setUser(response.data);
			} else {
				throw new Error("Login failed");
			}
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || error.message || "Login failed",
			);
		}
	};

	const signup = async (credentials: { email: string; password: string }) => {
		try {
			const response = await apiSignup(credentials);
			if (response?.status === "completed" && response?.data) {
				setUser(response.data);
			} else {
				throw new Error("Signup failed");
			}
		} catch (error: any) {
			throw new Error(
				error.response?.data?.message || error.message || "Signup failed",
			);
		}
	};

	const logout = async () => {
		try {
			await api.auth.logout.post();
		} catch (error) {
			console.error("Logout failed", error);
		} finally {
			setUser(null);
		}
	};

	const isAuthenticated = !!user;
	const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
	const isSuperAdmin = user?.role === "SUPER_ADMIN";

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				signup,
				logout,
				isAuthenticated,
				isInitialized,
				isAdmin,
				isSuperAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
