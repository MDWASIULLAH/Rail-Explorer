'use client';

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { trainAudio } from '@/lib/train-audio';

interface HornButtonProps {
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}

export default function HornButton({
  size = 'md',
  className = '',
  showLabel = true,
}: HornButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleHorn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(true);
    trainAudio.playHorn(1.2);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  return (
    <button
      onClick={handleHorn}
      type="button"
      title="Play Authentic WAP-7 Locomotive Air Horn (370 Hz / 311 Hz)"
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-95 ${
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      } ${
        isPlaying
          ? 'bg-amber-500 text-slate-950 border border-amber-300 shadow-lg shadow-amber-500/30 scale-105'
          : 'bg-slate-800 hover:bg-slate-750 text-amber-300 border border-slate-700/80 shadow'
      } ${className}`}
    >
      <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce text-slate-950' : 'text-amber-400'}`} />
      {showLabel && (
        <span className="font-mono uppercase tracking-wider text-[11px]">
          {isPlaying ? 'Horn Blasting...' : 'WAP-7 Horn'}
        </span>
      )}
    </button>
  );
}

