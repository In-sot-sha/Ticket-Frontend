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
