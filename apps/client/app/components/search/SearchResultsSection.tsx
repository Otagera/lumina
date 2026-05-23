import { ChevronDown, ChevronUp } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import { cn } from "~/utils/cn";

interface SearchResultsSectionProps {
	title: string;
	caption: string;
	count: number;
	markerColor: string;
	collapsible?: boolean;
	collapsed?: boolean;
	onToggle?: () => void;
	toggleLabel?: { collapsed: string; expanded: string };
	className?: string;
	children: ReactNode;
}

export const SearchResultsSection = ({
	title,
	caption,
	count,
	markerColor,
	collapsible = false,
	collapsed = false,
	onToggle,
	toggleLabel,
	className,
	children,
}: SearchResultsSectionProps) => {
	const panelId = useId();
	return (
		<section className={cn("space-y-6", className)}>
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="flex items-center gap-3">
					<span
						className={cn("w-1 h-7 rounded-full", markerColor)}
						aria-hidden="true"
					/>
					<div>
						<Heading level={2} className="text-lg">
							{title}
							<span className="ml-2 text-sm font-normal text-zinc-500 tabular-nums">
								{count}
							</span>
						</Heading>
						<span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-0.5">
							{caption}
						</span>
					</div>
				</div>
				{collapsible && onToggle && toggleLabel && (
					<Button
						variant="outline"
						size="sm"
						onClick={onToggle}
						aria-expanded={!collapsed}
						aria-controls={panelId}
					>
						{collapsed ? toggleLabel.collapsed : toggleLabel.expanded}
						{collapsed ? (
							<ChevronDown className="ml-1.5 w-4 h-4" aria-hidden="true" />
						) : (
							<ChevronUp className="ml-1.5 w-4 h-4" aria-hidden="true" />
						)}
					</Button>
				)}
			</div>
			{(!collapsible || !collapsed) && (
				<div id={panelId}>{children}</div>
			)}
		</section>
	);
};
