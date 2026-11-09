/**
 * Coach Distance Calculation Engine
 *
 * Computes real-world distances between coaches, berths, and exits
 * using the verified dimensions from the coach database.
 *
 * All distances are in meters unless noted otherwise.
 */

import {
  COACH_BLUEPRINTS,
  COUPLING_GAP_METERS,
  LHB_COACH_LENGTH_METERS,
  ICF_COACH_LENGTH_METERS,
  LOCOMOTIVE_LENGTH_METERS,
  resolveCoachBlueprint,
  type CoachBlueprint,
  type BerthPosition,
  type CoachCategory,
  type CoachGeneration,
} from '@/data/coach-database';
import type { CoachComposition, CoachInfo } from '@/lib/railway-api';

// ============================================================
// Types
// ============================================================

export interface CoachDistanceBreakdown {
  coachId: string;
  coachType: string;
  lengthMeters: number;
  couplingGap: number;
}

export interface CoachToCoachDistance {
  /** Total centre-to-centre distance in meters */
  distanceMeters: number;
  /** Number of intermediate coaches (not counting from/to) */
  coachesBetween: number;
  /** Direction of travel from `from` to `to` */
  direction: 'ahead' | 'behind';
  /** Per-coach breakdown of the traversal */
  breakdown: CoachDistanceBreakdown[];
}

export interface BerthToExitDistance {
  /** Distance from berth centre to the nearest door in meters */
  distanceToNearestDoor: number;
  /** Which side that door is on */
  doorSide: 'LEFT' | 'RIGHT';
  /** X-position of that door */
  doorX: number;
  /** Index of the nearest door in the blueprint's door array */
  doorIndex: number;
}

export interface CoachLengthEntry {
  coachId: string;
  lengthMeters: number;
}

export interface FullTrainLength {
  /** Total train length including couplings */
  totalLengthMeters: number;
  /** Per-coach lengths */
  coachLengths: CoachLengthEntry[];
}

export interface CoachPositionInfo {
  /** Offset from train start to the beginning of this coach */
  startOffsetMeters: number;
  /** Offset from train start to the centre of this coach */
  centerOffsetMeters: number;
  /** Offset from train start to the end of this coach */
  endOffsetMeters: number;
}

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Resolve a single coach to its length in meters.
 * Uses the blueprint's `lengthOverCouplers` when available,
 * otherwise falls back to generation defaults.
 */
function getCoachLengthMeters(coach: CoachInfo): number {
  const blueprintId = resolveCoachBlueprint(coach.coachType || coach.coachId);
  const blueprint = COACH_BLUEPRINTS[blueprintId];

  if (blueprint) {
    return blueprint.dimensions.lengthOverCouplers / 1000; // mm -> m
  }

  // Fallback by class label
  const upper = (coach.coachType || coach.coachId).toUpperCase();
  if (upper === 'LOCO' || upper.startsWith('WAP') || upper.startsWith('WAG')) {
    return LOCOMOTIVE_LENGTH_METERS;
  }

  // Default LHB
  return LHB_COACH_LENGTH_METERS;
}

/**
 * Build an ordered list of coach lengths from a composition.
 */
function buildCoachLengthsList(composition: CoachComposition): number[] {
  return composition.coaches.map(getCoachLengthMeters);
}

// ============================================================
// Public API
// ============================================================

/**
 * Calculate the distance between two coaches in a train composition.
 *
 * @param composition - Full coach composition from the API
 * @param fromCoachIndex - 0-based index of the source coach
 * @param toCoachIndex - 0-based index of the target coach
 */
