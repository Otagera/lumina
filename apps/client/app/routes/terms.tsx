import { Link } from "react-router-dom";
import { Heading } from "~/components/standard/Heading";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<div className="space-y-3">
		<Heading level={2} className="text-xl font-black text-zinc-900 dark:text-white">{title}</Heading>
		<div className="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-3 font-medium text-sm">
			{children}
		</div>
	</div>
);

export default function TermsPage() {
	return (
		<div className="max-w-2xl mx-auto px-6 py-16 space-y-12">
			<div className="space-y-3">
				<Link to="/" className="text-xs font-bold text-sage hover:underline">← Back to Lumina</Link>
				<Heading level={1} className="text-4xl font-black text-zinc-900 dark:text-white">Terms of Service</Heading>
				<p className="text-sm text-zinc-500 dark:text-zinc-400">Last updated: {new Date().getFullYear()}</p>
			</div>

			<Section title="Acceptance">
				<p>By creating an account or using Lumina, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
			</Section>

			<Section title="Your account">
				<p>You are responsible for maintaining the security of your account credentials. You must not share your account with others or use Lumina to impersonate any person.</p>
				<p>You must be at least 13 years old to create an account.</p>
			</Section>

			<Section title="Content you upload">
				<p>You retain ownership of any photos you upload. By uploading, you grant Lumina a limited license to store, display, and process your photos solely to provide the service — including face search and optimization.</p>
				<p>You must not upload content that is illegal, infringes on third-party rights, or depicts minors in any inappropriate way. We reserve the right to remove content that violates these terms.</p>
			</Section>

			<Section title="Guest uploads">
				<p>When you create a shared album and distribute a QR code, you are responsible for the content guests upload to your album. You agree to moderate your albums appropriately.</p>
			</Section>

			<Section title="Plan limits and fair use">
				<p>Free plan users are subject to storage and compute limits as described on the pricing page. Images on the free plan expire after 14 days. Exceeding plan limits will result in uploads being paused until the next billing period.</p>
			</Section>

			<Section title="Service availability">
				<p>Lumina is provided "as is." We do not guarantee 100% uptime. We are not liable for any loss of data or business resulting from service interruption.</p>
			</Section>

			<Section title="Termination">
				<p>You may delete your account at any time from the Settings page. We may suspend or terminate accounts that violate these terms.</p>
			</Section>

			<Section title="Contact">
				<p>Questions? Email <a href="mailto:hello@lumina.io" className="text-sage font-bold hover:underline">hello@lumina.io</a>.</p>
			</Section>
		</div>
	);
}
