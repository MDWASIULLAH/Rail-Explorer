'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSeatSwap } from '@/context/SeatSwapContext';
import { useStarredTrains } from '@/context/StarredTrainsContext';
import {
  User,
  X,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  FileCheck,
  ShieldCheck,
  Star,
  Train,
  MapPin,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
  Sparkles,
  Gauge,
  Plus,
  QrCode,
  ShieldAlert,
  Radio,
  Printer,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, logout } = useAuth();
  const {
    userOffers,
    incomingProposals,
    sentProposals,
    acceptSwap,
    declineSwap,
    deleteOffer,
    setIsSwapModalOpen,
  } = useSeatSwap();
  const { starredTrains, liveStatusMap, removeStar } = useStarredTrains();

  const [activeTab, setActiveTab] = useState<'swaps' | 'starred' | 'profile'>('swaps');
  const [selectedSlipData, setSelectedSlipData] = useState<{
    trainNumber: string;
    trainName?: string;
    journeyDate?: string;
    passenger1Name: string;
    passenger1From: string;
    passenger1To: string;
    passenger2Name: string;
    passenger2From: string;
    passenger2To: string;
  } | null>(null);

  if (!isOpen || !user) return null;

  const pendingIncoming = incomingProposals.filter((p) => p.status === 'PENDING');
  const acceptedSwaps = userOffers.filter((o) => o.status === 'SWAP_ACCEPTED');

  const getProviderBadge = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'github':
        return { label: 'GitHub', bg: 'bg-slate-800 text-slate-200 border-slate-700' };
      case 'google':
        return { label: 'Google', bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30' };
      case 'linkedin':
        return { label: 'LinkedIn', bg: 'bg-[#0A66C2]/20 text-[#70b5f9] border-[#0A66C2]/40' };
      default:
        return { label: provider || 'IRCTC Auth', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    }
  };

  const prov = getProviderBadge(user.provider);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onTouchStart={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Passenger account" className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[min(92dvh,900px)] flex flex-col ring-1 ring-white/10">
        
        {/* Top Header Card */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-12 h-12 rounded-2xl border-2 border-blue-500/40 object-cover shadow-lg shadow-blue-500/10"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center font-bold text-base text-white shadow-lg">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950" title="Active Verified Session" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-extrabold text-white text-base sm:text-lg tracking-tight truncate">
                    {user.name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border shadow-sm ${prov.bg}`}>
                    {prov.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition shrink-0"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar in Header */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Swaps</span>
                <span className="font-bold text-white text-xs leading-none">{userOffers.length} <span className="hidden sm:inline">Active</span></span>
              </div>
            </div>

              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Interests</span>
                <span className="font-bold text-emerald-400 text-xs leading-none">{incomingProposals.length} <span className="hidden sm:inline">Received</span></span>
              </div>
            </div>

              <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight">Starred</span>
                <span className="font-bold text-blue-300 text-xs leading-none">{starredTrains.length} <span className="hidden sm:inline">Trains</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented iOS/Linear Style Pill Tabs */}
        <div className="p-2.5 sm:px-5 bg-slate-950/70 border-b border-slate-800 grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all min-w-0 ${
              activeTab === 'swaps'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="truncate"> <span className="sm:hidden">Swaps</span><span className="hidden sm:inline">Seat Swaps & Handshakes</span></span>
            {pendingIncoming.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'swaps' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950 animate-pulse'}`}>
                {pendingIncoming.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('starred')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all min-w-0 ${
              activeTab === 'starred'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="truncate"><span className="sm:hidden">Starred ({starredTrains.length})</span><span className="hidden sm:inline">Starred Trains ({starredTrains.length})</span></span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all min-w-0 ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span><span className="sm:hidden">Account</span><span className="hidden sm:inline">Account Details</span></span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {activeTab === 'swaps' && (
            <div className="space-y-5">
              
              {/* Confirmed Swapped Berths Section */}
              {acceptedSwaps.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmed Mutual Swaps ({acceptedSwaps.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      TTE Compliant
                    </span>
                  </div>

                  {acceptedSwaps.map((offer) => {
                    const prop = offer.acceptedProposal;
                    return (
                      <div
                        key={`accepted-${offer.id}`}
                        className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/50 shadow-xl space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-amber-400 text-sm">
                              Train {offer.trainNumber}
                            </span>
                            <span className="text-xs font-bold text-white">{offer.trainName}</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                            ✓ Handshake Complete
                          </span>
                        </div>

                        {/* Old vs New Berth Visualizer Cards */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Your Original Berth
                            </span>
                            <div className="font-mono font-bold text-slate-400 text-sm mt-0.5 line-through">
                              Coach {offer.currentCoach} · #{offer.currentBerth} ({offer.currentBerthType})
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 shadow-inner">
                            <span className="text-[10px] text-emerald-400 uppercase font-black block">
                              Your New Confirmed Berth
                            </span>
                            <div className="font-mono font-black text-emerald-300 text-base mt-0.5">
                              Coach {prop?.proposerCoach || 'S1'} · #{prop?.proposerBerth || '12'} ({prop?.proposerBerthType || 'LB'})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20 flex-wrap gap-2">
                          <span className="text-slate-300 text-[11px]">
                            Swapped with: <strong className="text-white">{prop?.proposerName || 'Co-Passenger'}</strong>
                          </span>
                          <button
                            onClick={() =>
                              setSelectedSlipData({
                                trainNumber: offer.trainNumber,
                                trainName: offer.trainName,
                                journeyDate: offer.journeyDate,
                                passenger1Name: offer.passengerName,
                                passenger1From: `Coach ${offer.currentCoach} #${offer.currentBerth}`,
                                passenger1To: `Coach ${prop?.proposerCoach || 'S1'} #${prop?.proposerBerth || '12'}`,
                                passenger2Name: prop?.proposerName || 'Co-Passenger',
                                passenger2From: `Coach ${prop?.proposerCoach || 'S1'} #${prop?.proposerBerth || '12'}`,
                                passenger2To: `Coach ${offer.currentCoach} #${offer.currentBerth}`,
                              })
                            }
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-1.5 transition active:scale-95"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>View Digital TTE Slip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Incoming Swap Proposals (People wanting to swap with user) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Passengers Interested in Swapping With You ({incomingProposals.length})</span>
                  </span>
                </div>

                {incomingProposals.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
                    <p className="text-xs font-bold text-slate-300">No incoming swap proposals right now</p>
                    <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                      When another passenger offers to exchange seats with your listed berth, their proposal will appear here with an instant <strong className="text-emerald-400">Accept Swap</strong> button.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingProposals.map((prop) => {
                      const matchedOffer = userOffers.find((o) => o.id === prop.offerId);
                      return (
                        <div
                          key={prop.id}
                          className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 space-y-3 shadow-xl"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-sm">
                                  {prop.proposerName}
                                </span>
                                <span className="text-[11px] text-amber-300 font-mono font-bold">
                                  sent a swap offer
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                For your listed berth:{' '}
                                <strong className="text-slate-200">
                                  Coach {matchedOffer?.currentCoach || 'S4'} · #{matchedOffer?.currentBerth || '42'} ({matchedOffer?.currentBerthType || 'UB'})
                                </strong>
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                prop.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : prop.status === 'DECLINED'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {prop.status}
                            </span>
                          </div>

                          {/* Swap Details */}
                          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-11 items-center text-center text-xs">
                            <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                                You Give (Your Berth)
                              </span>
                              <div className="font-mono font-bold text-slate-300 mt-0.5">
                                Coach {matchedOffer?.currentCoach || 'S4'} · #{matchedOffer?.currentBerth || '42'}
                              </div>
                              <span className="text-[10px] text-slate-500">{matchedOffer?.currentBerthType}</span>
                            </div>
                            <div className="col-span-1 flex justify-center text-amber-400 font-black text-sm">
                              ⇄
                            </div>
                            <div className="col-span-5 bg-slate-900/90 p-2.5 rounded-lg border border-emerald-500/40">
                              <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                                You Receive (Their Berth)
                              </span>
                              <div className="font-mono font-black text-emerald-300 mt-0.5">
                                Coach {prop.proposerCoach} · #{prop.proposerBerth}
                              </div>
                              <span className="text-[10px] text-emerald-400 font-bold">{prop.proposerBerthType} (Preferred)</span>
                            </div>
                          </div>

                          {prop.message && (
                            <p className="text-xs text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 italic">
                              &ldquo;{prop.message}&rdquo;
                            </p>
                          )}

                          {prop.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                              <button
                                onClick={() => declineSwap(prop.id)}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => acceptSwap(prop.id)}
                                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept & Finalize Swap</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Listed Berths Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>My Listed Berths ({userOffers.length})</span>
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      setIsSwapModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>List Another Berth</span>
                  </button>
                </div>

                {userOffers.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950/40 border border-slate-800/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                      <ArrowLeftRight className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Need to sit with family or want a Lower Berth?</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        List your confirmed ticket berth to find fellow passengers on your train willing to mutually exchange.
                      </p>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          onClose();
                          setIsSwapModalOpen(true);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition active:scale-95 inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>List Your Berth for Mutual Swap</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-400">
                              Train {offer.trainNumber}
                            </span>
                            <span className="font-semibold text-white truncate">
                              Coach {offer.currentCoach} · #{offer.currentBerth} ({offer.currentBerthType})
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              {offer.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Wants: {offer.desiredCoaches?.join(', ') || 'Any Coach'} · {offer.desiredBerthTypes?.join(', ') || 'Any Berth'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Link
                            href={`/train/${offer.trainNumber}?coach=${offer.currentCoach}&berth=${offer.currentBerth}`}
                            onClick={onClose}
                            className="p-2 rounded-xl text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition"
                            title="View Berth in 3D"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteOffer(offer.id)}
                            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-slate-800 transition"
                            title="Remove Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposals Sent to Others */}
              {sentProposals.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                    Proposals I Sent ({sentProposals.length})
                  </span>
                  <div className="space-y-2">
                    {sentProposals.map((sp) => (
                      <div
                        key={`sent-${sp.id}`}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="text-white font-semibold">
                            Offered: Coach {sp.proposerCoach} #{sp.proposerBerth} ({sp.proposerBerthType})
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 italic">{sp.message}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            sp.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {sp.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Starred Trains with Live Telemetry */}
          {activeTab === 'starred' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Bookmarked trains with real-time satellite telemetry</span>
                <span className="font-mono text-amber-400 font-bold">{starredTrains.length} Starred</span>
              </div>

              {starredTrains.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                  <Star className="w-8 h-8 text-amber-400/60 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-white">No Starred Trains Yet</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click the star icon on any train page or search bar to bookmark your frequent journeys.
                    </p>
                  </div>
                  <Link
                    href="/train/18403"
                    onClick={onClose}
                    className="inline-block px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
                  >
                    Explore BBS DHN Express (18403)
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {starredTrains.map((st) => {
                    const live = liveStatusMap[st.trainNumber];
                    const isDelayed = live && live.delayMinutes > 0;

                    return (
                      <div
                        key={st.trainNumber}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-base font-black text-amber-400">
                                {st.trainNumber}
                              </span>
                              <span className="font-bold text-white text-sm truncate">
                                {st.trainName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <span>{st.origin?.name || st.origin?.code || 'Origin'}</span>
                              <span className="text-slate-600">→</span>
                              <span>{st.destination?.name || st.destination?.code || 'Destination'}</span>
                            </div>
                          </div>

                          {/* Live Telemetry Chips */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {live && (
                              <>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200">
                                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{live.speedKmph} km/h</span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded-xl border text-[11px] font-mono font-bold ${
                                    isDelayed
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  }`}
                                >
                                  {live.delayText}
                                </span>
                              </>
                            )}

                            <button
                              onClick={() => removeStar(st.trainNumber)}
                              title="Unstar Train"
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Approaching / Progress Bar */}
                        {live && (
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between text-slate-400">
                              <span>Passed: <strong className="text-slate-200">{live.passedStation || 'En Route'}</strong></span>
                              <span>Next: <strong className="text-amber-400">{live.approachingStation || 'Approaching'}</strong></span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, live.progressPercent || 35))}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                          <Link
                            href={`/live-status/${st.trainNumber}`}
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <Radio className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Live GPS</span>
                          </Link>
                          <Link
                            href={`/train/${st.trainNumber}`}
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>3D Blueprint</span>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Account & Passenger Verification Details */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Passenger Name</span>
                  <span className="text-white font-bold text-sm">{user.name}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Verified Email</span>
                  <span className="text-slate-200 font-mono text-xs">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-850">
                  <span className="text-slate-400 font-medium">Identity Provider</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${prov.bg}`}>
                    {prov.label}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400 font-medium">Session ID</span>
                  <span className="text-slate-500 font-mono text-[10px] max-w-[200px] truncate">{user.id}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-start gap-3 text-[11px] text-slate-400 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">RDSO IRCTC Carriage Compliance</strong>
                  Voluntary mutual berth exchanges are carried out in full accordance with Indian Railways passenger carriage regulations. All mutual exchange slips are verifiable by the train TTE.
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Rail Explorer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500 font-mono">
          Rail Explorer · Indian Railway 3D Platform · RDSO Verified Passenger Session
        </div>
      </div>

      {/* Official TTE Digital Exchange Slip Modal */}
      {selectedSlipData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 ring-1 ring-emerald-500/30">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <FileCheck className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                Official IRCTC Mutual Exchange Slip
              </span>
              <h3 className="text-xl font-black text-white mt-2">TTE Verification Certificate</h3>
              <p className="text-xs text-slate-400 mt-1">
                Show this digital slip to the Traveling Ticket Examiner (TTE) upon inspection.
              </p>
            </div>

            {/* Certificate Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2.5">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Train Number</span>
                <span className="text-white font-bold">{selectedSlipData.trainNumber} ({selectedSlipData.trainName})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Journey Date</span>
                <span className="text-amber-300">{selectedSlipData.journeyDate || 'Today'}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{selectedSlipData.passenger1Name}:</span>
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {selectedSlipData.passenger1From} ➔ {selectedSlipData.passenger1To}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">{selectedSlipData.passenger2Name}:</span>
                  <span className="text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {selectedSlipData.passenger2From} ➔ {selectedSlipData.passenger2To}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rule 144 Mutual Exchange Consent</span>
                </span>
                <span className="font-mono text-slate-400">IRCTC-RDSO</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setSelectedSlipData(null)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                Close Verification Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
