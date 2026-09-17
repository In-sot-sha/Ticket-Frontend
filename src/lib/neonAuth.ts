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

const isJwt = (value: unknown): value is string =>
  typeof value === 'string' && value.split('.').length === 3;

type NeonSessionBag = {
  token?: unknown;
  access_token?: unknown;
  accessToken?: unknown;
};

/**
 * Neon stores the JWKS-verifiable JWT on access_token (or via GET /token).
 * session.token is often an opaque Better Auth cookie value and will fail backend verify.
 */
export async function getNeonJwt(
  client: NonNullable<typeof neonAuthClient>
): Promise<string | null> {
  const result = await client.getSession();
  const session = result.data?.session as NeonSessionBag | undefined;
  if (!session) return null;

  for (const candidate of [session.access_token, session.accessToken, session.token]) {
    if (isJwt(candidate)) return candidate;
  }

  const tokenFn = (client as { token?: () => Promise<{ data?: { token?: string } }> }).token;
  if (typeof tokenFn === 'function') {
    try {
      const tokenRes = await tokenFn();
      const jwt = tokenRes?.data?.token;
      if (isJwt(jwt)) return jwt;
    } catch {
      /* fall through */
    }
  }

  return null;
}

export async function waitForNeonJwt(
  client: NonNullable<typeof neonAuthClient>,
  opts?: { attempts?: number; delayMs?: number }
): Promise<string | null> {
  const attempts = opts?.attempts ?? 10;
  const delayMs = opts?.delayMs ?? 250;

  for (let i = 0; i < attempts; i++) {
    const jwt = await getNeonJwt(client);
    if (jwt) return jwt;
    if (i < attempts - 1) {
      await new Promise((r) => window.setTimeout(r, delayMs));
    }
  }
  return null;
}
