'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { SwapOffer, SwapProposal } from '@/types/seat-swap';

interface SeatSwapContextType {
  offers: SwapOffer[];
  userOffers: SwapOffer[];
  proposals: SwapProposal[];
  incomingProposals: SwapProposal[];
  sentProposals: SwapProposal[];
  createOffer: (offer: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => SwapOffer;
  proposeSwap: (proposal: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => SwapProposal;
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

export function SeatSwapProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [proposals, setProposals] = useState<SwapProposal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pre-fill state
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [prefilledCoach, setPrefilledCoach] = useState<string | null>(null);
  const [prefilledBerth, setPrefilledBerth] = useState<number | null>(null);
  const [prefilledTrain, setPrefilledTrain] = useState<string | null>(null);

  // Load from storage
  useEffect(() => {
    try {
      const storedOffers = localStorage.getItem(SWAP_STORAGE_KEY);
      if (storedOffers) {
        const parsed = JSON.parse(storedOffers);
        if (Array.isArray(parsed)) {
          setOffers(parsed);
        }
      }

      const storedProps = localStorage.getItem(PROPOSAL_STORAGE_KEY);
      if (storedProps) {
        setProposals(JSON.parse(storedProps));
      }
    } catch (e) {
      console.warn('Error loading seat swaps:', e);
    }
    setIsLoaded(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(offers));
      localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(proposals));
    } catch (e) {
      console.warn('Error saving seat swaps:', e);
    }
  }, [offers, proposals, isLoaded]);

  const userOffers = useMemo(() => offers.filter((o) => o.isCurrentUser), [offers]);

  const userOfferIds = useMemo(() => new Set(userOffers.map((o) => o.id)), [userOffers]);

  const incomingProposals = useMemo(
    () => proposals.filter((p) => userOfferIds.has(p.offerId)),
    [proposals, userOfferIds]
  );

  const sentProposals = useMemo(
    () => proposals.filter((p) => p.isCurrentUser),
    [proposals]
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
      setOffers((prev) => [newOffer, ...prev]);
      return newOffer;
    },
    []
  );

  const proposeSwap = useCallback(
    (proposalData: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => {
      const newProposal: SwapProposal = {
        ...proposalData,
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        status: 'PENDING',
        isCurrentUser: true,
        createdAt: new Date().toISOString(),
      };
      setProposals((prev) => [newProposal, ...prev]);

      // Update offer status
      setOffers((prev) =>
        prev.map((o) =>
          o.id === proposalData.offerId ? { ...o, status: 'REQUEST_PENDING' } : o
        )
      );
      return newProposal;
    },
    []
  );

  const acceptSwap = useCallback((proposalId: string) => {
    let acceptedProp: SwapProposal | undefined;
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === proposalId) {
          acceptedProp = { ...p, status: 'ACCEPTED' };
          return acceptedProp;
        }
        return p;
      })
    );

    setOffers((prev) =>
      prev.map((o) => {
        if (acceptedProp && o.id === acceptedProp.offerId) {
          return {
            ...o,
            status: 'SWAP_ACCEPTED',
            acceptedProposal: acceptedProp,
            acceptedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
  }, []);

  const declineSwap = useCallback((proposalId: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'DECLINED' } : p))
    );

    const targetProp = proposals.find((p) => p.id === proposalId);
    if (targetProp) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === targetProp.offerId ? { ...o, status: 'AVAILABLE' } : o
        )
      );
    }
  }, [proposals]);

  const deleteOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    setProposals((prev) => prev.filter((p) => p.offerId !== offerId));
  }, []);

  const findMatchesForOffer = useCallback(
    (targetOffer: SwapOffer) => {
      return offers.filter((candidate) => {
        if (candidate.id === targetOffer.id) return false;
        if (candidate.trainNumber !== targetOffer.trainNumber) return false;
        if (candidate.status !== 'AVAILABLE') return false;

        const candidateCoachOk =
          !targetOffer.desiredCoaches ||
          targetOffer.desiredCoaches.length === 0 ||
          targetOffer.desiredCoaches.includes(candidate.currentCoach);

        const candidateBerthOk =
          !targetOffer.desiredBerthTypes ||
          targetOffer.desiredBerthTypes.length === 0 ||
          targetOffer.desiredBerthTypes.includes(candidate.currentBerthType as any);

        return candidateCoachOk && candidateBerthOk;
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
