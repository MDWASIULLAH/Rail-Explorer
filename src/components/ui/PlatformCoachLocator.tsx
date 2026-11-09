'use client';

import React, { useState, useEffect } from 'react';
import type { TrainCoach } from '@/components/3d/FullTrainView';

interface PlatformCoachLocatorProps {
  coaches: TrainCoach[];
  selectedCoachId: string | null;
  onSelectCoach: (coachId: string) => void;
  trainName?: string;
  trainNumber?: string;
}

export default function PlatformCoachLocator({
  coaches,
  selectedCoachId,
  onSelectCoach,
  trainName,
  trainNumber,
}: PlatformCoachLocatorProps) {
  const [platformEntrance, setPlatformEntrance] = useState<'FRONT' | 'CENTER' | 'REAR'>('CENTER');
  const [platformAssignments, setPlatformAssignments] = useState<
    Array<{ code: string; name: string; platform: string; confidence?: string | null }>
  >([]);

  useEffect(() => {
    if (!trainNumber) return;
    fetch(`/api/train/${trainNumber}/platforms`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.stations) {
          const list = res.data.stations.map((s: any) => ({
            code: s.station?.code,
            name: s.station?.name,
            platform: s.assignments?.[0]?.platform || '1',
            confidence: s.assignments?.[0]?.confidence,
          }));
          setPlatformAssignments(list);
        }
      })
      .catch(() => {});
  }, [trainNumber]);

  const totalCoaches = coaches.length;
  const coachIndex = selectedCoachId
    ? coaches.findIndex((c) => c.coachId === selectedCoachId)
    : -1;

  // Each coach ~24m, Locomotive ~21m
  const coachLength = 24.0;
  const locoLength = 21.0;
  const totalTrainLength = locoLength + totalCoaches * coachLength;

  // Approximate platform location of entrance (in meters from engine front)
  const entranceOffsetMeters =
    platformEntrance === 'FRONT'
      ? 40
      : platformEntrance === 'CENTER'
      ? totalTrainLength / 2
      : totalTrainLength - 50;

  // Distance of selected coach from engine front
  const userCoachDistance =
    coachIndex >= 0 ? locoLength + (coachIndex + 0.5) * coachLength : null;

  // Walking distance from chosen entrance to coach
  const walkDistance =
    userCoachDistance !== null
      ? Math.round(Math.abs(userCoachDistance - entranceOffsetMeters))
      : null;

  const walkTimeMins = walkDistance !== null ? Math.max(1, Math.round(walkDistance / 70)) : null;

  return (
    <div className="bg-slate-800/80 rounded-xl border border-slate-700/80 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <span>🚉</span>
            <span>Where Is My Coach On The Platform?</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify your coach position relative to Platform Entrances & Foot Overbridges (FOB)
          </p>
        </div>

        {/* Entrance Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-700 text-xs">
          <span className="text-slate-400 px-2">Your Entry Point:</span>
          <button
            onClick={() => setPlatformEntrance('FRONT')}
            className={`px-2.5 py-1 rounded transition ${
              platformEntrance === 'FRONT'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            FOB 1 (Engine End)
          </button>
          <button
            onClick={() => setPlatformEntrance('CENTER')}
            className={`px-2.5 py-1 rounded transition ${
              platformEntrance === 'CENTER'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            FOB 2 (Main Center)
          </button>
          <button
            onClick={() => setPlatformEntrance('REAR')}
            className={`px-2.5 py-1 rounded transition ${
              platformEntrance === 'REAR'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            FOB 3 (Guard End)
          </button>
        </div>
      </div>

      {/* Verified Station Platform Assignments Bar */}
      {platformAssignments.length > 0 && (
        <div className="mb-4 p-3 bg-slate-900/90 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <span>🎯</span>
              <span>Verified Station Platform Numbers</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              Where Is My Train Live Feed
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {platformAssignments.map((p) => (
              <div
                key={p.code}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 shrink-0 flex items-center gap-1.5"
              >
                <span className="font-bold text-white">{p.code}</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-black text-[11px]">
                  PF {p.platform}
                </span>
                {p.confidence && (
                  <span className="text-[10px] text-slate-500 font-mono">({p.confidence})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Walking Guidance Card if Coach Selected */}
      {selectedCoachId && walkDistance !== null && (
        <div className="mb-5 p-4 bg-gradient-to-r from-blue-950/70 to-slate-900/80 rounded-xl border border-blue-800/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-lg font-bold text-blue-300">
              {selectedCoachId}
            </div>
            <div>
              <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                Position for Coach {selectedCoachId}
              </div>
              <div className="text-sm font-medium text-white mt-0.5">
                {userCoachDistance! < entranceOffsetMeters
                  ? `Walk ~${walkDistance}m towards Engine (Front)`
                  : `Walk ~${walkDistance}m towards Guard Van (Rear)`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-xs text-slate-400">Walking Distance</div>
              <div className="text-xl font-black text-amber-400">{walkDistance} m</div>
            </div>
            <div className="border-l border-slate-700 pl-4">
              <div className="text-xs text-slate-400">Est. Platform Walk</div>
              <div className="text-xl font-black text-emerald-400">~{walkTimeMins} min</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Platform Diagram */}
      <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span>◄ ENGINE (FRONT)</span>
          </span>
          <span className="text-slate-500">Total Train Length: ~{Math.round(totalTrainLength)}m</span>
          <span className="flex items-center gap-1 text-amber-400">
            <span>GUARD (REAR) ►</span>
          </span>
        </div>

        {/* Platform Line */}
        <div className="h-2 w-full bg-slate-800 rounded-full relative mb-3">
          {/* Active FOB marker */}
          <div
            className="absolute -top-3 transform -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-300"
            style={{
              left: `${
                platformEntrance === 'FRONT'
                  ? '10%'
                  : platformEntrance === 'CENTER'
                  ? '50%'
                  : '90%'
              }`,
            }}
          >
            <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black uppercase shadow-lg">
              ▼ Your Entry
            </span>
          </div>
        </div>

        {/* Train Rake Sequence (Interactive Coach Blocks) */}
        <div className="flex items-stretch gap-1.5 py-2 min-w-[700px]">
          {/* Loco Block */}
          <div className="px-3 py-2 bg-red-900/60 border border-red-700/60 rounded text-center shrink-0 flex flex-col justify-center text-xs">
            <span className="text-[10px] text-red-300 font-bold">LOCO</span>
            <span className="text-[9px] text-red-400">WAP-7</span>
          </div>

          {/* Coach Blocks */}
          {coaches.map((c) => {
            const isTarget = c.coachId === selectedCoachId;
            const isAC = !['SL', 'GS', 'GEN', 'EOG', 'SLR'].includes(c.coachType);

            return (
              <button
                key={c.coachId}
                onClick={() => onSelectCoach(c.coachId)}
                className={`flex-1 min-w-[42px] py-2 px-1 rounded border text-center transition-all ${
                  isTarget
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 font-black shadow-lg scale-105 z-10'
                    : isAC
                    ? 'bg-blue-900/50 hover:bg-blue-800/70 border-blue-700/60 text-blue-200'
                    : 'bg-emerald-900/50 hover:bg-emerald-800/70 border-emerald-700/60 text-emerald-200'
                }`}
                title={`Coach ${c.coachId} (${c.coachType})`}
              >
                <div className="text-xs font-bold truncate">{c.coachId}</div>
                <div className="text-[9px] opacity-75 truncate">{c.coachType}</div>
              </button>
            );
          })}
        </div>

        {/* Footnote */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" /> AC Class
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" /> Sleeper / General
            </span>
          </span>
          <span className="text-[11px] text-slate-500">
            Click any coach above to locate on the platform
          </span>
        </div>
      </div>
    </div>
  );
}

