'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Train, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface LiveStatusSearchCardProps {
  initialQuery?: string;
}

export default function LiveStatusSearchCard({ initialQuery = '' }: LiveStatusSearchCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [dateType, setDateType] = useState<'today' | 'tomorrow' | 'yesterday'>('today');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    router.push(`/live-status/${encodeURIComponent(clean)}?date=${dateType}`);
  };

  const POPULAR_TRAINS = [
    { number: '18403', name: 'BBS DHN Express', route: 'BBS → DHN' },
    { number: '04092', name: 'HWH Summer Spl', route: 'BXR Line' },
    { number: '12301', name: 'Howrah Rajdhani', route: 'HWH → NDLS' },
    { number: '12951', name: 'Tejas Rajdhani', route: 'MMCT → NDLS' },
    { number: '22436', name: 'Vande Bharat', route: 'NDLS → BSB' },
  ];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-8 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
          <Train className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            Live Train Running Status
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time satellite GPS tracking, delay alerts & station timelines
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Input Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Train Number or Train Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 18403, 12301, Rajdhani, Vande Bharat"
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Date Selector Chips matching ConfirmTkt */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Journey Date
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'tomorrow', label: 'Tomorrow' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDateType(d.id as any)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                  dateType === d.id
                    ? 'bg-blue-600 text-white border-blue-400 shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>CHECK LIVE RUNNING STATUS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Quick Select Popular Trains */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-2.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Track Popular Trains:</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TRAINS.map((train) => (
            <button
              key={train.number}
              type="button"
              onClick={() => {
                setQuery(train.number);
                router.push(`/live-status/${train.number}`);
              }}
              className="py-1 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <span className="font-mono text-amber-400 font-bold">{train.number}</span>
              <span>{train.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

