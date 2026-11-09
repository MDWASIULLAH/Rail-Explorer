import type { NextRequest } from 'next/server';
import { getCoachComposition } from '@/lib/railway-api';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import {
  successResponse,
  errorResponse,
  handleOptions,
  isValidTrainNumber,
} from '../../../_lib/helpers';

/**
 * GET /api/train/[number]/coaches
 *
 * Returns the coach composition (rake) with resilient fallback for rate-limiting.
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
    const result = await getCoachComposition(number);

    if (result.status === 'SUCCESS' && result.data?.coaches?.length) {
      return successResponse({
        ...result.data,
        trainNumber: number,
        meta: result.meta,
      });
    }

    // Fallback from verified train directory
    const train = getOrSynthesizeTrain(number);
    const coaches = train.coaches.map((c, i) => ({
      position: i + 1,
      coachId: c.coachId,
      coachType: c.coachType,
      coachClass: c.coachType,
      classCode: c.coachType,
      category: ['EOG', 'SLR'].includes(c.coachType)
        ? 'POWER_CAR'
        : c.coachType === 'PC'
        ? 'PANTRY'
        : 'PASSENGER',
      berthCount: c.berthCount,
    }));

    return successResponse({
      trainNumber: number,
      trainName: train.trainName,
      rakeType: train.rakeType,
      totalCoaches: coaches.length,
      coaches,
      meta: {
        requestId: 'fallback-coaches',
        generatedAt: new Date().toISOString(),
        source: 'VERIFIED_DIRECTORY_FALLBACK',
      },
    });
  } catch (err) {
    // Ultimate fallback so the user's 3D rake never fails
    const { number } = await params;
    const train = getOrSynthesizeTrain(number || '18403');
    return successResponse({
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      rakeType: train.rakeType,
      totalCoaches: train.coaches.length,
      coaches: train.coaches.map((c, i) => ({
        position: i + 1,
        coachId: c.coachId,
        coachType: c.coachType,
        coachClass: c.coachType,
        classCode: c.coachType,
        category: 'PASSENGER',
        berthCount: c.berthCount,
      })),
      meta: {
        requestId: 'fallback-error',
        generatedAt: new Date().toISOString(),
        source: 'EMERGENCY_RAKE_FALLBACK',
      },
    });
  }
}

export function OPTIONS() {
  return handleOptions();
}
