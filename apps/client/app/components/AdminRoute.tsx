import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../utils/auth";
import AdminLayout from "./admin/AdminLayout";

const AdminRoute = () => {
	const { isAuthenticated, isInitialized, isAdmin } = useAuth();

	if (!isInitialized) {
		return (
			<div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
				<div className="hidden md:flex w-64 flex-col border-r border-zinc-200/50 dark:border-zinc-800/50 p-6 space-y-8 animate-pulse">
					<div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
					<div className="space-y-4">
						<div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
						{[...Array(5)].map((_, i) => (
							<div key={i} className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
						))}
					</div>
				</div>
				<div className="flex-1 flex flex-col p-6 md:p-12 space-y-8 animate-pulse">
					<div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						{[...Array(6)].map((_, i) => (
							<div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
						))}
					</div>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) return <Navigate to="/login" replace />;
	if (!isAdmin) return <Navigate to="/home" replace />;

	return (
		<AdminLayout>
			<Outlet />
		</AdminLayout>
	);
};

export default AdminRoute;
