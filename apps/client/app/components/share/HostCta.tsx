interface HostCtaProps {
	ctaUrl: string;
}

export const HostCta = ({ ctaUrl }: HostCtaProps) => (
	<section className="mx-0 rounded-card border border-sage/30 bg-gradient-to-br from-sage/15 to-rose-500/10 p-5 sm:p-6 text-left animate-in fade-in slide-in-from-bottom-2 duration-500 mt-8">
		<p className="text-[11px] uppercase tracking-widest font-black text-sage mb-2">For Event Creators</p>
		<h4 className="text-lg sm:text-xl font-black tracking-tight text-zinc-900 dark:text-white">Host your own event</h4>
		<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-md">
			Create a branded AI face-match gallery in minutes and share it with your guests.
		</p>
		<a
			href={ctaUrl}
			className="mt-4 inline-flex w-full sm:w-auto items-center justify-center rounded-control bg-sage px-5 py-3 text-sm font-bold text-zinc-950 hover:bg-sage/90 transition-colors focus-ring"
		>
			Host your own event
		</a>
	</section>
);
