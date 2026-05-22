import { HardDrive, QrCode, Search, Sparkles, Users } from "lucide-react";
import { Button } from "~/components/standard/Button";
import { Heading } from "~/components/standard/Heading";
import { Modal } from "~/components/standard/Modal";

interface WelcomeTourModalProps {
	open: boolean;
	onStart: () => void;
	onDismiss: () => void;
}

const HIGHLIGHTS = [
	{
		icon: <Users className="h-5 w-5 text-sage" />,
		title: "Create Events",
		description: "Turn any album into a collaborative event in settings.",
	},
	{
		icon: <QrCode className="h-5 w-5 text-sage" />,
		title: "Share QR Codes",
		description: "Let guests upload photos directly without an account.",
	},
	{
		icon: <HardDrive className="h-5 w-5 text-plum dark:text-rose-300" />,
		title: "Own Your Storage",
		description: "Add your own S3/R2 bucket anytime in Settings.",
	},
	{
		icon: <Search className="h-5 w-5 text-terracotta" />,
		title: "AI Face Search",
		description: "Instantly find matching faces across guest uploads.",
	},
];

export const WelcomeTourModal = ({
	open,
	onStart,
	onDismiss,
}: WelcomeTourModalProps) => {
	return (
		<Modal isOpen={open} onClose={onDismiss} className="max-w-2xl">
			<div className="mb-10 text-center">
				<div className="inline-flex h-12 w-12 items-center justify-center rounded-control bg-sage/10 text-sage mb-4">
					<Sparkles size={24} />
				</div>
				<Heading level={2} className="text-3xl font-black mb-2">
					Welcome to the Intelligence Layer
				</Heading>
				<p className="text-zinc-500 dark:text-zinc-400 font-medium">
					Lumina is ready. Here's how to get the most value.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				{HIGHLIGHTS.map((item) => (
					<div
						key={item.title}
						className="rounded-card border border-zinc-100 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-950/50 transition-all hover:border-sage/30 group"
					>
						<div className="mb-3">{item.icon}</div>
						<p className="font-bold text-zinc-900 dark:text-white group-hover:text-sage transition-colors">
							{item.title}
						</p>
						<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
							{item.description}
						</p>
					</div>
				))}
			</div>

			<div className="mt-10 flex flex-col-reverse sm:flex-row gap-3 justify-center">
				<Button
					variant="ghost"
					className="rounded-control font-bold"
					onClick={onDismiss}
				>
					Skip tour
				</Button>
				<Button
					onClick={onStart}
					className="rounded-control px-10 py-6 font-black uppercase tracking-widest text-xs shadow-xl shadow-sage/20"
				>
					Start the tour
				</Button>
			</div>
		</Modal>
	);
};

export default WelcomeTourModal;
