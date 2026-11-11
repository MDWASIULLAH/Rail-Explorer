import { NextRequest, NextResponse } from 'next/server';
import { clearOAuthStateCookie, consumeOAuthState, signProviderSession } from '@/lib/auth-session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  // Parse state to retrieve return destination
  const returnTo = consumeOAuthState(request, 'google', state);
  if (!returnTo) return NextResponse.redirect(new URL('/login?error=invalid_oauth_state', request.url));

  const host = request.headers.get('host') || 'railexplorer.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseOrigin = `${proto}://${host}`;

  if (error || !code) {
    const errorMsg = error || 'no_code_provided';
    return NextResponse.redirect(`${baseOrigin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseOrigin}/login?error=missing_google_oauth_env`);
  }
  const redirectUri = `${baseOrigin}/api/auth/callback/google`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[Google OAuth Token Error]', tokenResponse.status, errBody);
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('google_token_exchange_failed')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('google_userinfo_failed')}`
      );
    }

    const googleUser = await userInfoResponse.json();
    const userSession = {
      id: googleUser.sub || `google_${Date.now()}`,
      email: googleUser.email || '',
      name: googleUser.name || googleUser.given_name || 'Passenger',
      avatarUrl: googleUser.picture || '',
      provider: 'google' as const,
      createdAt: new Date().toISOString(),
    };

    // 3. Create redirect response and set secure session cookie
    const response = NextResponse.redirect(`${baseOrigin}${returnTo}`);
    response.cookies.set('rail_session', signProviderSession(userSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    clearOAuthStateCookie(response, 'google');

    return response;
  } catch (err: any) {
    console.error('[Google OAuth Callback Exception]', err);
    return NextResponse.redirect(
      `${baseOrigin}/login?error=${encodeURIComponent(err.message || 'unexpected_error')}`
    );
  }
}
