'use client';

import React, { useState } from 'react';
import type { LiveJourneyAnalysis, TimelineStation } from '@/lib/live-tracking-engine';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Train as TrainIcon,
  Zap,
  Radio,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
} from 'lucide-react';

interface VerticalRailwayTimelineProps {
  journey: LiveJourneyAnalysis;
  onSelectStation?: (station: TimelineStation) => void;
  selectedStationCode?: string | null;
}

export default function VerticalRailwayTimeline({
  journey,
  onSelectStation,
  selectedStationCode,
}: VerticalRailwayTimelineProps) {
  const { timeline, position } = journey;

  // Count small intermediate passing stations
  const passingCount = timeline.filter((s) => s.isPassingHalt).length;

  // Toggle for showing small intermediate passing stations (like Where Is My Train)
  const [showIntermediate, setShowIntermediate] = useState(true);

  // Filter stations based on toggle
  const displayStations = showIntermediate
    ? timeline
    : timeline.filter((s) => !s.isPassingHalt);

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Top Controls Bar: Intermediate Stations Toggle & Live Speed Status */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
        {/* Toggle Intermediate Small Stations (Where Is My Train style) */}
        {passingCount > 0 && (
          <button
            onClick={() => setShowIntermediate(!showIntermediate)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
              showIntermediate
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 hover:bg-blue-600/30'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {showIntermediate ? (
              <>
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Passing Halts ({passingCount})</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Show Halts ({passingCount})</span>
              </>
            )}
          </button>
        )}

        {/* Live Speedometer Badge (Large and Prominent) */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-700/80 shadow-md">
            <span
              className={`w-2 h-2 rounded-full ${
                position.isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {position.isMoving ? 'Speed:' : 'Status:'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                {position.speedKmph ?? '--'}
              </span>
              <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400">km/h</span>
            </div>
            {position.isMoving ? (
              <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                Running
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Halted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table Column Header */}
      <div className="grid grid-cols-12 px-2 sm:px-4 py-2 sm:py-2.5 bg-slate-950/80 border-b border-slate-800/80 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <div className="col-span-3 text-left">Distance</div>
        <div className="col-span-5 text-left pl-2 sm:pl-3">Stations & Halts</div>
        <div className="col-span-2 text-right">Arrival</div>
        <div className="col-span-2 text-right">Departure</div>
      </div>

      {/* Timeline Stream */}
      <div className="p-2 sm:p-4 relative space-y-0">
        {displayStations.map((station, idx) => {
          const isSelected = selectedStationCode === station.stationCode;
          const isCompleted = station.state === 'COMPLETED';
          const isCurrent = station.state === 'CURRENT';
          const isNext = station.stationCode === position.nextStationCode;
          const isPrev = station.stationCode === position.previousStationCode;
          const isPassingHalt = Boolean(station.isPassingHalt);

          // Check if train is currently between this station and the next, or halted here
          const isTrainJustPastThis = isPrev && !position.isAtStation;
          const isTrainHaltedHere = (isCurrent || station.stationCode === position.currentStationCode) && position.isAtStation;

          return (
            <React.Fragment key={station.stationCode}>
              {/* Station Row */}
              <div
                onClick={() => onSelectStation?.(station)}
                className={`grid grid-cols-12 items-center rounded-xl transition cursor-pointer relative group ${
                  isPassingHalt ? 'py-2 px-2' : 'py-3 px-2'
                } ${
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/40'
                    : isNext
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : isTrainHaltedHere
                    ? 'bg-amber-500/15 border-2 border-amber-400/60 shadow-lg'
                    : isPassingHalt
                    ? 'hover:bg-slate-850/50 opacity-90'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Distance & Station Code */}
                <div className="col-span-3 flex flex-col">
                  <span className={`font-mono font-bold ${isPassingHalt ? 'text-xs text-slate-400' : 'text-xs text-slate-200'}`}>
                    {station.distance} <span className="text-[10px] text-slate-500 font-normal">km</span>
                  </span>
                  <span className={`font-mono font-semibold ${isPassingHalt ? 'text-[10px] text-slate-500' : 'text-[11px] text-slate-400'}`}>
                    {station.stationCode}
                  </span>
                </div>

                {/* Vertical Railway Track Line & Station Marker */}
                <div className="col-span-5 flex items-center gap-3 relative pl-1">
                  {/* Continuous Track Line Segment */}
                  {idx < displayStations.length - 1 && (
                    <div
                      className={`absolute left-[13px] top-[14px] bottom-[-24px] w-[3px] z-0 transition-colors ${
                        isCompleted
                          ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                          : 'bg-slate-700'
                      }`}
                    />
                  )}

                  {/* Station Marker Node */}
                  <div className="relative z-10 flex items-center justify-center">
                    {isTrainHaltedHere ? (
                      // Locomotive at station
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold ring-4 ring-amber-400/40 shadow-xl scale-125">
                        <TrainIcon className="w-3.5 h-3.5 text-slate-950" />
                      </div>
                    ) : isPassingHalt ? (
                      // Small Intermediate Station Dot
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all ${
                          isCompleted
                            ? 'border-rose-400 bg-rose-600'
                            : 'border-slate-500 bg-slate-800'
                        }`}
                        title="Passing Halt (Non-Stop)"
                      >
                        <div className={`w-1 h-1 rounded-full ${isCompleted ? 'bg-white' : 'bg-slate-400'}`} />
                      </div>
                    ) : (
                      // Major Scheduled Halt Node
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent || isNext
                            ? 'border-amber-400 bg-amber-500 text-slate-950 ring-4 ring-amber-400/20 shadow-lg scale-110'
                            : isCompleted
                            ? 'border-rose-500 bg-rose-600 shadow-sm'
                            : 'border-slate-500 bg-slate-900 group-hover:border-slate-300'
                        }`}
                      >
                        {isCurrent || isNext ? (
                          <div className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                        ) : isCompleted ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Station Name, Platform, and Halt details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`truncate ${
                          isTrainHaltedHere
                            ? 'text-sm font-black text-amber-300'
                            : isPassingHalt
                            ? 'text-xs text-slate-300 font-medium'
                            : isNext
                            ? 'text-sm font-black text-amber-300'
                            : isCompleted
                            ? 'text-sm font-bold text-white'
                            : 'text-sm font-bold text-slate-200'
                        }`}
                      >
                        {station.stationName}
                      </span>

                      {/* Small Passing Tag */}
                      {isPassingHalt && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-semibold text-slate-400 border border-slate-700/80">
                          Passing
                        </span>
                      )}

                      {/* Train Halted Here Badge */}
                      {isTrainHaltedHere && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider animate-pulse">
                          ● Train Here Now
                        </span>
                      )}

                      {/* Day Pill */}
                      {idx > 0 && station.day > 1 && station.day !== displayStations[idx - 1]?.day && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-900/60 border border-rose-700 text-[10px] text-rose-300 font-bold">
                          Day {station.day}
                        </span>
                      )}
                    </div>

                    {!isPassingHalt && (
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 flex-wrap">
                        <span className="text-[11px] font-semibold text-sky-400">{station.platform || 'Platform not reported'}</span>
                        {station.haltMinutes > 0 && (
                          <span className="text-[10px] text-slate-500">· Halt: {station.haltMinutes}m</span>
                        )}
                        {isCompleted && isPrev && !position.isAtStation && (
                          <span className="text-[10px] font-semibold text-emerald-400">
                            · Departed ({position.distanceCoveredFromPrevKm} km passed)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrival Time */}
                <div className="col-span-2 text-right">
                  <div
                    className={`font-mono font-bold ${isPassingHalt ? 'text-xs text-slate-400' : 'text-xs'} ${
                      station.delayArrivalMinutes > 5 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {station.actualArrival || station.scheduledArrival || '--'}
                  </div>
                  {!isPassingHalt && station.actualArrival && station.scheduledArrival && station.actualArrival !== station.scheduledArrival && (
                    <div className="text-[10px] text-slate-500 line-through font-mono mt-0.5">
                      {station.scheduledArrival}
                    </div>
                  )}
                </div>

                {/* Departure Time */}
                <div className="col-span-2 text-right">
                  <div
                    className={`font-mono font-bold ${isPassingHalt ? 'text-xs text-slate-400' : 'text-xs'} ${
                      station.delayDepartureMinutes > 5 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {station.actualDeparture || station.scheduledDeparture || '--'}
                  </div>
                  {!isPassingHalt && station.actualDeparture && station.scheduledDeparture && station.actualDeparture !== station.scheduledDeparture && (
                    <div className="text-[10px] text-slate-500 line-through font-mono mt-0.5">
                      {station.scheduledDeparture}
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* ANIMATED LIVE TRAIN POSITION MARKER WITH BIG SPEEDOMETER */}
              {/* ======================================================== */}
              {isTrainJustPastThis && (
                <div className="relative py-2.5 sm:py-3 pl-[14px] sm:pl-[18px] pr-1 sm:pr-2 my-1 animate-fadeIn">
                  {/* Connecting active track glowing pulse */}
                  <div className="absolute left-[13px] top-0 bottom-0 w-[3px] bg-gradient-to-b from-rose-600 via-amber-400 to-slate-700 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />

                  <div className="flex items-center gap-2 sm:gap-3 relative z-20">
                    {/* Animated Train Locomotive Icon */}
                    <div className="relative flex items-center justify-center -ml-[13px] shrink-0">
                      <span className="animate-ping absolute inline-flex h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-emerald-400 opacity-60" />
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-xl shadow-emerald-500/40 border-2 border-white">
                        <TrainIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                      </div>
                    </div>

                    {/* Speech Bubble Tooltip matching Where Is My Train */}
                    <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 px-3.5 sm:px-5 shadow-2xl border border-emerald-400/50 flex flex-wrap items-center justify-between gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Left: Passed Distance, Where It Is, and Next Station */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black tracking-wide text-white">
                            Passed {position.distanceCoveredFromPrevKm} km past {position.previousStationName}
                          </span>
                          <span className="text-xs text-emerald-200">→</span>
                          <span className="text-xs sm:text-sm font-bold text-amber-300">
                            {position.distanceToNextKm} km to {position.nextStationName}
                          </span>
                        </div>

                        <div className="text-[11px] sm:text-xs text-emerald-100 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
                            Location: {position.currentLocationText}
                          </span>
                          <span>·</span>
                          <span className="text-amber-200 font-mono font-bold">
                            ETA @ {position.nextStationEta}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
                            <span>{position.lastUpdatedSecondsAgo === null ? 'Updated just now' : `Updated ${position.lastUpdatedSecondsAgo}s ago`}</span>
                          </span>
                        </div>
                      </div>

                      {/* Right: Prominent Large Speedometer */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                        <div className="bg-emerald-950/90 border border-emerald-500/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-center shadow-inner">
                          <span className="text-[9px] uppercase font-bold text-emerald-300 block tracking-wider">
                            LIVE VELOCITY
                          </span>
                          <div className="flex items-baseline justify-center gap-0.5 sm:gap-1">
                            <span className="text-xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight leading-none">
                              {position.speedKmph ?? '--'}
                            </span>
                            <span className="text-[10px] sm:text-xs uppercase font-bold text-emerald-200">km/h</span>
                          </div>
                        </div>

                        <span className="text-[9px] sm:text-[10px] px-2 py-1 rounded-lg bg-emerald-900/90 font-bold uppercase tracking-wider text-emerald-200 border border-emerald-600">
                          {position.confidence === 'GPS_REPORTED' ? 'GPS Satellite' : 'Live Speed'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
