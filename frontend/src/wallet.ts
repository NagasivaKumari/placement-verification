import { PeraWalletConnect } from '@perawallet/connect';

export const peraWallet = new PeraWalletConnect();

// Prevent the SDK from opening a perawallet deep-link in a new blank tab on desktop.
// Intercept calls to window.open that target the perawallet scheme and instead
// surface the WalletConnect URI to the user (copied to clipboard) so they can
// open it on their phone or scan a QR. This avoids an about:blank tab when the
// OS/browser doesn't handle the custom scheme.
try {
	const _origOpen = window.open.bind(window);
	window.open = (url?: string | URL | undefined, target?: string, features?: string) => {
		try {
			const s = String(url || '');
			if (s.startsWith('perawallet-wc://') || s.startsWith('perawallet-wc:') || s.startsWith('perawallet://') || s.startsWith('perawallet:')) {
				// Extract raw walletconnect URI if present as a query param like wc?uri=ENCODED
				try {
					const u = new URL(s);
					const encoded = u.searchParams.get('uri') || u.searchParams.get('wc') || u.searchParams.get('uriEncoded');
					const wcUri = encoded ? decodeURIComponent(encoded) : s;
					// Copy to clipboard for easy mobile paste
					navigator.clipboard?.writeText(wcUri).catch(() => {});
					// Friendly alert to the user — avoid modal libraries here to keep minimal.
					alert('Pera deep-link detected. The WalletConnect URI has been copied to your clipboard. Open Pera Wallet on your phone and paste the URI or scan the QR.');
				} catch (e) {
					try { navigator.clipboard?.writeText(s).catch(() => {}); } catch {}
					alert('Pera deep-link detected. Please open this link on your mobile device. The link has been copied to your clipboard.');
				}
				// Return a harmless dummy Window-like object to satisfy callers expecting a Window.
				return {
					closed: true,
					close: () => {},
					focus: () => {},
					location: { href: '' }
				} as unknown as Window | null;
			}
		} catch (e) {
			// fall through to original open
		}
		return _origOpen(url as any, target, features);
	};
} catch (e) {
	// If overriding window.open fails (strict CSP), ignore and let SDK behave as-is.
	console.warn('Could not override window.open for perawallet deep-links', e);
}

// Try to restore any existing Pera session. Returns an array of accounts if restored.
export async function tryRestorePeraSession() {
	try {
		if (typeof peraWallet.reconnectSession === 'function') {
			const accounts = await peraWallet.reconnectSession();
			return accounts || [];
		}
	} catch (e) {
		// ignore; caller can decide to prompt connect
	}
	return [];
}

// Ensure we have an active session; if none, call connect() which will trigger the Pera flow (deep link / QR).
export async function ensurePeraConnected() {
	try {
		const restored = await tryRestorePeraSession();
		if (restored && restored.length > 0) return restored;
		// If no existing session, call connect (may open deep-link or QR on desktop)
		const newAccounts = await peraWallet.connect();
		return newAccounts || [];
	} catch (e) {
		throw e;
	}
}
