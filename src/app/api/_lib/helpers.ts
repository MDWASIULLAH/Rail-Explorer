/**
 * Shared helpers for API route handlers
 */

/** Same-origin API responses; do not grant arbitrary cross-origin access. */
export const corsHeaders: Record<string, string> = {
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

export function privateErrorResponse(error: string, status: number): Response {
  return Response.json({ success: false, data: null, error }, {
    status,
    headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' },
  });
}

export function privateSuccessResponse<T>(data: T): Response {
  return Response.json({ success: true, data, error: null }, {
    headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' },
  });
}

/** Preflight OPTIONS handler — reuse across all routes */
export function handleOptions(): Response {
  return new Response(null, { status: 204, headers: { Allow: 'GET, OPTIONS' } });
}

/** Validate that a string is a plausible Indian train number (1-5 digits) */
export function isValidTrainNumber(value: string): boolean {
  return /^\d{1,5}$/.test(value);
}

/** Format a calendar date in India, independent of the host's timezone. */
export function getIndiaDateString(now: Date = new Date(), dayOffset = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const indiaMidnight = new Date(Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day) + dayOffset,
  ));
  return indiaMidnight.toISOString().slice(0, 10);
}

export type RequestedJourneyDate =
  | { kind: 'auto' }
  | { kind: 'date'; date: string }
  | { kind: 'invalid' };

/** Resolve a status date query as an India calendar date, or preserve auto mode. */
export function resolveJourneyDate(
  value: string | null,
  now: Date = new Date(),
): RequestedJourneyDate {
  const dateParam = value?.trim().toLowerCase();
  if (!dateParam) return { kind: 'auto' };

  if (dateParam === 'today') return { kind: 'date', date: getIndiaDateString(now) };
  if (dateParam === 'yesterday') return { kind: 'date', date: getIndiaDateString(now, -1) };
  if (dateParam === 'tomorrow') return { kind: 'date', date: getIndiaDateString(now, 1) };

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const parsed = new Date(`${dateParam}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === dateParam) {
      return { kind: 'date', date: dateParam };
    }
  }

  return { kind: 'invalid' };
}

/** Guard against a provider keeping yesterday's train run marked live long after its timetable ended. */
export function isLiveReportBeyondScheduleWindow(
  journeyDate: string,
  observedAt: string,
  delayMinutes: number,
  stations: Array<{ arrivalTime?: string | null; departureTime?: string | null; day?: number }>,
  graceMinutes = 360,
): boolean {
  const date = journeyDate.slice(0, 10);
  const finalStation = stations.at(-1);
  const arrivalTime = finalStation?.arrivalTime || finalStation?.departureTime;
  const match = arrivalTime?.match(/^(\d{1,2}):(\d{2})$/);
  const observed = Date.parse(observedAt);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !match || !Number.isFinite(observed)) return false;

  const start = new Date(`${date}T00:00:00+05:30`);
  if (Number.isNaN(start.getTime())) return false;
  start.setTime(start.getTime() + (Math.max(1, finalStation?.day || 1) - 1) * 86_400_000);
  const arrivalDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(start);
  const expectedArrival = Date.parse(`${arrivalDate}T${match[1].padStart(2, '0')}:${match[2]}:00+05:30`);
  const allowedDelay = Math.max(graceMinutes, Math.max(0, delayMinutes) + 120);
  return Number.isFinite(expectedArrival) && observed > expectedArrival + allowedDelay * 60_000;
}

/** Validate a 10-digit PNR */
export function isValidPnr(value: string): boolean {
  return /^\d{10}$/.test(value);
}

/** Validate an Indian railway station code (2-5 uppercase alpha, sometimes with digits) */
export function isValidStationCode(value: string): boolean {
  return /^[A-Z0-9]{2,5}$/i.test(value);
}
