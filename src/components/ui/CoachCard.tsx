'use client';

import React from 'react';
import Link from 'next/link';
import type { CoachBlueprint } from '@/data/coach-database';

interface CoachCardProps {
  blueprint: CoachBlueprint;
  onSelect?: () => void;
  selected?: boolean;
  trainNumber?: string;
}

export default function CoachCard({ blueprint, onSelect, selected, trainNumber }: CoachCardProps) {
  const isAC = blueprint.hasAC;

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-xl border p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
        selected
          ? 'bg-slate-800/90 border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500'
          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
      }`}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: blueprint.color, opacity: selected ? 1 : 0.6 }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: blueprint.color }}
            />
            <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
              {blueprint.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {blueprint.category} · {blueprint.generation}
          </p>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
            isAC
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {isAC ? 'AC' : 'Non-AC'}
        </span>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-900/60 rounded-lg text-center text-xs">
        <div>
          <div className="text-slate-400">Total Berths</div>
          <div className="text-base font-bold text-white mt-0.5">
            {blueprint.totalBerths > 0 ? blueprint.totalBerths : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Bays</div>
          <div className="text-base font-bold text-white mt-0.5">
            {blueprint.totalBays > 0 ? blueprint.totalBays : 'Open'}
          </div>
        </div>
        <div>
          <div className="text-slate-400">Length</div>
          <div className="text-base font-bold text-white mt-0.5">
            {(blueprint.dimensions.lengthOverBody / 1000).toFixed(1)}m
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-400 mb-4 line-clamp-2">
        {blueprint.description}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 text-xs">
        {trainNumber ? (
          <Link
            href={`/train/${trainNumber}?coach=${blueprint.id}`}
            className="flex-1 text-center py-1.5 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Explore in 3D
          </Link>
        ) : (
          <Link
            href={`/seat-finder?type=${blueprint.id}`}
            className="flex-1 text-center py-1.5 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded font-medium transition-colors"
          >
            Seat Layout
          </Link>
        )}

        <Link
          href={`/compare?c1=${blueprint.id}`}
          className="py-1.5 px-3 bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded transition-colors"
          title="Compare this coach"
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
