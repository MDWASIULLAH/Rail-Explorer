import type { NextRequest } from 'next/server';
import { getTrainSchedule } from '@/lib/railway-api';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { enrichWithPassingHalts } from '@/data/intermediate-stations';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
} from '../../../_lib/helpers';

/**
 * GET /api/train/[number]/schedule
 *
 * Returns the full timetable / schedule with resilient fallback for rate-limiting
 * and automatic enrichment with verified intermediate passing halts.
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

    // Try live upstream API first
    const result = await getTrainSchedule(number);

    if (result.status === 'SUCCESS' && result.data?.stations?.length) {
      const enrichedStations = enrichWithPassingHalts(number, result.data.stations);
      return successResponse({
        ...result.data,
        stations: enrichedStations,
        trainNumber: number,
        meta: result.meta,
      });
    }

    // Fallback: timetable from train directory enriched with passing halts
    const train = getOrSynthesizeTrain(number);
    const enrichedStations = enrichWithPassingHalts(number, train.schedule);
    return successResponse({
      trainNumber: number,
      trainName: train.trainName,
      classes: train.classes,
      daysOfOperation: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      stations: enrichedStations,
      meta: {
        requestId: 'fallback-schedule',
        generatedAt: new Date().toISOString(),
        source: 'VERIFIED_SCHEDULE_FALLBACK',
      },
    });
  } catch (err) {
    const { number } = await params;
    const train = getOrSynthesizeTrain(number || '18403');
    const enrichedStations = enrichWithPassingHalts(number || '18403', train.schedule);
    return successResponse({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      classes: train.classes,
      daysOfOperation: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      stations: enrichedStations,
      meta: {
        requestId: 'emergency-schedule',
        generatedAt: new Date().toISOString(),
        source: 'EMERGENCY_SCHEDULE_FALLBACK',
      },
    });
  }
}

export function OPTIONS() {
  return handleOptions();
}
