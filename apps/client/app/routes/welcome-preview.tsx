import { useState } from "react";
import {
	EmptyStateBigGuided,
	EmptyStateIllustrated,
	EmptyStateInlineStrip,
} from "~/components/welcome-preview/EmptyStateVariants";
import {
	HeroCollage,
	HeroEditorial,
	HeroSoftSerif,
} from "~/components/welcome-preview/HeroVariants";
import {
	QrBigButton,
	QrInputIntegrated,
	QrTabSwitcher,
} from "~/components/welcome-preview/GuestQrVariants";
import {
	HeartBottomLeftPill,
	HeartGradientFooter,
	HeartOutsideAction,
	HeartTopRightFloat,
} from "~/components/welcome-preview/ReactionVariants";
import {
	SurfaceGlassCard,
	SurfaceGlassRaised,
	SurfaceGlassTile,
	SurfaceSolidCard,
} from "~/components/welcome-preview/SurfaceVariants";
import {
	SharePageCurrent,
	SharePageGlassHero,
	SharePageMagazine,
} from "~/components/welcome-preview/SharePageVariants";
import {
	ConfidenceBadgeVariant,
	FaceStripVariant,
	HiFiCombinedVariant,
	LiveCounterVariant,
} from "~/components/welcome-preview/HighFidelityVariants";
import { MainContainer } from "~/components/MainContainer";

type Stream =
	| "hero"
	| "empty"
	| "guest"
	| "reaction"
	| "surfaces"
	| "share"
	| "hifi";

const STREAMS: { id: Stream; label: string; tagline: string }[] = [
	{
		id: "hero",
		label: "Public hero",
		tagline:
			"Marketing landing page (apps/client/app/welcome/Welcome.tsx). Three treatments for the above-the-fold.",
	},
	{
		id: "empty",
		label: "Admin empty state",
		tagline:
			"Dashboard when albums.length === 0 (apps/client/app/routes/home.tsx). Three onboarding patterns.",
	},
	{
		id: "guest",
		label: "Guest QR landing",
		tagline:
			"Guest PWA landing (apps/app/app/routes/home.tsx). Three QR-scan placements.",
	},
	{
		id: "reaction",
		label: "Reaction placement",
		tagline:
			"Guest gallery tile (packages/ui/.../ImageGridItem.tsx). Four heart placements on the same image.",
	},
	{
		id: "surfaces",
		label: "Card surfaces",
		tagline:
			"Phase 1 — propagating the LivePreview glass language. Four treatments of the same album row to pick a baseline for the rest of the dashboard.",
	},
	{
		id: "share",
		label: "Share page",
		tagline:
			"Phase 2 — what /share/<token> looks like when a guest lands. Today's plain header vs. two upgraded layouts that match LivePreview.",
	},
	{
		id: "hifi",
		label: "Hi-fi elements",
		tagline:
			"Phase 3 — high-fidelity LivePreview add-ons that need real data backing. Each variant notes its API requirement.",
	},
];

