'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { LiveJourneyAnalysis } from '@/lib/live-tracking-engine';
import ShowMyCoachModal from './ShowMyCoachModal';
import { RotateCw, ArrowRight, Eye, Train as TrainIcon, MapPin, Gauge } from 'lucide-react';

interface StickyBottomStatusBarProps {
  journey: LiveJourneyAnalysis;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function StickyBottomStatusBar({
  journey,
  onRefresh,
  isRefreshing = false,
}: StickyBottomStatusBarProps) {
  const { position, trainNumber, trainName, journeyDate } = journey;
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 border-t border-slate-700/80 backdrop-blur-xl shadow-2xl p-2 sm:p-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Distance & Next Station Info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-baseline gap-0.5 shrink-0">
              <span className="text-xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {position.distanceToNextKm}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400">km</span>
            </div>

            <div className="border-l border-slate-700/80 pl-2 sm:pl-3 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1 truncate">
                <span className="truncate">To {position.nextStationName}</span>
                <span className="text-[10px] sm:text-xs font-mono text-amber-400 font-bold shrink-0">@{position.nextStationEta}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
                <span className={`font-semibold shrink-0 ${position.isDelayed ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
                  {position.delayText}
                </span>
                {!position.isAtStation && (
                  <span className="hidden sm:inline text-slate-500 truncate">
                    · Passed {position.distanceCoveredFromPrevKm} km past {position.previousStationName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Live Speedometer Pill */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                position.isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm sm:text-xl font-black text-amber-400 font-mono tracking-tight leading-none">
                {position.speedKmph ?? '--'}
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400">km/h</span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white transition shadow shrink-0 ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
              }`}
              title="Refresh Live Status"
            >
              <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Show My Coach Button */}
            <button
              onClick={() => setIsCoachModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition shadow border border-amber-500/30 active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Coach</span>
            </button>

            {/* View in 3D Button */}
            <Link
              href={`/train/${trainNumber}`}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-blue-600/30 active:scale-95 shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D Rake</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Show My Coach Modal */}
      <ShowMyCoachModal
        isOpen={isCoachModalOpen}
        onClose={() => setIsCoachModalOpen(false)}
        trainNumber={trainNumber}
        trainName={trainName}
        journeyDate={journeyDate}
      />
    </>
  );
}
