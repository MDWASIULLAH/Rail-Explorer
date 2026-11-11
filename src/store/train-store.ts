/**
 * Main Application State Store
 *
 * Zustand store that manages the entire application state for the
 * Indian Railway 3D Explorer. All API calls route through Next.js
 * API routes — never directly to Railway Engine.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import type {
  TrainSchedule,
  TrainRoute,
  CoachComposition,
  CoachInfo,
  TrainSearchResult,
  TrainStatus,
  PnrStatus,
  PnrPassenger,
  ApiResponse,
} from '@/lib/railway-api';

// ============================================================
// State Types
// ============================================================

export type ViewMode =
  | 'full-train'
  | 'coach-interior'
  | 'berth-detail'
  | 'walkthrough'
  | 'comparison';

export interface SelectedTrain {
  trainNumber: string;
  trainName: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  classes: string[];
  schedule: TrainSchedule | null;
  route: TrainRoute | null;
  coaches: CoachComposition | null;
}

export interface SelectedCoach {
  coachId: string;
  coachType: string;
  blueprintId: string;
  position: number;
}

export interface SelectedBerth {
  berthNumber: number;
  berthType: string;
  coachId: string;
}

export interface CameraTarget {
  x: number;
  y: number;
  z: number;
}

export interface TrainState {
  // Selection state
  selectedTrain: SelectedTrain | null;
  selectedCoach: SelectedCoach | null;
  selectedBerth: SelectedBerth | null;

  // Data state
  pnrData: PnrStatus | null;
  trainStatus: TrainStatus | null;
  searchResults: TrainSearchResult[];
  searchQuery: string;

  // UI state
  isLoading: boolean;
  error: string | null;
  viewMode: ViewMode;
  cameraTarget: CameraTarget | null;
  comparisonCoaches: [string, string] | null;

  // Actions
  searchTrains: (query: string) => Promise<void>;
  selectTrain: (trainNumber: string) => Promise<void>;
  fetchTrainDetails: (trainNumber: string) => Promise<void>;
  fetchTrainStatus: (trainNumber: string) => Promise<void>;
  lookupPnr: (pnr: string) => Promise<void>;
  selectCoach: (coachId: string, switchViewMode?: boolean) => void;
  selectBerth: (berthNumber: number, coachId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraTarget: (target: CameraTarget | null) => void;
  setComparisonCoaches: (coach1: string, coach2: string) => void;
  clearSelection: () => void;
  clearError: () => void;
}

// ============================================================
// Helper: Internal API fetcher
// ============================================================

async function apiFetch<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  const json = await res.json();
  
  // Handle both formats:
  // Internal API routes: { success, data, error }
  // Railway Engine direct: { status, data, error, meta }
  if (!res.ok) {
    throw new Error(
      json?.error || `Request failed (${res.status})`
    );
  }

  // Normalize to ApiResponse shape
  if ('success' in json) {
    // Internal API route format
    return {
      status: json.success ? 'SUCCESS' : 'ERROR',
      data: json.data,
      error: json.error,
      meta: json.meta || { requestId: '', generatedAt: new Date().toISOString() },
    };
  }

  // Already in Railway Engine format
  return json as ApiResponse<T>;
}

/**
 * Map a coach label (e.g. "S1", "B3") to a blueprint ID.
 *
 * We duplicate a lightweight version of the mapping here so the store
 * doesn't need to import the full coach-database on the client bundle.
 * The canonical map lives in `@/data/coach-database`.
 */
function coachLabelToBlueprintId(label: string): string {
  const upper = label.toUpperCase().trim();

  const map: Record<string, string> = {
    S: 'LHB_SL',
    SL: 'LHB_SL',
    B: 'LHB_3A',
    '3A': 'LHB_3A',
    '3E': 'LHB_3E',
    A: 'LHB_2A',
    '2A': 'LHB_2A',
    H: 'LHB_1A',
    HA: 'LHB_1A',
    '1A': 'LHB_1A',
    C: 'LHB_CC',
    CC: 'LHB_CC',
    GS: 'LHB_GS',
    D: 'LHB_GS',
    G: 'LHB_GS',
    PC: 'LHB_PC',
    PANTRY: 'LHB_PC',
    EOG: 'LHB_EOG',
    GENERATOR: 'LHB_EOG',
    SLR: 'LHB_SLR',
    BRAKE: 'LHB_SLR',
  };

  // Direct match
  if (map[upper]) return map[upper];

  // Prefix match (e.g. "S1" -> "S", "B3" -> "B")
  for (const [prefix, blueprintId] of Object.entries(map)) {
    if (upper.startsWith(prefix) && /\d/.test(upper.slice(prefix.length))) {
      return blueprintId;
    }
  }

  return 'LHB_GS';
}

// ============================================================
// Store
// ============================================================

