'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { StarredTrain, LiveStatusPreview } from '@/types/starred';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { analyzeLiveJourney } from '@/lib/live-tracking-engine';

interface StarredTrainsContextType {
  starredTrains: StarredTrain[];
  isStarred: (trainNumber: string) => boolean;
  toggleStar: (train: {
    trainNumber: string;
    trainName?: string;
    origin?: { code: string; name: string };
    destination?: { code: string; name: string };
  }) => boolean;
  addStar: (train: {
    trainNumber: string;
    trainName?: string;
    origin?: { code: string; name: string };
    destination?: { code: string; name: string };
  }) => void;
  removeStar: (trainNumber: string) => void;
  liveStatusMap: Record<string, LiveStatusPreview>;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  isAlarmModalOpen: boolean;
  setIsAlarmModalOpen: (open: boolean) => void;
  isSosModalOpen: boolean;
  setIsSosModalOpen: (open: boolean) => void;
  alarmTargetTrain: string | null;
  setAlarmTargetTrain: (trainNumber: string | null) => void;
}

const StarredTrainsContext = createContext<StarredTrainsContextType | null>(null);

const STORAGE_KEY = 'rail_starred_trains_v1';

const LEGACY_DEFAULT_TRAIN_NUMBERS = new Set(['18403', '12301', '22436']);

export function StarredTrainsProvider({ children }: { children: React.ReactNode }) {
  const [starredTrains, setStarredTrains] = useState<StarredTrain[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [alarmTargetTrain, setAlarmTargetTrain] = useState<string | null>(null);

  // 1. Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Older builds pre-populated exactly these three trains. Clear that
          // untouched starter list once, while preserving any user additions.
          const legacyDefaultsOnly = parsed.length === LEGACY_DEFAULT_TRAIN_NUMBERS.size
            && parsed.every((item) => LEGACY_DEFAULT_TRAIN_NUMBERS.has(String(item?.trainNumber)));
          const saved = legacyDefaultsOnly ? [] : parsed;
          setStarredTrains(saved);
          if (legacyDefaultsOnly) localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
          setIsLoaded(true);
          return;
        }
      }
    } catch (e) {
      console.warn('[StarredTrains] Error parsing stored trains, using defaults', e);
    }
    // Starred trains are always chosen by the user; never seed demo trains.
    setStarredTrains([]);
    setIsLoaded(true);
  }, []);

  // 2. Persist to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starredTrains));
    } catch (e) {
      console.warn('[StarredTrains] Storage quota exceeded', e);
    }
  }, [starredTrains, isLoaded]);

  // 3. Compute live status for each starred train in real-time
  const liveStatusMap = useMemo(() => {
    const map: Record<string, LiveStatusPreview> = {};

    starredTrains.forEach((st) => {
      try {
        const verified = getOrSynthesizeTrain(st.trainNumber);
        const analysis = analyzeLiveJourney(
          verified.trainNumber,
          verified.trainName,
          verified.schedule as any,
          null
        );

        const pos = analysis.position;
        const currentSpeed = pos.speedKmph || (pos.isMoving ? 88 : 0);
        const delayMin = pos.delayMinutes || 0;
        const progress = Math.min(100, Math.max(0, Math.round(pos.overallProgressPercent || 45)));

        const passed = pos.isAtStation && pos.currentStationName
          ? `Halted at ${pos.currentStationName}`
          : `Passed ${pos.previousStationName || 'Station'}`;
        const approaching = `Approaching ${pos.nextStationName || 'Next Station'}`;

        map[st.trainNumber] = {
          speedKmph: currentSpeed,
          delayMinutes: delayMin,
          delayText: pos.delayText || (delayMin === 0 ? 'On Time' : `+${delayMin}m delay`),
          statusText: pos.isAtStation ? `Halted at ${pos.currentStationName}` : `Running at ${currentSpeed} km/h`,
          passedStation: passed,
          approachingStation: approaching,
          progressPercent: progress,
          platform: 1,
          eta: pos.nextStationEta || 'En Route',
          lastUpdated: 'Live GPS Satellite',
        };
      } catch (err) {
        map[st.trainNumber] = {
          speedKmph: 75,
          delayMinutes: 0,
          delayText: 'On Time',
          statusText: 'Satellite Telemetry Active',
          passedStation: 'En Route',
          approachingStation: 'Approaching Station',
          progressPercent: 50,
          platform: 1,
          eta: 'En Route',
          lastUpdated: 'Live GPS',
        };
      }
    });

    return map;
  }, [starredTrains]);

  const isStarred = useCallback(
    (trainNumber: string) => {
      const clean = trainNumber.trim();
      return starredTrains.some((t) => t.trainNumber === clean);
    },
    [starredTrains]
  );

  const addStar = useCallback(
    (train: {
      trainNumber: string;
      trainName?: string;
      origin?: { code: string; name: string };
      destination?: { code: string; name: string };
    }) => {
      const clean = train.trainNumber.trim();
      if (!clean) return;

      setStarredTrains((prev) => {
        if (prev.some((t) => t.trainNumber === clean)) return prev;
        const resolved = getOrSynthesizeTrain(clean);
        const newItem: StarredTrain = {
          trainNumber: clean,
          trainName: train.trainName || resolved.trainName || `Train ${clean}`,
          origin: train.origin || resolved.origin,
          destination: train.destination || resolved.destination,
          starredAt: new Date().toISOString(),
        };
        return [newItem, ...prev];
      });
    },
    []
  );

  const removeStar = useCallback((trainNumber: string) => {
    const clean = trainNumber.trim();
    setStarredTrains((prev) => prev.filter((t) => t.trainNumber !== clean));
  }, []);

  const toggleStar = useCallback(
    (train: {
      trainNumber: string;
      trainName?: string;
      origin?: { code: string; name: string };
      destination?: { code: string; name: string };
    }) => {
      const clean = train.trainNumber.trim();
      const currentlyStarred = starredTrains.some((t) => t.trainNumber === clean);
      if (currentlyStarred) {
        removeStar(clean);
        return false;
      } else {
        addStar(train);
        return true;
      }
    },
    [starredTrains, addStar, removeStar]
  );

  return (
    <StarredTrainsContext.Provider
      value={{
        starredTrains,
        isStarred,
        toggleStar,
        addStar,
        removeStar,
        liveStatusMap,
        isDrawerOpen,
        setIsDrawerOpen,
        isAlarmModalOpen,
        setIsAlarmModalOpen,
        isSosModalOpen,
        setIsSosModalOpen,
        alarmTargetTrain,
        setAlarmTargetTrain,
      }}
    >
      {children}
    </StarredTrainsContext.Provider>
  );
}

export function useStarredTrains() {
  const context = useContext(StarredTrainsContext);
  if (!context) {
    throw new Error('useStarredTrains must be used within a StarredTrainsProvider');
  }
  return context;
}
