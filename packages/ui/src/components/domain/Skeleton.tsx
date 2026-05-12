import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

export { Skeleton };

export const SkeletonText = ({ lines = 3 }: { lines?: number }) => {
	return (
		<div className="space-y-2">
			{Array.from({ length: lines }).map((_, i) => (
				<Skeleton
					key={`line-${i}`}
					className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
				/>
			))}
		</div>
	);
};

export const SkeletonCard = () => {
	return (
		<div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
			<div className="flex items-center gap-3">
				<Skeleton className="w-12 h-12 rounded-xl" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
			<Skeleton className="h-32 w-full rounded-xl" />
			<div className="flex gap-2">
				<Skeleton className="h-8 w-20 rounded-lg" />
				<Skeleton className="h-8 w-20 rounded-lg" />
			</div>
		</div>
	);
};

export const SkeletonImageGrid = ({ count = 8 }: { count?: number }) => {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={`img-${i}`} className="aspect-square rounded-xl" />
			))}
		</div>
	);
};

export const SkeletonButton = () => {
	return <Skeleton className="h-10 w-24 rounded-xl" />;
};

export const SkeletonInput = () => {
	return <Skeleton className="h-10 w-full rounded-xl" />;
};

export const SkeletonAvatar = ({
	size = "md",
}: {
	size?: "sm" | "md" | "lg";
}) => {
	const sizes = {
		sm: "w-8 h-8",
		md: "w-12 h-12",
		lg: "w-16 h-16",
	};
	return <Skeleton className={cn(sizes[size], "rounded-full")} />;
};
