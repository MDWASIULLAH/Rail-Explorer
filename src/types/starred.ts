export interface LiveStatusPreview {
  speedKmph: number;
  delayMinutes: number;
  delayText: string;
  statusText: string;
  passedStation: string;
  approachingStation: string;
  progressPercent: number;
  platform?: number;
  eta?: string;
  lastUpdated: string;
}

export interface StarredTrain {
  trainNumber: string;
  trainName: string;
  origin?: { code: string; name: string };
  destination?: { code: string; name: string };
  starredAt: string;
  notes?: string;
  targetStationCode?: string;
}

