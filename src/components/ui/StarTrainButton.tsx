'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useStarredTrains } from '@/context/StarredTrainsContext';

interface StarTrainButtonProps {
  trainNumber: string;
  trainName?: string;
  origin?: { code: string; name: string };
  destination?: { code: string; name: string };
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function StarTrainButton({
  trainNumber,
  trainName,
  origin,
  destination,
  size = 'md',
  showLabel = false,
  className = '',
}: StarTrainButtonProps) {
  const { isStarred, toggleStar } = useStarredTrains();
  const starred = isStarred(trainNumber);
  const [animating, setAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleStar({ trainNumber, trainName, origin, destination });
    setTimeout(() => setAnimating(false), 400);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const buttonPadding = {
    sm: 'p-1.5 text-xs',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3.5 py-2 text-sm',
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={starred ? `Remove train ${trainNumber} from starred trains` : `Star train ${trainNumber}`}
      aria-pressed={starred}
      title={starred ? `Unstar Train ${trainNumber}` : `Star Train ${trainNumber} for Live Tracking`}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all duration-200 active:scale-95 ${buttonPadding[size]} ${
        starred
          ? 'bg-amber-400/15 border border-amber-400/40 text-amber-300 shadow-md shadow-amber-500/10 hover:bg-amber-400/25'
          : 'bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-300 hover:text-white'
      } ${className}`}
    >
      <Star
        className={`${iconSizes[size]} transition-transform duration-300 ${
          starred ? 'fill-amber-400 text-amber-400' : 'text-slate-400 group-hover:text-amber-300'
        } ${animating ? 'scale-125 rotate-12' : ''}`}
      />
      {showLabel && (
        <span className="font-mono">{starred ? 'Starred' : 'Star Train'}</span>
      )}
    </button>
  );
}

