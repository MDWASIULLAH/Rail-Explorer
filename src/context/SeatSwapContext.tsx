'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SwapOffer, SwapProposal } from '@/types/seat-swap';
import { useAuth } from '@/context/AuthContext';

export interface SwapNotification {
  id: string;
  recipientUserId?: string;
  recipientEmail?: string;
  offerId: string;
  proposalId: string;
  message: string;
  createdAt: string;
}

interface SeatSwapContextType {
  offers: SwapOffer[];
  userOffers: SwapOffer[];
  proposals: SwapProposal[];
  notifications: SwapNotification[];
  incomingProposals: SwapProposal[];
  sentProposals: SwapProposal[];
  createOffer: (offer: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => Promise<SwapOffer>;
  proposeSwap: (proposal: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => Promise<SwapProposal | null>;
  acceptSwap: (proposalId: string) => Promise<void>;
  declineSwap: (proposalId: string) => Promise<void>;
  deleteOffer: (offerId: string) => Promise<void>;
  findMatchesForOffer: (offer: SwapOffer) => SwapOffer[];
  isSwapModalOpen: boolean;
  setIsSwapModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  prefilledCoach: string | null;
  prefilledBerth: number | null;
  prefilledTrain: string | null;
  openSwapWithPreFill: (trainNumber: string, coach: string, berth: number) => void;
  syncError: string | null;
  sharedReady: boolean;
}

const SeatSwapContext = createContext<SeatSwapContextType | null>(null);

const SWAP_STORAGE_KEY = 'rail_seat_swaps_v3';
const PROPOSAL_STORAGE_KEY = 'rail_seat_proposals_v3';
const NOTIFICATION_STORAGE_KEY = 'rail_seat_swap_notifications_v1';

export function SeatSwapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [proposals, setProposals] = useState<SwapProposal[]>([]);
  const [notifications, setNotifications] = useState<SwapNotification[]>([]);
  const offersRef = useRef<SwapOffer[]>([]);
  const proposalsRef = useRef<SwapProposal[]>([]);
  const notificationsRef = useRef<SwapNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [sharedReady, setSharedReady] = useState(false);

  const updateOffers = useCallback((update: (current: SwapOffer[]) => SwapOffer[]) => {
    const next = update(offersRef.current);
    offersRef.current = next;
    setOffers(next);
  }, []);

  const refreshShared = useCallback(async () => {
    try {
      const response = await fetch('/api/seat-swaps', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Shared swap service is unavailable.');
      const data = result.data as { offers?: SwapOffer[]; proposals?: SwapProposal[]; notifications?: SwapNotification[] };
      const nextOffers = data.offers || [];
      const nextProposals = data.proposals || [];
      const nextNotifications = data.notifications || [];
      offersRef.current = nextOffers;
      proposalsRef.current = nextProposals;
      notificationsRef.current = nextNotifications;
      setOffers(nextOffers);
      setProposals(nextProposals);
      setNotifications(nextNotifications);
      setSyncError(null);
      setSharedReady(true);
      return true;
    } catch (error) {
      setSharedReady(false);
      setSyncError(error instanceof Error ? error.message : 'Shared swap service is unavailable.');
      return false;
    }
  }, []);

  // Import the signed-in user's existing browser listing once, then poll shared state
  // so requests and acceptance notifications appear in both accounts.
  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    let cancelled = false;
    const syncAndRefresh = async () => {
      const legacyOffers = offersRef.current.filter((offer) => offer.isCurrentUser && (!offer.userId || offer.userId === user.id));
      if (legacyOffers.length) {
        try {
          await fetch('/api/seat-swaps/sync', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ offers: legacyOffers }),
          });
        } catch { /* refresh below reports backend availability */ }
      }
      if (!cancelled) await refreshShared();
    };
    void syncAndRefresh();
    const timer = window.setInterval(() => { if (!cancelled) void refreshShared(); }, 12000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [isLoaded, refreshShared, user?.id]);
  // Pre-fill state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [prefilledCoach, setPrefilledCoach] = useState<string | null>(null);
  const [prefilledBerth, setPrefilledBerth] = useState<number | null>(null);
  const [prefilledTrain, setPrefilledTrain] = useState<string | null>(null);

  // Load from storage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedOffers = localStorage.getItem(SWAP_STORAGE_KEY);
        if (storedOffers) {
          const parsed = JSON.parse(storedOffers);
          if (Array.isArray(parsed)) {
            offersRef.current = parsed;
            setOffers(parsed);
          }
        }

        const storedProps = localStorage.getItem(PROPOSAL_STORAGE_KEY);
        if (storedProps) {
          const parsed = JSON.parse(storedProps);
          if (Array.isArray(parsed)) {
            proposalsRef.current = parsed;
            setProposals(parsed);
          }
        }
        const storedNotifications = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          if (Array.isArray(parsed)) {
            notificationsRef.current = parsed;
            setNotifications(parsed);
          }
        }
      } catch (e) {
        console.warn('Error loading seat swaps:', e);
      }
      setIsLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Persist
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(offers));
      localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(proposals));
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Error saving seat swaps:', e);
    }
  }, [offers, proposals, notifications, isLoaded]);

  const userOffers = useMemo(() => offers.filter((offer) => {
    if (user?.id) return offer.userId === user.id;
    if (user?.email) return offer.userEmail?.toLowerCase() === user.email.toLowerCase();
    return offer.isCurrentUser;
  }), [offers, user]);

  const userOfferIds = useMemo(() => new Set(userOffers.map((o) => o.id)), [userOffers]);

  const incomingProposals = useMemo(
    () => proposals.filter((p) => userOfferIds.has(p.offerId)),
    [proposals, userOfferIds]
  );

  const sentProposals = useMemo(
    () => proposals.filter((proposal) => user?.id
      ? proposal.proposerUserId === user.id
      : user?.email
        ? proposal.proposerEmail?.toLowerCase() === user.email.toLowerCase()
        : proposal.isCurrentUser),
    [proposals, user]
  );

  const createOffer = useCallback(
    async (newOfferData: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => {
      const newOffer: SwapOffer = {
        ...newOfferData,
        id: `swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'AVAILABLE',
        isCurrentUser: true,
        createdAt: new Date().toISOString(),
      };
      updateOffers((prev) => [newOffer, ...prev]);
      try {
        const response = await fetch('/api/seat-swaps', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newOffer),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not share this listing.');
        await refreshShared();
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Could not share this listing.');
        throw error;
      }
      return newOffer;
    },
    [refreshShared, updateOffers]
  );

  const proposeSwap = useCallback(
    async (proposalData: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => {
      const targetOffer = offersRef.current.find((offer) => offer.id === proposalData.offerId);
      if (!targetOffer || !['AVAILABLE', 'REQUEST_PENDING'].includes(targetOffer.status)) return null;
      if (targetOffer.userId && targetOffer.userId === (proposalData.proposerUserId || user?.id)) return null;

      const newProposal: SwapProposal = {
        ...proposalData,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'PENDING',
        isCurrentUser: true,
        createdAt: new Date().toISOString(),
      };
      try {
        const response = await fetch('/api/seat-swaps/actions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'propose', offerId: newProposal.offerId, proposalId: newProposal.id, payload: newProposal }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Could not send this proposal.');
        await refreshShared();
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : 'Could not send this proposal.');
        return null;
      }
      return newProposal;
    },
    [refreshShared, user?.id]
  );

  const acceptSwap = useCallback(async (proposalId: string) => {
    const pendingProposal = proposalsRef.current.find((proposal) => proposal.id === proposalId && proposal.status === 'PENDING');
    if (!pendingProposal) return;
    const offer = offersRef.current.find((candidate) => candidate.id === pendingProposal.offerId);
    if (!offer || offer.status === 'SWAP_ACCEPTED' || (offer.status !== 'AVAILABLE' && offer.status !== 'REQUEST_PENDING')) return;
    const currentUserOwnsOffer = offer.userId
      ? offer.userId === user?.id
      : Boolean(offer.isCurrentUser);
    if (!currentUserOwnsOffer) return;

    try {
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', proposalId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not accept this proposal.');
      await refreshShared();
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Could not accept this proposal.'); }
  }, [refreshShared, user?.id]);

  const declineSwap = useCallback(async (proposalId: string) => {
    const targetProposal = proposalsRef.current.find((proposal) => proposal.id === proposalId && proposal.status === 'PENDING');
    if (!targetProposal) return;
    const targetOffer = offersRef.current.find((offer) => offer.id === targetProposal.offerId);
    if (targetOffer?.status === 'SWAP_ACCEPTED') return;
    try {
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'decline', proposalId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not decline this proposal.');
      await refreshShared();
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Could not decline this proposal.'); }
  }, [refreshShared]);

  const deleteOffer = useCallback(async (offerId: string) => {
    try {
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', offerId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not remove this listing.');
      await refreshShared();
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Could not remove this listing.'); }
  }, [refreshShared]);

  const findMatchesForOffer = useCallback(
    (targetOffer: SwapOffer) => {
      return offers.filter((candidate) => {
        if (candidate.id === targetOffer.id) return false;
        if (candidate.trainNumber !== targetOffer.trainNumber) return false;
        if (candidate.status !== 'AVAILABLE') return false;

        const preferenceMatches = (offer: SwapOffer, counterpart: SwapOffer) => {
          const desiredCoaches = offer.desiredCoaches?.map((coach) => coach.trim().toUpperCase()).filter(Boolean) ?? [];
          const desiredBerthTypes = offer.desiredBerthTypes ?? [];
          const coachMatches = desiredCoaches.length === 0 || desiredCoaches.includes(counterpart.currentCoach.toUpperCase());
          const berthTypeMatches = desiredBerthTypes.length === 0 || desiredBerthTypes.includes(counterpart.currentBerthType as 'LB' | 'MB' | 'UB' | 'SL' | 'SU');
          const berthNumberMatches = offer.desiredBerthNumber === undefined || offer.desiredBerthNumber === counterpart.currentBerth;
          return coachMatches && berthTypeMatches && berthNumberMatches;
        };

        return preferenceMatches(targetOffer, candidate) && preferenceMatches(candidate, targetOffer);
      });
    },
    [offers]
  );

  const openSwapWithPreFill = useCallback(
    (trainNumber: string, coach: string, berth: number) => {
      setPrefilledTrain(trainNumber);
      setPrefilledCoach(coach);
      setPrefilledBerth(berth);
      setIsSwapModalOpen(true);
    },
    []
  );

  return (
    <SeatSwapContext.Provider
      value={{
        offers,
        userOffers,
        proposals,
        notifications,
        incomingProposals,
        sentProposals,
        createOffer,
        proposeSwap,
        acceptSwap,
        declineSwap,
        deleteOffer,
        findMatchesForOffer,
        isSwapModalOpen,
        setIsSwapModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        prefilledCoach,
        prefilledBerth,
        prefilledTrain,
        openSwapWithPreFill,
        syncError,
        sharedReady,
      }}
    >
      {children}
    </SeatSwapContext.Provider>
  );
}

export function useSeatSwap() {
  const context = useContext(SeatSwapContext);
  if (!context) {
    throw new Error('useSeatSwap must be used within a SeatSwapProvider');
  }
  return context;
}
