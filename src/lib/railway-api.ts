/**
 * Railway Engine API Client
 * 
 * Server-side client for the Railway Engine API.
 * Base URL: https://railway-engine.apkscope.workers.dev
 * Rate Limit: 60 requests/minute
 * Auth: x-api-key header
 * 
 * Endpoints:
 * - GET /v1/train/:number/status     - Live running status
 * - GET /v1/train/:number/schedule   - Full timetable
 * - GET /v1/train/:number/route      - Station-by-station path
 * - GET /v1/train/:number/coaches    - Coach composition
 * - GET /v1/train/:number/fare       - Fare enquiry
 * - GET /v1/trains/search?q=         - Train search
 * - GET /v1/station/:code            - Station info
 * - GET /v1/stations/search?q=       - Station search
 * - GET /v1/station/:code/board      - Station live board
 * - GET /v1/pnr/:pnr                 - PNR status
 * - GET /v1/health                   - Health check
 * - GET /v1/coverage                 - Dataset coverage
 */

// ============================================================
// Types
// ============================================================

export interface ApiResponse<T> {
  status: 'SUCCESS' | 'STALE_DATA' | 'ERROR';
  data: T | null;
  error: string | null;
  meta: {
    requestId: string;
    generatedAt: string;
    source?: string;
    cached?: boolean;
    freshness?: {
      observedAt: string;
      updatedAt: string;
      ageSeconds: number;
      state: 'LIVE' | 'RECENT' | 'STALE';
      provider: string;
    };
  };
}

export interface TrainStatus {
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  status: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  currentStation: { code: string; name: string } | null;
  previousStation: { code: string; name: string } | null;
  nextStation: { code: string; name: string } | null;
  position: {
    source: string;
    stationCode: string;
    latitude: number | null;
    longitude: number | null;
    observedAt: string;
  } | null;
  speedKmph: number | null;
  delayMinutes: number;
  delay: {
    minutes: number;
    source: string;
    reference: string;
    stationCode: string;
  };
  eta: {
    source: string;
    stationCode: string;
    value: string;
  } | null;
  routeProgress: {
    completedStops: number;
    remainingStops: number;
    totalStops: number;
    previousStop: { code: string; name: string };
    nextStop: { code: string; name: string };
    percent: number;
    basis: string;
  };
  exceptions: string[];
  freshness: {
    observedAt: string;
    updatedAt: string;
    ageSeconds: number;
    state: string;
    provider: string;
  };
  source: string;
  confidence: string;
  observedAt: string;
}

export interface TrainSchedule {
  trainNumber: string;
  trainName: string;
  trainType: string;
  zone: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  classes: string[];
  daysOfRun: string[];
  distance: number;
  duration: string;
  halts: number;
  stations: ScheduleStation[];
}

export interface ScheduleStation {
  stationCode: string;
  stationName: string;
  arrivalTime: string | null;
  departureTime: string | null;
  haltMinutes: number;
  distance: number;
  day: number;
  platform: string | null;
  isPassingHalt?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface TrainRoute {
  trainNumber: string;
  trainName: string;
  stations: RouteStation[];
}

export interface RouteStation {
  stationCode: string;
  stationName: string;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  delay: number;
  platform: string | null;
  distance: number;
  day: number;
  latitude?: number;
  longitude?: number;
}

export interface CoachComposition {
  trainNumber: string;
  trainName: string;
  coaches: CoachInfo[];
  totalCoaches: number;
  rakeType: string;
}

export interface CoachInfo {
  position: number;
  coachId: string;
  coachType: string;
  coachClass: string;
}

export interface TrainSearchResult {
  trainNumber: string;
  trainName: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  trainType: string;
  classes: string[];
  daysOfRun: string[];
}

export interface StationInfo {
  code: string;
  name: string;
  zone: string;
  division: string;
  state: string;
  latitude: number;
  longitude: number;
  platforms: number;
}

export interface PnrStatus {
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
  bookingFare?: number | null;
  observedAt?: string;
  providerStatus?: 'SUCCESS' | 'STALE_DATA';
  meta?: ApiResponse<unknown>['meta'];
  passengers: PnrPassenger[];
}

export interface PnrPassenger {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coachId: string | null;
  berthNumber: number | null;
  berthType: string | null;
}

function providerErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = typeof record.message === 'string' ? record.message : '';
    const code = typeof record.code === 'string' ? record.code : '';
    if (message && code) return `${message} (${code})`;
    if (message) return message;
    if (code) return code;
  }
  return 'The railway data provider could not complete this request.';
}

