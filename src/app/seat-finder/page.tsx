'use client';

import { useState } from 'react';
import { COACH_BLUEPRINTS, resolveCoachBlueprint } from '@/data/coach-database';
import { formatBerthInfo, getBerthColor, getBerthDescription, getAvailableBlueprints } from '@/lib/berth-finder';
import type { BerthType } from '@/data/coach-database';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SeatFinderPage() {
  const blueprints = getAvailableBlueprints().filter((b) => b.totalBerths > 0);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(blueprints[0]?.id || '');
  const [berthInput, setBerthInput] = useState('');
  const [result, setResult] = useState<ReturnType<typeof formatBerthInfo> | null>(null);
  const [searchError, setSearchError] = useState('');

  const handleSearch = () => {
    setSearchError('');
    setResult(null);
    const num = parseInt(berthInput);
    if (!num || num < 1) {
      setSearchError('Enter a valid berth number');
      return;
    }
    const bp = COACH_BLUEPRINTS[selectedBlueprintId];
    if (!bp) {
      setSearchError('Select a coach type');
      return;
    }
    if (num > bp.totalBerths) {
      setSearchError(`This coach has only ${bp.totalBerths} berths. Berth ${num} does not exist.`);
      return;
    }
    const info = formatBerthInfo(bp, num);
    if (!info) {
      setSearchError('Berth not found in this coach layout');
      return;
    }
    setResult(info);
  };

  const bp = COACH_BLUEPRINTS[selectedBlueprintId];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <MapPin className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Seat & Berth Finder</h1>
        <p className="text-slate-400">Find your exact berth position, type, and surrounding berths</p>
      </div>

      {/* Search */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Coach Type</label>
            <select
              value={selectedBlueprintId}
              onChange={(e) => { setSelectedBlueprintId(e.target.value); setResult(null); }}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              {blueprints.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.totalBerths})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Berth Number</label>
            <input
              type="number"
              value={berthInput}
              onChange={(e) => setBerthInput(e.target.value)}
              placeholder="e.g. 45"
              min={1}
              max={bp?.totalBerths || 100}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Find Berth
            </button>
          </div>
        </div>
        {searchError && <p className="mt-3 text-sm text-red-400">{searchError}</p>}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-5">
          {/* Main info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: result.color }}
              >
                {berthInput}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{result.label}</h3>
                <p className="text-slate-400">{result.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Position</p>
                <p className="text-sm font-medium text-white">{result.position}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Bay</p>
                <p className="text-sm font-medium text-white">Bay {result.bayNumber}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Coach</p>
                <p className="text-sm font-medium text-white">{bp?.name}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Nearest Door</p>
                <p className="text-sm font-medium text-white">~{result.distanceToNearestDoor}m</p>
              </div>
            </div>
          </div>

          {/* Bay visualization */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4 text-sm">Bay {result.bayNumber} Layout</h3>
            <div className="flex gap-6 justify-center items-start">
              {/* Main berths (left side) */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 text-center mb-2">Main Section</p>
                {['UB', 'MB', 'LB'].map((type) => {
                  const matching = result.neighbors.filter((n) => n.type === type);
                  const isCurrent = result.description.includes(getBerthDescription(type as BerthType));
                  return (
                    <div key={type} className="flex gap-1.5">
                      {[0, 1].map((side) => {
                        const berth = matching[side];
                        const isThis = isCurrent && side === 0;
                        return (
                          <div
                            key={side}
                            className={`w-20 h-7 rounded flex items-center justify-center text-xs font-medium transition-all ${
                              isThis ? 'ring-2 ring-amber-400 scale-105' : ''
                            }`}
                            style={{
                              backgroundColor: getBerthColor(type as BerthType) + (berth || isThis ? 'cc' : '33'),
                              color: berth || isThis ? '#fff' : '#64748b',
                            }}
                          >
                            {berth ? `#${berth.number} ${type}` : isThis ? `#${berthInput} ${type}` : type}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Aisle */}
              <div className="flex flex-col items-center justify-center h-full pt-6">
                <div className="w-px h-20 bg-slate-600" />
                <p className="text-[10px] text-slate-500 mt-1">Aisle</p>
              </div>

              {/* Side berths */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 text-center mb-2">Side</p>
                {['SU', 'SL'].map((type) => {
                  const berth = result.neighbors.find((n) => n.type === type);
                  const isCurrent = result.description.includes(getBerthDescription(type as BerthType));
                  return (
                    <div
                      key={type}
                      className={`w-20 h-7 rounded flex items-center justify-center text-xs font-medium ${
                        isCurrent ? 'ring-2 ring-amber-400 scale-105' : ''
                      }`}
                      style={{
                        backgroundColor: getBerthColor(type as BerthType) + (berth || isCurrent ? 'cc' : '33'),
                        color: berth || isCurrent ? '#fff' : '#64748b',
                      }}
                    >
                      {berth ? `#${berth.number} ${type}` : isCurrent ? `#${berthInput} ${type}` : type}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Neighbors */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-3 text-sm">All Berths in Bay {result.bayNumber}</h3>
            <div className="flex flex-wrap gap-2">
              {result.neighbors.map((nb) => (
                <div
                  key={nb.number}
                  className="px-3 py-2 rounded-lg text-sm text-white font-medium"
                  style={{ backgroundColor: getBerthColor(nb.type as BerthType) + 'aa' }}
                >
                  #{nb.number} — {nb.description}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick reference */}
      {!result && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h3 className="font-semibold text-white mb-4">Berth Types Reference</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(['LB', 'MB', 'UB', 'SL', 'SU', 'SEAT'] as BerthType[]).map((type) => (
              <div key={type} className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: getBerthColor(type) }} />
                <div>
                  <p className="text-sm font-medium text-white">{type}</p>
                  <p className="text-xs text-slate-400">{getBerthDescription(type)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

