'use client';

import { useMemo } from 'react';
import { resolveCoachBlueprint, getCoachColor, type CoachCategory } from '@/data/coach-database';

interface TrainCoach {
  coachId: string;
  coachType: string;
  position: number;
}

interface TrainCompositionProps {
  coaches: TrainCoach[];
  selectedCoachId: string | null;
  onCoachClick: (coachId: string) => void;
  compact?: boolean;
}

export default function TrainComposition({ coaches, selectedCoachId, onCoachClick, compact = false }: TrainCompositionProps) {
  const coachBlocks = useMemo(() => {
    return coaches
      .map((coach, inputIndex) => ({ ...coach, inputIndex }))
      // Provider rakes can include marker rows. Keep the engine/end markers visual,
      // but never render them as selectable passenger coaches as well.
      .filter((coach) => !['LOCO', 'ENGINE', 'END'].includes(coach.coachId.toUpperCase()))
      .sort((a, b) => (a.position - b.position) || (a.inputIndex - b.inputIndex))
      .map((coach) => {
      const blueprintId = resolveCoachBlueprint(coach.coachId);
      const category = blueprintId.replace('LHB_', '') as CoachCategory;
      const color = getCoachColor(category);
      return { ...coach, color, category };
      });
  }, [coaches]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-0.5 overflow-x-auto pb-1 sm:pb-2 scrollbar-none sm:scrollbar-thin touch-pan-x select-none snap-x">
        {/* Locomotive */}
        <div className={`flex-shrink-0 ${compact ? 'h-8 w-14' : 'h-12 w-20'} bg-gradient-to-r from-blue-800 to-blue-600 rounded-l-lg flex items-center justify-center text-white text-xs font-bold border border-blue-500`}>
          LOCO
        </div>

        {coachBlocks.map((coach) => (
          <button
            key={coach.coachId}
            onClick={() => onCoachClick(coach.coachId)}
            className={`flex-shrink-0 ${compact ? 'h-8 min-w-[44px] text-[10px]' : 'h-12 min-w-[56px] text-xs'} px-1 flex items-center justify-center font-semibold border transition-all duration-200 ${
              selectedCoachId === coach.coachId
                ? 'ring-2 ring-amber-400 border-amber-400 scale-110 z-10 shadow-lg shadow-amber-400/30'
                : 'border-slate-600 hover:border-slate-400 hover:scale-105'
            }`}
            style={{
              backgroundColor: coach.color + (selectedCoachId === coach.coachId ? 'ff' : 'cc'),
              color: '#fff',
            }}
            title={`${coach.coachId} (${coach.coachType})`}
          >
            {coach.coachId}
          </button>
        ))}

        {/* End */}
        <div className={`flex-shrink-0 ${compact ? 'h-8 w-10' : 'h-12 w-14'} bg-slate-700 rounded-r-lg flex items-center justify-center text-slate-400 text-xs border border-slate-600`}>
          END
        </div>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('SL') }} /> Sleeper</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('3A') }} /> AC 3-Tier</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('2A') }} /> AC 2-Tier</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('1A') }} /> First AC</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('PC') }} /> Pantry</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: getCoachColor('EOG') }} /> EOG/SLR</span>
        </div>
      )}
    </div>
  );
}

