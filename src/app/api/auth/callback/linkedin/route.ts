import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  let returnTo = '/';
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
      if (parsed.returnTo && typeof parsed.returnTo === 'string' && parsed.returnTo.startsWith('/')) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // ignore
    }
  }

  const host = request.headers.get('host') || 'railexplorer.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseOrigin = `${proto}://${host}`;

  if (error || !code) {
    const errorMsg = error || 'no_linkedin_code_provided';
    return NextResponse.redirect(`${baseOrigin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID || process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = `${baseOrigin}/api/auth/callback/linkedin`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseOrigin}/login?error=missing_linkedin_oauth_env`);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[LinkedIn OAuth Token Error]', tokenResponse.status, errBody);
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('linkedin_token_exchange_failed')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch OpenID Connect user info
    const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('linkedin_userinfo_failed')}`
      );
    }

    const liUser = await userRes.json();
    const userSession = {
      id: liUser.sub || `linkedin_${Date.now()}`,
      email: liUser.email || '',
      name: liUser.name || `${liUser.given_name || ''} ${liUser.family_name || ''}`.trim() || 'LinkedIn Passenger',
      avatarUrl: liUser.picture || '',
      provider: 'linkedin' as const,
      createdAt: new Date().toISOString(),
    };

    // 3. Set cookie and redirect
    const response = NextResponse.redirect(`${baseOrigin}${returnTo}`);
    response.cookies.set('rail_session', JSON.stringify(userSession), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[LinkedIn OAuth Callback Exception]', err);
    return NextResponse.redirect(
      `${baseOrigin}/login?error=${encodeURIComponent(err.message || 'unexpected_linkedin_error')}`
    );
  }
}
