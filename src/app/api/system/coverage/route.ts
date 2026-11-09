import { NextResponse } from 'next/server';
import { getCoverageInfo } from '@/lib/railway-api';

export async function GET() {
  try {
    const coverage = await getCoverageInfo();
    return NextResponse.json(coverage);
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'ERROR',
        error: err.message,
      },
      { status: 500 }
    );
  }
}

