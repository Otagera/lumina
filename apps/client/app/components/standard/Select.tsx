import type { ReactNode, SelectHTMLAttributes } from "react";

interface SelectOption {
	value: string;
	label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	label?: string;
	error?: string;
	options: SelectOption[];
	placeholder?: string;
}

export const Select = ({
	label,
	error,
	options,
	placeholder,
	className = "",
	...props
}: SelectProps) => {
	return (
		<div className="space-y-1">
			{label && (
				<label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
					{label}
				</label>
			)}
			<select
				className={`
					w-full px-4 py-2.5 rounded-control border bg-white dark:bg-zinc-900
					text-sm font-medium text-zinc-900 dark:text-white
					focus-ring
					transition-all duration-200
					disabled:opacity-50 disabled:cursor-not-allowed
					${error ? "border-plum focus:ring-plum" : "border-zinc-200 dark:border-zinc-700"}
					${className}
				`}
				{...props}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && <p className="text-xs text-plum dark:text-rose-300 font-medium">{error}</p>}
		</div>
	);
};
