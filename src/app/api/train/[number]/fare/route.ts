import type { NextRequest } from 'next/server';
import { getTrainFare } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
} from '../../../_lib/helpers';

/**
 * GET /api/train/[number]/fare?source=BBS&destination=DHN&class=3A
 *
 * Returns fare breakdown between two stations for a given class.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    const { number } = await params;

    if (!isValidTrainNumber(number)) {
      return errorResponse('Invalid train number. Must be 1-5 digits.', 400);
    }

    const { searchParams } = request.nextUrl;
    const source = searchParams.get('source')?.toUpperCase().trim();
    const destination = searchParams.get('destination')?.toUpperCase().trim();
    const coachClass = searchParams.get('class')?.toUpperCase().trim() || 'SL';

    if (!source || !destination) {
      return errorResponse('Source and destination station codes are required.', 400);
    }

    const result = await getTrainFare(number, source, destination, coachClass);

    if (result.status === 'SUCCESS' && result.data) {
      return successResponse({
        ...result.data,
        meta: result.meta,
      });
    }

    return errorResponse(result.error || 'Fare data is unavailable for this train and journey.', 503);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export function OPTIONS() {
  return handleOptions();
}
