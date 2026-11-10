'use client';

import React from 'react';
import { X, AlertTriangle, PhoneCall, ShieldAlert, HeartPulse, UserCheck } from 'lucide-react';
import { useStarredTrains } from '@/context/StarredTrainsContext';

export default function EmergencySosModal() {
  const { isSosModalOpen, setIsSosModalOpen } = useStarredTrains();

  if (!isSosModalOpen) return null;

  const helplines = [
    {
      number: '139',
      title: 'RailMadad Integrated Helpline',
      subtitle: 'Security, Medical, Accidents, Child Helpline & PNR Help (24x7)',
      color: 'from-amber-500 to-amber-700',
      badge: 'OFFICIAL IRCTC',
    },
    {
      number: '182',
      title: 'RPF Security Helpline',
      subtitle: 'Railway Protection Force emergency response on train/station',
      color: 'from-rose-500 to-rose-700',
      badge: 'POLICE',
    },
    {
      number: '1091',
      title: 'Women Passenger Helpline',
      subtitle: 'Dedicated assistance for women traveling alone or at night',
      color: 'from-purple-500 to-purple-700',
      badge: 'WOMEN SAFETY',
    },
    {
      number: '112',
      title: 'National Emergency Service',
      subtitle: 'Ambulance, Fire & Police emergency response across India',
      color: 'from-blue-500 to-blue-700',
      badge: 'NATIONAL SOS',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-950/50 border-b border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Emergency Helplines & SOS</h3>
              <p className="text-[11px] text-rose-300/80">Indian Railways Official 24×7 Assistance</p>
            </div>
          </div>
          <button
            onClick={() => setIsSosModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Helplines */}
        <div className="p-4 sm:p-6 space-y-3">
          {helplines.map((item) => (
            <div
              key={item.number}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white font-mono text-base">{item.number}</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-200 text-xs mt-0.5 truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.subtitle}</p>
              </div>

              <a
                href={`tel:${item.number}`}
                className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-lg shadow-rose-600/20 transition active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>
          ))}

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[11px] flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>For urgent medical aid at next station, tweet @RailMinIndia or dial 139 with your PNR.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
