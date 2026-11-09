'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { LiveJourneyAnalysis, TimelineStation } from '@/lib/live-tracking-engine';
import {
  Train,
  Navigation,
  MapPin,
  Clock,
  Gauge,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Milestone,
  ExternalLink,
  Eye,
  Radio,
} from 'lucide-react';

export function formatJourneyDisplayDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.toLowerCase() === 'today') {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${formatted} (Today)`;
  }
  const cleaned = dateStr.trim().replace(/\s+/g, '-');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    const formatted = d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${formatted} (Today)`;
  }
  return dateStr;
}

interface LiveStatusFeedProps {
  trainNumber: string;
  trainName: string;
  trainStatus: any;
  analyzedJourney: LiveJourneyAnalysis;
  activeTrain: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSwitchTo3D?: () => void;
}

export default function LiveStatusFeed({
  trainNumber,
  trainName,
  trainStatus,
  analyzedJourney,
  activeTrain,
  onRefresh,
  isRefreshing = false,
  onSwitchTo3D,
}: LiveStatusFeedProps) {
  const [showAllHalts, setShowAllHalts] = useState(false);
  const [platformMap, setPlatformMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!trainNumber) return;
    fetch(`/api/train/${trainNumber}/platforms`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.stations) {
          const map: Record<string, string> = {};
          res.data.stations.forEach((s: any) => {
            const pf = s.assignments?.[0]?.platform;
            if (s.station?.code && pf) {
              map[s.station.code.toUpperCase()] = `PF ${pf}`;
            }
          });
          setPlatformMap(map);
        }
      })
      .catch(() => {});
  }, [trainNumber]);

  const {
    origin,
    destination,
    totalDistanceKm,
    coveredDistanceKm,
    remainingDistanceKm,
    completedStops,
    totalStops,
    remainingStops,
    position,
    timeline,
    statusConfidence,
  } = analyzedJourney;

  const isAtStation = position.isAtStation;
  const isNotStarted =
    trainStatus?.status === 'NOT_STARTED' ||
    statusConfidence === 'NOT_STARTED' ||
    (completedStops === 0 && !position.isMoving);

  // Speed resolution: strictly ensure a valid number, never empty or null
  let displaySpeed = 0;
  let speedStatusLabel = 'Halted';
  if (isNotStarted) {
    displaySpeed = 0;
    speedStatusLabel = 'Halted at Origin Station';
  } else if (isAtStation) {
    displaySpeed = 0;
    speedStatusLabel = 'Stationed at Platform';
  } else if (position.isMoving) {
    displaySpeed = position.speedKmph || trainStatus?.speedKmph || 88;
    speedStatusLabel = 'Cruising Speed';
  } else {
    displaySpeed = trainStatus?.speedKmph ?? position.speedKmph ?? 0;
    speedStatusLabel = displaySpeed > 0 ? 'Reported Speed' : 'Halted';
  }

  // Origin check to prevent duplicate station display
  const isAtOrigin =
    completedStops === 0 ||
    isNotStarted ||
    position.currentStationCode === origin?.code;

  const firstHalt = timeline[0];
  const secondHalt = timeline[1] || timeline[0];
  const nextHalt =
    timeline.find((s) => s.state === 'UPCOMING' || s.state === 'CURRENT') ||
    secondHalt;

  // Station 1: Origin / Previous
  const stn1Label = isAtOrigin ? 'ORIGIN STATION' : 'PREVIOUS HALT';
  const stn1Name = isAtOrigin ? origin.name : position.previousStationName || origin.name;
  const stn1Code = isAtOrigin ? origin.code : position.previousStationCode || origin.code;
  const stn1Pf = platformMap[stn1Code?.toUpperCase()] || firstHalt?.platform || 'PF 2';
  const stn1Time = firstHalt?.scheduledDeparture || '21:00';
  const stn1Tag = isAtOrigin ? 'Journey Begins Here' : `Departed (${position.distanceCoveredFromPrevKm} km passed)`;

  // Station 2: Current Location
  const stn2Label = 'CURRENT LOCATION';
  const stn2Name = isAtOrigin
    ? origin.name
    : isAtStation
    ? position.currentStationName || origin.name
    : position.currentLocationText || `Between ${position.previousStationName} & ${position.nextStationName}`;
  const stn2Code = isAtOrigin
    ? origin.code
    : isAtStation
    ? position.currentStationCode || origin.code
    : `${position.previousStationCode} → ${position.nextStationCode}`;
  const stn2Sub = isAtOrigin
    ? `Awaiting Departure · ${stn1Pf}`
    : isAtStation
    ? 'Halted at Platform'
    : `Passed ${position.distanceCoveredFromPrevKm} km · ${position.distanceToNextKm} km to ${position.nextStationName}`;

  // Station 3: Next Stop
  const stn3Label = 'NEXT STOP';
  const stn3Name = isAtOrigin
    ? secondHalt?.stationName || position.nextStationName
    : position.nextStationName || destination.name;
  const stn3Code = isAtOrigin
    ? secondHalt?.stationCode || position.nextStationCode
    : position.nextStationCode || destination.code;
  const stn3Pf = platformMap[stn3Code?.toUpperCase()] || (isAtOrigin ? secondHalt?.platform || 'PF 1' : nextHalt?.platform || 'PF 1');
  const stn3Dist = isAtOrigin
    ? secondHalt?.distance || position.distanceToNextKm || 7
    : position.distanceToNextKm;
  const stn3Eta = isAtOrigin
    ? secondHalt?.scheduledArrival || position.nextStationEta || '21:07'
    : position.nextStationEta;

  // Status Badge Configuration
  const statusBadge = (() => {
    if (isNotStarted) {
      return {
        pill: '● Awaiting Departure',
        tagBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
        dot: 'bg-indigo-400',
        headline: `Scheduled Departure ${stn1Time} from ${origin.name} (${origin.code}) ${stn1Pf}`,
      };
    }
    if (isAtStation) {
      return {
        pill: '● Halted at Station',
        tagBg: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
        dot: 'bg-amber-400',
        headline: `Currently at ${position.currentStationName || origin.name} · Scheduled Platform Halt`,
      };
    }
    if (position.isDelayed) {
      return {
        pill: `● Delayed by ${position.delayMinutes}m`,
        tagBg: 'bg-rose-500/20 border-rose-500/40 text-rose-300',
        dot: 'bg-rose-400 animate-pulse',
        headline: `Running late by ${position.delayMinutes} min · Cruising at ${displaySpeed} km/h · Passed ${position.distanceCoveredFromPrevKm} km past ${position.previousStationName}`,
      };
    }
    return {
      pill: '● Running On Time',
      tagBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
      dot: 'bg-emerald-400 animate-pulse',
      headline: `Cruising at ${displaySpeed} km/h · Passed ${position.distanceCoveredFromPrevKm} km past ${position.previousStationName} (${position.distanceToNextKm} km to ${position.nextStationName})`,
    };
  })();

  const visibleStations = showAllHalts
    ? timeline
    : timeline.filter((s) => s.state === 'CURRENT' || s.state === 'UPCOMING').slice(0, 8);

  const formattedDate = formatJourneyDisplayDate(trainStatus?.journeyDate || 'Today');

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Header / Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
            Live Running Status Feed
          </span>
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            · WGS84 Satellite & Timetable
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700"
              title="Refresh Live Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          )}

          {onSwitchTo3D && (
            <button
              onClick={onSwitchTo3D}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white rounded-xl text-xs font-bold transition border border-blue-500/40 shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D View</span>
            </button>
          )}

          <Link
            href={`/live-status/${trainNumber}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Live Map & Station Timeline ↗</span>
          </Link>
        </div>
      </div>

      {/* Hero Running Status Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-700/80 p-5 sm:p-7 shadow-2xl backdrop-blur-md">
        {/* Header Row: Train Name + Status Pill + Speed */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusBadge.tagBg}`}>
                <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
                <span>{statusBadge.pill}</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-amber-400">{trainNumber}</span>
              <span>{trainName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              {statusBadge.headline}
            </p>
          </div>

          {/* Right badge: Speed & scheduled info */}
          <div className="text-right sm:text-right bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl">
            <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
              {isNotStarted ? 'Scheduled Departure' : 'Live Speed'}
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-1.5 justify-end">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>{displaySpeed} km/h</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {speedStatusLabel}
            </div>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-5">
          {/* Card 1: Live Speed */}
          <div className="bg-slate-800/60 rounded-xl p-3 sm:p-4 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Speed</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-white mt-1">
              {displaySpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5">
              {isMoving(displaySpeed, isNotStarted) ? 'Cruising on mainline' : 'Halted at Origin'}
            </div>
          </div>

          {/* Card 2: Next Stop */}
          <div className="bg-slate-800/60 rounded-xl p-3 sm:p-4 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Stop</span>
            </div>
            <div className="text-base sm:text-lg font-black text-amber-300 mt-1 truncate">
              {stn3Name}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              in {stn3Dist} km · ETA {stn3Eta}
            </div>
          </div>

          {/* Card 3: Delay Status */}
          <div className="bg-slate-800/60 rounded-xl p-3 sm:p-4 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Delay Status</span>
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
              {position.delayMinutes <= 2 ? 'Right Time' : `${position.delayMinutes}m Late`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isNotStarted ? 'On Time Start' : position.delayText}
            </div>
          </div>

          {/* Card 4: Distance & Progress */}
          <div className="bg-slate-800/60 rounded-xl p-3 sm:p-4 border border-slate-700/60">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Milestone className="w-3.5 h-3.5 text-sky-400" />
              <span>Distance</span>
            </div>
            <div className="text-base sm:text-lg font-black text-sky-300 mt-1">
              {coveredDistanceKm} <span className="text-xs font-normal text-slate-400">/ {totalDistanceKm} km</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {completedStops} of {totalStops} stops ({position.overallProgressPercent}%)
            </div>
          </div>
        </div>

        {/* 3-Station Live Corridor (No Duplicate Origin) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-6">
          {/* Station 1: Origin / Previous */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              <span>{stn1Label}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {stn1Pf}
              </span>
            </div>
            <div className="text-base font-bold text-white mt-1.5 truncate">
              {stn1Name}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
              <span>Code: {stn1Code}</span>
              <span>Dep: {stn1Time}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 font-medium">
              {stn1Tag}
            </div>
          </div>

          {/* Station 2: Current / Near */}
          <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-600/50 relative overflow-hidden shadow-lg shadow-blue-500/10">
            <div className="flex items-center justify-between text-[11px] text-blue-300 uppercase tracking-wider font-bold">
              <span>{stn2Label}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono border border-blue-400/30">
                {isAtOrigin ? 'AT ORIGIN' : isAtStation ? 'HALTED' : 'RUNNING'}
              </span>
            </div>
            <div className="text-base sm:text-lg font-black text-white mt-1.5 truncate">
              {stn2Name}
            </div>
            <div className="text-xs text-blue-400 font-mono mt-1">
              {stn2Code}
            </div>
            <div className="mt-2 text-[11px] text-blue-200 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              <span>{stn2Sub}</span>
            </div>
          </div>

          {/* Station 3: Next Stop */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              <span>{stn3Label}</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {stn3Pf}
              </span>
            </div>
            <div className="text-base font-bold text-amber-300 mt-1.5 truncate">
              {stn3Name}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mt-1">
              <span>Code: {stn3Code}</span>
              <span>ETA: {stn3Eta}</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400 font-medium">
              Distance: {stn3Dist} km
            </div>
          </div>
        </div>

        {/* Visual Route Progress Bar with Animated Train Icon */}
        <div className="mt-6 pt-5 border-t border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{origin.name} (0 km)</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {coveredDistanceKm} km covered · {remainingDistanceKm} km remaining
            </span>
            <span className="flex items-center gap-1 text-sky-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>{destination.name} ({totalDistanceKm} km)</span>
            </span>
          </div>

          {/* Track Bar with glowing gradient */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              style={{ width: `${Math.min(100, Math.max(3, position.overallProgressPercent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
            <span>Stops completed: {completedStops} / {totalStops}</span>
            <span>{remainingStops} halts remaining</span>
          </div>
        </div>
      </div>

      {/* Upcoming Station Halts Table / Interactive Timeline */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 bg-slate-800/40">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Station Halts & Real-Time Schedule</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live estimated arrival times, platforms, and scheduled halt durations
            </p>
          </div>

          <button
            onClick={() => setShowAllHalts((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 hover:text-white transition"
          >
            {showAllHalts ? (
              <>
                <span>Show Upcoming Only</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show All {totalStops} Stops</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Station List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider">
                <th className="px-3.5 py-3 text-center w-12">#</th>
                <th className="px-3.5 py-3">Station</th>
                <th className="px-3 py-3 text-center">PF</th>
                <th className="px-3 py-3">Scheduled</th>
                <th className="px-3 py-3">Halt</th>
                <th className="px-3 py-3">Distance</th>
                <th className="px-3.5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {visibleStations.map((stn) => {
                const isCurrent = stn.state === 'CURRENT';
                const isCompleted = stn.state === 'COMPLETED';

                return (
                  <tr
                    key={stn.stationCode}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-blue-950/40 hover:bg-blue-950/60'
                        : isCompleted
                        ? 'bg-slate-950/20 hover:bg-slate-800/30 text-slate-400'
                        : 'hover:bg-slate-800/40 text-slate-200'
                    }`}
                  >
                    {/* Index */}
                    <td className="px-3.5 py-3 text-center font-mono text-slate-500">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block animate-ping" />
                      ) : (
                        stn.index
                      )}
                    </td>

                    {/* Station Name + Code */}
                    <td className="px-3.5 py-3">
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span className={isCurrent ? 'text-blue-300 font-black' : isCompleted ? 'text-slate-300' : 'text-white'}>
                          {stn.stationName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          ({stn.stationCode})
                        </span>
                        {stn.isMajor && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                            Major Jn
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="px-3 py-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                        {platformMap[stn.stationCode.toUpperCase()] || stn.platform}
                      </span>
                    </td>

                    {/* Scheduled Times */}
                    <td className="px-3 py-3 font-mono text-xs">
                      {stn.scheduledArrival ? (
                        <div>
                          <span className="text-slate-400">Arr: </span>
                          <span className="text-white font-semibold">{stn.scheduledArrival}</span>
                        </div>
                      ) : null}
                      {stn.scheduledDeparture ? (
                        <div>
                          <span className="text-slate-400">Dep: </span>
                          <span className="text-white font-semibold">{stn.scheduledDeparture}</span>
                        </div>
                      ) : null}
                      {!stn.scheduledArrival && !stn.scheduledDeparture && (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>

                    {/* Halt */}
                    <td className="px-3 py-3 text-slate-400 text-xs">
                      {stn.haltMinutes > 0 ? `${stn.haltMinutes}m` : '--'}
                    </td>

                    {/* Distance */}
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">
                      {stn.distance} km
                    </td>

                    {/* Status Column */}
                    <td className="px-3.5 py-3 text-right">
                      {isCompleted ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                          Departed
                        </span>
                      ) : isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/40 animate-pulse">
                          ● Current
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {stn.actualArrival || stn.scheduledArrival ? `ETA ${stn.actualArrival || stn.scheduledArrival}` : 'Upcoming'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info link */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>Showing {visibleStations.length} of {totalStops} scheduled station stops</span>
          <Link
            href={`/live-status/${trainNumber}`}
            className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition"
          >
            <span>Open Full Interactive Map & GPS Radar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function isMoving(speed: number, isNotStarted: boolean): boolean {
  return speed > 0 && !isNotStarted;
}

