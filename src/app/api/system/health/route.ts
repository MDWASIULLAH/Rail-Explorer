import { NextResponse } from 'next/server';
import { getProviderHealth, getHealthStatus } from '@/lib/railway-api';

export async function GET() {
  try {
    const health = await getProviderHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    const basic = await getHealthStatus();
    return NextResponse.json({
      status: 'FALLBACK',
      data: basic.data,
      error: err.message,
    });
  }
}

