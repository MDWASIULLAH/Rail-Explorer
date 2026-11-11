/**
 * Live Train Running Status & Animated Railway Timeline Engine
 *
 * Computes exact station states, delay calculations, train position between
 * stations, ETA estimates, and status confidence ratings inspired by
 * ConfirmTkt, Where Is My Train, and RailRadar.
 */

import { getKnownStationCoordinates, getStationCoordinates } from '../data/station-coordinates.ts';
import type { KnownTrain } from '../data/train-directory';
import type { TrainSchedule, TrainStatus, ScheduleStation } from './railway-api';

export type StationState = 'COMPLETED' | 'CURRENT' | 'UPCOMING';
export type StatusConfidence =
  | 'LIVE_REPORTED'
  | 'GPS_REPORTED'
  | 'ESTIMATED'
  | 'SCHEDULE_BASED'
  | 'NOT_STARTED'
  | 'CANCELLED';

export interface TimelineStation {
  index: number;
  stationCode: string;
  stationName: string;
  distance: number;
  day: number;
  platform: string | null;
  scheduledArrival: string | null;
  scheduledDeparture: string | null;
  actualArrival: string | null;
  actualDeparture: string | null;
  delayArrivalMinutes: number;
  delayDepartureMinutes: number;
  haltMinutes: number;
  state: StationState;
  coordinates: [number, number];
  isMajor: boolean;
  isPassingHalt?: boolean;
}

export interface LiveTrainPosition {
  isMoving: boolean;
  isAtStation: boolean;
  currentStationCode: string | null;
  currentStationName: string | null;
  previousStationCode: string;
  previousStationName: string;
  nextStationCode: string;
  nextStationName: string;
  distanceToNextKm: number;
  distanceCoveredFromPrevKm: number;
  stretchTotalKm: number;
  progressPercentInStretch: number; // 0 to 100 between prev and next
  overallProgressPercent: number; // 0 to 100 of total journey
  speedKmph: number | null;
  delayMinutes: number;
  delayText: string;
  isDelayed: boolean;
  nextStationEta: string;
  lastUpdatedSecondsAgo: number | null;
  confidence: StatusConfidence;
  coordinates: [number, number]; // interpolated GPS coordinates
  passedStationText: string;
  approachingStationText: string;
  currentLocationText: string;
  liveStatusSummary: string;
}

export interface LiveJourneyAnalysis {
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  origin: { code: string; name: string };
  destination: { code: string; name: string };
  totalDistanceKm: number;
  coveredDistanceKm: number;
  remainingDistanceKm: number;
  completedStops: number;
  totalStops: number;
  remainingStops: number;
  position: LiveTrainPosition;
  timeline: TimelineStation[];
  statusConfidence: StatusConfidence;
}

/**
 * Format minutes delay into human readable string (e.g. "4h 6min late", "On Time")
 */
export function formatDelay(minutes: number): { text: string; isDelayed: boolean; color: string } {
  if (minutes <= 2) {
    return { text: 'Running On Time', isDelayed: false, color: 'text-emerald-400' };
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return {
      text: `Running late by ${hrs}h ${mins > 0 ? `${mins}m` : ''}`,
      isDelayed: true,
      color: minutes > 60 ? 'text-rose-400' : 'text-amber-400',
    };
  }
  return {
    text: `Running late by ${mins} min`,
    isDelayed: true,
    color: 'text-amber-400',
  };
}

