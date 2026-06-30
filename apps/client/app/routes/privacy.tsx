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

export default function PrivacyPage() {
	return (
		<div className="max-w-2xl mx-auto px-6 py-16 space-y-12">
			<div className="space-y-3">
				<Link to="/" className="text-xs font-bold text-sage hover:underline">← Back to Lumina</Link>
				<Heading level={1} className="text-4xl font-black text-zinc-900 dark:text-white">Privacy Policy</Heading>
				<p className="text-sm text-zinc-500 dark:text-zinc-400">Last updated: {new Date().getFullYear()}</p>
			</div>

			<Section title="What we collect">
				<p>When you create an account, we collect your email address and password (hashed). We do not collect your real name, phone number, or any payment information directly — payments are handled by our payment processor.</p>
				<p>When you upload photos, we store the image files and metadata (upload date, file size, album association). If you use face search, we compute a face vector from your selfie to match against album photos.</p>
			</Section>

			<Section title="Face data & biometrics">
				<p><strong className="text-zinc-900 dark:text-white">Selfies are never stored.</strong> When you submit a selfie for face search, a mathematical face vector is computed in memory and used immediately to search for matches. The selfie image and the vector are discarded at the end of the request — nothing is written to disk or retained in any database.</p>
				<p>Face vectors extracted from uploaded album photos are stored only to enable search functionality within that album. They are deleted when the image is deleted.</p>
				<p>We do not sell, license, or share biometric data with any third party.</p>
			</Section>

			<Section title="Data retention">
				<p><strong className="text-zinc-900 dark:text-white">Free tier:</strong> Images uploaded under a free plan expire after 14 days and are automatically deleted from our storage. This is not optional — it is enforced by a scheduled job that runs daily.</p>
				<p><strong className="text-zinc-900 dark:text-white">Paid plans:</strong> Images are retained until you delete them or close your account.</p>
				<p>Account data is deleted within 30 days of account deletion.</p>
			</Section>

			<Section title="Guest uploads">
				<p>Guests who upload photos via a shared QR code do not create an account. No email address is collected from guests. Guest uploads are associated with an anonymous session ID that expires after the event.</p>
			</Section>

			<Section title="GDPR (EU residents)">
				<p>If you are located in the European Economic Area, you have the right to access, correct, or delete your personal data at any time. You may also request a copy of the data we hold about you.</p>
				<p>To exercise these rights, contact us at the email below. We will respond within 30 days.</p>
			</Section>

			<Section title="BIPA (Illinois residents)">
				<p>Lumina does not sell, lease, trade, or profit from any biometric identifiers or biometric information. Biometric data (face vectors) derived from album photos are collected solely to provide the face search feature within that specific album and are not retained beyond the life of the image.</p>
			</Section>

			<Section title="Cookies & analytics">
				<p>We use session cookies to keep you logged in. We do not use third-party advertising cookies or cross-site tracking. Basic server-side usage metrics (storage consumed, compute units used) are logged to enforce plan limits.</p>
			</Section>

			<Section title="Contact">
				<p>Questions about your data? Email us at <a href="mailto:privacy@lumina.io" className="text-sage font-bold hover:underline">privacy@lumina.io</a>.</p>
			</Section>
		</div>
	);
}
