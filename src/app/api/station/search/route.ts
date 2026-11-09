import type { NextRequest } from 'next/server';
import { searchStations } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '../../_lib/helpers';

/**
 * GET /api/station/search?q=delhi
 *
 * Search stations by name or code.
 * Query param `q` is required and must be at least 2 characters.
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim();

    if (!query) {
      return errorResponse('Missing required query parameter "q"', 400);
    }

    if (query.length < 2) {
      return errorResponse(
        'Search query must be at least 2 characters',
        400,
      );
    }

    if (query.length > 50) {
      return errorResponse('Search query is too long (max 50 characters)', 400);
    }

    const result = await searchStations(query);

    if (result.status === 'ERROR') {
      return errorResponse(result.error ?? 'Station search failed', 502);
    }

    return successResponse({
      query,
      results: result.data ?? [],
      count: Array.isArray(result.data) ? result.data.length : 0,
      meta: result.meta,
    });
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : 'Internal server error',
      500,
    );
  }
}

export function OPTIONS() {
  return handleOptions();
}
