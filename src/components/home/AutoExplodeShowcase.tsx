'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import StarTrainButton from '@/components/ui/StarTrainButton';
import HornButton from '@/components/ui/HornButton';
import { useAuth } from '@/context/AuthContext';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { ArrowRight, Cpu, Eye, Sliders } from 'lucide-react';

const TRAIN = getOrSynthesizeTrain('18403');

const COACH_STYLE: Record<string, { label: string; accent: string; border: string; bg: string }> = {
  EOG: { label: 'End-on-generation car', accent: 'text-slate-300', border: 'border-slate-600/50', bg: 'bg-slate-800/30' },
  GS: { label: 'General second class', accent: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  SL: { label: 'Sleeper class', accent: 'text-emerald-300', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
  '3A': { label: 'AC three-tier', accent: 'text-blue-300', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  '2A': { label: 'AC two-tier', accent: 'text-indigo-300', border: 'border-indigo-500/30', bg: 'bg-indigo-500/10' },
  '1A': { label: 'AC first class', accent: 'text-violet-300', border: 'border-violet-500/30', bg: 'bg-violet-500/10' },
  PC: { label: 'Pantry car', accent: 'text-amber-300', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
  SLR: { label: 'Seating, luggage & brake van', accent: 'text-slate-300', border: 'border-slate-600/50', bg: 'bg-slate-800/30' },
};

const PASSENGER_COACH = (type: string) => !['EOG', 'PC', 'SLR', 'LOCO'].includes(type);

export default function AutoExplodeShowcase() {
  const { user } = useAuth();
  const [isExploded, setIsExploded] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState(() =>
    TRAIN.coaches.find((coach) => coach.coachId === 'B1')?.coachId ?? TRAIN.coaches[0]?.coachId ?? '',
  );
  const selectedIndex = TRAIN.coaches.findIndex((coach) => coach.coachId === selectedCoachId);
  const selectedCoach = TRAIN.coaches[selectedIndex] ?? TRAIN.coaches[0];
  const selectedStyle = selectedCoach ? COACH_STYLE[selectedCoach.coachType] : undefined;
  const trainHref = useMemo(
    () => `/train/${TRAIN.trainNumber}${selectedCoach ? `?coach=${encodeURIComponent(selectedCoach.coachId)}` : ''}`,
    [selectedCoach],
  );
  const passengerCoachCount = TRAIN.coaches.filter((coach) => PASSENGER_COACH(coach.coachType)).length;

  return (
    <div className="mt-10 sm:mt-12 max-w-6xl mx-auto px-2 sm:px-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">Train composition</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/25">REFERENCE SNAPSHOT</span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                {TRAIN.trainNumber} {TRAIN.trainName} | {TRAIN.origin.name} to {TRAIN.destination.name} | {TRAIN.coaches.length} listed coaches ({passengerCoachCount} passenger)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <>
                <StarTrainButton trainNumber={TRAIN.trainNumber} trainName={TRAIN.trainName} size="sm" showLabel />
                <HornButton size="sm" showLabel={false} />
              </>
            )}
            <button
              type="button"
              onClick={() => setIsExploded((value) => !value)}
              aria-pressed={isExploded}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 border ${
                isExploded
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isExploded ? 'Expanded view' : 'Expand coaches'}</span>
            </button>
            <Link href={trainHref} className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Full 3D scene</span>
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-950/60 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex items-center min-w-max py-2" aria-label={`${TRAIN.trainName} reference coach order`}>
            <div className="w-20 sm:w-24 h-20 sm:h-[5.5rem] rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5 flex flex-col justify-between mr-2">
              <span className="font-mono font-bold text-xs sm:text-sm text-sky-300">LOCO</span>
              <div className="h-2.5 w-full rounded-sm bg-sky-500/20 border border-sky-400/30" />
              <span className="text-[9px] font-mono text-slate-400">Locomotive type unspecified</span>
            </div>
            {TRAIN.coaches.map((coach, index) => {
              const style = COACH_STYLE[coach.coachType] ?? {
                label: coach.coachType,
                accent: 'text-slate-300',
                border: 'border-slate-700',
                bg: 'bg-slate-900',
              };
              const isSelected = coach.coachId === selectedCoachId;
              return (
                <React.Fragment key={`${coach.coachId}-${index}`}>
                  <div className={`transition-all duration-300 ${isExploded ? 'w-5 sm:w-8' : 'w-1.5 sm:w-2'}`} aria-hidden="true">
                    <div className="h-2 rounded-full bg-slate-700" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCoachId(coach.coachId)}
                    aria-pressed={isSelected}
                    aria-label={`Select ${coach.coachId}, ${style.label}`}
                    className={`relative text-left transition-all duration-200 rounded-lg p-2.5 sm:p-3 border flex flex-col justify-between w-20 sm:w-24 h-20 sm:h-[5.5rem] ${
                      isSelected
                        ? `${style.bg} ${style.border} shadow-xl ring-1 ring-blue-500/50`
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono font-bold text-xs sm:text-sm ${style.accent}`}>{coach.coachId}</span>
                      <span className="text-[9px] font-mono text-slate-500">#{index + 1}</span>
                    </div>
                    <div className="w-full my-auto flex gap-1 items-center justify-center" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, windowIndex) => (
                        <span key={windowIndex} className={`h-2 flex-1 rounded-sm ${isSelected ? 'bg-slate-300' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400">
                      <span>{coach.coachType}</span>
                      <span>{PASSENGER_COACH(coach.coachType) && coach.berthCount > 0 ? `${coach.berthCount} ${['GS', '2S', 'CC', 'EC', 'EA'].includes(coach.coachType) ? 'seats' : 'berths'}` : 'service'}</span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-500 font-mono">Curated reference composition | coach order and capacities may differ from the operating rake.</p>
        </div>

        {selectedCoach && (
          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${selectedStyle?.bg ?? 'bg-slate-800'} ${selectedStyle?.border ?? 'border-slate-700'} ${selectedStyle?.accent ?? 'text-slate-300'}`}>Coach {selectedCoach.coachId}</span>
                  <span className="font-bold text-white text-sm sm:text-base">{selectedStyle?.label ?? selectedCoach.coachType}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">Coach {selectedCoach.coachId} is listed as position {selectedIndex + 1} in this reference rake.</p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Coach class</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">{selectedCoach.coachType}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">{['GS', '2S', 'CC', 'EC', 'EA'].includes(selectedCoach.coachType) ? 'Listed seats' : 'Listed berths'}</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">{selectedCoach.berthCount > 0 && PASSENGER_COACH(selectedCoach.coachType) ? selectedCoach.berthCount : 'Not listed'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase">Reference route</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">{TRAIN.origin.code} <span className="text-slate-500">to</span> {TRAIN.destination.code}</div>
                </div>
              </div>
              <div className="lg:col-span-2 flex justify-start lg:justify-end">
                <Link href={trainHref} className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 text-center">
                  <span>Inspect {selectedCoach.coachId}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-500">Composition is a curated reference snapshot. No live train position or current rake is available here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
