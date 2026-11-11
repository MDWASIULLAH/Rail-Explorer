'use client';

import React, { useState } from 'react';
import { Armchair } from 'lucide-react';
import type { CoachBlueprint } from '@/data/coach-database';

interface CoachSeatGridProps {
  blueprint: CoachBlueprint;
  selectedBerthNumber: number | null;
  onSelectBerth: (berthNumber: number) => void;
  coachId: string;
}

const BERTH_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  LB: { bg: 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40', text: 'text-emerald-300', label: 'Lower' },
  MB: { bg: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/40', text: 'text-blue-300', label: 'Middle' },
  UB: { bg: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/40', text: 'text-purple-300', label: 'Upper' },
  SL: { bg: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40', text: 'text-amber-300', label: 'Side Lower' },
  SU: { bg: 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/40', text: 'text-orange-300', label: 'Side Upper' },
  SEAT: { bg: 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40', text: 'text-sky-300', label: 'Chair' },
};

export default function CoachSeatGrid({
  blueprint,
  selectedBerthNumber,
  onSelectBerth,
  coachId,
}: CoachSeatGridProps) {
  const [filterType, setFilterType] = useState<string>('ALL');
  const isSeatCoach = blueprint.berths.length > 0 && blueprint.berths.every((item) => item.berthType === 'SEAT');

  const filteredBerths = blueprint.berths.filter((b) => {
    if (isSeatCoach || filterType === 'ALL') return true;
    return b.berthType === filterType;
  });

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-4 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
            <Armchair className="h-4 w-4 text-sky-300" />
            <span>Coach {coachId} {isSeatCoach ? 'Seat Layout' : 'Berth Layout'}</span>
          </h3>
          <p className="text-xs text-slate-400">
            {blueprint.name} · {blueprint.totalBerths} {isSeatCoach ? 'Seats' : 'Berths'} ({blueprint.totalBays} {isSeatCoach ? 'Rows' : 'Bays'})
          </p>
        </div>

        {selectedBerthNumber && (
          <span className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
            {isSeatCoach ? 'Seat' : 'Berth'} #{selectedBerthNumber}
          </span>
        )}
      </div>

      {/* Filter Pills */}
      {!isSeatCoach && <div className="flex flex-wrap gap-1 mb-3 text-[11px]">
        {['ALL', 'LB', 'MB', 'UB', 'SL', 'SU'].map((type) => {
          const isSelected = filterType === type;
          const label = type === 'ALL' ? 'All' : BERTH_COLORS[type]?.label || type;
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-0.5 rounded transition ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>}

      {isSeatCoach && (
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Open seating layout for reference. General coach seats are unreserved and are not ticketed berth assignments.
        </p>
      )}

      {/* Seat Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-4 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {filteredBerths.map((b) => {
          const isSelected = selectedBerthNumber === b.berthNumber;
          const style = BERTH_COLORS[b.berthType] || BERTH_COLORS.LB;

          return (
            <button
              key={b.berthNumber}
              onClick={() => onSelectBerth(b.berthNumber)}
              className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-300 font-black ring-2 ring-amber-400 scale-105 z-10 shadow-lg'
                  : `${style.bg} ${style.text}`
              }`}
              title={`${isSeatCoach ? 'Seat' : 'Berth'} ${b.berthNumber} (${b.berthType}) - ${isSeatCoach ? 'Row' : 'Bay'} ${b.bayNumber}`}
            >
              <div className="text-xs font-bold">{b.berthNumber}</div>
              <div className="text-[9px] opacity-80 uppercase">{b.berthType}</div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      {!isSeatCoach && <div className="mt-3 pt-2 border-t border-slate-700/60 flex flex-wrap gap-2 text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Lower (LB)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> Middle (MB)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-purple-500 inline-block" /> Upper (UB)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Side Lower (SL)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-orange-500 inline-block" /> Side Upper (SU)
        </span>
      </div>}
    </div>
  );
}

