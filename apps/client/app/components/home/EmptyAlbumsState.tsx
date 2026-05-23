import { ArrowRight, ImagePlus, QrCode, Sparkles } from "lucide-react";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";

interface EmptyAlbumsStateProps {
	onCreateAlbum: () => void;
}

const STEPS = [
	{
		icon: <ImagePlus className="w-5 h-5" />,
		title: "Create your first album",
		body: "Name it, then we'll set it up for photos in one click.",
	},
	{
		icon: <Sparkles className="w-5 h-5" />,
		title: "Make it an event",
		body: "Flip the Event toggle so guests can contribute too.",
	},
	{
		icon: <QrCode className="w-5 h-5" />,
		title: "Share the QR code",
		body: "Print, share, or AirDrop it. Guests upload without accounts.",
	},
];

export const EmptyAlbumsState = ({ onCreateAlbum }: EmptyAlbumsStateProps) => {
	return (
		<div className="space-y-8">
			{/* Big guided card */}
			<section className="rounded-tile border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 p-8 md:p-10">
				<div className="max-w-2xl mx-auto text-center mb-8">
					<div className="inline-flex h-12 w-12 items-center justify-center rounded-card bg-sage/15 text-sage mb-4">
						<Sparkles className="w-6 h-6" />
					</div>
					<Heading
						level={3}
						className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-2"
					>
						Let's get your first event live
					</Heading>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
						Three quick steps and your guests can start uploading photos.
					</p>
				</div>
				<ol className="grid gap-4 md:grid-cols-3">
					{STEPS.map((s, i) => (
						<li
							key={s.title}
							className="rounded-card border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3"
						>
							<div className="flex items-center gap-2">
								<span
									aria-hidden="true"
									className="w-6 h-6 rounded-full bg-sage text-zinc-950 text-xs font-black flex items-center justify-center"
								>
									{i + 1}
								</span>
								<span className="text-sage">{s.icon}</span>
							</div>
							<h4 className="font-bold text-zinc-900 dark:text-white">
								{s.title}
							</h4>
							<p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
								{s.body}
							</p>
						</li>
					))}
				</ol>
			</section>

			{/* Illustrated empty state with primary CTA */}
			<section className="rounded-tile border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 md:p-12 text-center">
				<div className="relative mx-auto w-32 h-32 mb-6">
					<div
						aria-hidden="true"
						className="absolute inset-0 rounded-tile bg-sage/10 rotate-6"
					/>
					<div
						aria-hidden="true"
						className="absolute inset-0 rounded-tile bg-plum/10 -rotate-6"
					/>
					<div className="absolute inset-0 rounded-tile bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
						<ImagePlus className="w-12 h-12 text-zinc-400" />
					</div>
				</div>
				<Heading
					level={3}
					className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mb-2"
				>
					No albums yet
				</Heading>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-6">
					Albums are buckets for photos. Make one into an event and your
					guests can contribute too.
				</p>
				<Button
					size="lg"
					onClick={onCreateAlbum}
					className="font-black uppercase tracking-widest text-xs shadow-lg shadow-sage/20"
				>
					+ Create your first album <ArrowRight className="w-4 h-4 ml-1.5" />
				</Button>
			</section>
		</div>
	);
};

export default EmptyAlbumsState;
