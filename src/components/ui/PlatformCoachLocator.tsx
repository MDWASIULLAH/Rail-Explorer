'use client';

import React, { useEffect, useState } from 'react';
import type { TrainCoach } from '@/components/3d/FullTrainView';

interface PlatformCoachLocatorProps {
  coaches: TrainCoach[];
  selectedCoachId: string | null;
  onSelectCoach: (coachId: string) => void;
  trainName?: string;
  trainNumber?: string;
}

type Entrance = 'FRONT' | 'CENTER' | 'REAR';
type PlatformResponse = {
  success?: boolean;
  data?: {
    stations?: Array<{
      station?: { code?: string; name?: string };
      assignments?: Array<{ platform?: string; confidence?: string | null }>;
    }>;
  };
};

export default function PlatformCoachLocator({
  coaches,
  selectedCoachId,
  onSelectCoach,
  trainName,
  trainNumber,
}: PlatformCoachLocatorProps) {
  const [platformEntrance, setPlatformEntrance] = useState<Entrance>('CENTER');
  const [platformAssignments, setPlatformAssignments] = useState<
    Array<{ code: string; name: string; platform: string; confidence?: string | null }>
  >([]);

  useEffect(() => {
    if (!trainNumber) return;
    const controller = new AbortController();
    fetch(`/api/train/${trainNumber}/platforms`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() as Promise<PlatformResponse> : null))
      .then((result: PlatformResponse | null) => {
        if (result?.success && Array.isArray(result.data?.stations)) {
          setPlatformAssignments(result.data.stations.map((station) => ({
            code: station.station?.code || '—',
            name: station.station?.name || '',
            platform: station.assignments?.[0]?.platform || 'Not reported',
            confidence: station.assignments?.[0]?.confidence,
          })));
        } else {
          setPlatformAssignments([]);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setPlatformAssignments([]);
      });
    return () => controller.abort();
  }, [trainNumber]);

  const coachIndex = selectedCoachId ? coaches.findIndex((coach) => coach.coachId === selectedCoachId) : -1;
  const locomotiveLength = 21;
  const averageCoachLength = 24;
  const totalLength = locomotiveLength + coaches.length * averageCoachLength;
  const entranceOffset = platformEntrance === 'FRONT'
    ? 40
    : platformEntrance === 'CENTER'
      ? totalLength / 2
      : totalLength - 50;
  const coachDistance = coachIndex >= 0 ? locomotiveLength + (coachIndex + 0.5) * averageCoachLength : null;
  const walkingDistance = coachDistance === null ? null : Math.round(Math.abs(coachDistance - entranceOffset));
  const walkMinutes = walkingDistance === null ? null : Math.max(1, Math.round(walkingDistance / 70));
  const direction = coachDistance !== null && coachDistance < entranceOffset ? 'the engine end' : 'the guard end';

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900 shadow-lg">
      <header className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-300">Platform coach locator</p>
          <h3 className="text-base font-bold text-white sm:text-lg">Find your coach before you board</h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-400">
            {trainName ? `${trainName} · ` : ''}Choose the entrance you expect to use. The diagram follows the listed coach order.
          </p>
        </div>
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs font-medium text-slate-400">Platform entrance</legend>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1 text-xs">
            {([['FRONT', 'Engine end'], ['CENTER', 'Middle'], ['REAR', 'Guard end']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={platformEntrance === value}
                onClick={() => setPlatformEntrance(value)}
                className={`min-h-10 rounded-lg px-2 font-semibold transition-colors ${platformEntrance === value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
              >{label}</button>
            ))}
          </div>
        </fieldset>
      </header>

      {platformAssignments.length > 0 && (
        <div className="border-b border-slate-800 p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-200">Reported platform stops</span>
            <span className="rounded-md bg-emerald-950 px-2 py-1 text-[10px] font-medium text-emerald-300">Provider report · verify locally</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {platformAssignments.map((station) => (
              <div key={`${station.code}-${station.name}`} className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <span className="font-semibold text-white" title={station.name}>{station.code}</span>
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${station.platform === 'Not reported' ? 'bg-slate-800 text-slate-400' : 'bg-amber-950 text-amber-300'}`}>
                  {station.platform === 'Not reported' ? station.platform : `PF ${station.platform}`}
                </span>
                {station.confidence && <span className="text-[10px] text-slate-500">{station.confidence}</span>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">Platform assignments can change. Follow the station display or announcement before boarding.</p>
        </div>
      )}

      {selectedCoachId && walkingDistance !== null && (
        <div className="grid gap-4 border-b border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-950 text-sm font-bold text-blue-200">{selectedCoachId}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-300">Coach position estimate</div>
              <div className="mt-1 text-sm font-semibold text-white">{walkingDistance === 0 ? 'Near your selected entrance' : `About ${walkingDistance} m towards ${direction}`}</div>
            </div>
          </div>
          <div className="flex items-center gap-5 sm:justify-end">
            <div><div className="text-xs text-slate-400">Estimated walk</div><div className="mt-1 text-lg font-bold tabular-nums text-amber-300">{walkingDistance} m</div></div>
            <div className="border-l border-slate-700 pl-5"><div className="text-xs text-slate-400">Easy walking pace</div><div className="mt-1 text-lg font-bold tabular-nums text-emerald-300">~{walkMinutes} min</div></div>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
            <span className="text-slate-300">Engine</span>
            <span className="text-center">Reference rake · about {Math.round(totalLength)} m</span>
            <span className="text-slate-300">Guard van</span>
          </div>
          <div className="relative mb-4 h-2 rounded-full bg-slate-800">
            <span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-amber-400" style={{ left: platformEntrance === 'FRONT' ? '10%' : platformEntrance === 'CENTER' ? '50%' : '90%' }} />
            <span className="sr-only">Selected platform entrance: {platformEntrance.toLowerCase()}</span>
          </div>
          <div className="overflow-x-auto pb-2" aria-label="Scrollable train coach sequence">
            <div className="flex min-w-[720px] items-stretch gap-1.5 py-2">
              <div className="flex w-20 shrink-0 flex-col justify-center rounded-lg border border-red-900 bg-red-950/70 px-2 py-3 text-center">
                <span className="text-xs font-bold text-red-200">LOCO</span><span className="mt-1 text-[10px] text-red-300">WAP-7</span>
              </div>
              {coaches.map((coach) => {
                const isTarget = coach.coachId === selectedCoachId;
                const isAC = !['SL', 'GS', 'GEN', 'EOG', 'SLR'].includes(coach.coachType);
                return (
                  <button
                    key={coach.coachId}
                    type="button"
                    aria-pressed={isTarget}
                    onClick={() => onSelectCoach(coach.coachId)}
                    className={`min-w-[46px] flex-1 rounded-lg border px-1 py-3 text-center transition-colors ${isTarget ? 'z-10 border-amber-300 bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300/40' : isAC ? 'border-blue-900 bg-blue-950/70 text-blue-200 hover:bg-blue-900' : 'border-emerald-900 bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900'}`}
                    title={`Coach ${coach.coachId}, ${coach.coachType}`}
                  >
                    <span className="block truncate text-xs font-bold">{coach.coachId}</span><span className="mt-1 block truncate text-[10px] opacity-75">{coach.coachType}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
            <span className="flex flex-wrap items-center gap-x-4 gap-y-2"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-600" /> AC class</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Sleeper / general</span></span>
            <span className="text-slate-500">Select a coach to update its estimate</span>
          </div>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Coach lengths and entrance locations are approximate. Actual rake order and platform access can vary by service and station.</p>
      </div>
    </section>
  );
}
