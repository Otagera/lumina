import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	hint?: string;
	icon?: React.ReactNode;
	trailing?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{ className, type, label, error, hint, icon, trailing, ...props },
		ref,
	) => {
		return (
			<div className="space-y-1.5 w-full">
				{label && (
					<label className="block text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
						{label}
					</label>
				)}
				<div className="relative">
					{icon && (
						<div className="absolute left-0.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
							{icon}
						</div>
					)}
					<input
						type={type}
						className={cn(
							"flex h-11 w-full border-0 border-b-2 bg-transparent px-0 py-2 text-base font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
							icon && "pl-9",
							trailing && "pr-9",
							error
								? "border-plum focus:border-plum"
								: "border-zinc-200 dark:border-zinc-800 focus:border-sage hover:border-zinc-300 dark:hover:border-zinc-700",
							className,
						)}
						ref={ref}
						{...props}
					/>
					{trailing && (
						<div className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400">
							{trailing}
						</div>
					)}
				</div>
				{hint && !error && (
					<p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{hint}</p>
				)}
				{error && <p className="text-xs text-plum dark:text-rose-300 font-bold">{error}</p>}
			</div>
		);
	},
);
Input.displayName = "Input";

export { Input };
