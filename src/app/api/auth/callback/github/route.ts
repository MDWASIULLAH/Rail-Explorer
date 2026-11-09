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
    const errorMsg = error || 'no_github_code_provided';
    return NextResponse.redirect(`${baseOrigin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const redirectUri = `${baseOrigin}/api/auth/callback/github`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseOrigin}/login?error=missing_github_oauth_env`);
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[GitHub OAuth Token Error]', tokenResponse.status, errBody);
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('github_token_exchange_failed')}`
      );
    }

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('[GitHub OAuth Error Response]', tokenData);
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent(tokenData.error_description || tokenData.error)}`
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'RailExplorer-App',
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(
        `${baseOrigin}/login?error=${encodeURIComponent('github_user_fetch_failed')}`
      );
    }

    const ghUser = await userRes.json();
    let email = ghUser.email;

    // If email is private on GitHub profile, fetch from emails endpoint
    if (!email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'RailExplorer-App',
          },
        });
        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          if (Array.isArray(emails)) {
            const primary = emails.find((e: any) => e.primary && e.verified) || emails[0];
            if (primary?.email) {
              email = primary.email;
            }
          }
        }
      } catch {
        // email fallback to login username
      }
    }

    const userSession = {
      id: String(ghUser.id),
      email: email || `${ghUser.login}@users.noreply.github.com`,
      name: ghUser.name || ghUser.login || 'GitHub Passenger',
      avatarUrl: ghUser.avatar_url || '',
      provider: 'github' as const,
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
    console.error('[GitHub OAuth Callback Exception]', err);
    return NextResponse.redirect(
      `${baseOrigin}/login?error=${encodeURIComponent(err.message || 'unexpected_github_error')}`
    );
  }
}

