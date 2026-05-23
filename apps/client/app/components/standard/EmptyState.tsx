import type { ReactNode } from "react";
import { cn } from "~/utils/cn";
import { Heading } from "./Heading";

interface EmptyStateProps {
	title: string;
	description?: string;
	icon?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export const EmptyState = ({
	title,
	description,
	icon,
	action,
	className,
}: EmptyStateProps) => {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center py-24 px-6 text-center bg-zinc-50/50 dark:bg-zinc-900/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-modal animate-in fade-in duration-700",
				className,
			)}
		>
			<div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-tile shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-400 mb-8">
				{icon || (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-12 w-12 opacity-20"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				)}
			</div>
			<Heading level={2} className="mb-3 text-2xl md:text-3xl font-black">
				{title}
			</Heading>
			{description && (
				<p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
					{description}
				</p>
			)}
			{action && <div className="flex justify-center">{action}</div>}
		</div>
	);
};
