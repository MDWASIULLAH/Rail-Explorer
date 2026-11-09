import React from 'react';
import LiveStatusSearchCard from '@/components/live-status/LiveStatusSearchCard';
import { Train, Radio, MapPin, Eye, Clock, ShieldCheck } from 'lucide-react';

export default function LiveStatusLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Real-Time Railway Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Live Train Running Status & Tracking
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Accurate live position updates, delay predictions, station timelines, and seamless 1-click integration with our 3D Train Simulation.
          </p>
        </div>

        {/* Search Card */}
        <LiveStatusSearchCard />

        {/* Features Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-6">
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Station-by-Station Timeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continuous vertical railway line showing completed, current, and upcoming halts with exact arrival, departure, and delay minutes.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Live Map Route Geometry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              OpenStreetMap integration with verified coordinates, passed track highlighting, and animated locomotive marker.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Integrated 3D Simulation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Directly transition from live tracking into the full 3D train explorer to find your coach, inspect inner berths, and walk the aisle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

