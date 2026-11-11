'use client';

import { useState } from 'react';
import { compareCoaches, getComparableCoaches } from '@/lib/coach-comparison';
import { getBerthDescription, getBerthColor } from '@/lib/berth-finder';
import type { BerthType } from '@/data/coach-database';
import { GitCompare, ArrowRight, ArrowUpDown } from 'lucide-react';

export default function ComparePage() {
  const available = getComparableCoaches();
  const [coach1Id, setCoach1Id] = useState(available[0]?.id || '');
  const [coach2Id, setCoach2Id] = useState(available[1]?.id || '');

  const comparison = coach1Id && coach2Id ? compareCoaches(coach1Id, coach2Id) : null;

  const swap = () => {
    setCoach1Id(coach2Id);
    setCoach2Id(coach1Id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="page-heading-icon w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GitCompare className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Compare Coaches</h1>
        <p className="text-slate-400">Side-by-side comparison of Indian Railway coach types</p>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-3 mb-8 flex-wrap justify-center">
        <select
          value={coach1Id}
          onChange={(e) => setCoach1Id(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[200px]"
        >
          {available.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.berths} berths)</option>
          ))}
        </select>

        <button onClick={swap} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
          <ArrowUpDown className="w-5 h-5 text-slate-300" />
        </button>

        <select
          value={coach2Id}
          onChange={(e) => setCoach2Id(e.target.value)}
          className="px-4 py-3 bg-slate-800 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[200px]"
        >
          {available.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.berths} berths)</option>
          ))}
        </select>
      </div>

      {comparison && (
        <div className="space-y-6">
          {/* Verdict */}
          <div className="page-insight rounded-xl border p-5 text-center">
            <p className="text-slate-300 text-sm">{comparison.verdict}</p>
          </div>

          {/* Header cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-5 border" style={{ backgroundColor: comparison.coach1.color + '22', borderColor: comparison.coach1.color + '55' }}>
              <h3 className="font-bold text-white text-lg">{comparison.coach1.name}</h3>
              <p className="text-sm text-slate-400">{comparison.coach1.generation} · {comparison.coach1.category}</p>
            </div>
            <div className="rounded-xl p-5 border" style={{ backgroundColor: comparison.coach2.color + '22', borderColor: comparison.coach2.color + '55' }}>
              <h3 className="font-bold text-white text-lg">{comparison.coach2.name}</h3>
              <p className="text-sm text-slate-400">{comparison.coach2.generation} · {comparison.coach2.category}</p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3 bg-slate-800 border-b border-slate-700">
              <h3 className="font-semibold text-white text-sm">Dimensions</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs">
                  <th className="px-5 py-2 text-left">Dimension</th>
                  <th className="px-5 py-2 text-right">{comparison.coach1.name}</th>
                  <th className="px-5 py-2 text-right">{comparison.coach2.name}</th>
                  <th className="px-5 py-2 text-right">Diff</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Length', data: comparison.dimensions.length },
                  { label: 'Width', data: comparison.dimensions.width },
                  { label: 'Height', data: comparison.dimensions.height },
                  { label: 'Interior Width', data: comparison.dimensions.interiorWidth },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-slate-800 hover:bg-slate-800/50">
                    <td className="px-5 py-3 text-slate-300 font-medium">{row.label}</td>
                    <td className="px-5 py-3 text-white text-right">{row.data.coach1} mm</td>
                    <td className="px-5 py-3 text-white text-right">{row.data.coach2} mm</td>
                    <td className={`px-5 py-3 text-right font-medium ${row.data.diff > 0 ? 'text-emerald-400' : row.data.diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {row.data.diff > 0 ? '+' : ''}{row.data.diff} mm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Capacity */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3 bg-slate-800 border-b border-slate-700">
              <h3 className="font-semibold text-white text-sm">Capacity</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{comparison.capacity.coach1Berths}</p>
                  <p className="text-xs text-slate-400">berths</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${comparison.capacity.difference > 0 ? 'text-emerald-400' : comparison.capacity.difference < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {comparison.capacity.difference > 0 ? '+' : ''}{comparison.capacity.difference}
                  </p>
                  <p className="text-xs text-slate-400">difference</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{comparison.capacity.coach2Berths}</p>
                  <p className="text-xs text-slate-400">berths</p>
                </div>
              </div>
            </div>
          </div>

          {/* Berth Types */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3 bg-slate-800 border-b border-slate-700">
              <h3 className="font-semibold text-white text-sm">Berth Types</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs">
                  <th className="px-5 py-2 text-left">Type</th>
                  <th className="px-5 py-2 text-right">{comparison.coach1.name}</th>
                  <th className="px-5 py-2 text-right">{comparison.coach2.name}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.berthTypes.map((bt) => (
                  <tr key={bt.type} className="border-t border-slate-800">
                    <td className="px-5 py-3 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getBerthColor(bt.type) }} />
                      <span className="text-slate-300">{bt.description}</span>
                    </td>
                    <td className="px-5 py-3 text-white text-right font-medium">{bt.coach1Count}</td>
                    <td className="px-5 py-3 text-white text-right font-medium">{bt.coach2Count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amenities */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-5 py-3 bg-slate-800 border-b border-slate-700">
              <h3 className="font-semibold text-white text-sm">Amenities</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Toilets', v1: comparison.amenities.toilets.coach1, v2: comparison.amenities.toilets.coach2 },
                  { label: 'Doors', v1: comparison.amenities.doors.coach1, v2: comparison.amenities.doors.coach2 },
                  { label: 'Windows', v1: comparison.amenities.windows.coach1, v2: comparison.amenities.windows.coach2 },
                  { label: 'Air Conditioning', v1: comparison.amenities.ac.coach1 ? 'Yes' : 'No', v2: comparison.amenities.ac.coach2 ? 'Yes' : 'No' },
                ].map((row, i) => (
                  <tr key={row.label} className={i > 0 ? 'border-t border-slate-800' : ''}>
                    <td className="px-5 py-3 text-slate-300 font-medium">{row.label}</td>
                    <td className="px-5 py-3 text-white text-right">{row.v1}</td>
                    <td className="px-5 py-3 text-white text-right">{row.v2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

