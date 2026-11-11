import type { NextRequest } from 'next/server';
import { getTrainStatus } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
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

    // Compute IST dates (Indian Standard Time: UTC+5:30)
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60 * 1000) + istOffsetMs);
    const todayStr = istNow.toISOString().slice(0, 10);
    const yesterdayStr = new Date(istNow.getTime() - 86400000).toISOString().slice(0, 10);
    const tomorrowStr = new Date(istNow.getTime() + 86400000).toISOString().slice(0, 10);

    const dateParam = request.nextUrl.searchParams.get('date')?.toLowerCase().trim();
    const isExplicitDate = Boolean(dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam));

    let result;

    if (isExplicitDate && dateParam) {
      // Explicit specific calendar date requested
      result = await getTrainStatus(number, dateParam);
    } else if (dateParam === 'yesterday') {
      result = await getTrainStatus(number, yesterdayStr);
    } else if (dateParam === 'tomorrow') {
      result = await getTrainStatus(number, tomorrowStr);
    } else {
      // Auto-detect active running train (default / 'today'):
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