function providerStation(value: unknown): { code: string; name: string } {
  if (!value || typeof value !== 'object') return { code: '', name: '' };
  const station = value as Record<string, unknown>;
  return {
    code: typeof station.code === 'string' ? station.code : typeof station.stationCode === 'string' ? station.stationCode : '',
    name: typeof station.name === 'string' ? station.name : typeof station.stationName === 'string' ? station.stationName : '',
  };
}

export function normalizePnrStatus(value: unknown, requestedPnr: string): PnrStatus {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const chart = raw.chart && typeof raw.chart === 'object' ? raw.chart as Record<string, unknown> : {};
  const rawPassengers = Array.isArray(raw.passengers) ? raw.passengers : [];
  const passengers = rawPassengers.map((value, index): PnrPassenger => {
    const passenger = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const rawBerth = passenger.berthNumber;
    const berthNumber = typeof rawBerth === 'number' ? rawBerth : typeof rawBerth === 'string' && rawBerth.trim() ? Number(rawBerth) : null;
    return {
      number: Number.isFinite(Number(passenger.passengerNumber ?? passenger.number))
        ? Number(passenger.passengerNumber ?? passenger.number)
        : index + 1,
      bookingStatus: typeof passenger.bookingStatus === 'string' ? passenger.bookingStatus : '',
      currentStatus: typeof passenger.currentStatus === 'string' ? passenger.currentStatus : '',
      coachId: typeof passenger.coach === 'string' ? passenger.coach : typeof passenger.coachId === 'string' ? passenger.coachId : null,
      berthNumber: Number.isFinite(berthNumber) && berthNumber! > 0 ? berthNumber : null,
      berthType: typeof passenger.berthCode === 'string' ? passenger.berthCode : typeof passenger.berthType === 'string' ? passenger.berthType : null,
    };
  });
  const boardingPoint = providerStation(raw.boardingPoint);
  const from = providerStation(raw.origin ?? raw.from ?? raw.boardingPoint);
  const to = providerStation(raw.destination ?? raw.to ?? raw.reservationUpto ?? raw.reservationUpTo);
  const reservationUpTo = providerStation(raw.reservationUpto ?? raw.reservationUpTo ?? raw.destination ?? raw.to);

  return {
    pnr: typeof raw.pnrNumber === 'string' ? raw.pnrNumber : typeof raw.pnr === 'string' ? raw.pnr : requestedPnr,
    trainNumber: typeof raw.trainNumber === 'string' || typeof raw.trainNumber === 'number' ? String(raw.trainNumber) : '',
    trainName: typeof raw.trainName === 'string' ? raw.trainName : '',
    journeyDate: typeof raw.journeyDate === 'string' ? raw.journeyDate : '',
    from,
    to,
    boardingPoint,
    reservationUpTo,
    journeyClass: typeof raw.classCode === 'string' ? raw.classCode : typeof raw.journeyClass === 'string' ? raw.journeyClass : '',
    quota: typeof raw.quota === 'string' ? raw.quota : '',
    chartStatus: typeof chart.status === 'string' ? chart.status : typeof raw.chartStatus === 'string' ? raw.chartStatus : '',
    bookingFare: typeof raw.bookingFare === 'number' ? raw.bookingFare : null,
    observedAt: typeof raw.observedAt === 'string' ? raw.observedAt : undefined,
    passengers,
  };
}

