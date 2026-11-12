'use client';

import React from 'react';
import type { TrainCoach } from '@/components/3d/FullTrainView';
import { calculateCoachToCoachDistance } from '@/lib/distance-calculator';
import type { CoachComposition } from '@/lib/railway-api';

interface DistancePanelProps {
  coaches: TrainCoach[];
  composition: CoachComposition;
  fromCoachId: string | null;
  toCoachId: string | null;
  onFromChange: (coachId: string) => void;
  onToChange: (coachId: string) => void;
}

export default function DistancePanel({
  coaches,
  composition,
  fromCoachId,
  toCoachId,
  onFromChange,
  onToChange,
}: DistancePanelProps) {
  const fromIndex = coaches.findIndex((c) => c.coachId === fromCoachId);
  const toIndex = coaches.findIndex((c) => c.coachId === toCoachId);

  const hasBoth = fromIndex >= 0 && toIndex >= 0;
  const result = hasBoth
    ? calculateCoachToCoachDistance(composition, fromIndex, toIndex)
    : null;

  // Walking calculations
  const distance = result ? Math.round(result.distanceMeters) : 0;
  const walkingMinutes = result ? Math.max(1, Math.round(result.distanceMeters / 70)) : 0; // ~70m per min at platform
  const steps = result ? Math.round(result.distanceMeters / 0.75) : 0;

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
          <span>📏</span>
          <span>Inter-Coach Distance Calculator</span>
        </h3>
        {result && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            {result.coachesBetween} coach{result.coachesBetween === 1 ? '' : 'es'} apart
          </span>
        )}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">From Coach</label>
          <select
            value={fromCoachId || ''}
            onChange={(e) => onFromChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select coach...</option>
            {coaches.map((c) => (
              <option key={`from-${c.coachId}`} value={c.coachId}>
                {c.coachId} ({c.coachType})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">To Coach</label>
          <select
            value={toCoachId || ''}
            onChange={(e) => onToChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select coach...</option>
            {coaches.map((c) => (
              <option key={`to-${c.coachId}`} value={c.coachId}>
                {c.coachId} ({c.coachType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Display */}
      {result ? (
        <div className="space-y-3">
          {/* Highlight stat */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/60 to-slate-900/60 rounded-xl border border-blue-800/40 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-300 font-medium">Physical Distance</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {distance} <span className="text-sm font-normal text-slate-400">meters</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Walking Time</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                ~{walkingMinutes} min <span className="text-xs font-normal text-slate-400">({steps} steps)</span>
              </div>
            </div>
          </div>

          {/* Platform walk advice */}
          <div className="text-xs text-slate-400 flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
            <span className="text-amber-400 shrink-0">💡</span>
            <span>
              {result.distanceMeters === 0
                ? 'Same coach selected. You are already at this coach.'
                : 'Approximate centre-to-centre distance from this train’s listed coach order and coach blueprints. Walking time and steps are estimates; platform routes and access restrictions are not included.'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-xs text-slate-500 bg-slate-900/30 rounded-lg border border-dashed border-slate-800">
          Select two coaches to measure physical walking distance and estimated time.
        </div>
      )}
    </div>
  );
}
