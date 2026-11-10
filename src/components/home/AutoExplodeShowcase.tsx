'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StarTrainButton from '@/components/ui/StarTrainButton';
import HornButton from '@/components/ui/HornButton';
import {
  Layers,
  Eye,
  Radio,
  ArrowRight,
  Maximize2,
  Cpu,
  Compass,
  Gauge,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface RakeCoachSpec {
  id: string;
  code: string;
  category: string;
  subType?: string;
  berths: number;
  bays: number;
  lengthM: number;
  tareWeightT: number;
  speedRatingKm: number;
  bogieType: string;
  accent: string;
  accentBorder: string;
  accentBg: string;
  summary: string;
}

const SPEC_COACHES: RakeCoachSpec[] = [
  { id: 'WAP-7', code: 'LOCO', category: 'Electric Locomotive', subType: '3-Phase AC Co-Co', berths: 0, bays: 2, lengthM: 20.5, tareWeightT: 123.0, speedRatingKm: 160, bogieType: 'Bo-Bo High Adhesion', accent: 'text-sky-400', accentBorder: 'border-sky-500/40', accentBg: 'bg-sky-500/10', summary: '6,350 HP heavy-haul passenger traction unit with regenerative braking.' },
  { id: 'EOG', code: 'WLLRM', category: 'Power & Brake Van', subType: 'End-On-Generation', berths: 0, bays: 1, lengthM: 24.0, tareWeightT: 53.2, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-slate-400', accentBorder: 'border-slate-600/40', accentBg: 'bg-slate-800/20', summary: 'Dual 500 kVA Cummins diesel alternator sets supplying hotel load.' },
  { id: 'GS1', code: 'LS', category: 'General Second Class', berths: 100, bays: 12, lengthM: 24.0, tareWeightT: 40.5, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'High-density unreserved commuter coach with modular bi-directional seating.' },
  { id: 'S1', code: 'LWSCN', category: 'Sleeper Class', berths: 80, bays: 10, lengthM: 24.0, tareWeightT: 42.1, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'Standard 10-bay longitudinal layout with 8 berths per compartment.' },
  { id: 'S2', code: 'LWSCN', category: 'Sleeper Class', berths: 80, bays: 10, lengthM: 24.0, tareWeightT: 42.1, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'Modular composite interior panels with stainless steel washroom fittings.' },
  { id: 'S3', code: 'LWSCN', category: 'Sleeper Class', berths: 80, bays: 10, lengthM: 24.0, tareWeightT: 42.1, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'High-durability vinyl cushion berths with luggage restraint straps.' },
  { id: 'B1', code: 'LWACCN', category: 'AC 3-Tier Sleeper', berths: 72, bays: 9, lengthM: 24.0, tareWeightT: 46.5, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-blue-400', accentBorder: 'border-blue-500/40', accentBg: 'bg-blue-500/10', summary: 'Climate-controlled passenger coach with individual reading lights and 230V plugs.' },
  { id: 'B2', code: 'LWACCN', category: 'AC 3-Tier Sleeper', berths: 72, bays: 9, lengthM: 24.0, tareWeightT: 46.5, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-blue-400', accentBorder: 'border-blue-500/40', accentBg: 'bg-blue-500/10', summary: 'RMPU roof-mounted air-conditioning units with microprocessor regulation.' },
  { id: 'A1', code: 'LWACCW', category: 'AC 2-Tier Sleeper', berths: 52, bays: 9, lengthM: 24.0, tareWeightT: 44.8, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-indigo-400', accentBorder: 'border-indigo-500/40', accentBg: 'bg-indigo-500/10', summary: 'Spacious longitudinal configuration with privacy curtains and wide viewing windows.' },
  { id: 'PC', code: 'LWCBAC', category: 'AC Pantry Car', berths: 0, bays: 6, lengthM: 24.0, tareWeightT: 48.0, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-amber-400', accentBorder: 'border-amber-500/40', accentBg: 'bg-amber-500/10', summary: 'All-electric modular galley kitchen adhering to RDSO fire safety standards.' },
  { id: 'S4', code: 'LWSCN', category: 'Sleeper Class', berths: 80, bays: 10, lengthM: 24.0, tareWeightT: 42.1, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'Standard 10-bay longitudinal layout with 8 berths per compartment.' },
  { id: 'S5', code: 'LWSCN', category: 'Sleeper Class', berths: 80, bays: 10, lengthM: 24.0, tareWeightT: 42.1, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-emerald-400', accentBorder: 'border-emerald-500/40', accentBg: 'bg-emerald-500/10', summary: 'Controlled discharge toilet system (CDTS) with bio-digester integration.' },
  { id: 'SLR', code: 'LWLRRM', category: 'Brake Van & Luggage', berths: 36, bays: 4, lengthM: 24.0, tareWeightT: 49.0, speedRatingKm: 160, bogieType: 'FIAT-SIG', accent: 'text-slate-400', accentBorder: 'border-slate-600/40', accentBg: 'bg-slate-800/20', summary: 'Guard operational cabin, hand-brake wheel, and disabled passenger compartment.' },
];

export default function AutoExplodeShowcase() {
  const [isExploded, setIsExploded] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState('B1');

  const selectedSpec = SPEC_COACHES.find((c) => c.id === selectedCoachId) || SPEC_COACHES[6];

  return (
    <div className="mt-10 sm:mt-12 max-w-6xl mx-auto px-2 sm:px-4">
      {/* Precision Industrial Console Card */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Console Header Bar */}
        <div className="px-4 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
                  Rake Telemetry & Architecture
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  GPS LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Train 18403 BBS DHN EXPRESS · 92.4 km/h · Passed 39 km past Rengali (REN) · Approaching Jharsuguda Jn (PF 2, ETA 22:45)
              </p>
            </div>
          </div>

          {/* Right Action: Exploded Architecture Switch, Horn, Star */}
          <div className="flex items-center gap-2 flex-wrap">
            <StarTrainButton
              trainNumber="18403"
              trainName="BBS DHN EXPRESS"
              size="sm"
              showLabel={true}
            />

            <HornButton size="sm" showLabel={false} />

            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 border ${
                isExploded
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isExploded ? 'Exploded: Active' : 'Explode Architecture'}</span>
            </button>

            <Link
              href="/train/18403"
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Full 3D Scene</span>
            </Link>
          </div>
        </div>

        {/* Architectural Rake Ribbon */}
        <div className="p-4 sm:p-6 bg-slate-950/60 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="flex items-center justify-start min-w-max py-2">
            {SPEC_COACHES.map((coach, index) => {
              const isSelected = coach.id === selectedCoachId;
              const isLoco = coach.code === 'LOCO';

              return (
                <React.Fragment key={coach.id}>
                  {/* Caliper Gap between coaches */}
                  {index > 0 && (
                    <div
                      className={`flex flex-col items-center justify-center transition-all duration-300 ${
                        isExploded ? 'w-12 sm:w-16 px-1' : 'w-2 sm:w-3'
                      }`}
                    >
                      {isExploded ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-mono text-blue-400 font-bold">
                            +8.5m
                          </span>
                          <div className="w-full h-px bg-slate-700 relative">
                            <div className="absolute left-0 -top-0.5 w-1 h-1 rounded-full bg-blue-400" />
                            <div className="absolute right-0 -top-0.5 w-1 h-1 rounded-full bg-blue-400" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-3 bg-slate-800 rounded-xs" />
                      )}
                    </div>
                  )}

                  {/* Coach Schematic Module */}
                  <button
                    onClick={() => setSelectedCoachId(coach.id)}
                    className={`relative text-left transition-all duration-200 rounded-lg p-2.5 sm:p-3 border flex flex-col justify-between ${
                      isLoco ? 'w-24 sm:w-28' : 'w-20 sm:w-24'
                    } h-20 sm:h-22 ${
                      isSelected
                        ? 'bg-slate-850 border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/50'
                        : 'bg-slate-900 hover:bg-slate-850/80 border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`font-mono font-bold text-xs sm:text-sm ${coach.accent}`}>
                        {coach.id}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-slate-500">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Schematic Windows Line */}
                    <div className="w-full my-auto flex gap-1 items-center justify-center">
                      {!isLoco ? (
                        Array.from({ length: 5 }).map((_, wi) => (
                          <div
                            key={wi}
                            className={`h-2 flex-1 rounded-xs transition-colors ${
                              isSelected ? 'bg-slate-300' : 'bg-slate-700'
                            }`}
                          />
                        ))
                      ) : (
                        <div className="w-full h-2.5 bg-sky-500/30 rounded-xs border border-sky-400/40" />
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400">
                      <span>{coach.code}</span>
                      <span>{coach.berths > 0 ? `${coach.berths}B` : 'LOCO'}</span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Selected Coach Specification Sheet */}
        <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Left: Metadata */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-2.5 py-1 rounded font-mono font-bold text-xs border ${selectedSpec.accentBg} ${selectedSpec.accentBorder} ${selectedSpec.accent}`}>
                  Coach {selectedSpec.id}
                </span>
                <span className="font-bold text-white text-sm sm:text-base">
                  {selectedSpec.category}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  [{selectedSpec.code}]
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedSpec.summary}
              </p>
            </div>

            {/* Center: Engineering Blueprint Specs */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Capacity</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {selectedSpec.berths > 0 ? `${selectedSpec.berths} Berths` : 'N/A'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Shell Length</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {selectedSpec.lengthM.toFixed(1)} m
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Tare Weight</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">
                  {selectedSpec.tareWeightT.toFixed(1)} t
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase">Bogie Design</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5 truncate">
                  {selectedSpec.bogieType}
                </div>
              </div>
            </div>

            {/* Right: Direct 3D Entry Action */}
            <div className="lg:col-span-2 flex justify-start lg:justify-end">
              <Link
                href={`/train/18403?coach=${selectedSpec.id}`}
                className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 text-center"
              >
                <span>Inspect 3D</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
