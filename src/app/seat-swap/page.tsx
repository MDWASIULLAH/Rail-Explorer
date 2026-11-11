'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSeatSwap } from '@/context/SeatSwapContext';
import type { SwapReasonCategory, SwapOffer } from '@/types/seat-swap';
import {
  ArrowLeftRight,
  Plus,
  Users,
  Heart,
  Baby,
  Activity,
  CheckCircle2,
  Sparkles,
  Filter,
  Eye,
  ShieldCheck,
  X,
  Search,
  Lock,
  TrendingUp,
  Clock,
  MapPin,
  Train,
  AlertTriangle,
  Trash2,
  Info,
  Zap,
  ChevronDown,
  LogIn,
} from 'lucide-react';

/* ─────────────────── Reason Configs ─────────────────── */
const REASON_CONFIG: Record<
  SwapReasonCategory,
  { label: string; shortLabel: string; icon: any; color: string; bg: string; border: string; gradient: string }
> = {
  FAMILY_PROXIMITY: {
    label: 'Family Split in Coaches',
    shortLabel: 'Family',
    icon: Users,
    color: 'text-blue-300',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  SENIOR_CITIZEN: {
    label: 'Senior Citizen Need',
    shortLabel: 'Senior',
    icon: Heart,
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    gradient: 'from-amber-500/20 to-amber-600/5',
  },
  MEDICAL_CONDITION: {
    label: 'Medical Condition',
    shortLabel: 'Medical',
    icon: Activity,
    color: 'text-rose-300',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    gradient: 'from-rose-500/20 to-rose-600/5',
  },
  PREFER_LOWER: {
    label: 'Prefers Lower Berth',
    shortLabel: 'Lower',
    icon: ArrowLeftRight,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
  },
  PREFER_WINDOW: {
    label: 'Willing to Give Lower',
    shortLabel: 'Give Lower',
    icon: Sparkles,
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
    gradient: 'from-cyan-500/20 to-cyan-600/5',
  },
  TRAVELING_WITH_INFANT: {
    label: 'Traveling with Infant',
    shortLabel: 'With Baby',
    icon: Baby,
    color: 'text-purple-300',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    gradient: 'from-purple-500/20 to-purple-600/5',
  },
};

/* ─────────────────── Helpers ─────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getBerthClass(type: string): string {
  switch (type) {
    case 'LB': return 'text-emerald-400';
    case 'MB': return 'text-amber-400';
    case 'UB': return 'text-rose-400';
    case 'SL': return 'text-blue-400';
    case 'SU': return 'text-purple-400';
    default: return 'text-slate-300';
  }
}

/* ═══════════════════════════════════════════════════════ */
/* MAIN PAGE                                              */
/* ═══════════════════════════════════════════════════════ */
export default function SeatSwapPage() {
  const { user, loginWithGoogle, loginWithGitHub, loginWithLinkedIn } = useAuth();
  const {
    offers,
    userOffers,
    createOffer,
    deleteOffer,
    proposeSwap,
    findMatchesForOffer,
    isSwapModalOpen,
    setIsSwapModalOpen,
    prefilledCoach,
    prefilledBerth,
    prefilledTrain,
  } = useSeatSwap();

  const [selectedTrainFilter, setSelectedTrainFilter] = useState<string>('ALL');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHandshakeOffer, setActiveHandshakeOffer] = useState<SwapOffer | null>(null);
  const [confirmedSwapData, setConfirmedSwapData] = useState<{
    offer: SwapOffer;
    proposerCoach: string;
    proposerBerth: string;
    proposerName: string;
  } | null>(null);
  const [showMyListings, setShowMyListings] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Form states
  const [trainNumber, setTrainNumber] = useState(prefilledTrain || '');
  const [coachId, setCoachId] = useState(prefilledCoach || '');
  const [berthNumber, setBerthNumber] = useState<number | ''>(prefilledBerth || '');
  const [berthType, setBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('LB');
  const [coachClass, setCoachClass] = useState('Sleeper Class (SL)');
  const [desiredCoachText, setDesiredCoachText] = useState('');
  const [desiredBerthType, setDesiredBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('LB');
  const [reasonCategory, setReasonCategory] = useState<SwapReasonCategory>('FAMILY_PROXIMITY');
  const [reasonDescription, setReasonDescription] = useState('');
  const [passengerName, setPassengerName] = useState(user?.name || '');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');

  // Propose form
  const [myProposalCoach, setMyProposalCoach] = useState('');
  const [myProposalBerth, setMyProposalBerth] = useState('');
  const [myProposalBerthType, setMyProposalBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('LB');
  const [myProposalMessage, setMyProposalMessage] = useState('');

  /* ─── Computed ─── */
  const uniqueTrains = useMemo(() => {
    const map = new Map<string, string>();
    offers.forEach((o) => map.set(o.trainNumber, o.trainName));
    return Array.from(map.entries());
  }, [offers]);

  const filteredOffers = useMemo(() => {
    let list = showMyListings ? userOffers : offers;
    if (selectedTrainFilter !== 'ALL') list = list.filter((o) => o.trainNumber === selectedTrainFilter);
    if (selectedReasonFilter !== 'ALL') list = list.filter((o) => o.reasonCategory === selectedReasonFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.trainNumber.includes(q) ||
          o.trainName.toLowerCase().includes(q) ||
          o.currentCoach.toLowerCase().includes(q) ||
          o.passengerName.toLowerCase().includes(q) ||
          o.fromStation.toLowerCase().includes(q) ||
          o.toStation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [offers, userOffers, showMyListings, selectedTrainFilter, selectedReasonFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = offers.length;
    const familyCount = offers.filter((o) => o.reasonCategory === 'FAMILY_PROXIMITY').length;
    const seniorCount = offers.filter((o) => o.reasonCategory === 'SENIOR_CITIZEN' || o.reasonCategory === 'MEDICAL_CONDITION').length;
    const trainCount = new Set(offers.map((o) => o.trainNumber)).size;
    return { total, familyCount, seniorCount, trainCount };
  }, [offers]);

  /* ─── Handlers ─── */
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const desiredCoaches = desiredCoachText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    createOffer({
      trainNumber,
      trainName: `Train ${trainNumber}`,
      journeyDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      fromStation: fromStation || 'Boarding Station',
      toStation: toStation || 'Destination',
      currentCoach: coachId.toUpperCase(),
      currentBerth: Number(berthNumber),
      currentBerthType: berthType,
      currentCoachClass: coachClass,
      desiredCoaches: desiredCoaches.length > 0 ? desiredCoaches : undefined,
      desiredBerthTypes: [desiredBerthType],
      reasonCategory,
      reasonDescription:
        reasonDescription || 'Seeking mutual berth exchange for comfortable travel.',
      passengerName: passengerName || user.name || 'Passenger',
    });

    // Reset form
    setTrainNumber('');
    setCoachId('');
    setBerthNumber('');
    setDesiredCoachText('');
    setReasonDescription('');
    setFromStation('');
    setToStation('');
    setIsSwapModalOpen(false);
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHandshakeOffer || !user) return;

    proposeSwap({
      offerId: activeHandshakeOffer.id,
      proposerName: user.name || 'Passenger',
      proposerCoach: myProposalCoach.toUpperCase(),
      proposerBerth: Number(myProposalBerth),
      proposerBerthType: myProposalBerthType,
      message: myProposalMessage || 'I would like to swap berths with you.',
    });

    setConfirmedSwapData({
      offer: activeHandshakeOffer,
      proposerCoach: myProposalCoach.toUpperCase(),
      proposerBerth: myProposalBerth,
      proposerName: user.name || 'Passenger',
    });

    setActiveHandshakeOffer(null);
    setMyProposalCoach('');
    setMyProposalBerth('');
    setMyProposalMessage('');
  };

  /* ═══════════════════════════════════════════════════════ */
  /* AUTH GATE — Full-page login prompt for unauthenticated */
  /* ═══════════════════════════════════════════════════════ */
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero top */}
        <section className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800 py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Mutual Berth Swap Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Exchange Berths{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400">
                Mutually
              </span>
            </h1>

            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Connect with fellow passengers on your train to swap berths — help families sit together,
              seniors get lower berths, and travelers with infants find safe seats.
            </p>
          </div>
        </section>

        {/* Auth Gate Card */}
        <div className="flex-1 flex items-start justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-800/50 to-transparent border-b border-slate-800 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-amber-400" />
                </div>
                <h2 className="text-lg font-bold text-white">Sign in to access Seat Swap</h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  For passenger safety, berth swap requests are verified through authenticated accounts.
                  Sign in to list your berth or propose a swap.
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-3">
                <button
                  onClick={() => loginWithGoogle('/seat-swap')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <button
                  onClick={() => loginWithGitHub('/seat-swap')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-sm border border-slate-700 transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </button>

                <button
                  onClick={() => loginWithLinkedIn('/seat-swap')}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold text-sm transition-all hover:shadow-lg active:scale-[0.98]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span>Continue with LinkedIn</span>
                </button>
              </div>

              <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Your identity is verified, not shared publicly. Only masked contact info is visible.</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Berth swap is a voluntary mutual exchange between confirmed passengers.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════ */
  /* AUTHENTICATED VIEW                                    */
  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen pb-20">
      {/* ─── Hero Section ─── */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-b border-slate-800 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Berth Swap Exchange
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm max-w-lg">
                Connect with fellow passengers to exchange berths mutually.
                Verified accounts only — safe, transparent, TTE-compliant.
              </p>
            </div>

            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>List My Berth</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition">
              <span className="text-slate-500 text-[10px] block uppercase tracking-wider">Active Requests</span>
              <span className="text-xl font-black text-white mt-0.5 block">{stats.total}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition">
              <span className="text-slate-500 text-[10px] block uppercase tracking-wider">Active Trains</span>
              <span className="text-xl font-black text-blue-400 mt-0.5 block">{stats.trainCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition">
              <span className="text-slate-500 text-[10px] block uppercase tracking-wider">Family Requests</span>
              <span className="text-xl font-black text-amber-400 mt-0.5 block">{stats.familyCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition">
              <span className="text-slate-500 text-[10px] block uppercase tracking-wider">Medical / Senior</span>
              <span className="text-xl font-black text-rose-400 mt-0.5 block">{stats.seniorCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Container ─── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-5">

        {/* ─── How It Works Bar ─── */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900/50 to-amber-950/40 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">How It Works</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span className="text-slate-300"><strong className="text-white">List your berth</strong> — Enter your coach, berth number, and what you prefer</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span className="text-slate-300"><strong className="text-white">Browse requests</strong> — Find passengers on your train open to swap</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span className="text-slate-300"><strong className="text-white">Propose a swap</strong> — Send your berth details to the other passenger</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <span className="text-slate-300"><strong className="text-white">Get a digital slip</strong> — Show the TTE to confirm the voluntary exchange</span>
            </div>
          </div>
        </div>

        {/* ─── Filters & Search Bar ─── */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-900 p-3 rounded-2xl border border-slate-800">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search train, coach, name…"
              className="bg-transparent text-white placeholder:text-slate-500 focus:outline-none w-full text-xs"
            />
          </div>

          {/* Train filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTrainFilter}
              onChange={(e) => setSelectedTrainFilter(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none text-xs"
            >
              <option value="ALL">All Trains ({offers.length})</option>
              {uniqueTrains.map(([num, name]) => (
                <option key={num} value={num}>
                  {num} {name}
                </option>
              ))}
            </select>
          </div>

          {/* Reason filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <select
              value={selectedReasonFilter}
              onChange={(e) => setSelectedReasonFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs"
            >
              <option value="ALL">All Reasons</option>
              {Object.entries(REASON_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
          </div>

          {/* My Listings toggle */}
          <button
            onClick={() => setShowMyListings((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              showMyListings
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            My Listings ({userOffers.length})
          </button>
        </div>

        {/* ─── Empty State ─── */}
        {filteredOffers.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <ArrowLeftRight className="w-8 h-8 text-slate-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {showMyListings ? 'No listings yet' : 'No swap requests found'}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {showMyListings
                  ? 'List your berth to find swap matches on your train.'
                  : searchQuery
                  ? 'Try a different search term or clear filters.'
                  : 'Be the first to list your berth for swapping!'}
              </p>
            </div>
            <button
              onClick={() => setIsSwapModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>List My Berth</span>
            </button>
          </div>
        )}

        {/* ─── Swap Offer Grid ─── */}
        {filteredOffers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOffers.map((offer) => {
              const reason = REASON_CONFIG[offer.reasonCategory] || REASON_CONFIG.FAMILY_PROXIMITY;
              const ReasonIcon = reason.icon;
              const matches = findMatchesForOffer(offer);
              const isExpanded = expandedCard === offer.id;
              const isOwn = offer.isCurrentUser;
              const statusColor =
                offer.status === 'SWAP_ACCEPTED'
                  ? 'text-emerald-400'
                  : offer.status === 'REQUEST_PENDING'
                  ? 'text-amber-400'
                  : 'text-slate-400';

              return (
                <div
                  key={offer.id}
                  className={`bg-slate-900 border rounded-2xl shadow-xl transition-all flex flex-col ${
                    isOwn ? 'border-blue-500/40 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className={`p-4 sm:p-5 space-y-3 flex-1`}>
                    {/* Top: Train info + Reason badge + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Train className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono text-sm font-black text-amber-400">{offer.trainNumber}</span>
                          <span className="font-semibold text-white text-xs">{offer.trainName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{offer.fromStation} → {offer.toStation}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${reason.bg} ${reason.border} ${reason.color}`}
                        >
                          <ReasonIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{reason.label}</span>
                          <span className="sm:hidden">{reason.shortLabel}</span>
                        </span>
                        <span className={`text-[10px] font-mono ${statusColor}`}>
                          {offer.status === 'AVAILABLE' && <Clock className="w-2.5 h-2.5 inline mr-0.5" />}
                          {offer.status === 'SWAP_ACCEPTED' ? '✓ Matched' : offer.status === 'REQUEST_PENDING' ? '⏳ Pending' : timeAgo(offer.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Seat Exchange Visualization */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="grid grid-cols-11 items-center text-center gap-1">
                        <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider">Has Berth</span>
                          <div className="font-mono font-black text-sm text-amber-300 mt-0.5">
                            {offer.currentCoach} · #{offer.currentBerth}
                          </div>
                          <span className={`text-[10px] font-mono ${getBerthClass(offer.currentBerthType)}`}>
                            {offer.currentBerthType} · {offer.currentCoachClass.split(' ')[0]}
                          </span>
                        </div>

                        <div className="col-span-1 flex justify-center text-blue-400">
                          <ArrowLeftRight className="w-4 h-4" />
                        </div>

                        <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-blue-500/20">
                          <span className="text-[9px] uppercase font-bold text-blue-400 block tracking-wider">Wants</span>
                          <div className="font-mono font-black text-sm text-white mt-0.5">
                            {offer.desiredCoaches?.join('/') || 'Any'} · {offer.desiredBerthTypes?.join('/') || 'Any'}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {offer.desiredBerthTypes?.includes('LB') ? 'Lower Preferred' : 'Flexible'}
                          </span>
                        </div>
                      </div>

                      {/* Match indicator */}
                      {matches.length > 0 && (
                        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-300">
                            {matches.length} compatible {matches.length === 1 ? 'match' : 'matches'} found on this train
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Passenger Reason */}
                    <div
                      className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 cursor-pointer"
                      onClick={() => setExpandedCard(isExpanded ? null : offer.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {offer.passengerName}
                          {offer.passengerAge && (
                            <span className="text-[11px] font-normal text-slate-400 ml-1">({offer.passengerAge} yrs)</span>
                          )}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                      {isExpanded && (
                        <p className="mt-1.5 text-slate-300">&ldquo;{offer.reasonDescription}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/train/${offer.trainNumber}?coach=${offer.currentCoach}&berth=${offer.currentBerth}`}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View in 3D</span>
                      </Link>
                      {isOwn && (
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {!isOwn && offer.status === 'AVAILABLE' && (
                      <button
                        onClick={() => setActiveHandshakeOffer(offer)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Propose Swap</span>
                      </button>
                    )}

                    {offer.status === 'SWAP_ACCEPTED' && (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Swap Confirmed
                      </span>
                    )}

                    {offer.status === 'REQUEST_PENDING' && (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
                        Request Sent
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
          <span>
            Berth swap is a voluntary mutual exchange between confirmed passengers under IRCTC rules.
            Rail Explorer facilitates the connection — the actual exchange happens on-train with TTE acknowledgment.
            No money should be exchanged for berth swaps.
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: List My Berth                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">List Your Berth for Swap</h3>
                  <p className="text-[11px] text-slate-400">
                    Posting as <strong className="text-slate-300">{user.name || user.email}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsSwapModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Train & Journey */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-blue-400" />
                  Journey Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Train Number *</label>
                    <input
                      type="text"
                      value={trainNumber}
                      onChange={(e) => setTrainNumber(e.target.value)}
                      placeholder="e.g. 12301"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">From Station</label>
                    <input
                      type="text"
                      value={fromStation}
                      onChange={(e) => setFromStation(e.target.value)}
                      placeholder="e.g. Howrah (HWH)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">To Station</label>
                    <input
                      type="text"
                      value={toStation}
                      onChange={(e) => setToStation(e.target.value)}
                      placeholder="e.g. New Delhi (NDLS)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Current Berth */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Your Current Berth (as per ticket)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Coach *</label>
                    <input
                      type="text"
                      value={coachId}
                      onChange={(e) => setCoachId(e.target.value)}
                      placeholder="S4"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Berth # *</label>
                    <input
                      type="number"
                      value={berthNumber}
                      onChange={(e) => setBerthNumber(e.target.value ? Number(e.target.value) : '')}
                      placeholder="42"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-amber-500 transition"
                      required
                      min={1}
                      max={80}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Berth Type</label>
                    <select
                      value={berthType}
                      onChange={(e: any) => setBerthType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="LB">LB (Lower)</option>
                      <option value="MB">MB (Middle)</option>
                      <option value="UB">UB (Upper)</option>
                      <option value="SL">SL (Side Lower)</option>
                      <option value="SU">SU (Side Upper)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Coach Class</label>
                  <select
                    value={coachClass}
                    onChange={(e) => setCoachClass(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white focus:outline-none"
                  >
                    <option value="Sleeper Class (SL)">Sleeper Class (SL)</option>
                    <option value="AC 3-Tier (3A)">AC 3-Tier (3A)</option>
                    <option value="AC 2-Tier (2A)">AC 2-Tier (2A)</option>
                    <option value="First AC (1A)">First AC (1A)</option>
                    <option value="General Second (2S)">General Second (2S)</option>
                  </select>
                </div>
              </div>

              {/* Desired */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Preferred Swap Destination
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Coaches (comma-separated)</label>
                    <input
                      type="text"
                      value={desiredCoachText}
                      onChange={(e) => setDesiredCoachText(e.target.value)}
                      placeholder="S1, S2 or leave empty"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Preferred Berth Type</label>
                    <select
                      value={desiredBerthType}
                      onChange={(e: any) => setDesiredBerthType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="LB">Lower Berth (LB)</option>
                      <option value="MB">Middle Berth (MB)</option>
                      <option value="UB">Upper Berth (UB)</option>
                      <option value="SL">Side Lower (SL)</option>
                      <option value="SU">Side Upper (SU)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold text-xs">Why do you need to swap?</label>
                <select
                  value={reasonCategory}
                  onChange={(e: any) => setReasonCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="FAMILY_PROXIMITY">Family split across different coaches</option>
                  <option value="SENIOR_CITIZEN">Senior citizen — cannot climb to upper berth</option>
                  <option value="MEDICAL_CONDITION">Medical condition / surgery recovery</option>
                  <option value="TRAVELING_WITH_INFANT">Traveling with infant / baby</option>
                  <option value="PREFER_WINDOW">Solo traveler — willing to give my lower berth</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold text-xs mb-1">Message to fellow passengers</label>
                <textarea
                  value={reasonDescription}
                  onChange={(e) => setReasonDescription(e.target.value)}
                  placeholder="Briefly describe your situation — e.g. 'Traveling with elderly mother who can't climb to upper berth. Need any lower berth in S1–S3.'"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 transition text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Post Swap Request</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Propose Swap                                */}
      {/* ═══════════════════════════════════════════════════ */}
      {activeHandshakeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Propose Swap to {activeHandshakeOffer.passengerName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Train {activeHandshakeOffer.trainNumber} · {activeHandshakeOffer.currentCoach} #{activeHandshakeOffer.currentBerth} ({activeHandshakeOffer.currentBerthType})
                  </p>
                </div>
              </div>
              <button onClick={() => setActiveHandshakeOffer(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  If accepted, you&apos;ll receive <strong>Coach {activeHandshakeOffer.currentCoach} · Berth #{activeHandshakeOffer.currentBerth} ({activeHandshakeOffer.currentBerthType})</strong>.
                  A digital slip will be generated for TTE verification.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-amber-400">Your berth details (what you&apos;re offering)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Coach *</label>
                    <input
                      type="text"
                      value={myProposalCoach}
                      onChange={(e) => setMyProposalCoach(e.target.value)}
                      placeholder="S1"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Berth # *</label>
                    <input
                      type="number"
                      value={myProposalBerth}
                      onChange={(e) => setMyProposalBerth(e.target.value)}
                      placeholder="12"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-amber-500"
                      required
                      min={1}
                      max={80}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Type</label>
                    <select
                      value={myProposalBerthType}
                      onChange={(e: any) => setMyProposalBerthType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono focus:outline-none"
                    >
                      <option value="LB">LB</option>
                      <option value="MB">MB</option>
                      <option value="UB">UB</option>
                      <option value="SL">SL</option>
                      <option value="SU">SU</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Message (optional)</label>
                <input
                  type="text"
                  value={myProposalMessage}
                  onChange={(e) => setMyProposalMessage(e.target.value)}
                  placeholder="e.g. Happy to help your family sit together!"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Send Swap Proposal</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL: Confirmation Slip                           */}
      {/* ═══════════════════════════════════════════════════ */}
      {confirmedSwapData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Swap Proposal Sent
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Digital Exchange Slip</h3>
              <p className="text-xs text-slate-400 mt-1">
                Show this to the Ticket Examiner (TTE) once both parties agree on-train.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Train</span>
                <span className="text-white font-bold">{confirmedSwapData.offer.trainNumber} · {confirmedSwapData.offer.trainName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Date</span>
                <span className="text-white">{confirmedSwapData.offer.journeyDate}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{confirmedSwapData.offer.passengerName}</span>
                  <span className="text-amber-300 font-bold">
                    {confirmedSwapData.offer.currentCoach} #{confirmedSwapData.offer.currentBerth} → {confirmedSwapData.proposerCoach} #{confirmedSwapData.proposerBerth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{confirmedSwapData.proposerName}</span>
                  <span className="text-emerald-300 font-bold">
                    {confirmedSwapData.proposerCoach} #{confirmedSwapData.proposerBerth} → {confirmedSwapData.offer.currentCoach} #{confirmedSwapData.offer.currentBerth}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voluntary mutual exchange under IRCTC Carriage Rules. No money exchanged.</span>
              </div>
            </div>

            <button
              onClick={() => setConfirmedSwapData(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
