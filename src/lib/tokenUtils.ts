/**
 * Token utility functions for JWT handling
 */

interface TokenPayload {
  userId: number;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Decode JWT token without verification (safe for client-side)
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch (error) {
    console.error('[Token] Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 * @param token JWT token string
 * @param bufferSeconds Additional buffer in seconds (default 0)
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string, bufferSeconds: number = 0): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  // Convert exp (seconds) to milliseconds and compare with current time
  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const bufferMs = bufferSeconds * 1000;

  return currentTime >= expirationTime - bufferMs;
};

/**
 * Check if token is expiring soon (for proactive refresh)
 * @param token JWT token string
 * @param thresholdSeconds Time before expiration to consider as expiring soon (default 120 seconds = 2 minutes)
 * @returns true if token will expire within threshold
 */
export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 120): boolean => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const thresholdMs = thresholdSeconds * 1000;

  return currentTime >= expirationTime - thresholdMs;
};

/**
 * Get time remaining until token expires
 * @param token JWT token string
 * @returns Time remaining in milliseconds, or 0 if expired
 */
export const getTokenTimeRemaining = (token: string): number => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return 0;

  const expirationTime = payload.exp * 1000;
  const currentTime = Date.now();
  const timeRemaining = expirationTime - currentTime;

  return timeRemaining > 0 ? timeRemaining : 0;
};

/**
 * Format remaining time as human-readable string
 * @param milliseconds Time in milliseconds
 * @returns Formatted string (e.g., "2 days", "5 hours", "30 minutes")
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Expired';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  return `${seconds} second${seconds > 1 ? 's' : ''}`;
};

/**
 * Get token info for debugging
 * @param token JWT token string
 * @returns Debug info or null
 */
export const getTokenInfo = (token: string) => {
  const payload = decodeToken(token);
  if (!payload) return null;

  const timeRemaining = getTokenTimeRemaining(token);
  const isExpired = isTokenExpired(token);

  return {
    userId: payload.userId,
    role: payload.role,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    timeRemaining: formatTimeRemaining(timeRemaining),
    isExpired,
  };
};