export function calculateCoachToCoachDistance(
  composition: CoachComposition,
  fromCoachIndex: number,
  toCoachIndex: number
): CoachToCoachDistance {
  const coaches = composition.coaches;
  const total = coaches.length;

  // Clamp indices
  const from = Math.max(0, Math.min(fromCoachIndex, total - 1));
  const to = Math.max(0, Math.min(toCoachIndex, total - 1));

  if (from === to) {
    return {
      distanceMeters: 0,
      coachesBetween: 0,
      direction: 'ahead',
      breakdown: [],
    };
  }

  const direction: 'ahead' | 'behind' = to > from ? 'ahead' : 'behind';
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);

  const breakdown: CoachDistanceBreakdown[] = [];
  let totalDistance = 0;

  // Walk from lo to hi. The "distance" is measured centre-to-centre.
  // For coach `i`, we traverse half its length + coupling + half of coach `i+1`.
  for (let i = lo; i <= hi; i++) {
    const coach = coaches[i];
    const len = getCoachLengthMeters(coach);

    if (i === lo) {
      // Half of the first coach
      totalDistance += len / 2;
      breakdown.push({
        coachId: coach.coachId,
        coachType: coach.coachType,
        lengthMeters: len / 2,
        couplingGap: i < hi ? COUPLING_GAP_METERS : 0,
      });
      if (i < hi) totalDistance += COUPLING_GAP_METERS;
    } else if (i === hi) {
      // Half of the last coach
      totalDistance += len / 2;
      breakdown.push({
        coachId: coach.coachId,
        coachType: coach.coachType,
        lengthMeters: len / 2,
        couplingGap: 0,
      });
    } else {
      // Full intermediate coach + coupling gap after it
      totalDistance += len;
      totalDistance += COUPLING_GAP_METERS;
      breakdown.push({
        coachId: coach.coachId,
        coachType: coach.coachType,
        lengthMeters: len,
        couplingGap: COUPLING_GAP_METERS,
      });
    }
  }

  return {
    distanceMeters: Math.round(totalDistance * 100) / 100,
    coachesBetween: hi - lo - 1,
    direction,
    breakdown,
  };
}

/**
 * Calculate the distance from a specific berth to the nearest exit door.
 *
 * @param blueprint - The coach blueprint containing berth and door positions
 * @param berthNumber - The berth number to measure from
 */
export function calculateBerthToExitDistance(
  blueprint: CoachBlueprint,
  berthNumber: number
): BerthToExitDistance {
  const berth = blueprint.berths.find((b) => b.berthNumber === berthNumber);

  if (!berth) {
    // If berth not found, return distance from coach centre
    const midX = blueprint.dimensions.lengthOverCouplers / 1000 / 2;
    let nearestDist = Infinity;
    let nearestDoor = blueprint.doors.positions[0];
    let nearestIdx = 0;

    blueprint.doors.positions.forEach((door, idx) => {
      const d = Math.abs(midX - door.x);
      if (d < nearestDist) {
        nearestDist = d;
        nearestDoor = door;
        nearestIdx = idx;
      }
    });

    return {
      distanceToNearestDoor: Math.round(nearestDist * 100) / 100,
      doorSide: nearestDoor?.side ?? 'LEFT',
      doorX: nearestDoor?.x ?? 0,
      doorIndex: nearestIdx,
    };
  }

  let nearestDist = Infinity;
  let nearestDoor = blueprint.doors.positions[0];
  let nearestIdx = 0;

  blueprint.doors.positions.forEach((door, idx) => {
    // 2D distance in the XZ plane (horizontal distance through the coach)
    const dx = berth.x - door.x;
    const dz = berth.z - door.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestDoor = door;
      nearestIdx = idx;
    }
  });

  return {
    distanceToNearestDoor: Math.round(nearestDist * 100) / 100,
    doorSide: nearestDoor?.side ?? 'LEFT',
    doorX: nearestDoor?.x ?? 0,
    doorIndex: nearestIdx,
  };
}

/**
 * Calculate the total length of the full train.
 *
 * @param composition - Full coach composition from the API
 */
export function calculateFullTrainLength(
  composition: CoachComposition
): FullTrainLength {
  const coaches = composition.coaches;
  const lengths: CoachLengthEntry[] = [];
  let total = 0;

  coaches.forEach((coach, idx) => {
    const len = getCoachLengthMeters(coach);
    lengths.push({ coachId: coach.coachId, lengthMeters: len });
    total += len;
    // Coupling gap between coaches (not after the last one)
    if (idx < coaches.length - 1) {
      total += COUPLING_GAP_METERS;
    }
  });

  return {
    totalLengthMeters: Math.round(total * 100) / 100,
    coachLengths: lengths,
  };
}

/**
 * Get the absolute position of a single coach within the full train.
 *
 * @param composition - Full coach composition from the API
 * @param coachIndex - 0-based index of the coach
 */
export function getCoachPosition(
  composition: CoachComposition,
  coachIndex: number
): CoachPositionInfo {
  const coaches = composition.coaches;
  const idx = Math.max(0, Math.min(coachIndex, coaches.length - 1));

  let offset = 0;

  for (let i = 0; i < idx; i++) {
    offset += getCoachLengthMeters(coaches[i]);
    offset += COUPLING_GAP_METERS;
  }

  const thisLen = getCoachLengthMeters(coaches[idx]);

  return {
    startOffsetMeters: Math.round(offset * 100) / 100,
    centerOffsetMeters: Math.round((offset + thisLen / 2) * 100) / 100,
    endOffsetMeters: Math.round((offset + thisLen) * 100) / 100,
  };
}
