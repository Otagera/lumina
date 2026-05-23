import { X } from "lucide-react";
import { Heading } from "~/components/standard/Heading";

export const SearchLoadingState = () => (
	<div
		className="flex flex-col justify-center items-center py-32 gap-6"
		role="status"
		aria-live="polite"
	>
		<div className="relative w-16 h-16">
			<div className="absolute inset-0 border-[3px] border-sage/15 rounded-full" />
			<div className="absolute inset-0 border-[3px] border-sage border-t-transparent rounded-full animate-spin" />
		</div>
		<div className="text-center">
			<Heading level={2} className="mb-1 text-lg">
				Searching for matches
			</Heading>
			<p className="text-sm text-zinc-500 dark:text-zinc-400">
				This usually takes a few seconds.
			</p>
		</div>
	</div>
);

interface SearchErrorStateProps {
	message: string;
}

export const SearchErrorState = ({ message }: SearchErrorStateProps) => (
	<div
		className="bg-plum/5 dark:bg-rose-500/10 border border-plum/20 dark:border-rose-400/30 text-plum dark:text-rose-300 p-8 rounded-card flex flex-col items-center gap-4 text-center"
		role="alert"
	>
		<div className="p-3 bg-plum text-white rounded-control">
			<X size={20} strokeWidth={2.5} aria-hidden="true" />
		</div>
		<div>
			<Heading level={2} className="text-plum dark:text-rose-300 mb-1 text-lg">
				Couldn't load matches
			</Heading>
			<p className="text-sm text-plum/80 dark:text-rose-300/80">{message}</p>
		</div>
	</div>
);
