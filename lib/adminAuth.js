import crypto from 'crypto';
import { cookies } from 'next/headers';

export const AUTH_COOKIE = 'nik_admin_auth';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Constant-time string comparison using SHA-256 digests so lengths never leak.
 */
export function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Strictly reads ADMIN_PASSWORD from server environment variables.
 * Never falls back to any hardcoded default password.
 */
export function getAdminPassword() {
  const value = process.env.ADMIN_PASSWORD;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
}

/**
 * Strictly reads ADMIN_SESSION_SECRET from server environment variables.
 * Never falls back to any static or hardcoded token.
 */
export function getAdminSessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value;
}

/**
 * Verifies a submitted password strictly against process.env.ADMIN_PASSWORD.
 */
export function verifyAdminPassword(submittedPassword) {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) return false;
  if (typeof submittedPassword !== 'string' || submittedPassword.length === 0) {
    return false;
  }
  return timingSafeEqualStr(submittedPassword, configuredPassword);
}

/**
 * Generates an HMAC-SHA256 signed session cookie token using ADMIN_SESSION_SECRET.
 */
export function createAdminSessionToken() {
  const secret = getAdminSessionSecret();
  if (!secret) return null;

  const payload = Buffer.from(
    JSON.stringify({
      sub: 'nik-admin',
      iat: Date.now(),
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      nonce: crypto.randomBytes(16).toString('hex'),
    }),
    'utf8'
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

/**
 * Validates either an HMAC-signed session token or a direct match against ADMIN_SESSION_SECRET.
 */
export function verifySessionToken(token) {
  const secret = getAdminSessionSecret();
  if (!secret || typeof token !== 'string' || token.length === 0) {
    return false;
  }

  // 1. Verify HMAC-signed session token (payload.signature)
  const dotIdx = token.indexOf('.');
  if (dotIdx > 0 && dotIdx === token.lastIndexOf('.')) {
    const payload = token.slice(0, dotIdx);
    const signature = token.slice(dotIdx + 1);
    if (payload && signature) {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64url');

      if (timingSafeEqualStr(signature, expectedSig)) {
        try {
          const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
          if (
            decoded &&
            decoded.sub === 'nik-admin' &&
            typeof decoded.exp === 'number' &&
            decoded.exp > Date.now()
          ) {
            return true;
          }
        } catch {
          return false;
        }
      }
    }
  }

  // 2. Support direct secret match (e.g. server-to-server x-admin-token)
  return timingSafeEqualStr(token, secret);
}

/**
 * Verifies same-origin for cookie-authenticated mutating requests (CSRF defense-in-depth).
 */
function hasValidSameOrigin(request) {
  if (!request || !request.headers) return true;
  const method = (request.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    const host = request.headers.get('host');
    return originHost === forwardedHost || originHost === host;
  } catch {
    return false;
  }
}

/**
 * Standard cookie attributes for the admin session cookie.
 */
export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
  };
}

/**
 * Verifies admin authentication on any incoming API route request via:
 *  - `x-admin-token` header or `Authorization: Bearer <token>` matching ADMIN_SESSION_SECRET (or signed token)
 *  - `nik_admin_auth` HttpOnly session cookie signed with ADMIN_SESSION_SECRET
 */
export async function isAdminAuthenticated(request) {
  const secret = getAdminSessionSecret();
  if (!secret) {
    return false;
  }

  try {
    // 1. Check explicit header token (x-admin-token or Authorization: Bearer)
    if (request && request.headers) {
      const xAdminToken = request.headers.get('x-admin-token');
      if (xAdminToken && verifySessionToken(xAdminToken)) {
        return true;
      }

      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.slice(7).trim();
        if (bearerToken && verifySessionToken(bearerToken)) {
          return true;
        }
      }
    }

    // 2. Check HttpOnly session cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get(AUTH_COOKIE)?.value;
    if (cookieToken && verifySessionToken(cookieToken)) {
      return hasValidSameOrigin(request);
    }
  } catch (err) {
    console.warn('[AdminAuth] Verification warning:', err?.message || err);
  }

  return false;
}

/**
 * Standard 401 Unauthorized JSON response with no-store caching.
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return Response.json(
    { error: message },
    {
      status: 401,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
