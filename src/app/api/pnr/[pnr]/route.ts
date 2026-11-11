import type { NextRequest } from 'next/server';
import { getPnrStatus } from '@/lib/railway-api';
import {
  privateSuccessResponse,
  privateErrorResponse,
  handleOptions,
  isValidPnr,
} from '../../_lib/helpers';

/**
 * GET /api/pnr/[pnr]
 *
 * Looks up PNR status.  PNR must be exactly 10 digits.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pnr: string }> },
) {
  try {
    const { pnr } = await params;

    if (!isValidPnr(pnr)) {
      return privateErrorResponse(
        'Invalid PNR number. Must be exactly 10 digits.',
        400,
      );
    }

    const result = await getPnrStatus(pnr);

    if ((result.status !== 'SUCCESS' && result.status !== 'STALE_DATA') || !result.data) {
      return privateErrorResponse(
        result.error ?? 'Failed to fetch PNR status',
        502,
      );
    }

    return privateSuccessResponse({
      ...result.data,
      providerStatus: result.status,
      meta: result.data.meta || result.meta,
    });
  } catch (err) {
    return privateErrorResponse(
      err instanceof Error ? err.message : 'Internal server error',
      500,
    );
  }
}

export function OPTIONS() {
  return handleOptions();
}
