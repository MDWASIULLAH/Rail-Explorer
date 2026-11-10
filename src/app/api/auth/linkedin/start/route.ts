import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId =
    process.env.LINKEDIN_CLIENT_ID ||
    process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'LINKEDIN_CLIENT_ID is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/';

  // Determine origin for callback
  const host = request.headers.get('host') || 'railexplorer.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseOrigin = `${proto}://${host}`;
  const redirectUri = `${baseOrigin}/api/auth/callback/linkedin`;

  // Encode state with returnTo
  const statePayload = Buffer.from(
    JSON.stringify({ returnTo, ts: Date.now() })
  ).toString('base64url');

  const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  linkedinAuthUrl.searchParams.set('response_type', 'code');
  linkedinAuthUrl.searchParams.set('client_id', clientId);
  linkedinAuthUrl.searchParams.set('redirect_uri', redirectUri);
  linkedinAuthUrl.searchParams.set('state', statePayload);
  linkedinAuthUrl.searchParams.set('scope', 'openid profile email');

  return NextResponse.redirect(linkedinAuthUrl.toString());
}
