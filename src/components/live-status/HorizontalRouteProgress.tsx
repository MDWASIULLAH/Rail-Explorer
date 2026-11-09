'use client';

import React from 'react';
import type { LiveJourneyAnalysis } from '@/lib/live-tracking-engine';
import { ArrowRight, MapPin, Train as TrainIcon, CheckCircle2 } from 'lucide-react';

interface HorizontalRouteProgressProps {
  journey: LiveJourneyAnalysis;
}

export default function HorizontalRouteProgress({ journey }: HorizontalRouteProgressProps) {
  const {
    origin,
    destination,
    totalDistanceKm,
    coveredDistanceKm,
    remainingDistanceKm,
    position,
    completedStops,
    totalStops,
  } = journey;

  const percent = position.overallProgressPercent;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3.5 sm:p-5 shadow-xl backdrop-blur-md">
      {/* Origin -> Current -> Destination Card */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        {/* Source */}
        <div className="flex items-start gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Source
            </div>
            <div className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
              {origin.name} <span className="text-[11px] text-slate-400 font-mono">({origin.code})</span>
            </div>
          </div>
        </div>

        {/* Current Interim Position */}
        <div className="order-last sm:order-none w-full sm:w-auto text-center bg-slate-950/70 py-1 sm:py-1.5 px-3 sm:px-4 rounded-xl border border-slate-800">
          <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider">
            Current / Passing
          </div>
          <div className="text-xs sm:text-sm font-black text-amber-300 mt-0.5 flex items-center gap-1.5 justify-center">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{position.nextStationName}</span>
            <span className="text-xs font-mono text-slate-400">({position.nextStationCode})</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
            {position.distanceToNextKm} km remaining
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start gap-2 sm:gap-2.5 text-right ml-auto sm:ml-0">
          <div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-sky-400 uppercase tracking-wider">
              Destination
            </div>
            <div className="text-sm sm:text-base font-bold text-white leading-tight mt-0.5">
              {destination.name} <span className="text-[11px] text-slate-400 font-mono">({destination.code})</span>
            </div>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>

      {/* Visual Continuous Rail Track Progress Bar with Animated Train */}
      <div className="relative pt-6 pb-2">
        {/* Track Line */}
        <div className="h-2 w-full bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-rose-500 to-amber-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(244,63,94,0.5)]"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Moving Train Marker positioned at percent */}
        <div
          className="absolute top-2 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-700 ease-out z-20"
          style={{ left: `${Math.min(96, Math.max(4, percent))}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white">
            <TrainIcon className="w-3.5 h-3.5" />
          </div>
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-0.5" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400">Total Distance</div>
          <div className="text-sm font-bold text-white mt-0.5 font-mono">{totalDistanceKm} km</div>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400">Covered</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">{coveredDistanceKm} km ({percent}%)</div>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400">Remaining</div>
          <div className="text-sm font-bold text-amber-400 mt-0.5 font-mono">{remainingDistanceKm} km</div>
        </div>
        <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-slate-400">Stops Completed</div>
          <div className="text-sm font-bold text-white mt-0.5 font-mono">{completedStops} / {totalStops}</div>
        </div>
      </div>
    </div>
  );
}

