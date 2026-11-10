import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnTo = searchParams.get('returnTo') || '/';

  const host = request.headers.get('host') || 'railexplorer.vercel.app';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseOrigin = `${proto}://${host}`;
  const callbackUrl = `${baseOrigin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uamsjyldizrskdvpkamm.supabase.co';
  const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set('provider', 'linkedin_oidc');
  authorizeUrl.searchParams.set('redirect_to', callbackUrl);

  return NextResponse.redirect(authorizeUrl.toString());
}