export interface StationBoard {
  station: { code: string; name: string };
  stationCode?: string;
  stationName?: string;
  window?: { from: string; to: string; hoursBack: number; hoursAhead: number };
  count?: number;
  trains: StationBoardTrain[];
}

export interface StationBoardTrain {
  trainNumber: string;
  trainName: string;
  trainType?: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  arrival?: string | null;
  departure?: string | null;
  scheduledArrival?: string | null;
  scheduledDeparture?: string | null;
  expectedArrival?: string | null;
  expectedDeparture?: string | null;
  actualArrival?: string | null;
  actualDeparture?: string | null;
  delay?: number;
  delayMinutes?: number;
  platform: string | null;
  liveStatus?: string;
  journeyStartDate?: string;
}

// ============================================================
// Rate Limiting & Caching
// ============================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxEntries = 500;
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    // Refresh insertion order so the bounded cache behaves as a small LRU.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data as T;
  }
  
  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    if (ttlMs <= 0) return;
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      const now = Date.now();
      for (const [entryKey, entry] of this.cache) {
        if (now - entry.timestamp > entry.ttl) this.cache.delete(entryKey);
      }
      while (this.cache.size >= this.maxEntries) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey === undefined) break;
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests: number = 50, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  waitForSlot(): void {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) throw new Error('Railway data provider request limit reached. Retry shortly.');
    
    this.requests.push(Date.now());
  }
  
  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// ============================================================
// API Client
// ============================================================

const cache = new ApiCache();
const rateLimiter = new RateLimiter(50, 60000); // 50 req/min (buffer from 60 limit)

function getApiKey(): string {
  const key = process.env.RAILWAY_API_KEY;
  if (!key) {
    throw new Error('RAILWAY_API_KEY environment variable is not set');
  }
  return key;
}

function getBaseUrl(): string {
  return process.env.RAILWAY_API_BASE_URL || 'https://railway-engine.apkscope.workers.dev';
}

async function apiRequest<T>(
  endpoint: string,
  options: {
    cacheTtl?: number;
    cacheKey?: string;
  } = {}
): Promise<ApiResponse<T>> {
  const { cacheTtl = 60000, cacheKey } = options;
  const key = cacheKey || endpoint;
  
  // Check cache
  const cached = cacheTtl > 0 ? cache.get<ApiResponse<T>>(key) : null;
  if (cached) {
    return { ...cached, meta: { ...cached.meta, cached: true } };
  }
  
  const url = `${getBaseUrl()}${endpoint}`;
  
  try {
    // Keep provider throttling failures inside the normal API error envelope.
    await rateLimiter.waitForSlot();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': getApiKey(),
        'accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.status === 429) {
      // Respect the provider's Retry-After hint, but don't hold a serverless
      // request open for a long quota window.
      const retryAfter = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter) ? Number(retryAfter) : 5;
      if (retryAfterSeconds > 15) {
        return {
          status: 'ERROR', data: null,
          error: `Railway data provider rate limit reached. Retry after ${Math.ceil(retryAfterSeconds)} seconds.`,
          meta: { requestId: '', generatedAt: new Date().toISOString() },
        };
      }
      await new Promise(resolve => setTimeout(resolve, Math.max(1, retryAfterSeconds) * 1000));
      const retryResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'x-api-key': getApiKey(),
          'accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });
      
      if (!retryResponse.ok) {
        const retryText = await retryResponse.text();
        let retryJson: Record<string, unknown> | null = null;
        try { retryJson = JSON.parse(retryText) as Record<string, unknown>; } catch { /* provider may return plain text */ }
        const retryMessage = providerErrorMessage(retryJson?.error ?? retryJson?.message ?? retryText);
        return {
          status: 'ERROR',
          data: null,
          error: retryResponse.status === 429 ? retryMessage : `Provider retry failed (${retryResponse.status}): ${retryMessage}`,
          meta: retryJson?.meta && typeof retryJson.meta === 'object'
            ? retryJson.meta as ApiResponse<T>['meta']
            : { requestId: '', generatedAt: new Date().toISOString() },
        };
      }
      
      const data = await retryResponse.json() as ApiResponse<T>;
      if (data?.status === 'ERROR') {
        return {
          ...data,
          data: null,
          error: providerErrorMessage(data.error),
          meta: data.meta || { requestId: '', generatedAt: new Date().toISOString() },
        };
      }
      if (cacheTtl > 0) cache.set(key, data, cacheTtl);
      return data;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try { errorJson = JSON.parse(errorText); } catch { errorJson = null; }
      
      return {
        status: 'ERROR',
        data: null,
        error: providerErrorMessage(errorJson?.error ?? errorJson?.message ?? `API returned ${response.status}: ${errorText.slice(0, 200)}`),
        meta: { requestId: errorJson?.meta?.requestId || '', generatedAt: new Date().toISOString() },
      };
    }
    
    const data = await response.json() as ApiResponse<T>;
    if (data?.status === 'ERROR') {
      return {
        ...data,
        data: null,
        error: providerErrorMessage(data.error),
        meta: data.meta || { requestId: '', generatedAt: new Date().toISOString() },
      };
    }
    if (cacheTtl > 0) cache.set(key, data, cacheTtl);
    return data;
  } catch (error) {
    return {
      status: 'ERROR',
      data: null,
      error: error instanceof Error ? error.message : 'Unknown API error',
      meta: { requestId: '', generatedAt: new Date().toISOString() },
    };
  }
}

