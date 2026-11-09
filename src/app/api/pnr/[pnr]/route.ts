import type { NextRequest } from 'next/server';
import { getPnrStatus } from '@/lib/railway-api';
import {
  successResponse,
  errorResponse,
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
      return errorResponse(
        'Invalid PNR number. Must be exactly 10 digits.',
        400,
      );
    }

    const result = await getPnrStatus(pnr);

    if (result.status === 'ERROR') {
      return errorResponse(
        result.error ?? 'Failed to fetch PNR status',
        502,
      );
    }

    return successResponse({
      pnr,
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
