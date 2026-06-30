import type { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import {
	LayoutDashboard,
	Users,
	CreditCard,
	ShieldCheck,
	Activity,
	ChevronLeft,
} from "lucide-react";
import { useAuth } from "../../utils/auth";

const navItems = [
	{ to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
	{ to: "/admin/users", label: "Users", icon: Users, end: false },
	{ to: "/admin/plans", label: "Plans", icon: CreditCard, end: false },
	{ to: "/admin/moderation", label: "Moderation", icon: ShieldCheck, end: false },
	{ to: "/admin/queues", label: "Queues", icon: Activity, end: false },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
	`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
		isActive
			? "bg-sage/10 text-sage"
			: "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
	}`;

export default function AdminLayout({ children }: { children: ReactNode }) {
	const { user, isSuperAdmin } = useAuth();

	return (
		<div className="flex min-h-[calc(100vh-57px)] w-full">
			{/* Sidebar */}
			<aside className="hidden md:flex w-64 flex-col shrink-0 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-900 p-4">
				<div className="mb-6">
					<Link
						to="/home"
						className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4"
					>
						<ChevronLeft size={14} />
						Back to app
					</Link>
					<p className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
						Admin
					</p>
				</div>

				<nav className="flex-1 space-y-1">
					{navItems.map(({ to, label, icon: Icon, end }) => (
						<NavLink key={to} to={to} end={end} className={navClass}>
							<Icon size={16} />
							{label}
						</NavLink>
					))}
				</nav>

				<div className="mt-6 pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
					<p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 truncate">
						{user?.email}
					</p>
					<span
						className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
							isSuperAdmin
								? "bg-plum/10 text-plum dark:bg-rose-500/15 dark:text-rose-300"
								: "bg-sage/10 text-sage"
						}`}
					>
						{isSuperAdmin ? "Super Admin" : "Admin"}
					</span>
				</div>
			</aside>

			{/* Main content */}
			<div className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-950">
				{children}
			</div>
		</div>
	);
}
