import type { NextRequest } from 'next/server';
import { getStationBoard } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidStationCode,
} from '../../../_lib/helpers';

/**
 * GET /api/station/[code]/board
 *
 * Returns the live arrival/departure board for the given station.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const upperCode = code.toUpperCase();

    if (!isValidStationCode(upperCode)) {
      return errorResponse(
        'Invalid station code. Must be 2-5 alphanumeric characters.',
        400,
      );
    }

    const result = await getStationBoard(upperCode);

    if (result.status === 'ERROR') {
      return errorResponse(
        result.error ?? 'Failed to fetch station board',
        502,
      );
    }

    return successResponse({
      stationCode: upperCode,
      ...result.data,
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
