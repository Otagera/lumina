import { Link } from "react-router-dom";

const PRODUCT_LINKS = [
	{ label: "Features", to: "/" },
	{ label: "Pricing", to: "/" },
	{ label: "Try a demo", to: "/share/demo" },
];

const USE_CASE_LINKS = [
	{ label: "Weddings", to: "/share/demo" },
	{ label: "Parties", to: "/share/demo-party" },
	{ label: "Church & Media", to: "/share/demo-church" },
	{ label: "Conferences", to: "/signup" },
	{ label: "Schools", to: "/signup" },
];

const LEGAL_LINKS = [
	{ label: "Privacy Policy", to: "/privacy" },
	{ label: "Terms of Service", to: "/terms" },
];

const FooterCol = ({
	heading,
	links,
}: {
	heading: string;
	links: { label: string; to: string }[];
}) => (
	<div className="space-y-3">
		<p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
			{heading}
		</p>
		<ul className="space-y-2.5">
			{links.map((l) => (
				<li key={l.label}>
					<Link
						to={l.to}
						className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-sage dark:hover:text-sage transition-colors"
					>
						{l.label}
					</Link>
				</li>
			))}
		</ul>
	</div>
);

export const Footer = () => {
	return (
		<footer className="border-t border-zinc-200 dark:border-zinc-800">
			<div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 space-y-10">
				<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr_1fr]">
					<div className="space-y-4">
						<Link to="/" className="inline-flex items-center gap-2">
							<div className="w-7 h-7 bg-sage rounded-lg flex items-center justify-center shadow-md shadow-sage/20">
								<div className="w-2.5 h-2.5 bg-zinc-950 rounded-full" />
							</div>
							<span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white">
								lumina<span className="text-sage">.</span>io
							</span>
						</Link>
						<p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
							The AI photo platform for events. Collect, search, and share —
							effortlessly.
						</p>
					</div>
					<FooterCol heading="Product" links={PRODUCT_LINKS} />
					<FooterCol heading="Use Cases" links={USE_CASE_LINKS} />
					<FooterCol heading="Legal" links={LEGAL_LINKS} />
				</div>
				<div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
					<p className="text-xs text-zinc-400 dark:text-zinc-500">
						© {new Date().getFullYear()} Lumina. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
