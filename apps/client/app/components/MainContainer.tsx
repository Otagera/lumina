import type React from "react";

interface MainContainerProps {
	children: React.ReactNode;
	className?: string;
	maxWidth?: string; // e.g. "max-w-7xl", "max-w-[1600px]", "container"
}

export const MainContainer: React.FC<MainContainerProps> = ({
	children,
	className = "",
	maxWidth = "max-w-6xl",
}) => {
	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 antialiased font-sans overflow-x-hidden">
			<div className={`${maxWidth} mx-auto px-5 sm:px-8 py-10 ${className}`}>
				{children}
			</div>
		</div>
	);
};
