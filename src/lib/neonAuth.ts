// Neon Auth client for Google OAuth sign-in
// Docs: https://neon.com/docs/auth/overview
import { createAuthClient } from '@neondatabase/neon-js/auth';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!neonAuthUrl) {
  console.warn(
    '[Neon Auth] VITE_NEON_AUTH_URL is not set. Google sign-in via Neon Auth will not work.'
  );
}

export const neonAuthClient = neonAuthUrl
  ? createAuthClient(neonAuthUrl)
  : null;

/** Set before redirecting to Google — Login/Register only auto-consume Neon session when this is set. */
export const NEON_OAUTH_PENDING_KEY = 'neon_oauth_pending';
/** Set on logout so a leftover Neon cookie cannot silently re-authenticate. */
export const AUTH_LOGGED_OUT_KEY = 'auth_logged_out';

export function markNeonOAuthPending() {
  try {
    sessionStorage.setItem(NEON_OAUTH_PENDING_KEY, '1');
    sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasNeonOAuthPending(): boolean {
  try {
    return sessionStorage.getItem(NEON_OAUTH_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

/** Remove the pending flag (call after success or when giving up). */
export function clearNeonOAuthPending() {
  try {
    sessionStorage.removeItem(NEON_OAUTH_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated prefer hasNeonOAuthPending + clearNeonOAuthPending */
export function consumeNeonOAuthPending(): boolean {
  try {
    const pending = sessionStorage.getItem(NEON_OAUTH_PENDING_KEY) === '1';
    if (pending) sessionStorage.removeItem(NEON_OAUTH_PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}

export function markLoggedOut() {
  try {
    sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, '1');
    sessionStorage.removeItem(NEON_OAUTH_PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function clearLoggedOutFlag() {
  try {
    sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
  } catch {
    /* ignore */
  }
}

export function wasExplicitLogout(): boolean {
  try {
    return sessionStorage.getItem(AUTH_LOGGED_OUT_KEY) === '1';
  } catch {
    return false;
  }
}