export const useTrainStore = create<TrainState>()(
  devtools(
    (set, get) => ({
      // ---- Initial state ----
      selectedTrain: null,
      selectedCoach: null,
      selectedBerth: null,
      pnrData: null,
      trainStatus: null,
      searchResults: [],
      searchQuery: '',
      isLoading: false,
      error: null,
      viewMode: 'full-train',
      cameraTarget: null,
      comparisonCoaches: null,

      // ---- Actions ----

      searchTrains: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return;
        }

        set({ isLoading: true, error: null, searchQuery: query });

        try {
          const res = await apiFetch<{ query: string; results: TrainSearchResult[]; count: number } | TrainSearchResult[]>(
            `/api/train/search?q=${encodeURIComponent(query)}`
          );

          if (res.status === 'ERROR' || !res.data) {
            throw new Error(res.error || 'No results found');
          }

          // Handle both response shapes
          const results = Array.isArray(res.data) ? res.data : (res.data as { results?: TrainSearchResult[] }).results || [];
          set({ searchResults: results, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Search failed',
            isLoading: false,
            searchResults: [],
          });
        }
      },

      selectTrain: async (trainNumber: string) => {
        // Pre-populate immediately with verified directory/synthesized data so UI is instantly populated
        const fallbackTrain = getOrSynthesizeTrain(trainNumber);
        const initialSelectedTrain: SelectedTrain = {
          trainNumber: fallbackTrain.trainNumber,
          trainName: fallbackTrain.trainName,
          origin: fallbackTrain.origin,
          destination: fallbackTrain.destination,
          classes: fallbackTrain.classes,
          schedule: null,
          route: null,
          coaches: {
            trainNumber: fallbackTrain.trainNumber,
            trainName: fallbackTrain.trainName,
            rakeType: fallbackTrain.rakeType,
            totalCoaches: fallbackTrain.coaches.length,
            coaches: fallbackTrain.coaches.map((c, i) => ({
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
            })),
          },
        };

        set({
          selectedTrain: initialSelectedTrain,
          selectedCoach: null,
          selectedBerth: null,
          pnrData: null,
          trainStatus: null,
          viewMode: 'full-train',
          cameraTarget: null,
          isLoading: false,
          error: null,
        });

        try {
          // Check search for live name/origin/destination enhancements
          const searchRes = await apiFetch<{ results: TrainSearchResult[] } | TrainSearchResult[]>(
            `/api/train/search?q=${encodeURIComponent(trainNumber)}`
          );

          const searchData = searchRes.data;
          const results = Array.isArray(searchData) ? searchData : (searchData as { results?: TrainSearchResult[] } | null)?.results || [];
          const match = results.find((t: TrainSearchResult) => t.trainNumber === trainNumber);

          if (match) {
            set((state) => ({
              selectedTrain: state.selectedTrain ? {
                ...state.selectedTrain,
                trainName: match.trainName || state.selectedTrain.trainName,
                origin: match.origin || state.selectedTrain.origin,
                destination: match.destination || state.selectedTrain.destination,
                classes: match.classes || state.selectedTrain.classes,
              } : null,
            }));
          }

          // Fetch full details
          get().fetchTrainDetails(trainNumber);
        } catch {
          // Gracefully fallback to background details fetch
          get().fetchTrainDetails(trainNumber);
        }
      },

      fetchTrainDetails: async (trainNumber: string) => {
        set({ isLoading: true, error: null });

        // Fetch schedule, route, coaches, and live status in parallel
        const [scheduleRes, routeRes, coachesRes, statusRes] = await Promise.allSettled([
          apiFetch<TrainSchedule>(
            `/api/train/${trainNumber}/schedule`
          ),
          apiFetch<TrainRoute>(
            `/api/train/${trainNumber}/route`
          ),
          apiFetch<CoachComposition>(
            `/api/train/${trainNumber}/coaches`
          ),
          apiFetch<TrainStatus>(
            `/api/train/${trainNumber}/status`
          ),
        ]);

        const schedule =
          scheduleRes.status === 'fulfilled' &&
          scheduleRes.value.status === 'SUCCESS'
            ? scheduleRes.value.data
            : null;

        const route =
          routeRes.status === 'fulfilled' &&
          routeRes.value.status === 'SUCCESS'
            ? routeRes.value.data
            : null;

        const coaches =
          coachesRes.status === 'fulfilled' &&
          coachesRes.value.status === 'SUCCESS'
            ? coachesRes.value.data
            : null;

        const trainStatus =
          statusRes.status === 'fulfilled' &&
          statusRes.value.status === 'SUCCESS'
            ? statusRes.value.data
            : null;

        const currentTrain = get().selectedTrain;
        if (!currentTrain || currentTrain.trainNumber !== trainNumber) {
          // User navigated away while we were loading
          return;
        }

        // Collect any errors
        const errors: string[] = [];
        if (
          scheduleRes.status === 'rejected' ||
          (scheduleRes.status === 'fulfilled' &&
            scheduleRes.value.status === 'ERROR')
        ) {
          errors.push('Schedule unavailable');
        }
        if (
          routeRes.status === 'rejected' ||
          (routeRes.status === 'fulfilled' &&
            routeRes.value.status === 'ERROR')
        ) {
          errors.push('Route unavailable');
        }
        if (
          coachesRes.status === 'rejected' ||
          (coachesRes.status === 'fulfilled' &&
            coachesRes.value.status === 'ERROR')
        ) {
          errors.push('Coach composition unavailable');
        }

        set({
          selectedTrain: {
            ...currentTrain,
            schedule: schedule || currentTrain.schedule,
            route: route || currentTrain.route,
            coaches: coaches || currentTrain.coaches,
            // Also update classes from schedule if we got it
            classes: schedule?.classes ?? currentTrain.classes,
          },
          trainStatus: trainStatus ?? get().trainStatus,
          isLoading: false,
          error: null, // Graceful offline/fallback; no noisy banner
        });
      },

      fetchTrainStatus: async (trainNumber: string) => {
        try {
          const result = await apiFetch<TrainStatus>(`/api/train/${trainNumber}/status`);
          const currentTrain = get().selectedTrain;
          if (!currentTrain || currentTrain.trainNumber !== trainNumber) return;
          set({ trainStatus: result.status === 'SUCCESS' ? result.data : null });
        } catch {
          const currentTrain = get().selectedTrain;
          if (currentTrain?.trainNumber === trainNumber) set({ trainStatus: null });
        }
      },

      lookupPnr: async (pnr: string) => {
        const sanitized = pnr.replace(/\D/g, '');
        if (sanitized.length !== 10) {
          set({ error: 'PNR must be a 10-digit number' });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const res = await apiFetch<PnrStatus>(
            `/api/pnr/${sanitized}`
          );

          if (res.status === 'ERROR' || !res.data) {
            throw new Error(res.error || 'PNR not found');
          }

          const pnrData = res.data;

          // If we have a PNR, auto-select the train too
          const currentTrain = get().selectedTrain;
          if (!currentTrain || currentTrain.trainNumber !== pnrData.trainNumber) {
            await get().selectTrain(pnrData.trainNumber);
          }

          // selectTrain clears previous PNR data as part of its reset; publish this
          // lookup only after the train change so the fresh result remains visible.
          set({ pnrData, isLoading: false, error: null });

          // Auto-select the first passenger's coach and berth if available
          const firstPassenger: PnrPassenger | undefined =
            pnrData.passengers?.[0];
          if (firstPassenger?.coachId) {
            get().selectCoach(firstPassenger.coachId);
            if (firstPassenger.berthNumber != null) {
              get().selectBerth(
                firstPassenger.berthNumber,
                firstPassenger.coachId
              );
            }
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'PNR lookup failed',
            isLoading: false,
            pnrData: null,
          });
        }
      },

      selectCoach: (coachId: string, switchViewMode: boolean = false) => {
        const { selectedTrain } = get();
        // Look up coach from train composition if available
        const coach = selectedTrain?.coaches?.coaches.find(
          (c: CoachInfo) => c.coachId === coachId
        );

        // Deduce coach type and position
        const coachType = coach?.coachType || coachId.replace(/\d/g, '') || 'SL';
        const position = coach?.position || 1;
        const blueprintId = coachLabelToBlueprintId(coachType || coachId);

        set((state) => ({
          selectedCoach: {
            coachId,
            coachType,
            blueprintId,
            position,
          },
          selectedBerth: {
            berthNumber: 1,
            berthType: 'LB',
            coachId,
          },
          viewMode: switchViewMode ? 'coach-interior' : state.viewMode,
          error: null, // Clear any stale error banner so user views interior cleanly
        }));
      },

      selectBerth: (berthNumber: number, coachId: string) => {
        const { selectedCoach } = get();

        // If coach isn't selected yet, select it first
        if (!selectedCoach || selectedCoach.coachId !== coachId) {
          get().selectCoach(coachId);
        }

        const currentCoach = get().selectedCoach;
        if (!currentCoach) return;

        // Infer berth type from number and blueprint
        // (The 3D component will do the precise lookup from the blueprint)
        let berthType = 'LB';
        const mod = berthNumber % 8;
        if (mod === 1 || mod === 4) berthType = 'LB';
        else if (mod === 2 || mod === 5) berthType = 'MB';
        else if (mod === 3 || mod === 6) berthType = 'UB';
        else if (mod === 7) berthType = 'SL';
        else if (mod === 0) berthType = 'SU';

        set({
          selectedBerth: {
            berthNumber,
            berthType,
            coachId,
          },
          viewMode: 'berth-detail',
        });
      },

      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      setCameraTarget: (target: CameraTarget | null) => {
        set({ cameraTarget: target });
      },

      setComparisonCoaches: (coach1: string, coach2: string) => {
        set({
          comparisonCoaches: [coach1, coach2],
          viewMode: 'comparison',
        });
      },

      clearSelection: () => {
        set({
          selectedTrain: null,
          selectedCoach: null,
          selectedBerth: null,
          pnrData: null,
          trainStatus: null,
          searchResults: [],
          searchQuery: '',
          viewMode: 'full-train',
          cameraTarget: null,
          comparisonCoaches: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'train-store' }
  )
);