export default function WelcomePreview() {
	const [stream, setStream] = useState<Stream>("hero");

	return (
		<MainContainer maxWidth="max-w-[1400px]">
			<header className="mb-10">
				<p className="text-xs font-black uppercase tracking-widest text-sage mb-2">
					Dev only · /welcome-preview
				</p>
				<h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-3">
					Welcome onboarding mocks
				</h1>
				<p className="text-zinc-500 dark:text-zinc-400 max-w-2xl">
					Side-by-side variants for the three onboarding surfaces. Pick the
					ones that feel right and we'll ship them into the real routes.
				</p>
				<div className="flex flex-wrap gap-2 mt-6">
					{STREAMS.map((s) => (
						<button
							key={s.id}
							type="button"
							onClick={() => setStream(s.id)}
							aria-pressed={stream === s.id}
							className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-colors ${stream === s.id
								? "bg-sage text-zinc-950 border-sage"
								: "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700"
								}`}
						>
							{s.label}
						</button>
					))}
				</div>
				<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 max-w-2xl">
					{STREAMS.find((s) => s.id === stream)?.tagline}
				</p>
			</header>

			{stream === "hero" && (
				<div className="space-y-8">
					<HeroEditorial />
					<HeroSoftSerif />
					<HeroCollage />
				</div>
			)}

			{stream === "empty" && (
				<div className="space-y-12">
					<VariantBlock
						label="A · Big guided card"
						note="Replaces the empty album grid with a 3-step playbook. Highest hand-holding."
					>
						<EmptyStateBigGuided />
					</VariantBlock>
					<VariantBlock
						label="B · Inline strip + skeleton grid"
						note="Non-blocking banner above the empty grid. Dismissible. Lowest friction."
					>
						<EmptyStateInlineStrip />
					</VariantBlock>
					<VariantBlock
						label="C · Illustrated empty state"
						note="Classic single-CTA pattern. Cleanest visually, least guidance."
					>
						<EmptyStateIllustrated />
					</VariantBlock>
				</div>
			)}

			{stream === "guest" && (
				<div className="grid gap-8 md:grid-cols-3">
					<VariantBlock
						label="A · Big scan button"
						note="QR as an equal-weight secondary action below the link input."
					>
						<QrBigButton />
					</VariantBlock>
					<VariantBlock
						label="B · Icon inside input"
						note="Single field, scanner accessible via trailing icon. Most compact."
					>
						<QrInputIntegrated />
					</VariantBlock>
					<VariantBlock
						label="C · Tab switcher"
						note="Equal billing for both paths. Best if QR is the primary expected flow."
					>
						<QrTabSwitcher />
					</VariantBlock>
				</div>
			)}

			{stream === "reaction" && (
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
					<VariantBlock
						label="A · Bottom-left pill (current)"
						note="Heart + count in a translucent pill. Hidden on hover-capable devices until hover; always visible on touch."
					>
						<HeartBottomLeftPill />
					</VariantBlock>
					<VariantBlock
						label="B · Top-right floating"
						note="Round icon button with a small count badge. Always visible, less photo coverage."
					>
						<HeartTopRightFloat />
					</VariantBlock>
					<VariantBlock
						label="C · Gradient footer"
						note="Bottom gradient frames the heart + count. Highest visual weight, best for hero tiles."
					>
						<HeartGradientFooter />
					</VariantBlock>
					<VariantBlock
						label="D · Outside the tile"
						note="Action row below the image. Zero overlay on the photo; closer to social-feed pattern."
					>
						<HeartOutsideAction />
					</VariantBlock>
				</div>
			)}

			{stream === "surfaces" && (
				<div className="grid gap-8 sm:grid-cols-2">
					<VariantBlock
						label="A · Solid card (current baseline)"
						note="What most dashboard cards use today. Opaque, soft shadow, hard border. Doesn't carry LivePreview's design language."
					>
						<SurfaceSolidCard />
					</VariantBlock>
					<VariantBlock
						label="B · Glass card"
						note="Translucent + backdrop-blur, rounded-card. Drop-in replacement for solid cards. Inherits LivePreview's feel without changing radius scale."
					>
						<SurfaceGlassCard />
					</VariantBlock>
					<VariantBlock
						label="C · Glass raised"
						note="Glass + elevated shadow + subtle top-edge highlight. For cards that need to feel 'lifted' (modals, primary CTAs, hero stats)."
					>
						<SurfaceGlassRaised />
					</VariantBlock>
					<VariantBlock
						label="D · Glass tile (LivePreview parity)"
						note="Exact match to the LivePreview wrapper: rounded-tile, no shadow, larger padding. Use for hero surfaces only."
					>
						<SurfaceGlassTile />
					</VariantBlock>
				</div>
			)}

			{stream === "share" && (
				<div className="space-y-12">
					<VariantBlock
						label="A · Current (header bar + flat grid)"
						note="Recap of today's /share/<token>. Plain row above a flush photo grid. Visually disconnected from LivePreview."
					>
						<SharePageCurrent />
					</VariantBlock>
					<VariantBlock
						label="B · Glass hero + grid"
						note="Top hero card mirrors LivePreview's tile (QR, stats, two-CTA). Photo grid below stays standard. Lowest-effort upgrade."
					>
						<SharePageGlassHero />
					</VariantBlock>
					<VariantBlock
						label="C · Magazine"
						note="Full-bleed cover image with overlay text. Highest visual impact; relies on a quality cover photo existing on the album."
					>
						<SharePageMagazine />
					</VariantBlock>
				</div>
			)}

			{stream === "hifi" && (
				<div className="space-y-10">
					<VariantBlock
						label="A · Face strip"
						note="Avatar cluster + caption. Needs a public guest-avatar endpoint on shared albums (currently avatars are gated behind auth)."
					>
						<FaceStripVariant />
					</VariantBlock>
					<VariantBlock
						label="B · Confidence badge"
						note="Pill overlay on photo tiles. Score is already returned by the face-search response — just not surfaced in any UI today."
					>
						<div className="max-w-xs">
							<ConfidenceBadgeVariant />
						</div>
					</VariantBlock>
					<VariantBlock
						label="C · Live counter"
						note="Animated count-up with progress bar. Needs an aggregate /albums/:id/stats endpoint (cheap) or websocket (richer)."
					>
						<LiveCounterVariant />
					</VariantBlock>
					<VariantBlock
						label="D · Combined showcase"
						note="All three on a single panel. Closest preview of what LivePreview could look like post-Phase 3, with real data."
					>
						<HiFiCombinedVariant />
					</VariantBlock>
				</div>
			)}
		</MainContainer>
	);
}

function VariantBlock({
	label,
	note,
	children,
}: {
	label: string;
	note: string;
	children: React.ReactNode;
}) {
	return (
		<section className="space-y-3">
			<div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
				<h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white">
					{label}
				</h2>
				<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{note}</p>
			</div>
			{children}
		</section>
	);
}
