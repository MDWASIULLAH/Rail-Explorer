/**
 * RailKit server-side REST client.
 *
 * RailKit is optional: deployments without RAILKIT_API_KEY continue using the
 * existing Railway Engine integration. PNR responses are never cached or logged.
 */

export interface RailKitResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export interface RailKitPnrPassenger {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coachId: string | null;
  berthNumber: number | null;
  berthType: string | null;
}

export interface RailKitPnrStatus {
  pnr: string;
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  from: { code: string; name: string };
  to: { code: string; name: string };
  boardingPoint: { code: string; name: string };
  reservationUpTo: { code: string; name: string };
  journeyClass: string;
  quota: string;
  chartStatus: string;
  bookingFare: number | null;
  observedAt?: string;
  passengers: RailKitPnrPassenger[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function railKitStation(value: unknown): { code: string; name: string } {
  const station = asRecord(value);
  return {
    code: asText(station.code ?? station.stationCode ?? station.station_code).toUpperCase(),
    name: asText(station.name ?? station.stationName ?? station.station_name),
  };
}

/** Maps the documented RailKit PNR response without retaining raw passenger fields. */
export function normalizeRailKitPnr(value: unknown, requestedPnr: string): RailKitPnrStatus | null {
  const raw = asRecord(value);
  const train = asRecord(raw.train);
  const journey = asRecord(raw.journey);
  const source = railKitStation(journey.source ?? raw.source);
  const destination = railKitStation(journey.destination ?? raw.destination);
  const trainNumber = asText(train.number ?? train.trainNo ?? raw.trainNumber);
  const responsePnr = asText(raw.pnr ?? raw.pnrNumber ?? requestedPnr);
  const rawPassengers = Array.isArray(raw.passengers) ? raw.passengers : [];

  if (responsePnr !== requestedPnr || !/^\d{4,6}$/.test(trainNumber) || !source.code || !destination.code) {
    return null;
  }

  const passengers = rawPassengers.map((value, index): RailKitPnrPassenger => {
    const passenger = asRecord(value);
    const booking = asRecord(passenger.booking);
    const current = asRecord(passenger.current);
    const bookingDetails = asText(booking.details ?? passenger.bookingStatus);
    const currentDetails = asText(current.details ?? passenger.currentStatus);
    const berthMatch = currentDetails.match(/(?:CNF|CONFIRMED|RAC)\/([A-Z0-9]{1,6})\/(\d{1,3})/i);
    const explicitBerth = current.berthNumber ?? passenger.berthNumber;
    const berthNumber = Number(explicitBerth ?? berthMatch?.[2]);
    const berthCode = asText(current.berthCode ?? passenger.berthCode ?? passenger.berthType);
    return {
      number: Number(passenger.number ?? passenger.passengerNumber) || index + 1,
      bookingStatus: asText(booking.status ?? bookingDetails),
      currentStatus: asText(current.status ?? currentDetails),
      coachId: asText(current.coach ?? current.coachId ?? passenger.coach ?? berthMatch?.[1]) || null,
      berthNumber: Number.isInteger(berthNumber) && berthNumber > 0 ? berthNumber : null,
      berthType: berthCode || null,
    };
  });

  const boardingPoint = railKitStation(raw.boardingPoint ?? journey.boardingPoint ?? journey.source);
  const reservationUpTo = railKitStation(raw.reservationUpTo ?? raw.reservationUpto ?? journey.destination);
  const chart = asRecord(raw.chart);
  const fare = Number(raw.bookingFare ?? raw.fare);
  const observedAt = asText(raw.observedAt ?? raw.lastUpdate ?? raw.updatedAt) || undefined;

  return {
    pnr: responsePnr,
    trainNumber,
    trainName: asText(train.name ?? train.trainName ?? raw.trainName),
    journeyDate: asText(journey.date ?? raw.journeyDate),
    from: source,
    to: destination,
    boardingPoint: boardingPoint.code ? boardingPoint : source,
    reservationUpTo: reservationUpTo.code ? reservationUpTo : destination,
    journeyClass: asText(raw.class ?? raw.classCode ?? journey.class),
    quota: asText(raw.quota ?? journey.quota),
    chartStatus: asText(chart.status ?? raw.chartStatus),
    bookingFare: Number.isFinite(fare) ? fare : null,
    observedAt,
    passengers,
  };
}

const RAILKIT_BASE_URL = 'https://api.railkit.in/api/v1';

export function isRailKitConfigured(): boolean {
  return Boolean(process.env.RAILKIT_API_KEY?.trim());
}

export async function railKitGet<T>(path: string, timeoutMs = 10_000): Promise<RailKitResult<T>> {
  const key = process.env.RAILKIT_API_KEY?.trim();
  if (!key) return { ok: false, status: 0, data: null, error: 'RailKit is not configured.' };

  try {
    const response = await fetch(`${RAILKIT_BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'x-api-key': key, accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { payload = null; }
    const envelope = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    const value = envelope.data && typeof envelope.data === 'object'
      ? envelope.data as T
      : null;
    const success = response.ok && envelope.success === true && value !== null;
    const providerMessage = typeof envelope.message === 'string' ? envelope.message : '';
    return {
      ok: success,
      status: response.status,
      data: success ? value : null,
      error: success ? null : providerMessage || `RailKit request failed (${response.status || 'invalid response'}).`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error && error.name === 'TimeoutError'
        ? 'RailKit request timed out.'
        : 'RailKit is temporarily unavailable.',
    };
  }
}

export async function getRailKitPnr(pnr: string): Promise<RailKitResult<Record<string, unknown>>> {
  return railKitGet<Record<string, unknown>>(`/pnr/${encodeURIComponent(pnr)}`);
}

export async function getRailKitTrainInfo(trainNumber: string): Promise<RailKitResult<Record<string, unknown>>> {
  return railKitGet<Record<string, unknown>>(`/trains/${encodeURIComponent(trainNumber)}/info`);
}
