/**
 * Berth Finder Utility
 * 
 * Lookup and information functions for berths within coach blueprints.
 */

import {
  type BerthPosition,
  type BerthType,
  type CoachBlueprint,
  COACH_BLUEPRINTS,
} from '../data/coach-database.ts';

/**
 * Find a specific berth by number in a coach blueprint
 */
export function findBerth(
  blueprint: CoachBlueprint,
  berthNumber: number
): BerthPosition | null {
  return blueprint.berths.find((b) => b.berthNumber === berthNumber) || null;
}

/**
 * Get human-readable description of berth type
 */
export function getBerthDescription(berthType: BerthType): string {
  const descriptions: Record<BerthType, string> = {
    LB: 'Lower Berth',
    MB: 'Middle Berth',
    UB: 'Upper Berth',
    SL: 'Side Lower Berth',
    SU: 'Side Upper Berth',
    SEAT: 'Seat',
    CABIN_LB: 'Cabin Lower Berth',
    CABIN_UB: 'Cabin Upper Berth',
    COUPE_LB: 'Coupe Lower Berth',
    COUPE_UB: 'Coupe Upper Berth',
  };
  return descriptions[berthType] || berthType;
}

/**
 * Get berths surrounding a given berth (same bay)
 */
export function getSurroundingBerths(
  blueprint: CoachBlueprint,
  berthNumber: number
): BerthPosition[] {
  const berth = findBerth(blueprint, berthNumber);
  if (!berth) return [];

  return blueprint.berths.filter(
    (b) => b.bayNumber === berth.bayNumber && b.berthNumber !== berthNumber
  );
}

/**
 * Get all berths in a specific bay
 */
export function getBayBerths(
  blueprint: CoachBlueprint,
  bayNumber: number
): BerthPosition[] {
  return blueprint.berths.filter((b) => b.bayNumber === bayNumber);
}

/**
 * Get berth color based on type
 */
export function getBerthColor(berthType: BerthType): string {
  const colors: Record<BerthType, string> = {
    LB: '#22c55e',
    MB: '#3b82f6',
    UB: '#a855f7',
    SL: '#f59e0b',
    SU: '#f97316',
    SEAT: '#8b5cf6',
    CABIN_LB: '#22c55e',
    CABIN_UB: '#f97316',
    COUPE_LB: '#22c55e',
    COUPE_UB: '#f97316',
  };
  return colors[berthType] || '#666666';
}

/**
 * Format comprehensive berth information
 */
export function formatBerthInfo(
  blueprint: CoachBlueprint,
  berthNumber: number
): {
  berthNumber: number;
  type: BerthType;
  label: string;
  description: string;
  position: string;
  deck: number;
  side: string;
  bayNumber: number;
  neighbors: Array<{ number: number; type: string; description: string }>;
  distanceToNearestDoor: number;
  color: string;
} | null {
  const berth = findBerth(blueprint, berthNumber);
  if (!berth) return null;

  const neighbors = getSurroundingBerths(blueprint, berthNumber).map((b) => ({
    number: b.berthNumber,
    type: b.berthType,
    description: getBerthDescription(b.berthType),
  }));

  // Calculate distance to nearest door
  let nearestDoorDist = Infinity;
  for (const door of blueprint.doors.positions) {
    const dist = Math.sqrt(
      Math.pow(berth.x - door.x, 2) + Math.pow(berth.z - door.z, 2)
    );
    if (dist < nearestDoorDist) nearestDoorDist = dist;
  }

  return {
    berthNumber: berth.berthNumber,
    type: berth.berthType,
    label: `Berth ${berthNumber}`,
    description: getBerthDescription(berth.berthType),
    position: berth.side,
    deck: berth.deck,
    side: berth.side,
    bayNumber: berth.bayNumber,
    neighbors,
    distanceToNearestDoor: Math.round(nearestDoorDist * 10) / 10,
    color: getBerthColor(berth.berthType),
  };
}

/**
 * Get all available coach blueprints as a list
 */
export function getAvailableBlueprints(): Array<{
  id: string;
  name: string;
  category: string;
  totalBerths: number;
}> {
  return Object.values(COACH_BLUEPRINTS).map((bp) => ({
    id: bp.id,
    name: bp.name,
    category: bp.category,
    totalBerths: bp.totalBerths,
  }));
}

