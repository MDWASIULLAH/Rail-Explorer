'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import TrainStatusHeader from '@/components/live-status/TrainStatusHeader';
import HorizontalRouteProgress from '@/components/live-status/HorizontalRouteProgress';
import VerticalRailwayTimeline from '@/components/live-status/VerticalRailwayTimeline';
import StickyBottomStatusBar from '@/components/live-status/StickyBottomStatusBar';
import { analyzeLiveJourney, type LiveJourneyAnalysis } from '@/lib/live-tracking-engine';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { Loader2, AlertCircle } from 'lucide-react';

// Dynamic import for MapLibre GL Map (SSR false)
const LiveMapTracker = dynamic(
  () => import('@/components/live-status/LiveMapTracker'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] bg-slate-900 flex items-center justify-center rounded-2xl border border-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading MapLibre Vector Engine & OpenFreeMap...</p>
        </div>
      </div>
    ),
  }
);

function LiveStatusContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trainNumber = (params.number as string) || '18403';
  const initialDate = searchParams?.get('date') === 'yesterday' ? 'Yesterday' : searchParams?.get('date') === 'tomorrow' ? 'Tomorrow' : 'Today';

  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [viewMode, setViewMode] = useState<'timeline' | 'map' | 'combined'>('combined');
  const [selectedStationCode, setSelectedStationCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [journeyData, setJourneyData] = useState<LiveJourneyAnalysis | null>(null);
  const [statusWarning, setStatusWarning] = useState<string | null>(null);
  const latestRequestId = useRef(0);

  // Default to Timeline view on mobile (< 1024px) for Where Is My Train / ConfirmTkt experience
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const frame = window.requestAnimationFrame(() => setViewMode('timeline'));
      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  const fetchLiveStatus = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setIsRefreshing(true);
    try {
      // Parallel fetch schedule and status from API
      const dateQuery = selectedDate ? `?date=${encodeURIComponent(selectedDate.toLowerCase())}` : '';
      const [schedRes, statRes] = await Promise.allSettled([
        fetch(`/api/train/${trainNumber}/schedule`).then((r) => r.json()),
        fetch(`/api/train/${trainNumber}/status${dateQuery}`).then((r) => r.json()),
      ]);

      const scheduleData =
        schedRes.status === 'fulfilled' && schedRes.value.success
          ? schedRes.value.data
          : getOrSynthesizeTrain(trainNumber);

      // Never substitute generated train movement for a failed live feed.
      const statusData =
        statRes.status === 'fulfilled' && statRes.value.success
          ? statRes.value.data
          : null;
      const warning = statRes.status === 'fulfilled' && !statRes.value.success && typeof statRes.value.error === 'string'
        ? statRes.value.error
        : statRes.status === 'rejected'
          ? 'Live train status is temporarily unavailable.'
          : null;

      const analysis = analyzeLiveJourney(
        trainNumber,
        scheduleData.trainName || `Train ${trainNumber}`,
        scheduleData,
        statusData,
        selectedDate,
      );

      if (requestId === latestRequestId.current) {
        setJourneyData(analysis);
        setStatusWarning(warning);
      }
    } catch {
      // Graceful fallback from local synthesized directory
      const train = getOrSynthesizeTrain(trainNumber);
      const analysis = analyzeLiveJourney(
        trainNumber,
        train.trainName,
        train,
        null,
        selectedDate,
      );
      if (requestId === latestRequestId.current) setJourneyData(analysis);
      if (requestId === latestRequestId.current) setStatusWarning('Live train status is temporarily unavailable.');
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [trainNumber, selectedDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchLiveStatus(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchLiveStatus]);

  // Refresh from the provider on its 30 second cache cadence. The marker is
  // deliberately not animated between reports because that would imply GPS precision.
  useEffect(() => {
    const timer = window.setInterval(fetchLiveStatus, 30_000);
    return () => window.clearInterval(timer);
  }, [fetchLiveStatus]);

  if (isLoading || !journeyData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Tracking Train {trainNumber}...</h2>
          <p className="text-xs text-slate-400">Checking the train status provider</p>
        </div>
      </div>
    );
  }

  if (journeyData.totalStops === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-white grid place-items-center px-5">
        <section className="max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center shadow-xl">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
          <h1 className="text-lg font-bold">Route data unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">A verified schedule for train {trainNumber} is not available right now. Check the number or try again later.</p>
          <button onClick={fetchLiveStatus} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32">
      {/* Top Status Header */}
      <TrainStatusHeader
        journey={journeyData}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onRefresh={fetchLiveStatus}
        isRefreshing={isRefreshing}
        selectedDate={selectedDate}
        onChangeDate={setSelectedDate}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {statusWarning && (
          <div role="status" className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            {statusWarning}
          </div>
        )}
        {/* Horizontal Journey Progress Card */}
        <HorizontalRouteProgress journey={journeyData} />

        {/* Dynamic View Display: Timeline / Map / Combined */}
        {viewMode === 'timeline' && (
          <div className="max-w-4xl mx-auto">
            <VerticalRailwayTimeline
              journey={journeyData}
              selectedStationCode={selectedStationCode}
              onSelectStation={(stn) => setSelectedStationCode(stn.stationCode)}
            />
          </div>
        )}

        {viewMode === 'map' && (
          <div className="w-full h-[680px]">
            <LiveMapTracker
              journey={journeyData}
              selectedStationCode={selectedStationCode}
              onSelectStation={(code) => setSelectedStationCode(code)}
            />
          </div>
        )}

        {viewMode === 'combined' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Map Column (5 cols on desktop) */}
            <div className="lg:col-span-5 h-[450px] lg:h-[650px] lg:sticky lg:top-6">
              <LiveMapTracker
                journey={journeyData}
                selectedStationCode={selectedStationCode}
                onSelectStation={(code) => setSelectedStationCode(code)}
              />
            </div>

            {/* Station Timeline Column (7 cols on desktop) */}
            <div className="lg:col-span-7">
              <VerticalRailwayTimeline
                journey={journeyData}
                selectedStationCode={selectedStationCode}
                onSelectStation={(stn) => setSelectedStationCode(stn.stationCode)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Status Bar matching Where Is My Train */}
      <StickyBottomStatusBar
        journey={journeyData}
        onRefresh={fetchLiveStatus}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}

export default function LiveStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        </div>
      }
    >
      <LiveStatusContent />
    </Suspense>
  );
}

