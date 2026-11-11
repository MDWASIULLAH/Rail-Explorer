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
  createOffer: (offer: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => SwapOffer;
  proposeSwap: (proposal: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => SwapProposal | null;
  acceptSwap: (proposalId: string) => void;
  declineSwap: (proposalId: string) => void;
  deleteOffer: (offerId: string) => void;
  findMatchesForOffer: (offer: SwapOffer) => SwapOffer[];
  isSwapModalOpen: boolean;
  setIsSwapModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  prefilledCoach: string | null;
  prefilledBerth: number | null;
  prefilledTrain: string | null;
  openSwapWithPreFill: (trainNumber: string, coach: string, berth: number) => void;
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

  const updateOffers = useCallback((update: (current: SwapOffer[]) => SwapOffer[]) => {
    const next = update(offersRef.current);
    offersRef.current = next;
    setOffers(next);
  }, []);
  const updateProposals = useCallback((update: (current: SwapProposal[]) => SwapProposal[]) => {
    const next = update(proposalsRef.current);
    proposalsRef.current = next;
    setProposals(next);
  }, []);
  const updateNotifications = useCallback((update: (current: SwapNotification[]) => SwapNotification[]) => {
    const next = update(notificationsRef.current);
    notificationsRef.current = next;
    setNotifications(next);
  }, []);

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
    (newOfferData: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => {
      const newOffer: SwapOffer = {
        ...newOfferData,
        id: `swap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'AVAILABLE',
        isCurrentUser: true,
        createdAt: new Date().toISOString(),
      };
      updateOffers((prev) => [newOffer, ...prev]);
      return newOffer;
    },
    [updateOffers]
  );

  const proposeSwap = useCallback(
    (proposalData: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => {
      const targetOffer = offersRef.current.find((offer) => offer.id === proposalData.offerId);
      if (!targetOffer || targetOffer.status !== 'AVAILABLE') return null;
      if (targetOffer.userId && targetOffer.userId === (proposalData.proposerUserId || user?.id)) return null;

      const newProposal: SwapProposal = {
        ...proposalData,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'PENDING',
        isCurrentUser: true,
        createdAt: new Date().toISOString(),
      };
      updateProposals((prev) => [newProposal, ...prev]);
      updateOffers((prev) =>
        prev.map((o) =>
          o.id === proposalData.offerId && o.status === 'AVAILABLE'
            ? { ...o, status: 'REQUEST_PENDING' }
            : o
        )
      );
      return newProposal;
    },
    [updateOffers, updateProposals, user?.id]
  );

  const acceptSwap = useCallback((proposalId: string) => {
    const pendingProposal = proposalsRef.current.find((proposal) => proposal.id === proposalId && proposal.status === 'PENDING');
    if (!pendingProposal) return;
    const offer = offersRef.current.find((candidate) => candidate.id === pendingProposal.offerId);
    if (!offer || offer.status === 'SWAP_ACCEPTED' || (offer.status !== 'AVAILABLE' && offer.status !== 'REQUEST_PENDING')) return;
    const currentUserOwnsOffer = offer.userId
      ? offer.userId === user?.id
      : Boolean(offer.isCurrentUser);
    if (!currentUserOwnsOffer) return;

    const acceptedAt = new Date().toISOString();
    const acceptedProposal: SwapProposal = { ...pendingProposal, status: 'ACCEPTED' };
    updateProposals((current) => current.map((proposal) => {
      if (proposal.offerId !== offer.id || proposal.status !== 'PENDING') return proposal;
      return proposal.id === acceptedProposal.id
        ? acceptedProposal
        : { ...proposal, status: 'DECLINED' };
    }));
    updateOffers((current) => current.map((candidate) => candidate.id === offer.id
      ? { ...candidate, status: 'SWAP_ACCEPTED', acceptedProposal, acceptedAt }
      : candidate));

    const recipients = [
      {
        recipientUserId: offer.userId || (offer.isCurrentUser ? user?.id : undefined),
        recipientEmail: offer.userEmail || (offer.isCurrentUser ? user?.email : undefined),
        role: 'Your listed berth',
      },
      { recipientUserId: pendingProposal.proposerUserId, recipientEmail: pendingProposal.proposerEmail, role: 'Your swap proposal' },
    ].filter((recipient, index, all) => recipient.recipientUserId || recipient.recipientEmail
      ? all.findIndex((other) => (other.recipientUserId || '').toLowerCase() === (recipient.recipientUserId || '').toLowerCase()
        && (other.recipientEmail || '').toLowerCase() === (recipient.recipientEmail || '').toLowerCase()) === index
      : index === 0);
    const newNotifications = recipients.map((recipient) => ({
      id: `swap-notice-${acceptedProposal.id}-${recipient.role.replaceAll(' ', '-').toLowerCase()}`,
      recipientUserId: recipient.recipientUserId,
      recipientEmail: recipient.recipientEmail,
      offerId: offer.id,
      proposalId: acceptedProposal.id,
      message: `${recipient.role} for train ${offer.trainNumber} was accepted. The berth exchange is confirmed in this local session.`,
      createdAt: acceptedAt,
    }));
    updateNotifications((current) => [...newNotifications, ...current].slice(0, 100));
  }, [updateNotifications, updateOffers, updateProposals, user?.email, user?.id]);

  const declineSwap = useCallback((proposalId: string) => {
    const targetProposal = proposalsRef.current.find((proposal) => proposal.id === proposalId && proposal.status === 'PENDING');
    if (!targetProposal) return;
    const targetOffer = offersRef.current.find((offer) => offer.id === targetProposal.offerId);
    if (targetOffer?.status === 'SWAP_ACCEPTED') return;
    updateProposals((current) => current.map((proposal) => proposal.id === proposalId && proposal.status === 'PENDING'
      ? { ...proposal, status: 'DECLINED' }
      : proposal));
    if (targetOffer) {
      const hasOtherPending = proposalsRef.current.some((proposal) => proposal.offerId === targetOffer.id && proposal.id !== proposalId && proposal.status === 'PENDING');
      updateOffers((current) => current.map((offer) => offer.id === targetOffer.id
        ? { ...offer, status: hasOtherPending ? 'REQUEST_PENDING' : 'AVAILABLE' }
        : offer));
    }
  }, [updateOffers, updateProposals]);

  const deleteOffer = useCallback((offerId: string) => {
    updateOffers((prev) => prev.filter((o) => o.id !== offerId));
    updateProposals((prev) => prev.filter((p) => p.offerId !== offerId));
  }, [updateOffers, updateProposals]);

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
