'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';
import { useTrainStore } from '@/store/train-store';
import { Train, MapPin, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const { searchTrains, searchResults, isLoading, error } = useTrainStore();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (q) {
      searchTrains(q);
      setSearched(true);
    }
  }, [q, searchTrains]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">Train Explorer</h1>
      <p className="text-slate-400 mb-8">Search for any Indian train to explore it in 3D</p>

      <SearchBar
        defaultMode="trainName"
        onSearch={(query) => {
          searchTrains(query);
          setSearched(true);
        }}
        className="mb-8"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          Searching trains...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-300 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!isLoading && searched && searchResults.length === 0 && !error && (
        <div className="text-center py-16 text-slate-400">
          <Train className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No trains found. Try a different search.</p>
        </div>
      )}

      <div className="grid gap-3">
        {searchResults.map((train) => (
          <Link
            key={train.trainNumber}
            href={`/train/${train.trainNumber}`}
            className="group flex items-center justify-between p-5 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-blue-600/50 hover:bg-slate-800/80 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Train className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{train.trainNumber}</span>
                  <span className="text-slate-300">{train.trainName}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  {train.origin?.name || 'N/A'}
                  <ArrowRight className="w-3 h-3" />
                  {train.destination?.name || 'N/A'}
                </div>
                {train.classes && train.classes.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {train.classes.slice(0, 6).map((cls) => (
                      <span key={cls} className="px-1.5 py-0.5 bg-slate-700 rounded text-[10px] text-slate-300 font-medium">
                        {cls}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

