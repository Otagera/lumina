import { useCallback, useEffect, useState } from "react";

export type OnboardingStep =
	| "welcome"
	| "create-album"
	| "share-qr"
	| "complete";

const STORAGE_KEY = "lumina:onboarding";
const LEGACY_KEY = "lumina:first-signup-guide";

const ORDER: OnboardingStep[] = [
	"welcome",
	"create-album",
	"share-qr",
	"complete",
];

interface OnboardingState {
	step: OnboardingStep;
	startedAt: number;
}

const readState = (): OnboardingState | null => {
	if (typeof window === "undefined") return null;
	// Migrate the legacy first-signup-guide flag (set by signup.tsx) into the
	// new multi-step state machine so existing in-flight signups still land
	// on the welcome step.
	const legacy = localStorage.getItem(LEGACY_KEY);
	if (legacy === "show") {
		const seeded: OnboardingState = { step: "welcome", startedAt: Date.now() };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
		localStorage.removeItem(LEGACY_KEY);
		return seeded;
	}
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as OnboardingState;
		if (!parsed?.step || !ORDER.includes(parsed.step)) return null;
		return parsed;
	} catch {
		return null;
	}
};

const writeState = (state: OnboardingState | null) => {
	if (typeof window === "undefined") return;
	if (!state) {
		localStorage.removeItem(STORAGE_KEY);
		return;
	}
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export interface UseOnboardingReturn {
	step: OnboardingStep | null;
	isActive: boolean;
	isStep: (s: OnboardingStep) => boolean;
	advance: (to?: OnboardingStep) => void;
	dismiss: () => void;
	restart: () => void;
}

/**
 * Cross-surface first-run journey state machine.
 *
 * Steps: welcome -> create-album -> share-qr -> complete. Progress is
 * persisted in localStorage so users can refresh or close the tab without
 * losing position. `dismiss()` short-circuits straight to complete; the
 * legacy `lumina:first-signup-guide` flag set by signup is auto-migrated
 * to the welcome step on first read.
 */
export const useOnboarding = (): UseOnboardingReturn => {
	const [state, setState] = useState<OnboardingState | null>(null);

	useEffect(() => {
		setState(readState());
	}, []);

	const advance = useCallback((to?: OnboardingStep) => {
		setState((prev) => {
			const current = prev?.step ?? "welcome";
			const fallbackIdx = Math.min(
				ORDER.indexOf(current) + 1,
				ORDER.length - 1,
			);
			const nextStep = to ?? ORDER[fallbackIdx];
			const updated: OnboardingState = {
				step: nextStep,
				startedAt: prev?.startedAt ?? Date.now(),
			};
			writeState(nextStep === "complete" ? null : updated);
			return nextStep === "complete" ? null : updated;
		});
	}, []);

	const dismiss = useCallback(() => {
		writeState(null);
		setState(null);
	}, []);

	const restart = useCallback(() => {
		const seeded: OnboardingState = { step: "welcome", startedAt: Date.now() };
		writeState(seeded);
		setState(seeded);
	}, []);

	return {
		step: state?.step ?? null,
		isActive: Boolean(state?.step) && state?.step !== "complete",
		isStep: (s: OnboardingStep) => state?.step === s,
		advance,
		dismiss,
		restart,
	};
};

export default useOnboarding;
