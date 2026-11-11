'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { SwapOffer, SwapProposal } from '@/types/seat-swap';
import { INITIAL_SWAP_OFFERS } from '@/data/mock-seat-swaps';

interface SeatSwapContextType {
  offers: SwapOffer[];
  userOffers: SwapOffer[];
  proposals: SwapProposal[];
  createOffer: (offer: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => SwapOffer;
  proposeSwap: (proposal: Omit<SwapProposal, 'id' | 'createdAt' | 'status'>) => SwapProposal;
  acceptSwap: (proposalId: string) => void;
  deleteOffer: (offerId: string) => void;
  findMatchesForOffer: (offer: SwapOffer) => SwapOffer[];
  isSwapModalOpen: boolean;
  setIsSwapModalOpen: (open: boolean) => void;
  prefilledCoach: string | null;
  prefilledBerth: number | null;
  prefilledTrain: string | null;
  openSwapWithPreFill: (trainNumber: string, coach: string, berth: number) => void;
}

const SeatSwapContext = createContext<SeatSwapContextType | null>(null);

const SWAP_STORAGE_KEY = 'rail_seat_swaps_v1';
const PROPOSAL_STORAGE_KEY = 'rail_seat_proposals_v1';

export function SeatSwapProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [proposals, setProposals] = useState<SwapProposal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pre-fill state for when users click "Swap this Berth" from 3D or PNR
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [prefilledCoach, setPrefilledCoach] = useState<string | null>(null);
  const [prefilledBerth, setPrefilledBerth] = useState<number | null>(null);
  const [prefilledTrain, setPrefilledTrain] = useState<string | null>(null);

  // 1. Load from storage
  useEffect(() => {
    try {
      const storedOffers = localStorage.getItem(SWAP_STORAGE_KEY);
      if (storedOffers) {
        const parsed = JSON.parse(storedOffers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOffers(parsed);
        } else {
          setOffers(INITIAL_SWAP_OFFERS);
        }
      } else {
        setOffers(INITIAL_SWAP_OFFERS);
      }

      const storedProps = localStorage.getItem(PROPOSAL_STORAGE_KEY);
      if (storedProps) {
        setProposals(JSON.parse(storedProps));
      }
    } catch (e) {
      console.warn('Error loading seat swaps:', e);
      setOffers(INITIAL_SWAP_OFFERS);
    }
    setIsLoaded(true);
  }, []);

  // 2. Persist
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SWAP_STORAGE_KEY, JSON.stringify(offers));
      localStorage.setItem(PROPOSAL_STORAGE_KEY, JSON.stringify(proposals));
    } catch (e) {
      console.warn('Error saving seat swaps:', e);
    }
  }, [offers, proposals, isLoaded]);

  const userOffers = offers.filter((o) => o.isCurrentUser);

  const createOffer = useCallback(
    (newOfferData: Omit<SwapOffer, 'id' | 'createdAt' | 'status' | 'isCurrentUser'>) => {
      const newOffer: SwapOffer = {
        ...newOfferData,
        id: `swap-${Date.now()}`,
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
        id: `prop-${Date.now()}`,
        status: 'PENDING',
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
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, status: 'ACCEPTED' } : p))
    );

    const targetProp = proposals.find((p) => p.id === proposalId);
    if (targetProp) {
      setOffers((prev) =>
        prev.map((o) =>
          o.id === targetProp.offerId ? { ...o, status: 'SWAP_ACCEPTED' } : o
        )
      );
    }
  }, [proposals]);

  const deleteOffer = useCallback((offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  }, []);

  // Matching algorithm: finds compatible swaps on the same train
  const findMatchesForOffer = useCallback(
    (targetOffer: SwapOffer) => {
      return offers.filter((candidate) => {
        if (candidate.id === targetOffer.id) return false;
        if (candidate.trainNumber !== targetOffer.trainNumber) return false;

        // Check if candidate coach matches target desire
        const candidateCoachOk =
          !targetOffer.desiredCoaches ||
          targetOffer.desiredCoaches.length === 0 ||
          targetOffer.desiredCoaches.includes(candidate.currentCoach);

        // Check if candidate berth type matches target desire
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
        createOffer,
        proposeSwap,
        acceptSwap,
        deleteOffer,
        findMatchesForOffer,
        isSwapModalOpen,
        setIsSwapModalOpen,
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
