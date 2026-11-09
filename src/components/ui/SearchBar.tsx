'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SearchMode = 'pnr' | 'trainNumber' | 'trainName';

interface SearchBarProps {
  defaultMode?: SearchMode;
  onSearch?: (query: string, mode: SearchMode) => void;
  className?: string;
  compact?: boolean;
}

export default function SearchBar({ defaultMode = 'trainNumber', onSearch, className = '', compact = false }: SearchBarProps) {
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const placeholders: Record<SearchMode, string> = {
    pnr: 'Enter 10-digit PNR number',
    trainNumber: 'Enter train number (e.g. 12301)',
    trainName: 'Enter train name (e.g. Rajdhani)',
  };

  const validate = (): boolean => {
    if (!query.trim()) { setError('Please enter a value'); return false; }
    if (mode === 'pnr' && !/^\d{10}$/.test(query.trim())) { setError('PNR must be exactly 10 digits'); return false; }
    if (mode === 'trainNumber' && !/^\d{4,5}$/.test(query.trim())) { setError('Train number must be 4-5 digits'); return false; }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    if (onSearch) {
      onSearch(query.trim(), mode);
      setLoading(false);
    } else {
      if (mode === 'pnr') {
        router.push(`/pnr?pnr=${query.trim()}`);
      } else if (mode === 'trainNumber') {
        router.push(`/train/${query.trim()}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Mode tabs */}
      {!compact && (
        <div className="flex gap-1 mb-3">
          {[
            { key: 'pnr' as SearchMode, label: 'PNR Number' },
            { key: 'trainNumber' as SearchMode, label: 'Train Number' },
            { key: 'trainName' as SearchMode, label: 'Train Name' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMode(tab.key); setError(''); setQuery(''); }}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                mode === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setError(''); }}
            placeholder={placeholders[mode]}
            className={`w-full pl-10 pr-4 bg-slate-800 border border-slate-600 text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              compact ? 'py-2.5 text-sm' : 'py-3.5 text-base'
            }`}
            maxLength={mode === 'pnr' ? 10 : 50}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 ${
            compact ? 'px-4 py-2.5 text-sm' : 'px-6 py-3.5'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}

