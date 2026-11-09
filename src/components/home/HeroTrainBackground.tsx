'use client';

import React from 'react';

/**
 * HeroTrainBackground
 * 
 * Clean, sophisticated architectural gradient backdrop with subtle high-precision
 * gridlines, deep cosmic gradients, and ambient lighting. No cartoon graphics.
 */
export default function HeroTrainBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
      {/* 1. Deep Midnight Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* 2. Soft Engineering Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* 3. Subtle Ambient Light Cones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-blue-600/[0.07] rounded-full blur-[140px]" />
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-indigo-600/[0.04] rounded-full blur-[120px]" />

      {/* 4. Fine Horizon Track Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />
    </div>
  );
}
