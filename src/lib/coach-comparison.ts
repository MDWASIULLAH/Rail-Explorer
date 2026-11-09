/**
 * Coach Comparison Engine
 * 
 * Compare two coach blueprints across all attributes.
 */

import {
  type CoachBlueprint,
  type BerthType,
  COACH_BLUEPRINTS,
} from '../data/coach-database.ts';
import { getBerthDescription } from './berth-finder.ts';

export interface ComparisonResult {
  coach1: CoachSummary;
  coach2: CoachSummary;
  dimensions: DimensionComparison;
  capacity: CapacityComparison;
  berthTypes: BerthTypeComparison[];
  amenities: AmenityComparison;
  verdict: string;
}

interface CoachSummary {
  id: string;
  name: string;
  category: string;
  generation: string;
  color: string;
}

interface DimensionComparison {
  length: { coach1: number; coach2: number; diff: number; unit: string };
  width: { coach1: number; coach2: number; diff: number; unit: string };
  height: { coach1: number; coach2: number; diff: number; unit: string };
  interiorWidth: { coach1: number; coach2: number; diff: number; unit: string };
}

interface CapacityComparison {
  coach1Berths: number;
  coach2Berths: number;
  difference: number;
  coach1Bays: number;
  coach2Bays: number;
}

interface BerthTypeComparison {
  type: BerthType;
  description: string;
  coach1Count: number;
  coach2Count: number;
}

interface AmenityComparison {
  toilets: { coach1: number; coach2: number };
  doors: { coach1: number; coach2: number };
  windows: { coach1: number; coach2: number };
  ac: { coach1: boolean; coach2: boolean };
  pantry: { coach1: boolean; coach2: boolean };
}

function countBerthsByType(
  blueprint: CoachBlueprint
): Record<BerthType, number> {
  const counts = {} as Record<BerthType, number>;
  for (const berth of blueprint.berths) {
    counts[berth.berthType] = (counts[berth.berthType] || 0) + 1;
  }
  return counts;
}

/**
 * Compare two coach blueprints
 */
export function compareCoaches(
  blueprintId1: string,
  blueprintId2: string
): ComparisonResult | null {
  const bp1 = COACH_BLUEPRINTS[blueprintId1];
  const bp2 = COACH_BLUEPRINTS[blueprintId2];

  if (!bp1 || !bp2) return null;

  const counts1 = countBerthsByType(bp1);
  const counts2 = countBerthsByType(bp2);

  // Collect all berth types
  const allTypes = new Set<BerthType>([
    ...Object.keys(counts1) as BerthType[],
    ...Object.keys(counts2) as BerthType[],
  ]);

  const berthTypes: BerthTypeComparison[] = Array.from(allTypes)
    .filter((t) => (counts1[t] || 0) + (counts2[t] || 0) > 0)
    .map((type) => ({
      type,
      description: getBerthDescription(type),
      coach1Count: counts1[type] || 0,
      coach2Count: counts2[type] || 0,
    }));

  // Generate verdict
  const verdictParts: string[] = [];
  if (bp1.totalBerths > bp2.totalBerths) {
    verdictParts.push(
      `${bp1.name} has ${bp1.totalBerths - bp2.totalBerths} more berths`
    );
  } else if (bp2.totalBerths > bp1.totalBerths) {
    verdictParts.push(
      `${bp2.name} has ${bp2.totalBerths - bp1.totalBerths} more berths`
    );
  }
  if (bp1.hasAC !== bp2.hasAC) {
    const acCoach = bp1.hasAC ? bp1.name : bp2.name;
    verdictParts.push(`${acCoach} has air conditioning`);
  }
  if (bp1.dimensions.lengthOverBody !== bp2.dimensions.lengthOverBody) {
    const longer =
      bp1.dimensions.lengthOverBody > bp2.dimensions.lengthOverBody
        ? bp1.name
        : bp2.name;
    verdictParts.push(`${longer} is longer`);
  }

  return {
    coach1: {
      id: bp1.id,
      name: bp1.name,
      category: bp1.category,
      generation: bp1.generation,
      color: bp1.color,
    },
    coach2: {
      id: bp2.id,
      name: bp2.name,
      category: bp2.category,
      generation: bp2.generation,
      color: bp2.color,
    },
    dimensions: {
      length: {
        coach1: bp1.dimensions.lengthOverBody,
        coach2: bp2.dimensions.lengthOverBody,
        diff: bp1.dimensions.lengthOverBody - bp2.dimensions.lengthOverBody,
        unit: 'mm',
      },
      width: {
        coach1: bp1.dimensions.width,
        coach2: bp2.dimensions.width,
        diff: bp1.dimensions.width - bp2.dimensions.width,
        unit: 'mm',
      },
      height: {
        coach1: bp1.dimensions.height,
        coach2: bp2.dimensions.height,
        diff: bp1.dimensions.height - bp2.dimensions.height,
        unit: 'mm',
      },
      interiorWidth: {
        coach1: bp1.dimensions.interiorWidth,
        coach2: bp2.dimensions.interiorWidth,
        diff: bp1.dimensions.interiorWidth - bp2.dimensions.interiorWidth,
        unit: 'mm',
      },
    },
    capacity: {
      coach1Berths: bp1.totalBerths,
      coach2Berths: bp2.totalBerths,
      difference: bp1.totalBerths - bp2.totalBerths,
      coach1Bays: bp1.totalBays,
      coach2Bays: bp2.totalBays,
    },
    berthTypes,
    amenities: {
      toilets: { coach1: bp1.toilets.count, coach2: bp2.toilets.count },
      doors: { coach1: bp1.doors.count, coach2: bp2.doors.count },
      windows: { coach1: bp1.windows, coach2: bp2.windows },
      ac: { coach1: bp1.hasAC, coach2: bp2.hasAC },
      pantry: { coach1: bp1.hasPantry, coach2: bp2.hasPantry },
    },
    verdict:
      verdictParts.length > 0
        ? verdictParts.join('. ') + '.'
        : 'Both coaches have similar specifications.',
  };
}

/**
 * Get all comparable coach pairs (excludes non-passenger coaches)
 */
export function getComparableCoaches(): Array<{
  id: string;
  name: string;
  category: string;
  berths: number;
}> {
  return Object.values(COACH_BLUEPRINTS)
    .filter((bp) => bp.totalBerths > 0)
    .map((bp) => ({
      id: bp.id,
      name: bp.name,
      category: bp.category,
      berths: bp.totalBerths,
    }));
}

