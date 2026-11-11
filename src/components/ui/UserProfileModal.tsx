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
  const { starredTrains } = useStarredTrains();

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-blue-400/50 object-cover shadow"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow">
                {user.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base sm:text-lg">{user.name}</h2>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                  {user.provider}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'swaps'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Seat Swaps & Handshakes</span>
            {pendingIncoming.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
                {pendingIncoming.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('starred')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'starred'
                ? 'border-blue-400 text-blue-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Starred Trains ({starredTrains.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-purple-400 text-purple-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account Details</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'swaps' && (
            <div className="space-y-5">
              {/* Confirmed Swapped Berths (Prominent Success Section) */}
              {acceptedSwaps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Confirmed Swapped Berths</h3>
                  </div>
                  {acceptedSwaps.map((offer) => {
                    const prop = offer.acceptedProposal;
                    return (
                      <div
                        key={`accepted-${offer.id}`}
                        className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-3"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-300 text-sm">
                              Train {offer.trainNumber}
                            </span>
                            <span className="text-xs text-white">({offer.trainName})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                            Swap Complete
                          </span>
                        </div>

                        {/* Old vs New Berth Visualizer */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Your Original Berth (Ticket)
                            </span>
                            <div className="font-mono font-bold text-slate-300 text-sm mt-0.5 line-through">
                              Coach {offer.currentCoach} · #{offer.currentBerth} ({offer.currentBerthType})
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40">
                            <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                              Your New Confirmed Berth
                            </span>
                            <div className="font-mono font-black text-emerald-300 text-sm mt-0.5">
                              Coach {prop?.proposerCoach || 'S1'} · #{prop?.proposerBerth || '12'} ({prop?.proposerBerthType || 'LB'})
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-emerald-500/20">
                          <span className="text-slate-400 text-[11px]">
                            Swapped with passenger: <strong>{prop?.proposerName || 'Co-Passenger'}</strong>
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
                            className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow flex items-center gap-1.5 transition active:scale-95"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>View TTE Digital Slip</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Incoming Swap Proposals (People interested in swapping with you) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-white text-sm">
                      Passengers Interested in Swapping With You ({incomingProposals.length})
                    </h3>
                  </div>
                </div>

                {incomingProposals.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                    <p>No incoming swap proposals right now.</p>
                    <p className="text-[11px] text-slate-500">
                      When another passenger offers to swap with your listed berth, it will appear here for you to accept or decline.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingProposals.map((prop) => {
                      const matchedOffer = userOffers.find((o) => o.id === prop.offerId);
                      return (
                        <div
                          key={prop.id}
                          className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 shadow-lg"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-xs sm:text-sm">
                                  {prop.proposerName}
                                </span>
                                <span className="text-[11px] text-amber-400 font-mono font-bold">
                                  wants to swap with you
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                For your berth:{' '}
                                <strong>
                                  Coach {matchedOffer?.currentCoach || 'S4'} · #{matchedOffer?.currentBerth || '42'} ({matchedOffer?.currentBerthType || 'UB'})
                                </strong>
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                prop.status === 'ACCEPTED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : prop.status === 'DECLINED'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              }`}
                            >
                              {prop.status}
                            </span>
                          </div>

                          {/* Swap Details */}
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 grid grid-cols-11 items-center text-center text-xs">
                            <div className="col-span-5 bg-slate-950 p-2 rounded">
                              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                                You Give (Your Berth)
                              </span>
                              <div className="font-mono font-bold text-slate-200 mt-0.5">
                                Coach {matchedOffer?.currentCoach || 'S4'} · #{matchedOffer?.currentBerth || '42'}
                              </div>
                            </div>
                            <div className="col-span-1 flex justify-center text-amber-400 font-black">
                              ⇄
                            </div>
                            <div className="col-span-5 bg-slate-950 p-2 rounded border border-emerald-500/30">
                              <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                                You Receive (Their Berth)
                              </span>
                              <div className="font-mono font-bold text-emerald-300 mt-0.5">
                                Coach {prop.proposerCoach} · #{prop.proposerBerth} ({prop.proposerBerthType})
                              </div>
                            </div>
                          </div>

                          {prop.message && (
                            <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 italic">
                              &ldquo;{prop.message}&rdquo;
                            </p>
                          )}

                          {prop.status === 'PENDING' && (
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                              <button
                                onClick={() => declineSwap(prop.id)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => acceptSwap(prop.id)}
                                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Accept & Swap Seat</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Listed Berths */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">
                    My Active Berth Swap Requests ({userOffers.length})
                  </h3>
                  <button
                    onClick={() => {
                      onClose();
                      setIsSwapModalOpen(true);
                    }}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>+ List Another Berth</span>
                  </button>
                </div>

                {userOffers.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                    <p>You have not listed any berths for swapping yet.</p>
                    <button
                      onClick={() => {
                        onClose();
                        setIsSwapModalOpen(true);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
                    >
                      List Your Berth for Mutual Swap
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userOffers.map((offer) => (
                      <div
                        key={offer.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400">
                              Train {offer.trainNumber}
                            </span>
                            <span className="font-semibold text-white">
                              Coach {offer.currentCoach} · #{offer.currentBerth} ({offer.currentBerthType})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Looking for: {offer.desiredCoaches?.join(', ') || 'Any Coach'} ·{' '}
                            {offer.desiredBerthTypes?.join(', ') || 'Any Berth'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/train/${offer.trainNumber}?coach=${offer.currentCoach}&berth=${offer.currentBerth}`}
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-800"
                            title="View in 3D"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteOffer(offer.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-slate-800"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Proposals I Sent to Other Passengers */}
              {sentProposals.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm">
                    Proposals I Sent ({sentProposals.length})
                  </h3>
                  <div className="space-y-2">
                    {sentProposals.map((sp) => (
                      <div
                        key={`sent-${sp.id}`}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="text-white font-semibold">
                            Offered: Coach {sp.proposerCoach} #{sp.proposerBerth} ({sp.proposerBerthType})
                          </p>
                          <p className="text-[11px] text-slate-400">{sp.message}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            sp.status === 'ACCEPTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
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

          {activeTab === 'starred' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Your bookmarked trains with live satellite GPS and 3D coach layouts.
              </p>
              {starredTrains.length === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                  <p>You haven&apos;t starred any trains yet.</p>
                  <Link
                    href="/train/18403"
                    onClick={onClose}
                    className="inline-block px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow"
                  >
                    Explore BBS DHN Express (18403)
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {starredTrains.map((st) => (
                    <div
                      key={st.trainNumber}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">
                            {st.trainNumber}
                          </span>
                          <span className="font-semibold text-white">{st.trainName}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {st.origin?.name || st.origin?.code || 'Origin'} → {st.destination?.name || st.destination?.code || 'Destination'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/live-status/${st.trainNumber}`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/train/${st.trainNumber}`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1"
                        >
                          <span>3D</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Full Name</span>
                  <span className="text-white font-semibold">{user.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Email Address</span>
                  <span className="text-white font-mono">{user.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Auth Method</span>
                  <span className="text-blue-300 font-semibold uppercase">{user.provider}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">User ID</span>
                  <span className="text-slate-400 font-mono text-[10px]">{user.id}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Authenticated via RDSO IRCTC security architecture. All mutual seat swaps adhere to IRCTC Carriage & Conduct Regulations.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500">
          Indian Railway 3D Platform · RDSO Verified Passenger Session
        </div>
      </div>

      {/* Slip Dialog */}
      {selectedSlipData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Official Mutual Swap Slip
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">TTE Verification Slip</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Present this digital slip to the Traveling Ticket Examiner (TTE)
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Train</span>
                <span className="text-white font-bold">{selectedSlipData.trainNumber} ({selectedSlipData.trainName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{selectedSlipData.passenger1Name}:</span>
                <span className="text-amber-300 font-bold">{selectedSlipData.passenger1From} → {selectedSlipData.passenger1To}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{selectedSlipData.passenger2Name}:</span>
                <span className="text-emerald-300 font-bold">{selectedSlipData.passenger2From} → {selectedSlipData.passenger2To}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                Voluntary mutual exchange between confirmed passengers under IRCTC rules.
              </div>
            </div>

            <button
              onClick={() => setSelectedSlipData(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
            >
              Close Slip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
