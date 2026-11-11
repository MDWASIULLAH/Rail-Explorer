'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Plus,
  Users,
  Heart,
  Baby,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  PhoneCall,
  ShieldCheck,
  X,
  FileCheck,
} from 'lucide-react';
import { useSeatSwap } from '@/context/SeatSwapContext';
import type { SwapReasonCategory, SwapOffer } from '@/types/seat-swap';

const REASON_CONFIG: Record<
  SwapReasonCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  FAMILY_PROXIMITY: {
    label: 'Family Split in Coaches',
    icon: Users,
    color: 'text-blue-300',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
  },
  SENIOR_CITIZEN: {
    label: 'Senior Citizen Need',
    icon: Heart,
    color: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  MEDICAL_CONDITION: {
    label: 'Medical Condition',
    icon: Activity,
    color: 'text-rose-300',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
  },
  PREFER_LOWER: {
    label: 'Prefers Lower Berth',
    icon: ArrowLeftRight,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  PREFER_WINDOW: {
    label: 'Willing to Give Lower',
    icon: Sparkles,
    color: 'text-cyan-300',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/30',
  },
  TRAVELING_WITH_INFANT: {
    label: 'Traveling with Baby',
    icon: Baby,
    color: 'text-purple-300',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
  },
};

export default function SeatSwapPage() {
  const {
    offers,
    createOffer,
    proposeSwap,
    isSwapModalOpen,
    setIsSwapModalOpen,
    prefilledCoach,
    prefilledBerth,
    prefilledTrain,
  } = useSeatSwap();

  const [selectedTrainFilter, setSelectedTrainFilter] = useState<string>('ALL');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('ALL');
  const [activeHandshakeOffer, setActiveHandshakeOffer] = useState<SwapOffer | null>(null);
  const [confirmedSwapData, setConfirmedSwapData] = useState<{
    offer: SwapOffer;
    proposerCoach: string;
    proposerBerth: string;
    proposerName: string;
  } | null>(null);

  // Form states for creating a new swap request
  const [trainNumber, setTrainNumber] = useState(prefilledTrain || '18403');
  const [coachId, setCoachId] = useState(prefilledCoach || 'S4');
  const [berthNumber, setBerthNumber] = useState<number>(prefilledBerth || 42);
  const [berthType, setBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('UB');
  const [coachClass, setCoachClass] = useState('Sleeper Class (SL)');
  const [desiredCoachText, setDesiredCoachText] = useState('S1, S2');
  const [desiredBerthType, setDesiredBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('LB');
  const [reasonCategory, setReasonCategory] = useState<SwapReasonCategory>('FAMILY_PROXIMITY');
  const [reasonDescription, setReasonDescription] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Propose Handshake form
  const [myProposalName, setMyProposalName] = useState('');
  const [myProposalCoach, setMyProposalCoach] = useState('S1');
  const [myProposalBerth, setMyProposalBerth] = useState('12');
  const [myProposalBerthType, setMyProposalBerthType] = useState<'LB' | 'MB' | 'UB' | 'SL' | 'SU'>('LB');
  const [myProposalPhone, setMyProposalPhone] = useState('');
  const [myProposalMessage, setMyProposalMessage] = useState('Happy to swap berths so you can sit with your family!');

  // Filtered offers
  const filteredOffers = offers.filter((o) => {
    if (selectedTrainFilter !== 'ALL' && o.trainNumber !== selectedTrainFilter) return false;
    if (selectedReasonFilter !== 'ALL' && o.reasonCategory !== selectedReasonFilter) return false;
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const desiredCoaches = desiredCoachText
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    createOffer({
      trainNumber,
      trainName: trainNumber === '18403' ? 'BBS DHN EXPRESS' : `Train ${trainNumber}`,
      journeyDate: 'Today',
      fromStation: 'Boarding Station',
      toStation: 'Destination Station',
      currentCoach: coachId.toUpperCase(),
      currentBerth: Number(berthNumber),
      currentBerthType: berthType,
      currentCoachClass: coachClass,
      desiredCoaches: desiredCoaches.length > 0 ? desiredCoaches : undefined,
      desiredBerthTypes: [desiredBerthType],
      reasonCategory,
      reasonDescription:
        reasonDescription ||
        'Seeking mutual berth exchange to sit with family or travel comfortably.',
      passengerName: passengerName || 'Passenger',
      contactMasked: contactNumber ? `+91 ${contactNumber.slice(-4)}****` : undefined,
    });

    setIsSwapModalOpen(false);
  };

  const handleProposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHandshakeOffer) return;

    proposeSwap({
      offerId: activeHandshakeOffer.id,
      proposerName: myProposalName || 'Co-Passenger',
      proposerCoach: myProposalCoach.toUpperCase(),
      proposerBerth: Number(myProposalBerth),
      proposerBerthType: myProposalBerthType,
      proposerPhone: myProposalPhone,
      message: myProposalMessage,
    });

    setConfirmedSwapData({
      offer: activeHandshakeOffer,
      proposerCoach: myProposalCoach.toUpperCase(),
      proposerBerth: myProposalBerth,
      proposerName: myProposalName || 'Passenger',
    });

    setActiveHandshakeOffer(null);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Innovation · Inspired by 13-Year-Old Shireen Kalra</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Mutual Berth Swap &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-rose-400">
              Seat Exchange
            </span>
          </h1>

          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Did Indian Railways seat your family across different coaches? Or do your elderly parents have an Upper Berth?
            Exchange berths mutually with fellow passengers on your train — without the awkwardness of asking in person.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-2 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Active Offers</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{offers.length} Berths</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Match Speed</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">Instant</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">Family Proximity</span>
              <span className="text-lg font-bold text-blue-400 mt-0.5 block">100% Mutual</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase">TTE Compliance</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">Digital Slip</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Instant Match Banner on Train 18403 */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-amber-950/80 border border-blue-500/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Mutual Match Found on Train 18403!
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  98% Compatible
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong>Shireen Kalra</strong> (Coach S4 · Berth 42 UB) ⇄ <strong>Vikram Das</strong> (Coach S1 · Berth 12 LB).
                Both passengers can swap to sit with family & give Lower Berth!
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveHandshakeOffer(offers[0])}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center gap-1.5"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Connect & Swap</span>
          </button>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Train */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedTrainFilter}
                onChange={(e) => setSelectedTrainFilter(e.target.value)}
                className="bg-transparent text-white font-mono focus:outline-none"
              >
                <option value="ALL">All Trains ({offers.length})</option>
                <option value="18403">18403 BBS DHN EXP</option>
                <option value="12301">12301 Howrah Rajdhani</option>
                <option value="12951">12951 Mumbai Rajdhani</option>
              </select>
            </div>

            {/* Filter by Reason */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <select
                value={selectedReasonFilter}
                onChange={(e) => setSelectedReasonFilter(e.target.value)}
                className="bg-transparent text-white focus:outline-none text-xs"
              >
                <option value="ALL">All Swap Reasons</option>
                <option value="FAMILY_PROXIMITY">Family Split Across Coaches</option>
                <option value="SENIOR_CITIZEN">Senior Citizen / Medical</option>
                <option value="TRAVELING_WITH_INFANT">Traveling with Infant</option>
                <option value="PREFER_WINDOW">Giving Lower Berth</option>
              </select>
            </div>
          </div>

          {/* Post New Swap Offer Button */}
          <button
            onClick={() => setIsSwapModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>List My Berth for Swap</span>
          </button>
        </div>

        {/* Swap Offer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOffers.map((offer) => {
            const reason = REASON_CONFIG[offer.reasonCategory] || REASON_CONFIG.FAMILY_PROXIMITY;
            const ReasonIcon = reason.icon;

            return (
              <div
                key={offer.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xl transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Line: Train & Reason Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-amber-400">
                          {offer.trainNumber}
                        </span>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {offer.trainName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {offer.fromStation} → {offer.toStation}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${reason.bg} ${reason.border} ${reason.color}`}
                    >
                      <ReasonIcon className="w-3 h-3" />
                      <span>{reason.label}</span>
                    </span>
                  </div>

                  {/* Seat Exchange Visualization Card */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-11 items-center text-center gap-1">
                    {/* Offering Side */}
                    <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Has Berth</span>
                      <div className="font-mono font-black text-sm text-amber-300 mt-0.5">
                        Coach {offer.currentCoach} · #{offer.currentBerth}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {offer.currentBerthType} ({offer.currentCoachClass.split(' ')[0]})
                      </span>
                    </div>

                    {/* Swap Arrow */}
                    <div className="col-span-1 flex justify-center text-blue-400">
                      <ArrowLeftRight className="w-4 h-4 animate-pulse" />
                    </div>

                    {/* Desired Side */}
                    <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-blue-500/20">
                      <span className="text-[9px] uppercase font-bold text-blue-400 block">Wants Berth</span>
                      <div className="font-mono font-black text-sm text-white mt-0.5">
                        {offer.desiredCoaches?.join('/') || 'Any Coach'} · {offer.desiredBerthTypes?.join('/') || 'Any'}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {offer.desiredBerthTypes?.includes('LB') ? 'Lower Berth Preferred' : 'Any Comfort Berth'}
                      </span>
                    </div>
                  </div>

                  {/* Passenger Story / Reason */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    <span className="font-semibold text-white block mb-0.5">
                      {offer.passengerName}{' '}
                      {offer.passengerAge && (
                        <span className="text-[11px] font-normal text-slate-400">({offer.passengerAge} yrs)</span>
                      )}
                      :
                    </span>
                    &ldquo;{offer.reasonDescription}&rdquo;
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                  <Link
                    href={`/train/${offer.trainNumber}?coach=${offer.currentCoach}&berth=${offer.currentBerth}`}
                    className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View in 3D</span>
                  </Link>

                  <button
                    onClick={() => setActiveHandshakeOffer(offer)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-amber-500/20"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Propose Swap</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: List My Berth For Swap */}
      {isSwapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">List Your Berth for Mutual Swap</h3>
                  <p className="text-[11px] text-slate-400">Connect with passengers traveling on your exact train</p>
                </div>
              </div>
              <button
                onClick={() => setIsSwapModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Train & Passenger Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Train Number</label>
                  <input
                    type="text"
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value)}
                    placeholder="e.g. 18403"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    placeholder="e.g. Shireen Kalra"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              {/* Current Allocated Seat */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 text-xs block">1. Your Current Allocated Berth (on Ticket)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Coach</label>
                    <input
                      type="text"
                      value={coachId}
                      onChange={(e) => setCoachId(e.target.value)}
                      placeholder="e.g. S4"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Berth #</label>
                    <input
                      type="number"
                      value={berthNumber}
                      onChange={(e) => setBerthNumber(Number(e.target.value))}
                      placeholder="e.g. 42"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Berth Type</label>
                    <select
                      value={berthType}
                      onChange={(e: any) => setBerthType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
                    >
                      <option value="LB">LB (Lower)</option>
                      <option value="MB">MB (Middle)</option>
                      <option value="UB">UB (Upper)</option>
                      <option value="SL">SL (Side Lower)</option>
                      <option value="SU">SU (Side Upper)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Desired Berth */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="font-bold text-blue-400 text-xs block">2. Where Do You Want to Sit?</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Target Coaches (Comma-separated)</label>
                    <input
                      type="text"
                      value={desiredCoachText}
                      onChange={(e) => setDesiredCoachText(e.target.value)}
                      placeholder="e.g. S1, S2 (or leave empty)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Preferred Berth Type</label>
                    <select
                      value={desiredBerthType}
                      onChange={(e: any) => setDesiredBerthType(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
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

              {/* Reason Category */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Swap Reason</label>
                <select
                  value={reasonCategory}
                  onChange={(e: any) => setReasonCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="FAMILY_PROXIMITY">Family Split Across Different Coaches</option>
                  <option value="SENIOR_CITIZEN">Senior Citizen (Cannot Climb Upper)</option>
                  <option value="MEDICAL_CONDITION">Medical Condition / Fracture / Surgery</option>
                  <option value="TRAVELING_WITH_INFANT">Traveling with Infant / Baby</option>
                  <option value="PREFER_WINDOW">Solo Traveler (Willing to give Lower)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes for Fellow Passengers</label>
                <textarea
                  value={reasonDescription}
                  onChange={(e) => setReasonDescription(e.target.value)}
                  placeholder="e.g. My mother and baby are in Coach S1. Would love to swap for any berth in S1 or S2 to travel together!"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Post Berth Swap Request</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Propose Handshake Swap */}
      {activeHandshakeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  Propose Swap to {activeHandshakeOffer.passengerName}
                </h3>
              </div>
              <button
                onClick={() => setActiveHandshakeOffer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
                You will receive: <strong>Coach {activeHandshakeOffer.currentCoach} · Berth #{activeHandshakeOffer.currentBerth} ({activeHandshakeOffer.currentBerthType})</strong>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Your Name</label>
                <input
                  type="text"
                  value={myProposalName}
                  onChange={(e) => setMyProposalName(e.target.value)}
                  placeholder="e.g. Vikram Das"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Your Coach</label>
                  <input
                    type="text"
                    value={myProposalCoach}
                    onChange={(e) => setMyProposalCoach(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Your Berth #</label>
                  <input
                    type="number"
                    value={myProposalBerth}
                    onChange={(e) => setMyProposalBerth(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Type</label>
                  <select
                    value={myProposalBerthType}
                    onChange={(e: any) => setMyProposalBerthType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-white font-mono"
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
                <label className="block text-slate-300 font-semibold mb-1">Friendly Message</label>
                <input
                  type="text"
                  value={myProposalMessage}
                  onChange={(e) => setMyProposalMessage(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Mutual Swap Handshake</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Slip Dialog */}
      {confirmedSwapData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Mutual Swap Handshake Confirmed
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Berth Exchange Slip Ready</h3>
              <p className="text-xs text-slate-400 mt-1">
                Show this digital slip to the TTE (Ticket Examiner) during ticket verification.
              </p>
            </div>

            {/* Slip Details Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Train:</span>
                <span className="text-white font-bold">{confirmedSwapData.offer.trainNumber} ({confirmedSwapData.offer.trainName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passenger 1 ({confirmedSwapData.offer.passengerName}):</span>
                <span className="text-amber-300 font-bold">Coach {confirmedSwapData.offer.currentCoach} #{confirmedSwapData.offer.currentBerth} → Coach {confirmedSwapData.proposerCoach} #{confirmedSwapData.proposerBerth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passenger 2 ({confirmedSwapData.proposerName}):</span>
                <span className="text-emerald-300 font-bold">Coach {confirmedSwapData.proposerCoach} #{confirmedSwapData.proposerBerth} → Coach {confirmedSwapData.offer.currentCoach} #{confirmedSwapData.offer.currentBerth}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voluntary passenger mutual exchange under IRCTC Carriage Rules.</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setConfirmedSwapData(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
