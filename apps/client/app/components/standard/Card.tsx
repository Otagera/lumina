import type { ReactNode } from "react";
import { cn } from "~/utils/cn";

interface CardProps {
	children: ReactNode;
	className?: string;
	onClick?: () => void;
	hoverable?: boolean;
}

export const Card = ({
	children,
	className,
	onClick,
	hoverable = true,
}: CardProps) => {
	return (
		<div
			onClick={onClick}
			className={cn(
				"relative overflow-hidden rounded-card bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300",
				hoverable &&
				"hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-zinc-950 hover:-translate-y-1 cursor-pointer",
				className,
			)}
		>
			{children}
		</div>
	);
};
