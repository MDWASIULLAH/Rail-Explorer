import type { NextRequest } from 'next/server';
import { getTrainStatus } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
  getIndiaDateString,
  resolveJourneyDate,
} from '../../../_lib/helpers';

/**
 * GET /api/train/[number]/status
 *
 * Returns provider-reported running status with automatic active-train detection
 * and optional ?date=YYYY-MM-DD | yesterday | today | tomorrow support.
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

    const requestedDate = resolveJourneyDate(request.nextUrl.searchParams.get('date'));
    if (requestedDate.kind === 'invalid') {
      return errorResponse('Invalid date. Use today, yesterday, tomorrow, or YYYY-MM-DD.', 400);
    }

    let result;

    if (requestedDate.kind === 'date') {
      // The UI date selector is exact: Today never silently switches to a prior journey.
      result = await getTrainStatus(number, requestedDate.date);
    } else {
      // Only an omitted date asks for automatic active-train detection.
      const now = new Date();
      const todayStr = getIndiaDateString(now);
      const yesterdayStr = getIndiaDateString(now, -1);
      // Check today's rake first
      const todayResult = await getTrainStatus(number, todayStr);

      if (todayResult.status === 'SUCCESS' && todayResult.data?.status === 'RUNNING') {
        result = todayResult;
      } else {
        // Today has not started or is pending. Check if yesterday's rake is actively RUNNING
        const yestResult = await getTrainStatus(number, yesterdayStr);
        if (yestResult.status === 'SUCCESS' && yestResult.data?.status === 'RUNNING') {
          result = yestResult;
        } else {
          result = todayResult;
        }
      }
    }

    if (result.status === 'SUCCESS' && result.data) {
      return successResponse({
        ...result.data,
        trainNumber: number,
        meta: result.meta,
      });
    }

    return errorResponse(result.error || 'Live train status is currently unavailable.', 503);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'Live train status is currently unavailable.', 503);
  }
}

export function OPTIONS() {
  return handleOptions();
}
