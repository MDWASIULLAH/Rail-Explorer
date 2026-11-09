'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Eye,
  Maximize2,
  Navigation,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Activity,
  Play,
  Pause,
} from 'lucide-react';

interface ShowcaseCoach {
  id: string;
  type: string;
  category: string;
  berths: number;
  color: string;
  borderColor: string;
  description: string;
  classCode: string;
}

const RAKE_COACHES: ShowcaseCoach[] = [
  { id: 'WAP-7', type: 'LOCO', category: 'Electric Locomotive', berths: 0, color: 'from-blue-700 to-indigo-900', borderColor: 'border-blue-400', description: '6,350 HP Three-Phase AC High-Speed Traction Engine', classCode: 'LOCO' },
  { id: 'EOG', type: 'EOG', category: 'End-on-Generation Car', berths: 0, color: 'from-emerald-700 to-emerald-950', borderColor: 'border-emerald-500', description: 'Dual 500 kVA Diesel Generator & Luggage Compartment', classCode: 'POWER' },
  { id: 'GS1', type: 'GS', category: 'General Second Class', berths: 100, color: 'from-emerald-600 to-emerald-900', borderColor: 'border-emerald-400', description: 'Unreserved High-Capacity Commuter Seating', classCode: 'GEN' },
  { id: 'S1', type: 'SL', category: 'LHB Sleeper Class', berths: 80, color: 'from-emerald-600 to-teal-900', borderColor: 'border-teal-400', description: '10 Bays · Lower, Middle, Upper & Side Berths', classCode: 'SLEEPER' },
  { id: 'S2', type: 'SL', category: 'LHB Sleeper Class', berths: 80, color: 'from-emerald-600 to-teal-900', borderColor: 'border-teal-400', description: '10 Bays · Non-AC Cushion Berths', classCode: 'SLEEPER' },
  { id: 'S3', type: 'SL', category: 'LHB Sleeper Class', berths: 80, color: 'from-emerald-600 to-teal-900', borderColor: 'border-teal-400', description: '10 Bays · High Comfort Foam Berths', classCode: 'SLEEPER' },
  { id: 'B1', type: '3A', category: 'AC 3-Tier Sleeper', berths: 72, color: 'from-blue-600 to-blue-900', borderColor: 'border-blue-400', description: 'Air Conditioned 9 Bays with Reading Lights & Plugs', classCode: '3-TIER AC' },
  { id: 'B2', type: '3A', category: 'AC 3-Tier Sleeper', berths: 72, color: 'from-blue-600 to-blue-900', borderColor: 'border-blue-400', description: 'Air Conditioned 9 Bays with Climate Control', classCode: '3-TIER AC' },
  { id: 'A1', type: '2A', category: 'AC 2-Tier Sleeper', berths: 52, color: 'from-indigo-600 to-purple-900', borderColor: 'border-indigo-400', description: 'Spacious 2-Tier Berths with Privacy Curtains', classCode: '2-TIER AC' },
  { id: 'PC', type: 'PC', category: 'Pantry Car', berths: 0, color: 'from-amber-600 to-orange-950', borderColor: 'border-amber-400', description: 'IRCTC Kitchen & Catering Equipment', classCode: 'PANTRY' },
  { id: 'S4', type: 'SL', category: 'LHB Sleeper Class', berths: 80, color: 'from-emerald-600 to-teal-900', borderColor: 'border-teal-400', description: '10 Bays · Non-AC Cushion Berths', classCode: 'SLEEPER' },
  { id: 'S5', type: 'SL', category: 'LHB Sleeper Class', berths: 80, color: 'from-emerald-600 to-teal-900', borderColor: 'border-teal-400', description: '10 Bays · Non-AC Cushion Berths', classCode: 'SLEEPER' },
  { id: 'SLR', type: 'SLR', category: 'Seating & Luggage Rake', berths: 36, color: 'from-slate-700 to-slate-900', borderColor: 'border-slate-500', description: 'Guard Van & Disabled Passenger Berths', classCode: 'GUARD' },
];

