import { getRemainingRequests } from '@/lib/railway-api';
import { handleOptions } from '../_lib/helpers';

/** Cheap readiness endpoint. Provider health is checked through monitored provider telemetry. */
export async function GET() {
  return Response.json({
    success: true,
    data: { status: 'ready', providerProbe: 'not-run', rateLimitRemaining: getRemainingRequests(), timestamp: new Date().toISOString() },
    error: null,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function OPTIONS() { return handleOptions(); }
