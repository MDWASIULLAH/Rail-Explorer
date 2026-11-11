'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  MapPin,
  Eye,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface StationBoardTrain {
  trainNumber: string;
  trainName: string;
  trainType?: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  arrival?: string | null;
  departure?: string | null;
  expectedArrival?: string | null;
  expectedDeparture?: string | null;
  delayMinutes?: number;
  platform: string | null;
  liveStatus?: string;
}

interface StationBoardData {
  station: { code: string; name: string };
  window?: { from: string; to: string; hoursBack: number; hoursAhead: number };
  count?: number;
  trains: StationBoardTrain[];
  meta?: {
    generatedAt?: string;
    source?: string;
    cached?: boolean;
    freshness?: {
      ageSeconds: number;
      state: 'LIVE' | 'RECENT' | 'STALE';
      provider: string;
    };
  };
}

const POPULAR_STATIONS = [
  { code: 'BBS', name: 'Bhubaneswar' },
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'HWH', name: 'Howrah Jn' },
  { code: 'PURI', name: 'Puri' },
  { code: 'CSMT', name: 'Mumbai CSMT' },
  { code: 'MAS', name: 'Chennai Central' },
  { code: 'DHN', name: 'Dhanbad Jn' },
  { code: 'ROU', name: 'Rourkela' },
  { code: 'ANGL', name: 'Angul' },
];

