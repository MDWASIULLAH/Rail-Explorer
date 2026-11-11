import type { NextRequest } from 'next/server';
import { getTrainRoute } from '@/lib/railway-api';
import { KNOWN_TRAINS } from '@/data/train-directory';
import { getIndiaDateString } from '../../../_lib/helpers';
import { getNtesTrainBundle } from '@/lib/ntes-provider';
import { successResponse, errorResponse, handleOptions, isValidTrainNumber } from '../../../_lib/helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!isValidTrainNumber(number)) return errorResponse('Invalid train number. Must be 1-5 digits.', 400);

  const ntes = await getNtesTrainBundle(request.nextUrl.origin, number, getIndiaDateString());
  if (ntes?.route.stations?.length) {
    return successResponse({
      ...ntes.route,
      trainNumber: number,
      meta: { generatedAt: ntes.checkedAt, source: 'NTES', live: false },
    });
  }

  let result: Awaited<ReturnType<typeof getTrainRoute>>;
  try { result = await getTrainRoute(number); } catch { result = { status: 'ERROR', data: null, error: 'Route provider unavailable.', meta: { generatedAt: new Date().toISOString(), requestId: '' } }; }
  if (result.status === 'SUCCESS' && result.data?.stations?.length) {
    return successResponse({ ...result.data, trainNumber: number, meta: result.meta });
  }

  const known = KNOWN_TRAINS[number.padStart(5, '0')];
  if (known?.schedule.length) {
    return successResponse({
      trainNumber: known.trainNumber,
      trainName: known.trainName,
      stations: known.schedule.map((s) => ({ stationCode: s.stationCode, stationName: s.stationName, scheduledArrival: s.arrivalTime, scheduledDeparture: s.departureTime, haltMinutes: s.haltMinutes, distance: s.distance, day: s.day })),
      meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false },
    });
  }

  return errorResponse(result.error || 'Route data is unavailable for this train.', 503);
}

export function OPTIONS() { return handleOptions(); }
