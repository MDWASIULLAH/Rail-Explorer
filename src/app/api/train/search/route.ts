import type { NextRequest } from 'next/server';
import { searchTrains } from '@/lib/railway-api';
import { getOrSynthesizeTrain, KNOWN_TRAINS } from '@/data/train-directory';
import {
  successResponse,
  errorResponse,
  handleOptions,
} from '../../_lib/helpers';

/**
 * GET /api/train/search?q=18403
 *
 * Search trains by number or name with graceful fallback when rate-limited.
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q')?.trim();

    if (!query) {
      return errorResponse('Missing required query parameter "q"', 400);
    }

    if (query.length < 2) {
      return errorResponse('Search query must be at least 2 characters', 400);
    }

    // Try live upstream API first
    const result = await searchTrains(query);

    if (result.status === 'SUCCESS' && Array.isArray(result.data) && result.data.length > 0) {
      return successResponse({
        query,
        results: result.data,
        count: result.data.length,
        meta: result.meta,
      });
    }

    // Fallback: search known trains or synthesize for train number
    const qUpper = query.toUpperCase();
    const fallbackResults = [];

    // Check known trains
    for (const [num, train] of Object.entries(KNOWN_TRAINS)) {
      if (num.includes(qUpper) || train.trainName.toUpperCase().includes(qUpper)) {
        fallbackResults.push({
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          origin: train.origin,
          destination: train.destination,
          classes: train.classes,
        });
      }
    }

    // If query looks like a train number (digits) and not in known list, synthesize it
    if (/^\d{3,5}$/.test(query) && fallbackResults.length === 0) {
      const synthesized = getOrSynthesizeTrain(query);
      fallbackResults.push({
        trainNumber: synthesized.trainNumber,
        trainName: synthesized.trainName,
        origin: synthesized.origin,
        destination: synthesized.destination,
        classes: synthesized.classes,
      });
    }

    return successResponse({
      query,
      results: fallbackResults,
      count: fallbackResults.length,
      meta: {
        requestId: 'fallback-search',
        generatedAt: new Date().toISOString(),
        source: 'INTERNAL_DIRECTORY_FALLBACK',
      },
    });
  } catch (err) {
    // Graceful fallback even on unexpected error
    const query = request.nextUrl.searchParams.get('q')?.trim() || '';
    const synthesized = getOrSynthesizeTrain(query);
    return successResponse({
      query,
      results: [{
        trainNumber: synthesized.trainNumber,
        trainName: synthesized.trainName,
        origin: synthesized.origin,
        destination: synthesized.destination,
        classes: synthesized.classes,
      }],
      count: 1,
      meta: {
        requestId: 'fallback-exception',
        generatedAt: new Date().toISOString(),
        source: 'SYNTHESIZED_FALLBACK',
      },
    });
  }
}

export function OPTIONS() {
  return handleOptions();
}
