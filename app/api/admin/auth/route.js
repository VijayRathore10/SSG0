import { cookies } from 'next/headers';
import {
  AUTH_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
  getAdminSessionSecret,
  getSessionCookieOptions,
  isAdminAuthenticated,
  verifyAdminPassword,
} from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const configuredPassword = getAdminPassword();
    if (!configuredPassword) {
      return Response.json(
        { error: 'Admin authentication is not configured. Set ADMIN_PASSWORD on the server.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const sessionSecret = getAdminSessionSecret();
    if (!sessionSecret) {
      return Response.json(
        { error: 'Admin session signing is not configured. Set ADMIN_SESSION_SECRET on the server.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Invalid request body' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const password = typeof body?.password === 'string' ? body.password : '';

    if (!verifyAdminPassword(password)) {
      return Response.json(
        { error: 'Incorrect administrator password' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const sessionToken = createAdminSessionToken();
    if (!sessionToken) {
      return Response.json(
        { error: 'Failed to create admin session' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, sessionToken, getSessionCookieOptions());

    return Response.json(
      { success: true },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function GET(request) {
  const authenticated = await isAdminAuthenticated(request);
  return Response.json(
    { authenticated },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, '', getSessionCookieOptions(0));
  cookieStore.delete(AUTH_COOKIE);
  return Response.json(
    { success: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
