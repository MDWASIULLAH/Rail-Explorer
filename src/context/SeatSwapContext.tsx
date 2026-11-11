'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { SwapOffer, SwapProposal } from '@/types/seat-swap';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

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
  notificationSoundEnabled: boolean;
  toggleNotificationAlerts: () => Promise<void>;
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
const NOTIFICATION_ALERTS_STORAGE_KEY = 'rail_seat_swap_alerts_v1';
const SHARED_REFRESH_INTERVAL_MS = 5000;
const OFFER_LIFETIME_MS = 24 * 60 * 60 * 1000;

function playSwapNotificationTone(context: AudioContext) {
  const now = context.currentTime;
  [880, 1174].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + index * 0.12;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.24);
  });
}

function offerExpiryTime(offer: SwapOffer) {
  const storedExpiry = offer.expiresAt ? Date.parse(offer.expiresAt) : Number.NaN;
  return Number.isFinite(storedExpiry) ? storedExpiry : Date.parse(offer.createdAt) + OFFER_LIFETIME_MS;
}

async function seatSwapAuthHeaders(contentType?: string) {
  const headers = new Headers();
  if (contentType) headers.set('Content-Type', contentType);
  const { data } = await supabase?.auth.getSession() || { data: { session: null } };
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return headers;
}