// ============================================================
// Public API Functions
// ============================================================

/**
 * Get live running status of a train (optional date parameter YYYY-MM-DD)
 */
export async function getTrainStatus(trainNumber: string, date?: string): Promise<ApiResponse<TrainStatus>> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest<TrainStatus>(`/v1/train/${trainNumber}/status${query}`, {
    cacheTtl: 30000, // 30s for live data
  });
}

/**
 * Get full timetable/schedule for a train
 */
export async function getTrainSchedule(trainNumber: string): Promise<ApiResponse<TrainSchedule>> {
  return apiRequest<TrainSchedule>(`/v1/train/${trainNumber}/schedule`, {
    cacheTtl: 3600000, // 1 hour - schedules don't change often
  });
}

/**
 * Get station-by-station route with live timing
 */
export async function getTrainRoute(trainNumber: string): Promise<ApiResponse<TrainRoute>> {
  return apiRequest<TrainRoute>(`/v1/train/${trainNumber}/route`, {
    cacheTtl: 120000, // 2 min
  });
}

/**
 * Get coach composition of a train
 */
export async function getCoachComposition(trainNumber: string): Promise<ApiResponse<CoachComposition>> {
  return apiRequest<CoachComposition>(`/v1/train/${trainNumber}/coaches`, {
    cacheTtl: 3600000, // 1 hour
  });
}

/**
 * Search trains by number or name
 */
export async function searchTrains(query: string): Promise<ApiResponse<TrainSearchResult[]>> {
  return apiRequest<TrainSearchResult[]>(`/v1/trains/search?q=${encodeURIComponent(query)}`, {
    cacheTtl: 300000, // 5 min
  });
}

/**
 * Get station information
 */
export async function getStationInfo(stationCode: string): Promise<ApiResponse<StationInfo>> {
  return apiRequest<StationInfo>(`/v1/station/${stationCode}`, {
    cacheTtl: 86400000, // 24 hours
  });
}

/**
 * Search stations by name or code
 */