export default function AutoExplodeShowcase() {
  const [isExploded, setIsExploded] = useState(false);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [activeCoachIndex, setActiveCoachIndex] = useState(6); // Default B1 AC 3-Tier
  const [liveSpeed, setLiveSpeed] = useState(92);

  // Auto-tour sequence
  useEffect(() => {
    if (!isAutoTour) return;
    const interval = setInterval(() => {
      setActiveCoachIndex((prev) => (prev + 1) % RAKE_COACHES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isAutoTour]);

  // Subtle speed fluctuation for live feel
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveSpeed(88 + Math.floor(Math.random() * 5));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const activeCoach = RAKE_COACHES[activeCoachIndex] || RAKE_COACHES[0];

  return (
    <div className="mt-10 sm:mt-14 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Container Card */}
      <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Top Control Bar: Live Train Telemetry + Explode Button */}
        <div className="p-3.5 sm:p-5 bg-slate-950/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          {/* Live Train Status Info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-white text-sm sm:text-base">18403</span>
                <span className="font-bold text-slate-200 text-xs sm:text-sm">BBS DHN EXPRESS</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Satellite GPS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-emerald-400 font-semibold">Passed: Rengali</span>
                <span>➔</span>
                <span className="text-amber-300 font-semibold">Approaching: Jharsuguda Jn (PF 2)</span>
                <span className="text-slate-600">·</span>
                <span>ETA: 22:45</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {/* Speedometer Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-base sm:text-lg font-mono font-black text-amber-400">{liveSpeed}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">km/h</span>
            </div>

            {/* Auto-Tour Toggle */}
            <button
              onClick={() => setIsAutoTour(!isAutoTour)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border active:scale-95 ${
                isAutoTour
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Automatically tour and cycle through each coach"
            >
              {isAutoTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isAutoTour ? 'Touring...' : 'Auto Tour'}</span>
            </button>

            {/* AUTO EXPLODE TOGGLE */}
            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-black transition flex items-center gap-2 border active:scale-95 shadow-xl ${
                isExploded
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400 shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isExploded ? 'Exploded View ON' : '💥 Auto Explode Rake'}</span>
            </button>
          </div>
        </div>

        {/* Coach Timeline Stream (Exploded or Coupled Mode) */}
        <div className="p-4 sm:p-6 bg-slate-950/60 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex items-end justify-start min-w-max pb-3">
            {RAKE_COACHES.map((coach, index) => {
              const isActive = index === activeCoachIndex;
              const isLoco = coach.type === 'LOCO';

              return (
                <React.Fragment key={coach.id}>
                  {/* Gangway Coupler or Exploded Distance Caliper */}
                  {index > 0 && (
                    <div
                      className={`flex flex-col items-center justify-center transition-all duration-500 ${
                        isExploded ? 'w-10 sm:w-16 px-1' : 'w-2 sm:w-3'
                      }`}
                    >
                      {isExploded ? (
                        <div className="flex flex-col items-center gap-0.5 animate-fadeIn">
                          <span className="text-[9px] font-mono font-bold text-amber-400 bg-slate-900/90 px-1 py-0.5 rounded border border-amber-400/30">
                            +8.5m
                          </span>
                          <div className="w-full h-0.5 bg-amber-400/50 relative">
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-amber-400" />
                            <div className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-amber-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-5 sm:h-7 bg-slate-800 rounded-sm" />
                      )}
                    </div>
                  )}

                  {/* Coach Block / Card */}
                  <div
                    onClick={() => setActiveCoachIndex(index)}
                    className={`group relative cursor-pointer flex flex-col items-center transition-all duration-300 ${
                      isActive ? 'scale-105 z-10' : 'hover:scale-102 opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Floating Pin / Tag when active */}
                    {isActive && (
                      <div className="mb-1 sm:mb-2 px-2 py-0.5 rounded-md bg-blue-600 text-white font-mono font-black text-[10px] shadow-lg animate-bounce">
                        {coach.id}
                      </div>
                    )}

                    {/* Coach Body */}
                    <div
                      className={`h-14 sm:h-18 rounded-xl border flex flex-col justify-between p-1.5 sm:p-2 bg-gradient-to-b ${
                        coach.color
                      } ${isActive ? 'ring-2 ring-blue-400 shadow-xl shadow-blue-500/30' : coach.borderColor} ${
                        isLoco ? 'w-20 sm:w-24 rounded-l-2xl' : 'w-16 sm:w-20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
                        <span className="font-mono font-black">{coach.id}</span>
                        <span className="text-[9px] opacity-80">{coach.classCode}</span>
                      </div>

                      {/* Coach Windows */}
                      {!isLoco ? (
                        <div className="flex gap-1 justify-center my-auto">
                          {Array.from({ length: 4 }).map((_, w) => (
                            <div
                              key={w}
                              className={`w-2.5 h-3 rounded-xs ${
                                isActive ? 'bg-amber-300 shadow-[0_0_6px_#fde047]' : 'bg-amber-200/70'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 my-auto">
                          <div className="w-3.5 h-3 bg-cyan-400/90 rounded-xs" />
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        </div>
                      )}

                      <div className="text-[9px] font-mono text-center text-white/80">
                        {coach.berths > 0 ? `${coach.berths} B` : coach.type}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Coach Detailed Exploded Panel */}
        <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Left: Coach Overview */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-black text-sm">
                Coach {activeCoach.id}
              </span>
              <span className="text-white font-bold text-sm sm:text-base">{activeCoach.category}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{activeCoach.description}</p>
          </div>

          {/* Center: Specs Breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Total Berths</div>
              <div className="font-mono font-bold text-amber-400 text-sm sm:text-base">
                {activeCoach.berths > 0 ? activeCoach.berths : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Coach Length</div>
              <div className="font-mono font-bold text-slate-200 text-sm sm:text-base">24.0m</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Standard Rake</div>
              <div className="font-mono font-bold text-emerald-400 text-sm sm:text-base">LHB RDSO</div>
            </div>
          </div>

          {/* Right: Direct 3D Navigation Action */}
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/train/18403?coach=${activeCoach.id}`}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 border border-blue-400/40 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>Explore Coach {activeCoach.id} in 3D ➔</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

