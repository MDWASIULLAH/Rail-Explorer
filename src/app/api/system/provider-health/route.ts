import { getProviderHealth } from '@/lib/railway-api';
import { successResponse, errorResponse, handleOptions } from '../../_lib/helpers';

/**
 * GET /api/system/provider-health
 *
 * Returns live health metrics, latency, and status for upstream providers
 * (whereismytrain and railradar).
 */
export async function GET() {
  try {
    const result = await getProviderHealth();

    if (result.status === 'SUCCESS' && result.data) {
      return successResponse(result.data);
    }

    return errorResponse(result.error || 'Provider health metrics unavailable', 503);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export function OPTIONS() {
  return handleOptions();
}

