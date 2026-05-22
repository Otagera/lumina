/**
 * Extract an event token from a pasted link, raw token, or QR payload.
 *
 * Accepted shapes:
 *   - https://anoda.app/e/abc123
 *   - anoda.app/e/abc123
 *   - /e/abc123
 *   - e/abc123
 *   - abc123  (raw token form)
 *
 * Returns null when the input cannot be coerced into a plausible token.
 */
export const parseEventToken = (raw: string): string | null => {
	const value = raw.trim();
	if (!value) return null;

	try {
		const normalized = value.startsWith("http")
			? value
			: `https://${value.replace(/^\/+/, "")}`;
		const url = new URL(normalized);
		const pathToken = url.pathname.match(/\/e\/([^/?#]+)/)?.[1];
		if (pathToken) return pathToken;
	} catch {
		// fall through to raw-token handling
	}

	const stripped = value.replace(/^\/?e\//, "").trim();
	if (/^[A-Za-z0-9_-]{6,}$/.test(stripped)) return stripped;
	return null;
};
