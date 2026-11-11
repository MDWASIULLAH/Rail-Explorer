import type { NextRequest } from 'next/server';
import { getTrainSchedule } from '@/lib/railway-api';
import { KNOWN_TRAINS } from '@/data/train-directory';
import { getIndiaDateString } from '../../../_lib/helpers';
import { getNtesTrainBundle } from '@/lib/ntes-provider';
import { successResponse, errorResponse, handleOptions, isValidTrainNumber } from '../../../_lib/helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!isValidTrainNumber(number)) return errorResponse('Invalid train number. Must be 1-5 digits.', 400);

  const ntes = await getNtesTrainBundle(request.nextUrl.origin, number, getIndiaDateString());
  if (ntes?.schedule.stations?.length) {
    return successResponse({
      ...ntes.schedule,
      trainNumber: number,
      meta: { generatedAt: ntes.checkedAt, source: 'NTES', live: false },
    });
  }

  let result: Awaited<ReturnType<typeof getTrainSchedule>>;
  try { result = await getTrainSchedule(number); } catch { result = { status: 'ERROR', data: null, error: 'Schedule provider unavailable.', meta: { generatedAt: new Date().toISOString(), requestId: '' } }; }
  if (result.status === 'SUCCESS' && result.data?.stations?.length) {
    return successResponse({ ...result.data, trainNumber: number, meta: result.meta });
  }

  const known = KNOWN_TRAINS[number.padStart(5, '0')];
  if (known?.schedule.length) {
    return successResponse({
      trainNumber: known.trainNumber,
      trainName: known.trainName,
      classes: known.classes,
      stations: known.schedule,
      meta: { generatedAt: new Date().toISOString(), source: 'LOCAL_DIRECTORY', live: false },
    });
  }

  return errorResponse(result.error || 'Schedule data is unavailable for this train.', 503);
}

export function OPTIONS() { return handleOptions(); }
