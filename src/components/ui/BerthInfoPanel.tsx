'use client';

import Link from 'next/link';
import { getBerthDescription, getBerthColor } from '@/lib/berth-finder';
import type { BerthType } from '@/data/coach-database';
import { ArrowLeftRight } from 'lucide-react';

interface BerthInfoPanelProps {
  berthNumber: number;
  berthType: BerthType;
  coachId: string;
  bayNumber: number;
  side: string;
  deck: number;
  distanceToDoor: number;
  neighbors: Array<{ number: number; type: string; description: string }>;
  onClose: () => void;
}

export default function BerthInfoPanel({
  berthNumber,
  berthType,
  coachId,
  bayNumber,
  side,
  deck,
  distanceToDoor,
  neighbors,
  onClose,
}: BerthInfoPanelProps) {
  const color = getBerthColor(berthType);
  const deckLabel = deck === 0 ? 'Lower' : deck === 1 ? 'Middle' : 'Upper';
  const sideLabel = side === 'LEFT' ? 'Window Side' : side === 'RIGHT' ? 'Aisle Side' : 'Side Section';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 shadow-xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="text-lg font-bold text-white">
              Berth {berthNumber}
            </h3>
          </div>
          <p className="text-sm text-slate-400">
            {getBerthDescription(berthType)} · Coach {coachId}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-0.5">Bay</p>
          <p className="text-sm font-medium text-white">Bay {bayNumber}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-0.5">Position</p>
          <p className="text-sm font-medium text-white">{sideLabel}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-0.5">Level</p>
          <p className="text-sm font-medium text-white">{deckLabel} Deck</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-0.5">Nearest Door</p>
          <p className="text-sm font-medium text-white">~{distanceToDoor}m</p>
        </div>
      </div>

      {/* Bay visualization (2D cross-section) */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2 font-medium">Bay Layout</p>
        <div className="bg-slate-900 rounded-lg p-3">
          <div className="flex gap-4 justify-center">
            {/* Left side berths */}
            <div className="flex flex-col gap-1 items-center">
              <p className="text-[10px] text-slate-500 mb-1">Left</p>
              {['UB', 'MB', 'LB'].map((type, i) => {
                const n = neighbors.find((nb) => nb.type === type && i < 3);
                return (
                  <div
                    key={`left-${type}`}
                    className={`w-16 h-5 rounded text-[10px] flex items-center justify-center font-medium ${
                      n ? 'text-white' : 'text-slate-600'
                    }`}
                    style={{ backgroundColor: n ? getBerthColor(type as BerthType) + '80' : '#1e293b' }}
                  >
                    {type}
                  </div>
                );
              })}
            </div>

            {/* Aisle */}
            <div className="w-8 flex items-center justify-center">
              <div className="w-0.5 h-full bg-slate-600" />
            </div>

            {/* Side berths */}
            <div className="flex flex-col gap-1 items-center">
              <p className="text-[10px] text-slate-500 mb-1">Side</p>
              {['SU', 'SL'].map((type) => (
                <div
                  key={`side-${type}`}
                  className="w-14 h-5 rounded text-[10px] flex items-center justify-center font-medium text-white"
                  style={{ backgroundColor: getBerthColor(type as BerthType) + '80' }}
                >
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Neighboring berths */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-2 font-medium">Nearby Berths in Bay {bayNumber}</p>
        <div className="flex flex-wrap gap-1.5">
          {neighbors.map((nb) => (
            <span
              key={nb.number}
              className="px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: getBerthColor(nb.type as BerthType) + 'cc' }}
            >
              #{nb.number} {nb.type}
            </span>
          ))}
        </div>
      </div>

      {/* Mutual Seat Swap Action */}
      <Link
        href={`/seat-swap?coach=${coachId}&berth=${berthNumber}`}
        className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
      >
        <ArrowLeftRight className="w-4 h-4" />
        <span>Request Mutual Swap for Berth #{berthNumber}</span>
      </Link>
    </div>
  );
}

