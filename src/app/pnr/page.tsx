'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTrainStore } from '@/store/train-store';
import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';
import {
  Ticket, Loader2, AlertCircle, Train, MapPin, ArrowRight,
  User, Eye, CheckCircle, Clock, XCircle,
} from 'lucide-react';

function PnrContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pnrParam = searchParams.get('pnr') || '';
  const { lookupPnr, pnrData, isLoading, error, clearError } = useTrainStore();
  const [pnrInput, setPnrInput] = useState(pnrParam);

  useEffect(() => {
    if (pnrParam && /^\d{10}$/.test(pnrParam)) {
      lookupPnr(pnrParam);
    }
  }, [pnrParam, lookupPnr]);

  const handleSearch = () => {
    if (/^\d{10}$/.test(pnrInput.trim())) {
      router.push(`/pnr?pnr=${pnrInput.trim()}`);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'text-slate-400';
    const s = status.toUpperCase();
    if (s.startsWith('CNF') || s.startsWith('CONFIRM')) return 'text-emerald-400';
    if (s.startsWith('RAC')) return 'text-amber-400';
    if (s.startsWith('WL') || s.startsWith('WAIT')) return 'text-red-400';
    return 'text-blue-400';
  };

  const getStatusIcon = (status: string) => {
    if (!status) return Clock;
    const s = status.toUpperCase();
    if (s.startsWith('CNF') || s.startsWith('CONFIRM')) return CheckCircle;
    if (s.startsWith('WL') || s.startsWith('WAIT')) return XCircle;
    return Clock;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
          <Ticket className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">PNR Status</h1>
        <p className="text-slate-400">Check your reservation status and explore your coach in 3D</p>
      </div>

      {/* PNR Input */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">Enter PNR Number</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={pnrInput}
            onChange={(e) => { setPnrInput(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError(); }}
            placeholder="Enter 10-digit PNR"
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 text-white text-lg font-mono tracking-wider rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={10}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || pnrInput.length !== 10}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
            Check
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {pnrInput.length}/10 digits · PNR is printed on your ticket
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-300 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">PNR lookup failed</p>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      )}

      {pnrData && !isLoading && (
        <div className="space-y-5">
          {/* Train Info */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Train className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">{pnrData.trainNumber} — {pnrData.trainName}</p>
                <p className="text-sm text-slate-400">{pnrData.journeyDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">From</p>
                <p className="text-sm font-medium text-white">{pnrData.from?.name || pnrData.boardingPoint?.name}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">To</p>
                <p className="text-sm font-medium text-white">{pnrData.to?.name || pnrData.reservationUpTo?.name}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Class</p>
                <p className="text-sm font-medium text-white">{pnrData.journeyClass}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-500">Chart Status</p>
                <p className="text-sm font-medium text-white">{pnrData.chartStatus || 'Not Prepared'}</p>
              </div>
            </div>
          </div>

          {/* Passengers */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Passengers
            </h3>
            <div className="space-y-3">
              {pnrData.passengers?.map((pax, i) => {
                const StatusIcon = getStatusIcon(pax.currentStatus || '');
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                        {pax.number || i + 1}
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Booking: {pax.bookingStatus}</p>
                        <p className={`text-sm font-semibold flex items-center gap-1 ${getStatusColor(pax.currentStatus || '')}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          Current: {pax.currentStatus || 'N/A'}
                        </p>
                      </div>
                    </div>
                    {pax.coachId && pax.berthNumber && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{pax.coachId} / {pax.berthNumber}</p>
                        <p className="text-xs text-slate-400">{pax.berthType}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* View in 3D */}
          <Link
            href={`/train/${pnrData.trainNumber}`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            <Eye className="w-5 h-5" />
            Explore This Train in 3D
          </Link>

          <p className="text-center text-xs text-slate-500">
            PNR data is fetched in real-time and not stored. Personal information is not retained.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PnrPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <PnrContent />
    </Suspense>
  );
}

