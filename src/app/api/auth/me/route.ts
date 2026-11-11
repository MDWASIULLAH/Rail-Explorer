import { NextRequest, NextResponse } from 'next/server';
import { verifyProviderSession } from '@/lib/auth-session';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('rail_session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ user: null });
  }

  try {
    const user = verifyProviderSession(sessionCookie.value);
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