export async function searchStations(query: string): Promise<ApiResponse<StationInfo[]>> {
  return apiRequest<StationInfo[]>(`/v1/stations/search?q=${encodeURIComponent(query)}`, {
    cacheTtl: 300000, // 5 min
  });
}

/**
 * Get PNR status
 */
export async function getPnrStatus(pnr: string): Promise<ApiResponse<PnrStatus>> {
  // PNR data is personal reservation data; do not retain it in the process cache.
  const result = await apiRequest<Record<string, unknown>>(`/v1/pnr/${pnr}`, {
    cacheTtl: 0,
  });
  if (result.status === 'ERROR' || !result.data) {
    return { ...result, data: null, error: providerErrorMessage(result.error) };
  }
  return {
    ...result,
    data: {
      ...normalizePnrStatus(result.data, pnr),
      providerStatus: result.status === 'STALE_DATA' ? 'STALE_DATA' : 'SUCCESS',
      meta: result.meta,
    },
  };
}

/**
 * Get station live board (trains arriving and departing in current window)
 */
export async function getStationBoard(stationCode: string): Promise<ApiResponse<StationBoard>> {
  return apiRequest<StationBoard>(`/v1/station/${encodeURIComponent(stationCode.toUpperCase())}/live`, {
    cacheTtl: 60000, // 1 min
  });
}

export interface StationPlatformAssignment {
  station: { code: string; name: string };
  assignments: Array<{
    platform: string;
    confidence: string | null;
    feedbackCount: number | null;
  }>;
}

export interface TrainPlatformsResponse {
  trainNumber: string;
  trainName: string | null;
  journeyDate: string;
  stations: StationPlatformAssignment[];
  observedAt: string;
}

export interface TrainFareResponse {
  trainNumber: string;
  source: string;
  destination: string;
  class: string;
  baseFare?: number;
  totalFare?: number;
  fareBreakdown?: Record<string, number>;
}

/**
 * Get verified station platform numbers for a train across its route
 */
export async function getTrainPlatforms(trainNumber: string): Promise<ApiResponse<TrainPlatformsResponse>> {
  return apiRequest<TrainPlatformsResponse>(`/v1/train/${trainNumber}/platforms`, {
    cacheTtl: 300000, // 5 min
  });
}

/**
 * Get fare enquiry between two stations
 */
export async function getTrainFare(
  trainNumber: string,
  source: string,
  destination: string,
  coachClass: string,
): Promise<ApiResponse<TrainFareResponse>> {
  return apiRequest<TrainFareResponse>(
    `/v1/train/${trainNumber}/fare?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&class=${encodeURIComponent(coachClass)}`,
    {
      cacheTtl: 3600000, // 1 hour
    },
  );
}

/**
 * Health check
 */
export async function getHealthStatus(): Promise<ApiResponse<{ service: string; api: string }>> {
  return apiRequest(`/v1/health`, { cacheTtl: 10000 });
}

export interface ProviderHealth {
  providers: Array<{
    name: string;
    state: string;
    latencyMs: number | null;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    errorCount: number;
    configured: boolean;
    capabilities: string[];
    note: string | null;
  }>;
}

export interface CoverageInfo {
  updatedAt: string;
  overallNote: string;
  capabilities: Array<{
    capability: string;
    available: boolean;
    provider?: string;
  }>;
}

/**
 * Get detailed provider health across all upstream services (whereismytrain, railradar)
 */
export async function getProviderHealth(): Promise<ApiResponse<ProviderHealth>> {
  return apiRequest<ProviderHealth>(`/v1/provider/health`, { cacheTtl: 15000 });
}

/**
 * Get dataset and provider coverage details
 */
export async function getCoverageInfo(): Promise<ApiResponse<CoverageInfo>> {
  return apiRequest<CoverageInfo>(`/v1/coverage`, { cacheTtl: 300000 });
}

/**
 * Get remaining API request capacity
 */
export function getRemainingRequests(): number {
  return rateLimiter.getRemainingRequests();
}