function getTimetableEstimate(
  stations: ScheduleStation[],
  journeyDate: string | undefined,
): { index: number; progress: number; isAtStation: boolean; speedKmph: number | null } | null {
  const now = new Date();
  const dateParts = journeyDate?.slice(0, 10).split('-').map(Number);
  if (!dateParts || dateParts.length !== 3 || dateParts.some(Number.isNaN)) return null;
  const journeyMidnight = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsedDays = Math.floor((todayMidnight.getTime() - journeyMidnight.getTime()) / 86_400_000);
  if (elapsedDays < 0) return null;
  const minutesNow = elapsedDays * 1440 + now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const toMinutes = (value: string | null | undefined) => {
    const match = value?.match(/^(\d{1,2}):(\d{2})$/);
    return match ? Number(match[1]) * 60 + Number(match[2]) : null;
  };

  for (let i = 0; i < stations.length - 1; i += 1) {
    const from = stations[i];
    const to = stations[i + 1];
    const fromDay = Math.max(1, from.day || 1) - 1;
    const toDay = Math.max(1, to.day || 1) - 1;
    const departTime = toMinutes(from.departureTime || from.arrivalTime);
    const arriveTime = toMinutes(to.arrivalTime || to.departureTime);
    const depart = departTime === null ? null : fromDay * 1440 + departTime;
    const arrive = arriveTime === null ? null : toDay * 1440 + arriveTime;
    if (depart === null || arrive === null || arrive <= depart) continue;

    if (minutesNow >= depart && minutesNow < arrive) {
      const distanceKm = Math.max(0, to.distance - from.distance);
      return {
        index: i,
        progress: (minutesNow - depart) / (arrive - depart),
        isAtStation: false,
        speedKmph: Math.round(distanceKm / ((arrive - depart) / 60)),
      };
    }
    const arrivalTime = toMinutes(to.arrivalTime || to.departureTime);
    const departureTime = toMinutes(to.departureTime || to.arrivalTime);
    const arrival = arrivalTime === null ? null : toDay * 1440 + arrivalTime;
    const departure = departureTime === null ? null : toDay * 1440 + departureTime;
    if (arrival !== null && departure !== null && minutesNow >= arrival && minutesNow < departure) {
      return { index: i + 1, progress: 0, isAtStation: true, speedKmph: 0 };
    }
  }

  const finalStation = stations.at(-1);
  const finalArrivalTime = finalStation ? toMinutes(finalStation.arrivalTime || finalStation.departureTime) : null;
  const finalArrival = finalStation && finalArrivalTime !== null
    ? (Math.max(1, finalStation.day || 1) - 1) * 1440 + finalArrivalTime
    : null;
  if (finalStation && finalArrival !== null && minutesNow >= finalArrival) {
    return { index: stations.length - 1, progress: 0, isAtStation: true, speedKmph: 0 };
  }
  return null;
}

/**
 * Add minutes to "HH:MM" time string
 */
function addMinutesToTime(timeStr: string | null, minutes: number): string | null {
  if (!timeStr) return null;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  const [, h, m] = match;
  let totalMins = parseInt(h, 10) * 60 + parseInt(m, 10) + minutes;
  totalMins = (totalMins + 24 * 60) % (24 * 60);
  const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
  const newM = (totalMins % 60).toString().padStart(2, '0');
  return `${newH}:${newM}`;
}

/**
 * Compute full journey timeline and live position
 */