export function SeatSwapProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SwapOffer[]>([]);
  const [proposals, setProposals] = useState<SwapProposal[]>([]);
  const [notifications, setNotifications] = useState<SwapNotification[]>([]);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);
  const offersRef = useRef<SwapOffer[]>([]);
  const proposalsRef = useRef<SwapProposal[]>([]);
  const notificationsRef = useRef<SwapNotification[]>([]);
  const knownNotificationIdsRef = useRef<Set<string> | null>(null);
  const notificationSoundEnabledRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
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
      const response = await fetch('/api/seat-swaps', { cache: 'no-store', headers: await seatSwapAuthHeaders() });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Shared swap service is unavailable.');
      const data = result.data as { offers?: SwapOffer[]; proposals?: SwapProposal[]; notifications?: SwapNotification[] };
      const nextOffers = data.offers || [];
      const nextProposals = data.proposals || [];
      const nextNotifications = data.notifications || [];
      const knownIds = knownNotificationIdsRef.current;
      const newNotifications = knownIds
        ? nextNotifications.filter((notification) => !knownIds.has(notification.id))
        : [];
      knownNotificationIdsRef.current = new Set([
        ...(knownIds || []),
        ...nextNotifications.map((notification) => notification.id),
      ]);
      offersRef.current = nextOffers;
      proposalsRef.current = nextProposals;
      notificationsRef.current = nextNotifications;
      setOffers(nextOffers);
      setProposals(nextProposals);
      setNotifications(nextNotifications);
      if (newNotifications.length && notificationSoundEnabledRef.current && typeof window !== 'undefined') {
        const context = audioContextRef.current;
        if (context?.state === 'running') playSwapNotificationTone(context);
        if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted') {
          newNotifications.slice(0, 3).forEach((notification) => {
            new Notification('Rail Explorer · Seat Swap', {
              body: notification.message,
              icon: '/icon.png',
              tag: notification.id,
            });
          });
        }
      }
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
    let timer: number | undefined;
    let inFlight = false;
    let failures = 0;
    const notificationsChannel = supabase?.channel(`rail-swap-notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rail_seat_swap_notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, () => { void refreshShared(); })
      .subscribe();
    const poll = async () => {
      if (cancelled || inFlight) return;
      if (document.visibilityState !== 'visible') {
        timer = window.setTimeout(() => void poll(), 30000);
        return;
      }
      inFlight = true;
      const ok = await refreshShared();
      inFlight = false;
      failures = ok ? 0 : Math.min(failures + 1, 4);
      const delay = ok ? SHARED_REFRESH_INTERVAL_MS : Math.min(60000, SHARED_REFRESH_INTERVAL_MS * (2 ** failures));
      if (!cancelled) timer = window.setTimeout(() => void poll(), delay);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || cancelled) return;
      if (timer !== undefined) window.clearTimeout(timer);
      void poll();
    };
    const syncAndPoll = async () => {
      const legacyOffers = offersRef.current.filter((offer) => offer.isCurrentUser && (!offer.userId || offer.userId === user.id));
      if (legacyOffers.length) {
        try {
          await fetch('/api/seat-swaps/sync', {
            method: 'POST', headers: await seatSwapAuthHeaders('application/json'),
            body: JSON.stringify({ offers: legacyOffers }),
          });
        } catch { /* The shared refresh below reports backend availability. */ }
      }
      if (!cancelled) await poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    void syncAndPoll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (notificationsChannel) void supabase?.removeChannel(notificationsChannel);
    };
  }, [isLoaded, refreshShared, user?.id]);

  useEffect(() => {
    const enabled = localStorage.getItem(NOTIFICATION_ALERTS_STORAGE_KEY) === 'true';
    notificationSoundEnabledRef.current = enabled;
    const timer = window.setTimeout(() => setNotificationSoundEnabled(enabled), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleNotificationAlerts = useCallback(async () => {
    const nextEnabled = !notificationSoundEnabledRef.current;
    if (!nextEnabled) {
      notificationSoundEnabledRef.current = false;
      setNotificationSoundEnabled(false);
      localStorage.setItem(NOTIFICATION_ALERTS_STORAGE_KEY, 'false');
      audioContextRef.current?.suspend();
      return;
    }

    const AudioContextConstructor = window.AudioContext;
    if (AudioContextConstructor) {
      const context = audioContextRef.current || new AudioContextConstructor();
      audioContextRef.current = context;
      await context.resume();
      playSwapNotificationTone(context);
    }
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    notificationSoundEnabledRef.current = true;
    setNotificationSoundEnabled(true);
    localStorage.setItem(NOTIFICATION_ALERTS_STORAGE_KEY, 'true');
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      const expiredOfferIds = new Set(
        offersRef.current.filter((offer) => offerExpiryTime(offer) <= now).map((offer) => offer.id),
      );
      if (!expiredOfferIds.size) return;

      const nextOffers = offersRef.current.filter((offer) => !expiredOfferIds.has(offer.id));
      const nextProposals = proposalsRef.current.filter((proposal) => !expiredOfferIds.has(proposal.offerId));
      const nextNotifications = notificationsRef.current.filter((notification) => !expiredOfferIds.has(notification.offerId));
      offersRef.current = nextOffers;
      proposalsRef.current = nextProposals;
      notificationsRef.current = nextNotifications;
      setOffers(nextOffers);
      setProposals(nextProposals);
      setNotifications(nextNotifications);
    }, 1000);
    return () => window.clearInterval(timer);
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
          method: 'POST', headers: await seatSwapAuthHeaders('application/json'), body: JSON.stringify(newOffer),
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
          method: 'POST', headers: await seatSwapAuthHeaders('application/json'),
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
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: await seatSwapAuthHeaders('application/json'), body: JSON.stringify({ action: 'accept', proposalId }) });
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
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: await seatSwapAuthHeaders('application/json'), body: JSON.stringify({ action: 'decline', proposalId }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not decline this proposal.');
      await refreshShared();
    } catch (error) { setSyncError(error instanceof Error ? error.message : 'Could not decline this proposal.'); }
  }, [refreshShared]);

  const deleteOffer = useCallback(async (offerId: string) => {
    try {
      const response = await fetch('/api/seat-swaps/actions', { method: 'POST', headers: await seatSwapAuthHeaders('application/json'), body: JSON.stringify({ action: 'delete', offerId }) });
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
        notificationSoundEnabled,
        toggleNotificationAlerts,
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
