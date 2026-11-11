import type { NextRequest } from 'next/server';
import { searchTrains } from '@/lib/railway-api';
import { KNOWN_TRAINS } from '@/data/train-directory';
import { successResponse, errorResponse, handleOptions } from '../../_lib/helpers';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 50) {
    return errorResponse('Search query must be between 2 and 50 characters.', 400);
  }

  try {
    const result = await searchTrains(query);
    if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
      return successResponse({ query, results: result.data, count: result.data.length, meta: result.meta });
    }

    const q = query.toUpperCase();
    const results = Object.entries(KNOWN_TRAINS)
      .filter(([number, train]) => number.includes(q) || train.trainName.toUpperCase().includes(q))
      .map(([, train]) => ({
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        origin: train.origin,
        destination: train.destination,
        classes: train.classes,
      }));

    return successResponse({
      query,
      results,
      count: results.length,
      meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false },
    });
  } catch {
    // Return only directory entries when the provider is unreachable. Never invent a train.
    const q = query.toUpperCase();
    const results = Object.entries(KNOWN_TRAINS)
      .filter(([number, train]) => number.includes(q) || train.trainName.toUpperCase().includes(q))
      .map(([, train]) => ({ trainNumber: train.trainNumber, trainName: train.trainName, origin: train.origin, destination: train.destination, classes: train.classes }));
    return successResponse({ query, results, count: results.length, meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false } });
  }
}

export function OPTIONS() {
  return handleOptions();
}
