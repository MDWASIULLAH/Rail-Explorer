'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Star,
  Radio,
  Eye,
  Trash2,
  Plus,
  ArrowRight,
  Gauge,
  Clock,
  MapPin,
  BellRing,
  Volume2,
} from 'lucide-react';
import { useStarredTrains } from '@/context/StarredTrainsContext';
import { trainAudio } from '@/lib/train-audio';

export default function StarredTrainsDrawer() {
  const {
    starredTrains,
    removeStar,
    addStar,
    liveStatusMap,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsAlarmModalOpen,
    setAlarmTargetTrain,
  } = useStarredTrains();

  const [inputNumber, setInputNumber] = useState('');
  const [playingHorn, setPlayingHorn] = useState(false);

  if (!isDrawerOpen) return null;

  const handleAddTrain = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputNumber.trim();
    if (!clean) return;
    addStar({ trainNumber: clean });
    setInputNumber('');
  };

  const blastHorn = () => {
    setPlayingHorn(true);
    trainAudio.playHorn(1.2);
    setTimeout(() => setPlayingHorn(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">Starred Trains & Live Tracking</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {starredTrains.length} Saved
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Quick-access real-time satellite telemetry & 3D coach blueprints</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={blastHorn}
              title="Test WAP-7 Air Horn"
              className={`p-2 rounded-xl border transition ${
                playingHorn
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                  : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Train Bar */}
        <div className="p-3 sm:p-4 bg-slate-950/50 border-b border-slate-800">
          <form onSubmit={handleAddTrain} className="flex gap-2">
            <input
              type="text"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              placeholder="Star new train (e.g. 12951, 12919, 12002)..."
              className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Star Train</span>
            </button>
          </form>
        </div>

        {/* Train Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
          {starredTrains.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No starred trains yet</p>
              <p className="text-xs text-slate-500 mt-1">Search for any train or enter a number above to star it.</p>
            </div>
          ) : (
            starredTrains.map((train) => {
              const live = liveStatusMap[train.trainNumber];
              const isDelayed = live && live.delayMinutes > 0;

              return (
                <div
                  key={train.trainNumber}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 sm:p-4 transition space-y-3"
                >
                  {/* Top line: Number, Name, Speed, Delay */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-base font-black text-amber-400">
                          {train.trainNumber}
                        </span>
                        <span className="font-bold text-white text-sm sm:text-base truncate">
                          {train.trainName}
                        </span>
                      </div>
                      {train.origin && train.destination && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>{train.origin.name}</span>
                          <span className="text-slate-600">→</span>
                          <span>{train.destination.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Live Telemetry Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {live && (
                        <>
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-slate-200">
                            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{live.speedKmph} km/h</span>
                          </div>

                          <div
                            className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${
                              isDelayed
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {live.delayText}
                          </div>
                        </>
                      )}

                      <button
                        onClick={() => removeStar(train.trainNumber)}
                        title="Remove Star"
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Progress Bar */}
                  {live && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="truncate max-w-[200px] text-emerald-400">
                          ✓ {live.passedStation}
                        </span>
                        <span className="truncate max-w-[200px] text-sky-400">
                          → {live.approachingStation} ({live.eta})
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${live.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="pt-1 flex flex-wrap gap-2 items-center justify-between border-t border-slate-800/60">
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/live-status/${train.trainNumber}`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Radio className="w-3.5 h-3.5 text-rose-400" />
                        <span>Live GPS Status</span>
                      </Link>

                      <Link
                        href={`/train/${train.trainNumber}`}
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>3D Interior Rake</span>
                      </Link>

                      <button
                        onClick={() => {
                          setAlarmTargetTrain(train.trainNumber);
                          setIsAlarmModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                        title="Set Arrival Alarm"
                      >
                        <BellRing className="w-3 h-3 text-amber-400" />
                        <span>Set Alarm</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      RDSO Live Satellite Feed
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

