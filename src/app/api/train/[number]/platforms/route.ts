import type { NextRequest } from 'next/server';
import { getTrainPlatforms } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
} from '../../../_lib/helpers';

/**
 * GET /api/train/[number]/platforms
 *
 * Returns live verified platform assignments for the given train across its halts.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    const { number } = await params;

    if (!isValidTrainNumber(number)) {
      return errorResponse('Invalid train number. Must be 1-5 digits.', 400);
    }

    const result = await getTrainPlatforms(number);

    if (result.status === 'SUCCESS' && result.data) {
      return successResponse({
        ...result.data,
        meta: result.meta,
      });
    }

    return errorResponse(result.error || 'Platform assignments unavailable for this train.', 503);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Internal server error', 500);
  }
}

export function OPTIONS() {
  return handleOptions();
}
