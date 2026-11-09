'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { getCoachColor } from '@/data/coach-database';
import {
  MapPin,
  X,
  Train,
  ArrowRight,
  Eye,
  CheckCircle2,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface ShowMyCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainNumber: string;
  trainName: string;
  journeyDate?: string;
}

export default function ShowMyCoachModal({
  isOpen,
  onClose,
  trainNumber,
  trainName,
  journeyDate,
}: ShowMyCoachModalProps) {
  const router = useRouter();
  const trainData = useMemo(() => getOrSynthesizeTrain(trainNumber), [trainNumber]);
  const coaches = trainData?.coaches || [];

  // Default to first passenger coach (e.g. S1 or B1)
  const defaultCoach =
    coaches.find((c) => !['EOG', 'SLR', 'LOCO'].includes(c.coachType))?.coachId ||
    coaches[0]?.coachId ||
    'S1';

  const [selectedCoachId, setSelectedCoachId] = useState<string>(defaultCoach);
  const [berthNumber, setBerthNumber] = useState<string>('');

  if (!isOpen) return null;

  // Selected coach statistics
  const coachIndex = coaches.findIndex((c) => c.coachId === selectedCoachId);
  const coachObj = coachIndex >= 0 ? coaches[coachIndex] : null;
  const distanceFromLoco = coachIndex >= 0 ? Math.round(20.5 + coachIndex * 24.14) : null;
  const walkingSteps = distanceFromLoco ? Math.round(distanceFromLoco * 1.33) : null;

  const handleLaunch3D = () => {
    let url = `/train/${trainNumber}?coach=${encodeURIComponent(selectedCoachId)}`;
    if (berthNumber.trim()) {
      url += `&berth=${encodeURIComponent(berthNumber.trim())}`;
    }
    router.push(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>SHOW MY COACH LOCATION</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                  3D POSITION FINDER
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {trainNumber} · {trainName} {journeyDate ? `(${journeyDate})` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Coach Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Your Coach
            </label>
            <span className="text-xs text-slate-400">
              Total Rake: <strong className="text-amber-400">{coaches.length} Coaches</strong>
            </span>
          </div>

          {/* Quick Coach Chips Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl bg-slate-950/60 border border-slate-800">
            {coaches.map((c) => {
              const isSelected = c.coachId === selectedCoachId;
              const isEngine = c.coachType === 'LOCO';
              return (
                <button
                  key={c.coachId}
                  onClick={() => setSelectedCoachId(c.coachId)}
                  className={`p-2 rounded-xl text-center transition border active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-300 ring-2 ring-amber-400 shadow-lg'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="text-xs font-black">{c.coachId}</div>
                  <div
                    className={`text-[9px] uppercase font-bold mt-0.5 ${
                      isSelected ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {c.coachType}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Berth Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Assigned Berth Number (Optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={100}
              placeholder="e.g. 24, 42, 63"
              value={berthNumber}
              onChange={(e) => setBerthNumber(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {berthNumber && (
              <span className="text-xs text-amber-300 font-semibold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30">
                Berth #{berthNumber} will be highlighted in 3D
              </span>
            )}
          </div>
        </div>

        {/* Coach Location Analysis Card */}
        {coachObj && (
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Coach Relative Position Calculated</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Rake Position</span>
                <span className="text-base font-black text-white mt-0.5 block">
                  #{coachIndex + 1} <span className="text-xs font-normal text-slate-400">of {coaches.length}</span>
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance from Engine</span>
                <span className="text-base font-black text-amber-400 mt-0.5 block">
                  ~{distanceFromLoco} m
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Platform Walking</span>
                <span className="text-base font-black text-sky-400 mt-0.5 block">
                  ~{walkingSteps} steps
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              📍 Coach <strong className="text-white font-bold">{selectedCoachId}</strong> ({coachObj.coachType}) is located{' '}
              <strong className="text-amber-300 font-semibold">{distanceFromLoco} meters</strong> behind the WAP-7 Locomotive.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleLaunch3D}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl transition shadow-xl shadow-amber-500/25 active:scale-95"
          >
            <Eye className="w-4 h-4" />
            <span>LOCATE IN 3D TRAIN</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

