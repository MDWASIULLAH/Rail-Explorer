import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest, NextResponse } from 'next/server';

type SessionProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'github' | 'google' | 'linkedin' | string;
  createdAt: string;
};

function secretFor(provider: string): string | null {
  const key = `${provider.toUpperCase()}_CLIENT_SECRET`;
  return process.env[key] || null;
}

export function signProviderSession(profile: SessionProfile): string {
  const secret = secretFor(profile.provider);
  if (!secret) throw new Error(`OAuth signing secret is not configured for ${profile.provider}.`);
  const payload = Buffer.from(JSON.stringify(profile)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyProviderSession(value: string): SessionProfile | null {
  const [payload, suppliedSignature, extra] = value.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionProfile;
    const secret = secretFor(parsed.provider);
    if (!secret || !parsed.id || !parsed.email || !parsed.name) return null;
    const expected = createHmac('sha256', secret).update(payload).digest();
    const supplied = Buffer.from(suppliedSignature, 'base64url');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\u0000-\u001f]/.test(value)) return '/';
  try {
    const parsed = new URL(value, 'https://railexplorer.invalid');
    return parsed.origin === 'https://railexplorer.invalid' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/';
  } catch {
    return '/';
  }
}

export function createOAuthState(returnTo: unknown) {
  const state = randomBytes(32).toString('base64url');
  return { state, cookieValue: Buffer.from(JSON.stringify({ state, returnTo: safeReturnPath(returnTo), createdAt: Date.now() })).toString('base64url') };
}

export function applyOAuthStateCookie(response: NextResponse, provider: string, value: string) {
  response.cookies.set(`rail_oauth_${provider}`, value, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 300,
  });
}

export function consumeOAuthState(request: NextRequest, provider: string, suppliedState: string | null): string | null {
  if (!suppliedState) return null;
  const value = request.cookies.get(`rail_oauth_${provider}`)?.value;
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { state: string; returnTo: string; createdAt: number };
    const expected = Buffer.from(parsed.state || '');
    const supplied = Buffer.from(suppliedState);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    if (!parsed.createdAt || Date.now() - parsed.createdAt > 5 * 60_000) return null;
    return safeReturnPath(parsed.returnTo);
  } catch {
    return null;
  }
}

export function clearOAuthStateCookie(response: NextResponse, provider: string) {
  response.cookies.set(`rail_oauth_${provider}`, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
}
