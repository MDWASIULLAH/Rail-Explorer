/**
 * Shared helpers for API route handlers
 */

/** Standard CORS headers applied to every API response */
export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'X-Content-Type-Options': 'nosniff',
};

/**
 * Return a consistent JSON envelope.
 *
 * Shape:
 * ```json
 * { "success": boolean, "data": T | null, "error": string | null }
 * ```
 */
export function jsonResponse<T>(
  body: { success: boolean; data: T | null; error: string | null },
  status: number = 200,
): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

/** Convenience: successful response */
export function successResponse<T>(data: T): Response {
  return jsonResponse({ success: true, data, error: null }, 200);
}

/** Convenience: error response */
export function errorResponse(error: string, status: number = 500): Response {
  return jsonResponse({ success: false, data: null, error }, status);
}

/** Preflight OPTIONS handler — reuse across all routes */
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** Validate that a string is a plausible Indian train number (1-5 digits) */
export function isValidTrainNumber(value: string): boolean {
  return /^\d{1,5}$/.test(value);
}

/** Validate a 10-digit PNR */
export function isValidPnr(value: string): boolean {
  return /^\d{10}$/.test(value);
}

/** Validate an Indian railway station code (2-5 uppercase alpha, sometimes with digits) */
export function isValidStationCode(value: string): boolean {
  return /^[A-Z0-9]{2,5}$/i.test(value);
}
