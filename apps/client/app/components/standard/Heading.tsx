import type { ElementType, ReactNode } from "react";
import { cn } from "~/utils/cn";

interface HeadingProps {
	level?: 1 | 2 | 3 | 4;
	children: ReactNode;
	className?: string;
}

export const Heading = ({ level = 2, children, className }: HeadingProps) => {
	const Tag = `h${level}` as ElementType;

	const styles = {
		1: "text-3xl md:text-4xl font-black tracking-tight",
		2: "text-xl md:text-2xl font-semibold tracking-tight",
		3: "text-lg md:text-xl font-medium tracking-tight",
		4: "text-base md:text-lg font-medium",
	};

	return (
		<Tag
			className={cn(
				"text-zinc-900 dark:text-zinc-50",
				styles[level],
				className,
			)}
		>
			{children}
		</Tag>
	);
};
