import { getHealthStatus, getRemainingRequests } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '../_lib/helpers';

/**
 * GET /api/health
 *
 * Health check — pings the upstream Railway Engine API and
 * reports local rate-limit headroom.
 */
export async function GET() {
  try {
    const result = await getHealthStatus();

    if (result.status === 'ERROR') {
      return errorResponse(result.error ?? 'Upstream health check failed', 502);
    }

    return successResponse({
      status: 'healthy',
      upstream: result.data,
      rateLimitRemaining: getRemainingRequests(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : 'Health check failed',
      500,
    );
  }
}

export function OPTIONS() {
  return handleOptions();
}
