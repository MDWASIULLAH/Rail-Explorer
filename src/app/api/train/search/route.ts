import type { NextRequest } from 'next/server';
import { searchTrains } from '@/lib/railway-api';
import { findKnownTrains, mergeTrainSearchResults } from '@/lib/train-search';
import { successResponse, errorResponse, handleOptions } from '../../_lib/helpers';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 50) {
    return errorResponse('Search query must be between 2 and 50 characters.', 400);
  }

  const localResults = findKnownTrains(query);
  // Exact number lookups and multi-term route searches against the curated
  // directory should not wait on a slow external provider. The response is
  // explicitly marked as reference data, so callers can distinguish it from
  // provider/live data.
  if (localResults.length > 0 && (/^\d{4,6}$/.test(query) || query.trim().split(/\s+/).length >= 2)) {
    return successResponse({
      query,
      results: localResults,
      count: localResults.length,
      meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false },
    });
  }

  try {
    const result = await searchTrains(query);
    if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
      const results = mergeTrainSearchResults(result.data, findKnownTrains(query));
      return successResponse({ query, results, count: results.length, meta: { ...result.meta, localMatchesAdded: results.length > result.data.length } });
    }

    const results = localResults;

    return successResponse({
      query,
      results,
      count: results.length,
      meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false },
    });
  } catch {
    // Return only directory entries when the provider is unreachable. Never invent a train.
    const results = findKnownTrains(query);
    return successResponse({ query, results, count: results.length, meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false } });
  }
}

export function OPTIONS() {
  return handleOptions();
}
