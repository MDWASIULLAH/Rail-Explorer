import { NextRequest, NextResponse } from 'next/server';
import { applyOAuthStateCookie, createOAuthState } from '@/lib/auth-session';

export async function GET(request: NextRequest) {
  const clientId =
    process.env.GITHUB_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'GITHUB_CLIENT_ID is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/';

  // Determine origin for callback
  const host = request.headers.get('host') || 'railexplorer.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseOrigin = `${proto}://${host}`;
  const redirectUri = `${baseOrigin}/api/auth/callback/github`;

  // Encode state with returnTo
  const oauthState = createOAuthState(returnTo);

  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', oauthState.state);

  const response = NextResponse.redirect(githubAuthUrl.toString());
  applyOAuthStateCookie(response, 'github', oauthState.cookieValue);
  return response;
}

