'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { LiveJourneyAnalysis, StatusConfidence } from '@/lib/live-tracking-engine';
import StarTrainButton from '@/components/ui/StarTrainButton';
import HornButton from '@/components/ui/HornButton';
import {
  Train,
  Calendar,
  Share2,
  RefreshCw,
  Eye,
  CheckCircle,
  Map,
  ListOrdered,
  Columns,
  Radio,
  Navigation,
} from 'lucide-react';

interface TrainStatusHeaderProps {
  journey: LiveJourneyAnalysis;
  viewMode: 'timeline' | 'map' | 'combined';
  onChangeViewMode: (mode: 'timeline' | 'map' | 'combined') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  selectedDate: string;
  onChangeDate: (date: string) => void;
}

export default function TrainStatusHeader({
  journey,
  viewMode,
  onChangeViewMode,
  onRefresh,
  isRefreshing,
  selectedDate,
  onChangeDate,
}: TrainStatusHeaderProps) {
  const [isInsideTrain, setIsInsideTrain] = useState(false);
  const { trainNumber, trainName, origin, destination, position, statusConfidence } = journey;

  const confidenceStyles: Record<StatusConfidence, { label: string; bg: string; text: string }> = {
    LIVE_REPORTED: { label: 'Live Reported', bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-300' },
    GPS_REPORTED: { label: 'GPS Satellite', bg: 'bg-teal-500/20 border-teal-500/30', text: 'text-teal-300' },
    ESTIMATED: { label: 'Estimated Route', bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-300' },
    SCHEDULE_BASED: { label: 'Timetable Mode', bg: 'bg-blue-500/20 border-blue-500/30', text: 'text-blue-300' },
    NOT_STARTED: { label: 'Not Started', bg: 'bg-slate-500/20 border-slate-500/30', text: 'text-slate-300' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-rose-500/20 border-rose-500/30', text: 'text-rose-300' },
  };

  const conf = confidenceStyles[statusConfidence] || confidenceStyles.ESTIMATED;

  return (
    <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-6 shadow-xl">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4">
        {/* Main Title Row matching screenshot 1 */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition shrink-0"
              title="Back to Home"
            >
              ←
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-lg sm:text-2xl font-black text-amber-400">
                  {trainNumber}
                </span>
                <span className="text-base sm:text-xl font-bold text-white truncate max-w-[200px] sm:max-w-md">
                  {trainName}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">
                {origin.name} ({origin.code}) → {destination.name} ({destination.code})
              </div>
            </div>
          </div>

          {/* Quick Actions (Star, Horn, 3D Explorer, Share) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <StarTrainButton
              trainNumber={trainNumber}
              trainName={trainName}
              origin={origin}
              destination={destination}
              size="sm"
              showLabel={true}
            />

            <HornButton size="sm" showLabel={false} />

            <Link
              href={`/train/${trainNumber}`}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/40 flex items-center gap-1.5 transition active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D Explorer</span>
            </Link>

            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Live status URL copied to clipboard!');
                }
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Share Live Status"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector & "I am inside train" Bar matching Where Is My Train */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-slate-400 font-medium hidden xs:inline">Journey:</span>
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs">
              {['Yesterday', 'Today', 'Tomorrow'].map((day) => (
                <button
                  key={day}
                  onClick={() => onChangeDate(day)}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold text-xs transition ${
                    selectedDate === day
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Right Sub-options */}
          <div className="flex items-center gap-3">
            {/* "I am inside train" Checkbox matching Screenshot 1 */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInsideTrain}
                onChange={(e) => setIsInsideTrain(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-800 border-slate-700 focus:ring-0 focus:ring-offset-0"
              />
              <span className={`text-[11px] sm:text-xs ${isInsideTrain ? 'text-emerald-400 font-bold' : ''}`}>
                Inside Train
              </span>
              {isInsideTrain && <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
            </label>

            {/* Status Confidence Badge */}
            <span
              className={`px-2 sm:px-2.5 py-0.5 rounded-full border text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 ${conf.bg} ${conf.text}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
              {conf.label}
            </span>
          </div>
        </div>

        {/* View Mode Switcher: Timeline vs Map vs Combined */}
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-800/80 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => onChangeViewMode('timeline')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'timeline'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline<span className="hidden sm:inline"> View</span></span>
            </button>

            <button
              onClick={() => onChangeViewMode('map')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map<span className="hidden sm:inline"> View</span></span>
            </button>

            <button
              onClick={() => onChangeViewMode('combined')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'combined'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Combined<span className="hidden sm:inline"> Split</span></span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Live Speed Pill in Header */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${position.isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[10px] uppercase font-bold text-slate-400">Speed:</span>
              <span className="font-mono font-black text-amber-400 text-xs">{position.speedKmph ?? '--'} km/h</span>
            </div>

            {/* Passed Station Indicator */}
            {!position.isAtStation && (
              <span className="hidden md:inline text-emerald-400 font-medium">
                Passed <strong>{position.distanceCoveredFromPrevKm} km</strong> past {position.previousStationName}
              </span>
            )}

            {/* Next Station Proximity */}
            <span>
              Next: <strong className="text-white">{position.nextStationName}</strong>{' '}
              <span className="font-mono text-amber-300 font-bold">({position.distanceToNextKm} km)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