export function analyzeLiveJourney(
  trainNumber: string,
  trainName: string,
  schedule: TrainSchedule | Pick<KnownTrain, 'schedule'>,
  status: TrainStatus | null,
  journeyDate: string = 'Today',
): LiveJourneyAnalysis {
  const stations: ScheduleStation[] = 'stations' in schedule
    ? schedule.stations
    : schedule.schedule.map((station) => ({ ...station, platform: null }));
  const totalStops = stations.length;
  if (totalStops === 0) {
    const position: LiveTrainPosition = {
      isMoving: false, isAtStation: false, currentStationCode: null, currentStationName: null,
      previousStationCode: '', previousStationName: 'Route unavailable', nextStationCode: '', nextStationName: 'Route unavailable',
      distanceToNextKm: 0, distanceCoveredFromPrevKm: 0, stretchTotalKm: 0, progressPercentInStretch: 0,
      overallProgressPercent: 0, speedKmph: null, delayMinutes: 0, delayText: 'Live data unavailable',
      isDelayed: false, nextStationEta: '--:--', lastUpdatedSecondsAgo: status?.freshness?.ageSeconds ?? null,
      confidence: 'SCHEDULE_BASED', coordinates: [20.5937, 78.9629], passedStationText: 'Route data unavailable',
      approachingStationText: 'Route data unavailable', currentLocationText: 'Route data unavailable',
      liveStatusSummary: 'Route data unavailable for this train.',
    };
    return {
      trainNumber, trainName: status?.trainName || trainName, journeyDate: status?.journeyDate || journeyDate,
      origin: { code: status?.origin?.code || '—', name: status?.origin?.name || 'Route unavailable' },
      destination: { code: status?.destination?.code || '—', name: status?.destination?.name || 'Route unavailable' },
      totalDistanceKm: 0, coveredDistanceKm: 0, remainingDistanceKm: 0, completedStops: 0, totalStops: 0,
      remainingStops: 0, position, timeline: [], statusConfidence: 'SCHEDULE_BASED',
    };
  }
  const totalDistanceKm = stations[totalStops - 1]?.distance || 0;

  // Determine current active delay
  const currentDelay = status?.delayMinutes ?? 0;

  // Find index of current / next station
  let currentIndex = 0;
  let isAtStation = false;
  let timetableEstimate: ReturnType<typeof getTimetableEstimate> = null;

  if (status?.status === 'NOT_STARTED' || status?.status === 'CANCELLED') {
    currentIndex = 0;
    isAtStation = true;
    if (status.status === 'NOT_STARTED') {
      timetableEstimate = getTimetableEstimate(stations, status.journeyDate);
      if (timetableEstimate) {
        currentIndex = timetableEstimate.index;
        isAtStation = timetableEstimate.isAtStation;
      }
    }
  } else if (status?.status === 'RUNNING' && status.previousStation?.code) {
    const idx = stations.findIndex(
      (s) => s.stationCode.toUpperCase() === status.previousStation?.code.toUpperCase()
    );
    if (idx >= 0) currentIndex = idx;
  } else if (status?.status === 'RUNNING' && status.routeProgress?.completedStops) {
    currentIndex = Math.min(totalStops - 2, Math.max(0, status.routeProgress.completedStops - 1));
  } else if (status?.status === 'RUNNING' && status.nextStation?.code) {
    const idx = stations.findIndex(
      (s) => s.stationCode.toUpperCase() === status.nextStation?.code.toUpperCase()
    );
    if (idx > 0) currentIndex = idx - 1;
  } else if (status?.currentStation?.code) {
    const idx = stations.findIndex(
      (s) => s.stationCode.toUpperCase() === status.currentStation?.code.toUpperCase()
    );
    if (idx >= 0) {
      currentIndex = idx;
      isAtStation = true;
    }
  } else if (status?.nextStation?.code) {
    const idx = stations.findIndex(
      (s) => s.stationCode.toUpperCase() === status.nextStation?.code.toUpperCase()
    );
    if (idx > 0) {
      currentIndex = idx - 1;
    }
  } else if (status?.routeProgress?.completedStops) {
    currentIndex = Math.min(totalStops - 1, Math.max(0, status.routeProgress.completedStops - 1));
  }

  const prevStation = stations[currentIndex] || stations[0];
  const nextStation = stations[Math.min(totalStops - 1, currentIndex + 1)] || prevStation;
  const reportedCurrentIndex = status?.currentStation?.code
    ? stations.findIndex((station) => station.stationCode.toUpperCase() === status.currentStation?.code.toUpperCase())
    : -1;
  let currentStationOnReportedStretch = reportedCurrentIndex === currentIndex || reportedCurrentIndex === currentIndex + 1;
  if (reportedCurrentIndex < 0 && status?.currentStation?.code) {
    const currentCoords = getKnownStationCoordinates(status.currentStation.code);
    // Unknown station codes get synthetic map coordinates for visualization. Those coordinates
    // must never be used to validate live telemetry because they can place a station on any route.
    currentStationOnReportedStretch = false;
    if (currentCoords) {
    let closestGap = Number.POSITIVE_INFINITY;
    let projectedDistance = 0;
    for (let i = 0; i < stations.length - 1; i += 1) {
      const from = getStationCoordinates(stations[i].stationCode);
      const to = getStationCoordinates(stations[i + 1].stationCode);
      const lngScale = Math.cos((from[0] * Math.PI) / 180);
      const dx = (to[1] - from[1]) * lngScale;
      const dy = to[0] - from[0];
      const px = (currentCoords[1] - from[1]) * lngScale;
      const py = currentCoords[0] - from[0];
      const lengthSquared = dx * dx + dy * dy;
      const fraction = lengthSquared > 0 ? Math.min(1, Math.max(0, (px * dx + py * dy) / lengthSquared)) : 0;
      const gap = Math.hypot(px - dx * fraction, py - dy * fraction);
      if (gap < closestGap) {
        closestGap = gap;
        projectedDistance = stations[i].distance + (stations[i + 1].distance - stations[i].distance) * fraction;
      }
    }
    const projectedPercent = totalDistanceKm > 0 ? (projectedDistance / totalDistanceKm) * 100 : 0;
    const reportedPercent = status?.routeProgress?.percent;
      const lowerBound = Math.max(0, prevStation.distance - 20);
      const upperBound = Math.min(totalDistanceKm, nextStation.distance + 20);
      currentStationOnReportedStretch = closestGap < 0.45 && projectedDistance >= lowerBound && projectedDistance <= upperBound &&
        (typeof reportedPercent !== 'number' || Math.abs(projectedPercent - reportedPercent) < 20);
    }
  }
  const alignedCurrentStation = currentStationOnReportedStretch ? status?.currentStation : undefined;

  // Stretch distances
  const prevDist = prevStation.distance || 0;
  const nextDist = nextStation.distance || prevDist + 40;
  const stretchTotalKm = Math.max(1, nextDist - prevDist);

  // Position within stretch: compute realistic fraction between prevStation and nextStation
  let stretchProgressFactor = 0;
  if (!isAtStation) {
    if (timetableEstimate?.progress !== undefined && timetableEstimate.progress !== null) {
      stretchProgressFactor = Math.min(0.95, Math.max(0.05, timetableEstimate.progress));
    } else if (alignedCurrentStation?.code && alignedCurrentStation.code !== prevStation.stationCode) {
      // Current intermediate station reported by live feed (e.g. BEH Bagdihi between JSG and ROU)
      const prevCoords = getStationCoordinates(prevStation.stationCode);
      const nextCoords = getStationCoordinates(nextStation.stationCode);
      const currCoords = getStationCoordinates(alignedCurrentStation.code);

      const dLatTotal = nextCoords[0] - prevCoords[0];
      const dLngTotal = nextCoords[1] - prevCoords[1];
      const totalDistSq = dLatTotal * dLatTotal + dLngTotal * dLngTotal;

      if (totalDistSq > 0.00005) {
        const dot = (currCoords[0] - prevCoords[0]) * dLatTotal + (currCoords[1] - prevCoords[1]) * dLngTotal;
        const proj = dot / totalDistSq;
        stretchProgressFactor = Math.min(0.92, Math.max(0.12, proj));
      } else {
        stretchProgressFactor = 0.5;
      }
    } else if (status?.status === 'RUNNING') {
      stretchProgressFactor = 0.45;
    }
  }

  const distanceCoveredFromPrevKm = isAtStation
    ? 0
    : Math.max(1, Math.round(stretchTotalKm * stretchProgressFactor));
  const distanceToNextKm = isAtStation
    ? stretchTotalKm
    : Math.max(1, stretchTotalKm - distanceCoveredFromPrevKm);

  const coveredDistanceKm = prevDist + distanceCoveredFromPrevKm;
  const remainingDistanceKm = Math.max(0, totalDistanceKm - coveredDistanceKm);
  const overallProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((coveredDistanceKm / totalDistanceKm) * 100))
  );

  // Determine status confidence
  let confidence: StatusConfidence = 'LIVE_REPORTED';
  if (timetableEstimate) {
    confidence = 'ESTIMATED';
  } else if (typeof status?.position?.latitude === 'number' && typeof status.position.longitude === 'number') {
    confidence = 'GPS_REPORTED';
  } else if (status?.status === 'NOT_STARTED') {
    confidence = 'NOT_STARTED';
  } else if (status?.status === 'CANCELLED') {
    confidence = 'CANCELLED';
  } else if (!status) {
    confidence = 'SCHEDULE_BASED';
  }

  // Interpolate coordinates along route
  const prevCoords = getStationCoordinates(prevStation.stationCode);
  const nextCoords = getStationCoordinates(nextStation.stationCode);

  // Validate status coordinates: must be reasonably close (<2.5 deg) to prev/next station
  let trainLat: number;
  let trainLng: number;
  if (
    !timetableEstimate &&
    typeof status?.position?.latitude === 'number' &&
    typeof status?.position?.longitude === 'number' &&
    Math.abs(status.position.latitude - prevCoords[0]) < 2.5 &&
    Math.abs(status.position.longitude - prevCoords[1]) < 2.5
  ) {
    trainLat = status.position.latitude;
    trainLng = status.position.longitude;
  } else if (timetableEstimate) {
    trainLat = prevCoords[0] + (nextCoords[0] - prevCoords[0]) * stretchProgressFactor;
    trainLng = prevCoords[1] + (nextCoords[1] - prevCoords[1]) * stretchProgressFactor;
  } else if (alignedCurrentStation?.code && alignedCurrentStation.code !== prevStation.stationCode) {
    // Current intermediate passing station reported by provider (e.g. JUJA, HATB, BEH)
    const midCoords = getStationCoordinates(alignedCurrentStation.code);
    trainLat = midCoords[0];
    trainLng = midCoords[1];
  } else if (status?.status === 'RUNNING' && !isAtStation) {
    // Cruising between stations: interpolate position along the track corridor
    trainLat = prevCoords[0] + (nextCoords[0] - prevCoords[0]) * stretchProgressFactor;
    trainLng = prevCoords[1] + (nextCoords[1] - prevCoords[1]) * stretchProgressFactor;
  } else {
    trainLat = prevCoords[0];
    trainLng = prevCoords[1];
  }

  // Build timeline stations
  const timeline: TimelineStation[] = stations.map((stn, idx) => {
    let state: StationState = 'UPCOMING';
    if (idx < currentIndex) {
      state = 'COMPLETED';
    } else if (idx === currentIndex) {
      state = isAtStation ? 'CURRENT' : 'COMPLETED';
    } else if (idx === currentIndex + 1 && !isAtStation) {
      state = 'CURRENT';
    }

    const scheduledArr = stn.arrivalTime;
    const scheduledDep = stn.departureTime;

    // Platform assignments are live operational data and cannot be derived from station codes.
    const platform = typeof stn.platform === 'string' ? stn.platform : null;

    // Actual times with delay
    const stationDelay = idx <= currentIndex ? Math.max(0, currentDelay - (currentIndex - idx) * 2) : currentDelay;
    const actualArr = scheduledArr ? addMinutesToTime(scheduledArr, stationDelay) : null;
    const actualDep = scheduledDep ? addMinutesToTime(scheduledDep, stationDelay) : null;

    const coords = getStationCoordinates(stn.stationCode);
    const isMajor =
      stn.stationName.includes('Jn') ||
      stn.stationName.includes('Central') ||
      stn.stationName.includes('Terminus') ||
      idx === 0 ||
      idx === totalStops - 1;

    return {
      index: idx + 1,
      stationCode: stn.stationCode,
      stationName: stn.stationName,
      distance: stn.distance,
      day: stn.day || (idx > Math.floor(totalStops / 2) ? 2 : 1),
      platform,
      scheduledArrival: scheduledArr,
      scheduledDeparture: scheduledDep,
      actualArrival: actualArr,
      actualDeparture: actualDep,
      delayArrivalMinutes: stationDelay,
      delayDepartureMinutes: stationDelay,
      haltMinutes: stn.haltMinutes || (scheduledArr && scheduledDep ? 3 : 0),
      state,
      coordinates: coords,
      isMajor,
      isPassingHalt: Boolean(stn.isPassingHalt || (stn.haltMinutes === 0 && scheduledArr && scheduledArr === scheduledDep)),
    };
  });

  const delayInfo = formatDelay(currentDelay);
  const displayDelayText = timetableEstimate
    ? 'Timetable estimate'
    : status?.status === 'NOT_STARTED'
      ? 'Not started'
      : delayInfo.text;
  const nextEta = addMinutesToTime(nextStation.arrivalTime, currentDelay) || '--:--';

  // Compute realistic dynamic live speed
  const timetableSpeed = timetableEstimate?.speedKmph ?? null;
  const calculatedSpeed = isAtStation
    ? 0
    : typeof status?.speedKmph === 'number' && status.speedKmph > 0
    ? Math.round(status.speedKmph)
    : timetableEstimate?.speedKmph && timetableEstimate.speedKmph > 0
    ? timetableEstimate.speedKmph
    : timetableSpeed;

  // Clear descriptive location and passing status text
  const passedStationText = isAtStation
    ? `Stationed at Platform · Scheduled Halt`
    : `Passed ${distanceCoveredFromPrevKm} km past ${prevStation.stationName} (${prevStation.stationCode})`;

  const approachingStationText = `${distanceToNextKm} km to ${nextStation.stationName} (${nextStation.stationCode}) · ETA ${nextEta}`;

  const currentLocationText = isAtStation
    ? `At ${prevStation.stationName} (${prevStation.stationCode})`
    : alignedCurrentStation?.name && alignedCurrentStation.name !== prevStation.stationName
    ? `Near ${alignedCurrentStation.name} (${alignedCurrentStation.code})`
    : `Between ${prevStation.stationCode} & ${nextStation.stationCode}`;

  const liveStatusSummary = isAtStation
    ? `Halted at ${prevStation.stationName} (${prevStation.stationCode}) · ${displayDelayText}`
    : `Cruising at ${calculatedSpeed} km/h · Passed ${distanceCoveredFromPrevKm} km past ${prevStation.stationName} · Approaching ${nextStation.stationName} (${distanceToNextKm} km away)`;

  const position: LiveTrainPosition = {
    isMoving: (status?.status === 'RUNNING' || Boolean(timetableEstimate)) && !isAtStation,
    isAtStation,
    currentStationCode: isAtStation ? prevStation.stationCode : (alignedCurrentStation?.code || null),
    currentStationName: isAtStation ? prevStation.stationName : (alignedCurrentStation?.name || null),
    previousStationCode: prevStation.stationCode,
    previousStationName: prevStation.stationName,
    nextStationCode: nextStation.stationCode,
    nextStationName: nextStation.stationName,
    distanceToNextKm,
    distanceCoveredFromPrevKm,
    stretchTotalKm,
    progressPercentInStretch: Math.round(stretchProgressFactor * 100),
    overallProgressPercent,
    speedKmph: calculatedSpeed,
    delayMinutes: currentDelay,
    delayText: displayDelayText,
    isDelayed: delayInfo.isDelayed,
    nextStationEta: nextEta,
    lastUpdatedSecondsAgo: status?.freshness?.ageSeconds ?? null,
    confidence,
    coordinates: [parseFloat(trainLat.toFixed(4)), parseFloat(trainLng.toFixed(4))],
    passedStationText,
    approachingStationText,
    currentLocationText,
    liveStatusSummary,
  };

  return {
    trainNumber,
    trainName: status?.trainName || trainName,
    journeyDate: status?.journeyDate || journeyDate,
    origin: {
      code: status?.origin?.code || stations[0]?.stationCode || 'SRC',
      name: status?.origin?.name || stations[0]?.stationName || 'Source',
    },
    destination: {
      code: status?.destination?.code || stations[totalStops - 1]?.stationCode || 'DST',
      name: status?.destination?.name || stations[totalStops - 1]?.stationName || 'Destination',
    },
    totalDistanceKm,
    coveredDistanceKm,
    remainingDistanceKm,
    completedStops: timetableEstimate
      ? currentIndex
      : status?.status === 'NOT_STARTED'
        ? 0
        : status?.routeProgress?.completedStops ?? currentIndex,
    totalStops,
    remainingStops: Math.max(0, totalStops - (timetableEstimate ? currentIndex : currentIndex + 1)),
    position,
    timeline,
    statusConfidence: confidence,
  };
}
