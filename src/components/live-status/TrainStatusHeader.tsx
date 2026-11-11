'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { LiveJourneyAnalysis, StatusConfidence } from '@/lib/live-tracking-engine';
import StarTrainButton from '@/components/ui/StarTrainButton';
import HornButton from '@/components/ui/HornButton';
import { useAuth } from '@/context/AuthContext';
import {
  Share2,
  Eye,
  Map,
  ListOrdered,
  Columns,
  Radio,
  ArrowLeft,
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
  selectedDate,
  onChangeDate,
}: TrainStatusHeaderProps) {
  const [isInsideTrain, setIsInsideTrain] = useState(false);
  const { user } = useAuth();
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              aria-label="Back to home"
              className="min-h-10 min-w-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
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

          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2 shrink-0">
            {user && (
              <>
                <StarTrainButton
                  trainNumber={trainNumber}
                  trainName={trainName}
                  origin={origin}
                  destination={destination}
                  size="sm"
                  showLabel={false}
                  className="min-h-10 min-w-10 justify-center"
                />
                <span className="hidden sm:inline-flex"><HornButton size="sm" showLabel={false} /></span>
              </>
            )}

            <Link
              href={`/train/${trainNumber}`}
              className="min-h-10 flex-1 sm:flex-none justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/15 border border-blue-400/30 flex items-center gap-1.5 transition active:scale-95"
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
              aria-label="Share live status link"
              className="min-h-10 min-w-10 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95"
              title="Share Live Status"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Selector & "I am inside train" Bar matching Where Is My Train */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-800/80">
          <div className="w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium hidden xs:inline">Journey:</span>
            <div className="grid w-full grid-cols-3 items-stretch gap-0.5 sm:flex sm:w-auto sm:items-center sm:gap-1 bg-slate-950 p-0.5 sm:p-1 rounded-xl border border-slate-800 text-xs" role="group" aria-label="Journey date">
              {['Yesterday', 'Today', 'Tomorrow'].map((day) => (
                <button
                  key={day}
                  onClick={() => onChangeDate(day)}
                  aria-pressed={selectedDate === day}
                  className={`min-h-10 px-1.5 sm:px-3 rounded-lg font-semibold text-xs transition ${
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
          <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
            {/* "I am inside train" Checkbox matching Screenshot 1 */}
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInsideTrain}
                onChange={(e) => setIsInsideTrain(e.target.checked)}
                className="size-4 rounded accent-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3 pt-2.5 sm:pt-3 border-t border-slate-800/80">
          <div className="grid w-full grid-cols-3 items-stretch gap-0.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-xs sm:flex sm:w-auto sm:items-center sm:gap-1 sm:p-1" role="group" aria-label="Route display mode">
            <button
              onClick={() => onChangeViewMode('timeline')}
              aria-pressed={viewMode === 'timeline'}
              className={`min-h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Timeline<span className="hidden sm:inline"> View</span></span>
            </button>

            <button
              onClick={() => onChangeViewMode('map')}
              aria-pressed={viewMode === 'map'}
              className={`min-h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map<span className="hidden sm:inline"> View</span></span>
            </button>

            <button
              onClick={() => onChangeViewMode('combined')}
              aria-pressed={viewMode === 'combined'}
              className={`min-h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold transition text-xs ${
                viewMode === 'combined'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Combined<span className="hidden sm:inline"> Split</span></span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex w-full md:w-auto items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap">
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
            <span className="min-w-0 truncate text-right">
              Next: <strong className="text-white">{position.nextStationName}</strong>{' '}
              <span className="font-mono text-amber-300 font-bold">({position.distanceToNextKm} km)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

