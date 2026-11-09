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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-700/80 backdrop-blur-xl shadow-2xl p-2.5 sm:p-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Distance & Next Station Info matching Where Is My Train */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {position.distanceToNextKm}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400">km</span>
            </div>

            <div className="border-l border-slate-700/80 pl-2.5 sm:pl-4 min-w-0">
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
                <span>To {position.nextStationName}</span>
                <span className="text-[11px] sm:text-xs font-mono text-amber-400 font-bold shrink-0">@{position.nextStationEta}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[10px] sm:text-xs text-slate-400 truncate">
                <span>{position.lastUpdatedSecondsAgo === null ? 'Update time unavailable' : `${position.lastUpdatedSecondsAgo}s ago`}</span>
                <span>·</span>
                <span
                  className={`font-semibold shrink-0 ${
                    position.isDelayed ? 'text-rose-400 font-bold' : 'text-emerald-400'
                  }`}
                >
                  {position.delayText}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Large Speedometer Badge */}
          <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                position.isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <div className="text-left">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                {position.isMoving ? 'Live Velocity' : 'Station Status'}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400 font-mono tracking-tight leading-none">
                  {position.speedKmph ?? '--'}
                </span>
                <span className="text-xs uppercase font-bold text-slate-400">km/h</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto">
            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-white transition shadow-lg shrink-0 ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
              }`}
              title="Refresh Live Status"
            >
              <RotateCw className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Show My Coach Location Button */}
            <button
              onClick={() => setIsCoachModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 font-bold text-xs sm:text-sm rounded-xl transition shadow-md border border-amber-500/30 active:scale-95 shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span><span className="hidden sm:inline">SHOW </span>MY COACH</span>
            </button>

            {/* Connect to 3D Train Explorer Button */}
            <Link
              href={`/train/${trainNumber}`}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-blue-500/25 active:scale-95 border border-blue-400/30 shrink-0"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span><span className="hidden sm:inline">EXPLORE </span>3D TRAIN</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 hidden xs:inline" />
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
