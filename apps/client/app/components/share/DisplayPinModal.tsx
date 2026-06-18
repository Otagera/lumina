import { useRef, useState } from "react";
import { Modal } from "../standard/Modal";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onVerify: (pin: string) => Promise<boolean>;
}

export function DisplayPinModal({ isOpen, onClose, onVerify }: Props) {
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (pin.length !== 4) {
			setError("Enter a 4-digit PIN");
			return;
		}
		setIsLoading(true);
		setError("");
		try {
			const valid = await onVerify(pin);
			if (!valid) {
				setError("Incorrect PIN. Try again.");
				setPin("");
				inputRef.current?.focus();
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Live Display">
			<form onSubmit={handleSubmit} className="space-y-4 pt-2">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					Enter the 4-digit PIN to start the live display.
				</p>
				<input
					ref={inputRef}
					type="text"
					inputMode="numeric"
					pattern="[0-9]*"
					maxLength={4}
					value={pin}
					onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
					placeholder="0000"
					className="w-full text-center text-3xl font-black tracking-[0.5em] border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 bg-transparent focus:outline-none focus:ring-2 focus:ring-sage"
					autoFocus
				/>
				{error && <p className="text-xs text-red-500 text-center font-bold">{error}</p>}
				<button
					type="submit"
					disabled={isLoading || pin.length !== 4}
					className="w-full py-3 rounded-xl font-bold text-sm bg-sage text-white disabled:opacity-50 transition-all active:scale-95"
				>
					{isLoading ? "Verifying..." : "Start Live Display"}
				</button>
			</form>
		</Modal>
	);
}