function StationBoardContent() {
  const params = useParams();
  const router = useRouter();
  const stationCode = ((params.code as string) || 'BBS').toUpperCase();

  const [searchInput, setSearchInput] = useState('');
  const [boardData, setBoardData] = useState<StationBoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'UPCOMING' | 'DEPARTED'>('ALL');

  const freshness = boardData?.meta?.freshness;
  const updateLabel = freshness
    ? freshness.state === 'LIVE'
      ? 'Updated just now'
      : freshness.state === 'RECENT'
        ? `Provider update · ${Math.max(1, Math.floor(freshness.ageSeconds / 60))} min ago`
        : 'Provider data may be out of date'
    : boardData?.meta?.cached
      ? 'Cached provider data'
      : 'Provider schedule data';

  const fetchBoard = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/station/${stationCode}/board`);
      const json = await res.json();
      if (json.success && json.data) {
        setBoardData(json.data);
        setLoadError('');
      } else {
        setLoadError(json.error || 'The station board could not be loaded. Try again shortly.');
      }
    } catch (err) {
      console.error('Failed to load station board', err);
      setLoadError('The station board could not be reached. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchBoard();
  }, [stationCode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchInput.trim().toUpperCase();
    if (clean) {
      router.push(`/station/${clean}`);
    }
  };

  const filteredTrains = useMemo(() => {
    if (!boardData?.trains) return [];
    return boardData.trains.filter((t) => {
      if (filterType === 'UPCOMING') return t.liveStatus !== 'departed';
      if (filterType === 'DEPARTED') return t.liveStatus === 'departed';
      return true;
    });
  }, [boardData?.trains, filterType]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 sm:py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${freshness?.state === 'LIVE' ? 'bg-emerald-400' : freshness?.state === 'RECENT' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                <span className="text-xs uppercase font-bold text-emerald-300 tracking-wide">
                  Station Arrivals & Departures
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">{updateLabel}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white mt-2 flex items-center gap-2">
                <span>{boardData?.station?.name || stationCode}</span>
                <span className="text-amber-400 font-mono">({stationCode})</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Provider-reported platforms, expected times and train status. Check station displays for last-minute changes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchBoard}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh Board'}</span>
              </button>
            </div>
          </div>

          {/* Search + Popular Stations Bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Station Code (e.g. BBS)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white uppercase placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition"
              >
                Go
              </button>
            </form>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-1">
              <span className="text-slate-500 text-[11px] shrink-0 font-medium">Popular:</span>
              {POPULAR_STATIONS.map((stn) => (
                <Link
                  key={stn.code}
                  href={`/station/${stn.code}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                    stn.code === stationCode
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {stn.name} ({stn.code})
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Toggle Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredTrains.length}</strong> trains in current live window
          </div>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'UPCOMING', 'DEPARTED'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterType(mode)}
                className={`px-3 py-1 rounded-md font-bold transition text-xs ${
                  filterType === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'ALL' ? 'All Trains' : mode === 'UPCOMING' ? 'Upcoming' : 'Departed'}
              </button>
            ))}
          </div>
        </div>

        {/* Trains Board Table */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="text-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="text-sm font-semibold text-white">Loading Live Station Telemetry...</p>
              <p className="text-xs text-slate-500 mt-1">Connecting to Railway Engine for {stationCode}</p>
            </div>
          ) : filteredTrains.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto text-amber-400/70 mb-3" />
              <p className="text-base font-bold text-white">{loadError ? 'Station data unavailable' : 'No trains scheduled in this window'}</p>
              <p className="text-xs text-slate-400 mt-1">{loadError || 'Try another station or switch the current filter.'}</p>
              {loadError && <button type="button" onClick={fetchBoard} className="mt-4 min-h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white">Try again</button>}
            </div>
          ) : (
            <>
            <div className="md:hidden divide-y divide-slate-800/70">
              {filteredTrains.map((train) => {
                const delay = train.delayMinutes ?? 0;
                const hasDelayReport = typeof train.delayMinutes === 'number';
                const isDeparted = train.liveStatus === 'departed';
                const expected = train.expectedArrival || train.expectedDeparture;
                return (
                  <article key={train.trainNumber} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-bold text-amber-300">{train.trainNumber}</p>
                        <h2 className="text-sm font-semibold leading-snug text-white">{train.trainName}</h2>
                        {train.trainType && <span className="mt-1 inline-block rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">{train.trainType}</span>}
                      </div>
                      <span className="shrink-0 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 font-mono text-xs font-semibold text-amber-200">
                        {train.platform ? `PF ${train.platform}` : 'Platform pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="min-w-0 truncate">{train.origin?.name} ({train.origin?.code})</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="min-w-0 truncate">{train.destination?.name} ({train.destination?.code})</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-950/70 p-2.5">
                        <span className="block text-[10px] uppercase tracking-wide text-slate-500">Scheduled</span>
                        <span className="mt-1 block font-mono text-slate-200">
                          {train.arrival ? `Arr ${train.arrival}` : 'Arr —'}{train.departure ? ` · Dep ${train.departure}` : ''}
                        </span>
                      </div>
                      <div className="rounded-lg bg-slate-950/70 p-2.5">
                        <span className="block text-[10px] uppercase tracking-wide text-slate-500">Expected</span>
                        <span className={`mt-1 block font-mono font-semibold ${delay > 5 ? 'text-rose-300' : 'text-emerald-300'}`}>
                          {expected?.slice(11, 16) || expected || '—'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDeparted || !hasDelayReport ? 'bg-slate-800 text-slate-400' : delay > 0 ? 'bg-rose-500/10 text-rose-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                        {isDeparted ? 'Departed' : delay > 0 ? `Late by ${delay} min` : hasDelayReport ? 'No delay reported' : 'Status not reported'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link href={`/live-status/${train.trainNumber}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200">
                          <Navigation className="h-3.5 w-3.5" /> Track
                        </Link>
                        <Link href={`/train/${train.trainNumber}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white">
                          <Eye className="h-3.5 w-3.5" /> 3D
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">Train</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3 text-center">Platform</th>
                    <th className="px-4 py-3">Scheduled</th>
                    <th className="px-4 py-3">Expected</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTrains.map((train) => {
                    const isDeparted = train.liveStatus === 'departed';
                    const delay = train.delayMinutes ?? 0;
                    const hasDelayReport = typeof train.delayMinutes === 'number';
                    const isDelayed = delay > 0;

                    return (
                      <tr
                        key={train.trainNumber}
                        className={`transition hover:bg-slate-800/40 ${
                          isDeparted ? 'opacity-60 bg-slate-950/30' : ''
                        }`}
                      >
                        {/* Train Name & Number */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-base font-black text-amber-400">
                            {train.trainNumber}
                          </div>
                          <div className="font-bold text-white text-xs sm:text-sm truncate max-w-[200px]">
                            {train.trainName}
                          </div>
                          {train.trainType && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                              {train.trainType}
                            </span>
                          )}
                        </td>

                        {/* Origin -> Destination */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs text-slate-300 font-medium">
                            {train.origin?.name} ({train.origin?.code})
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                            <span>{train.destination?.name} ({train.destination?.code})</span>
                          </div>
                        </td>

                        {/* Platform */}
                        <td className="px-4 py-3.5 text-center font-mono">
                          {train.platform ? (
                            <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
                              PF {train.platform}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">--</span>
                          )}
                        </td>

                        {/* Scheduled Times */}
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                          {train.arrival ? `Arr: ${train.arrival}` : ''}
                          {train.arrival && train.departure ? ' · ' : ''}
                          {train.departure ? `Dep: ${train.departure}` : ''}
                        </td>

                        {/* Expected Times */}
                        <td className="px-4 py-3.5 font-mono text-xs">
                          {train.expectedArrival ? (
                            <span className={isDelayed ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              {train.expectedArrival.slice(11, 16)}
                            </span>
                          ) : train.expectedDeparture ? (
                            <span className={isDelayed ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                              {train.expectedDeparture.slice(11, 16)}
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          {isDeparted ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold">
                              Departed
                            </span>
                          ) : isDelayed ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                              Late by {delay}m
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${hasDelayReport ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              {hasDelayReport ? 'No delay reported' : 'Status not reported'}
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/live-status/${train.trainNumber}`}
                              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-500/30 transition flex items-center gap-1"
                              title="Track Live"
                            >
                              <Navigation className="w-3 h-3" />
                              <span className="hidden sm:inline">Track</span>
                            </Link>

                            <Link
                              href={`/train/${train.trainNumber}`}
                              className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white rounded-lg text-xs font-bold border border-blue-500/30 transition flex items-center gap-1"
                              title="3D Explorer"
                            >
                              <Eye className="w-3 h-3" />
                              <span className="hidden sm:inline">3D</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StationBoardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span>Loading Station Departure Board...</span>
          </div>
        </div>
      }
    >
      <StationBoardContent />
    </Suspense>
  );
}

