/**
 * Indian Railway Coach Database
 * 
 * Comprehensive coach specifications based on RDSO standards and verified
 * technical references. All measurements are in millimeters unless otherwise stated.
 * 
 * Sources:
 * - RDSO (Research Designs & Standards Organisation) technical drawings
 * - Indian Railways official documentation
 * - LHB coach specifications (Linke Hofmann Busch / Alstom design)
 * - ICF coach specifications (Integral Coach Factory, Chennai)
 * - Rail Coach Factory, Kapurthala
 * - Modern Coach Factory, Rae Bareli
 * 
 * IMPORTANT: Where exact measurements are unavailable, values are marked
 * with confidence levels: VERIFIED, APPROXIMATE, ESTIMATED, UNKNOWN
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type CoachGeneration = 'LHB' | 'ICF' | 'VANDE_BHARAT' | 'MEMU' | 'DEMU';

export type CoachCategory =
  | 'SL'     // Sleeper
  | '3A'     // AC 3 Tier
  | '3E'     // AC 3 Tier Economy
  | '2A'     // AC 2 Tier
  | '1A'     // First AC
  | '2S'     // Second Sitting (Unreserved)
  | 'CC'     // Chair Car
  | 'EC'     // Executive Chair Car
  | 'GS'     // General Second (Unreserved)
  | 'EA'     // Executive Anubhuti (Vande Bharat)
  | 'HA'     // First AC (H prefix)
  | 'PC'     // Pantry Car
  | 'EOG'    // End-on Generator
  | 'SLR'    // Seating cum Luggage Rake
  | 'LOCO'   // Locomotive
  | 'GEN'    // Generator Car
  | 'VP'     // Vistadome

export type BerthType =
  | 'LB'     // Lower Berth
  | 'MB'     // Middle Berth
  | 'UB'     // Upper Berth
  | 'SL'     // Side Lower
  | 'SU'     // Side Upper
  | 'SEAT'   // Seat (Chair Car)
  | 'CABIN_LB' // Cabin Lower Berth (1A)
  | 'CABIN_UB' // Cabin Upper Berth (1A)
  | 'COUPE_LB' // Coupe Lower Berth (1A)
  | 'COUPE_UB' // Coupe Upper Berth (1A)

export type Confidence = 'VERIFIED' | 'APPROXIMATE' | 'ESTIMATED' | 'UNKNOWN';

export interface CoachDimensions {
  lengthOverBody: number;     // mm
  lengthOverCouplers: number; // mm
  width: number;              // mm
  height: number;             // mm
  interiorWidth: number;      // mm
  floorHeight: number;        // mm - from rail level
  bogieCenterDistance: number; // mm
  confidence: Confidence;
  source: string;
}

export interface BerthDimensions {
  length: number;  // mm
  width: number;   // mm
  height: number;  // mm - clearance above berth
  confidence: Confidence;
}

export interface BerthPosition {
  berthNumber: number;
  berthType: BerthType;
  bayNumber: number;
  side: 'LEFT' | 'RIGHT' | 'SIDE';
  deck: number;          // 0 = lower, 1 = middle, 2 = upper
  x: number;             // meters from coach start
  y: number;             // meters from floor
  z: number;             // meters from center (+ = left, - = right)
  isAccessible?: boolean;
}

export interface CoachBlueprint {
  id: string;
  name: string;
  category: CoachCategory;
  generation: CoachGeneration;
  totalBerths: number;
  totalBays: number;
  berthsPerBay: number;
  dimensions: CoachDimensions;
  berthDimensions: Record<BerthType, BerthDimensions>;
  berths: BerthPosition[];
  toilets: { count: number; positions: Array<{ x: number; z: number }> };
  doors: { count: number; positions: Array<{ x: number; z: number; side: 'LEFT' | 'RIGHT' }> };
  windows: number;
  hasAC: boolean;
  hasPantry: boolean;
  description: string;
  modelFile?: string;
  color: string; // Primary color for 3D rendering
}

// ============================================================
// LHB COACH DIMENSIONS (COMMON)
// ============================================================

const LHB_COMMON_DIMENSIONS: CoachDimensions = {
  lengthOverBody: 23540,
  lengthOverCouplers: 24000,
  width: 3245,
  height: 4039,
  interiorWidth: 3120,
  floorHeight: 1310,
  bogieCenterDistance: 14900,
  confidence: 'VERIFIED',
  source: 'RDSO/Wikipedia/IRIMEE Technical References',
};

const ICF_COMMON_DIMENSIONS: CoachDimensions = {
  lengthOverBody: 21336,
  lengthOverCouplers: 22280,
  width: 3245,
  height: 4025,
  interiorWidth: 3060,
  floorHeight: 1308,
  bogieCenterDistance: 14900,
  confidence: 'VERIFIED',
  source: 'ICF Chennai Technical Specifications',
};

// ============================================================
// BERTH DIMENSIONS BY TYPE
// ============================================================

const SLEEPER_BERTH_DIMS: Record<BerthType, BerthDimensions> = {
  'LB': { length: 1880, width: 635, height: 670, confidence: 'APPROXIMATE' },
  'MB': { length: 1880, width: 530, height: 580, confidence: 'APPROXIMATE' },
  'UB': { length: 1880, width: 530, height: 750, confidence: 'APPROXIMATE' },
  'SL': { length: 1880, width: 530, height: 670, confidence: 'APPROXIMATE' },
  'SU': { length: 1880, width: 530, height: 750, confidence: 'APPROXIMATE' },
  'SEAT': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
};

const AC3_BERTH_DIMS: Record<BerthType, BerthDimensions> = {
  'LB': { length: 1905, width: 635, height: 690, confidence: 'APPROXIMATE' },
  'MB': { length: 1905, width: 530, height: 580, confidence: 'APPROXIMATE' },
  'UB': { length: 1905, width: 530, height: 750, confidence: 'APPROXIMATE' },
  'SL': { length: 1905, width: 530, height: 690, confidence: 'APPROXIMATE' },
  'SU': { length: 1905, width: 530, height: 750, confidence: 'APPROXIMATE' },
  'SEAT': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
};

const AC2_BERTH_DIMS: Record<BerthType, BerthDimensions> = {
  'LB': { length: 1905, width: 660, height: 1050, confidence: 'APPROXIMATE' },
  'UB': { length: 1905, width: 660, height: 900, confidence: 'APPROXIMATE' },
  'SL': { length: 1905, width: 580, height: 1050, confidence: 'APPROXIMATE' },
  'SU': { length: 1905, width: 580, height: 900, confidence: 'APPROXIMATE' },
  'MB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'SEAT': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'CABIN_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'COUPE_UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
};

const FIRST_AC_BERTH_DIMS: Record<BerthType, BerthDimensions> = {
  'CABIN_LB': { length: 1905, width: 700, height: 1100, confidence: 'APPROXIMATE' },
  'CABIN_UB': { length: 1905, width: 700, height: 950, confidence: 'APPROXIMATE' },
  'COUPE_LB': { length: 1905, width: 700, height: 1100, confidence: 'APPROXIMATE' },
  'COUPE_UB': { length: 1905, width: 700, height: 950, confidence: 'APPROXIMATE' },
  'LB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'MB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'UB': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'SL': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'SU': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
  'SEAT': { length: 0, width: 0, height: 0, confidence: 'UNKNOWN' },
};

// ============================================================
// BERTH GENERATION FUNCTIONS
// ============================================================

/**
 * Generate berth positions for LHB Sleeper coach (80 berths)
 * 
 * Layout: 10 bays × 8 berths per bay
 * Each bay:
 *   Main section: 3 berths each side (LB, MB, UB) = 6 berths
 *   Side section: SL + SU = 2 berths
 * 
 * Numbering pattern (per bay, 1-indexed):
 *   Bay starts at berth: (bayIndex * 8) + 1
 *   Position 1: Lower Berth (left)
 *   Position 2: Middle Berth (left)  
 *   Position 3: Upper Berth (left)
 *   Position 4: Lower Berth (right)
 *   Position 5: Middle Berth (right)
 *   Position 6: Upper Berth (right)
 *   Position 7: Side Lower
 *   Position 8: Side Upper
 */
function generateSleeperBerths(): BerthPosition[] {
  const berths: BerthPosition[] = [];
  const totalBays = 10;
  const bayLength = 1.95; // meters per bay
  const startX = 2.2; // offset from coach start to first bay
  
  for (let bay = 0; bay < totalBays; bay++) {
    const bayStartX = startX + bay * bayLength;
    const berthBase = bay * 8;
    
    // Left side berths (facing direction of travel)
    berths.push({
      berthNumber: berthBase + 1,
      berthType: 'LB',
      bayNumber: bay + 1,
      side: 'LEFT',
      deck: 0,
      x: bayStartX,
      y: 0.28,
      z: 0.74,
    });
    berths.push({
      berthNumber: berthBase + 2,
      berthType: 'MB',
      bayNumber: bay + 1,
      side: 'LEFT',
      deck: 1,
      x: bayStartX,
      y: 0.95,
      z: 0.74,
    });
    berths.push({
      berthNumber: berthBase + 3,
      berthType: 'UB',
      bayNumber: bay + 1,
      side: 'LEFT',
      deck: 2,
      x: bayStartX,
      y: 1.62,
      z: 0.74,
    });
    
    // Right side berths
    berths.push({
      berthNumber: berthBase + 4,
      berthType: 'LB',
      bayNumber: bay + 1,
      side: 'RIGHT',
      deck: 0,
      x: bayStartX,
      y: 0.28,
      z: -0.74,
    });
    berths.push({
      berthNumber: berthBase + 5,
      berthType: 'MB',
      bayNumber: bay + 1,
      side: 'RIGHT',
      deck: 1,
      x: bayStartX,
      y: 0.95,
      z: -0.74,
    });
    berths.push({
      berthNumber: berthBase + 6,
      berthType: 'UB',
      bayNumber: bay + 1,
      side: 'RIGHT',
      deck: 2,
      x: bayStartX,
      y: 1.62,
      z: -0.74,
    });
    
    // Side berths (along the aisle wall, opposite side)
    berths.push({
      berthNumber: berthBase + 7,
      berthType: 'SL',
      bayNumber: bay + 1,
      side: 'SIDE',
      deck: 0,
      x: bayStartX,
      y: 0.28,
      z: -1.29,
    });
    berths.push({
      berthNumber: berthBase + 8,
      berthType: 'SU',
      bayNumber: bay + 1,
      side: 'SIDE',
      deck: 2,
      x: bayStartX,
      y: 1.62,
      z: -1.29,
    });
  }
  
  return berths;
}

/**
 * Generate berth positions for AC 3-Tier coach (72 berths)
 * 
 * Layout: 9 bays × 8 berths per bay
 * Same arrangement as Sleeper but with AC, curtains, reading lights
 */
function generateAC3Berths(): BerthPosition[] {
  const berths: BerthPosition[] = [];
  const totalBays = 9;
  const bayLength = 2.10; // slightly wider bays in AC
  const startX = 2.4;
  
  for (let bay = 0; bay < totalBays; bay++) {
    const bayStartX = startX + bay * bayLength;
    const berthBase = bay * 8;
    
    // Left side
    berths.push({ berthNumber: berthBase + 1, berthType: 'LB', bayNumber: bay + 1, side: 'LEFT', deck: 0, x: bayStartX, y: 0.05, z: 0.74 });
    berths.push({ berthNumber: berthBase + 2, berthType: 'MB', bayNumber: bay + 1, side: 'LEFT', deck: 1, x: bayStartX, y: 0.75, z: 0.74 });
    berths.push({ berthNumber: berthBase + 3, berthType: 'UB', bayNumber: bay + 1, side: 'LEFT', deck: 2, x: bayStartX, y: 1.40, z: 0.74 });
    
    // Right side
    berths.push({ berthNumber: berthBase + 4, berthType: 'LB', bayNumber: bay + 1, side: 'RIGHT', deck: 0, x: bayStartX, y: 0.05, z: -0.74 });
    berths.push({ berthNumber: berthBase + 5, berthType: 'MB', bayNumber: bay + 1, side: 'RIGHT', deck: 1, x: bayStartX, y: 0.75, z: -0.74 });
    berths.push({ berthNumber: berthBase + 6, berthType: 'UB', bayNumber: bay + 1, side: 'RIGHT', deck: 2, x: bayStartX, y: 1.40, z: -0.74 });
    
    // Side berths
    berths.push({ berthNumber: berthBase + 7, berthType: 'SL', bayNumber: bay + 1, side: 'SIDE', deck: 0, x: bayStartX, y: 0.05, z: -1.29 });
    berths.push({ berthNumber: berthBase + 8, berthType: 'SU', bayNumber: bay + 1, side: 'SIDE', deck: 2, x: bayStartX, y: 1.40, z: -1.29 });
  }
  
  return berths;
}

/**
 * Generate berth positions for AC 3-Tier Economy coach (83 berths)
 * 
 * Same as AC 3-Tier but with extra berths (additional bays,
 * one toilet removed to add more space)
 */
function generateAC3EconomyBerths(): BerthPosition[] {
  const berths: BerthPosition[] = [];
  const bayLength = 1.90;
  const startX = 1.8;
  
  // First 10 bays follow 8-berth pattern (80 berths)
  for (let bay = 0; bay < 10; bay++) {
    const bayStartX = startX + bay * bayLength;
    const berthBase = bay * 8;
    
    berths.push({ berthNumber: berthBase + 1, berthType: 'LB', bayNumber: bay + 1, side: 'LEFT', deck: 0, x: bayStartX, y: 0.05, z: 0.74 });
    berths.push({ berthNumber: berthBase + 2, berthType: 'MB', bayNumber: bay + 1, side: 'LEFT', deck: 1, x: bayStartX, y: 0.75, z: 0.74 });
    berths.push({ berthNumber: berthBase + 3, berthType: 'UB', bayNumber: bay + 1, side: 'LEFT', deck: 2, x: bayStartX, y: 1.40, z: 0.74 });
    berths.push({ berthNumber: berthBase + 4, berthType: 'LB', bayNumber: bay + 1, side: 'RIGHT', deck: 0, x: bayStartX, y: 0.05, z: -0.74 });
    berths.push({ berthNumber: berthBase + 5, berthType: 'MB', bayNumber: bay + 1, side: 'RIGHT', deck: 1, x: bayStartX, y: 0.75, z: -0.74 });
    berths.push({ berthNumber: berthBase + 6, berthType: 'UB', bayNumber: bay + 1, side: 'RIGHT', deck: 2, x: bayStartX, y: 1.40, z: -0.74 });
    berths.push({ berthNumber: berthBase + 7, berthType: 'SL', bayNumber: bay + 1, side: 'SIDE', deck: 0, x: bayStartX, y: 0.05, z: -1.29 });
    berths.push({ berthNumber: berthBase + 8, berthType: 'SU', bayNumber: bay + 1, side: 'SIDE', deck: 2, x: bayStartX, y: 1.40, z: -1.29 });
  }
  
  // Bay 11: 3 extra side berths
  const extraStartX = startX + 10 * bayLength;
  berths.push({ berthNumber: 81, berthType: 'SL', bayNumber: 11, side: 'SIDE', deck: 0, x: extraStartX, y: 0.05, z: -1.29 });
  berths.push({ berthNumber: 82, berthType: 'SU', bayNumber: 11, side: 'SIDE', deck: 2, x: extraStartX, y: 1.40, z: -1.29 });
  berths.push({ berthNumber: 83, berthType: 'LB', bayNumber: 11, side: 'LEFT', deck: 0, x: extraStartX, y: 0.05, z: 0.92 });
  
  return berths;
}

/**
 * Generate berth positions for AC 2-Tier coach (52 berths - LHB)
 * 
 * Layout: ~8-9 bays × 6 berths per bay
 * Each bay:
 *   Main: LB + UB (left), LB + UB (right) = 4 berths
 *   Side: SL + SU = 2 berths
 */
function generateAC2Berths(): BerthPosition[] {
  const berths: BerthPosition[] = [];
  // 8 full bays of 6 + 4 extra = 52
  const fullBays = 8;
  const bayLength = 2.30;
  const startX = 2.5;
  
  for (let bay = 0; bay < fullBays; bay++) {
    const bayStartX = startX + bay * bayLength;
    const berthBase = bay * 6;
    
    // Left side
    berths.push({ berthNumber: berthBase + 1, berthType: 'LB', bayNumber: bay + 1, side: 'LEFT', deck: 0, x: bayStartX, y: 0.05, z: 0.92 });
    berths.push({ berthNumber: berthBase + 2, berthType: 'UB', bayNumber: bay + 1, side: 'LEFT', deck: 1, x: bayStartX, y: 1.10, z: 0.92 });
    
    // Right side
    berths.push({ berthNumber: berthBase + 3, berthType: 'LB', bayNumber: bay + 1, side: 'RIGHT', deck: 0, x: bayStartX, y: 0.05, z: -0.92 });
    berths.push({ berthNumber: berthBase + 4, berthType: 'UB', bayNumber: bay + 1, side: 'RIGHT', deck: 1, x: bayStartX, y: 1.10, z: -0.92 });
    
    // Side berths
    berths.push({ berthNumber: berthBase + 5, berthType: 'SL', bayNumber: bay + 1, side: 'SIDE', deck: 0, x: bayStartX + 0.6, y: 0.05, z: -1.27 });
    berths.push({ berthNumber: berthBase + 6, berthType: 'SU', bayNumber: bay + 1, side: 'SIDE', deck: 1, x: bayStartX + 0.6, y: 1.10, z: -1.27 });
  }
  
  // Last partial bay (4 berths: 49-52)
  const lastBayX = startX + fullBays * bayLength;
  berths.push({ berthNumber: 49, berthType: 'LB', bayNumber: 9, side: 'LEFT', deck: 0, x: lastBayX, y: 0.05, z: 0.92 });
  berths.push({ berthNumber: 50, berthType: 'UB', bayNumber: 9, side: 'LEFT', deck: 1, x: lastBayX, y: 1.10, z: 0.92 });
  berths.push({ berthNumber: 51, berthType: 'SL', bayNumber: 9, side: 'SIDE', deck: 0, x: lastBayX + 0.6, y: 0.05, z: -1.27 });
  berths.push({ berthNumber: 52, berthType: 'SU', bayNumber: 9, side: 'SIDE', deck: 1, x: lastBayX + 0.6, y: 1.10, z: -1.27 });
  
  return berths;
}

/**
 * Generate berth positions for First AC coach (24 berths - LHB)
 * 
 * Layout: 4 Cabins (4 berths each = 16) + 4 Coupes (2 berths each = 8) = 24
 * All berths are enclosed in lockable compartments along a side corridor
 */
function generateFirstACBerths(): BerthPosition[] {
  const berths: BerthPosition[] = [];
  const cabinLength = 2.60;
  const coupeLength = 1.80;
  const startX = 2.0;
  
  let berthNum = 1;
  
  // 4 Cabins, each with 4 berths
  for (let cabin = 0; cabin < 4; cabin++) {
    const cabinX = startX + cabin * cabinLength;
    
    // Two lower berths face one another across the cabin, with one upper above each.
    berths.push({ berthNumber: berthNum++, berthType: 'CABIN_LB', bayNumber: cabin + 1, side: 'LEFT', deck: 0, x: cabinX, y: 0.05, z: 0.70 });
    berths.push({ berthNumber: berthNum++, berthType: 'CABIN_LB', bayNumber: cabin + 1, side: 'RIGHT', deck: 0, x: cabinX, y: 0.05, z: -0.70 });
    berths.push({ berthNumber: berthNum++, berthType: 'CABIN_UB', bayNumber: cabin + 1, side: 'LEFT', deck: 1, x: cabinX, y: 1.15, z: 0.70 });
    berths.push({ berthNumber: berthNum++, berthType: 'CABIN_UB', bayNumber: cabin + 1, side: 'RIGHT', deck: 1, x: cabinX, y: 1.15, z: -0.70 });
  }
  
  // 4 Coupes, each with 2 berths
  const coupeStartX = startX + 4 * cabinLength + 0.5;
  for (let coupe = 0; coupe < 4; coupe++) {
    const coupeX = coupeStartX + coupe * coupeLength;
    berths.push({ berthNumber: berthNum++, berthType: 'COUPE_LB', bayNumber: coupe + 5, side: 'LEFT', deck: 0, x: coupeX, y: 0.05, z: 0.70 });
    berths.push({ berthNumber: berthNum++, berthType: 'COUPE_UB', bayNumber: coupe + 5, side: 'LEFT', deck: 1, x: coupeX, y: 1.15, z: 0.70 });
  }
  
  return berths;
}

/**
 * Generate seat positions for Chair Car (78 seats - LHB)
 * 
 * Layout: 2+3 seating arrangement (like airplane)
 * Rows of seats facing forward
 */
function generateChairCarSeats(): BerthPosition[] {
  const seats: BerthPosition[] = [];
  const totalRows = 16; // approximately 78 seats = ~16 rows
  const rowPitch = 1.10; // meters between rows
  const startX = 2.0;
  
  let seatNum = 1;
  for (let row = 0; row < totalRows; row++) {
    const rowX = startX + row * rowPitch;
    
    // Window side (2 seats)
    seats.push({ berthNumber: seatNum++, berthType: 'SEAT', bayNumber: row + 1, side: 'LEFT', deck: 0, x: rowX, y: 0.45, z: 1.10 });
    seats.push({ berthNumber: seatNum++, berthType: 'SEAT', bayNumber: row + 1, side: 'LEFT', deck: 0, x: rowX, y: 0.45, z: 0.65 });
    
    // Aisle side (3 seats)
    seats.push({ berthNumber: seatNum++, berthType: 'SEAT', bayNumber: row + 1, side: 'RIGHT', deck: 0, x: rowX, y: 0.45, z: -0.35 });
    seats.push({ berthNumber: seatNum++, berthType: 'SEAT', bayNumber: row + 1, side: 'RIGHT', deck: 0, x: rowX, y: 0.45, z: -0.80 });
    seats.push({ berthNumber: seatNum++, berthType: 'SEAT', bayNumber: row + 1, side: 'RIGHT', deck: 0, x: rowX, y: 0.45, z: -1.25 });
    
    if (seatNum > 78) break;
  }
  
  return seats;
}

/**
 * Generate seat positions for General/Unreserved coach (100 seats - LHB)
 */
function generateGeneralSeats(): BerthPosition[] {
  const seats: BerthPosition[] = [];
  const totalRows = 20;
  const rowPitch = 1.00;
  const startX = 1.8;
  
  let seatNum = 1;
  for (let row = 0; row < totalRows; row++) {
    const rowX = startX + row * rowPitch;
    
    // 3+2 seats on side benches. Keep the centre aisle completely clear.
    for (let col = 0; col < 5; col++) {
      const leftBank = col < 3;
      const seatInBank = leftBank ? col : col - 3;
      const z = leftBank ? 1.05 : -1.05;
      seats.push({
        berthNumber: seatNum++,
        berthType: 'SEAT',
        bayNumber: row + 1,
        side: leftBank ? 'LEFT' : 'RIGHT',
        deck: 0,
        // Stagger individual cushions along the length of each continuous bench.
        x: rowX + (seatInBank - (leftBank ? 1 : 0.5)) * 0.28,
        y: 0.45,
        z: z,
      });
      if (seatNum > 100) break;
    }
    if (seatNum > 100) break;
  }
  
  return seats;
}

// ============================================================
// COACH BLUEPRINTS
// ============================================================

export const COACH_BLUEPRINTS: Record<string, CoachBlueprint> = {
  // LHB Sleeper
  'LHB_SL': {
    id: 'LHB_SL',
    name: 'LHB Sleeper Class',
    category: 'SL',
    generation: 'LHB',
    totalBerths: 80,
    totalBays: 10,
    berthsPerBay: 8,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: SLEEPER_BERTH_DIMS,
    berths: generateSleeperBerths(),
    toilets: {
      count: 4,
      positions: [
        { x: 0.5, z: 0.8 },
        { x: 0.5, z: -0.8 },
        { x: 22.5, z: 0.8 },
        { x: 22.5, z: -0.8 },
      ],
    },
    doors: {
      count: 4,
      positions: [
        { x: 1.0, z: 1.4, side: 'LEFT' },
        { x: 1.0, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 24,
    hasAC: false,
    hasPantry: false,
    description: 'Standard LHB Non-AC Sleeper coach with 80 berths arranged in 10 bays of 8 berths each. Features 3-tier bunks on both sides with side berths along the corridor.',
    color: '#4A7C59', // Indian Railways green
  },

  // LHB AC 3-Tier
  'LHB_3A': {
    id: 'LHB_3A',
    name: 'LHB AC 3-Tier',
    category: '3A',
    generation: 'LHB',
    totalBerths: 72,
    totalBays: 9,
    berthsPerBay: 8,
    dimensions: { ...LHB_COMMON_DIMENSIONS, height: 4250 },
    berthDimensions: AC3_BERTH_DIMS,
    berths: generateAC3Berths(),
    toilets: {
      count: 4,
      positions: [
        { x: 0.6, z: 0.8 },
        { x: 0.6, z: -0.8 },
        { x: 22.5, z: 0.8 },
        { x: 22.5, z: -0.8 },
      ],
    },
    doors: {
      count: 4,
      positions: [
        { x: 1.2, z: 1.4, side: 'LEFT' },
        { x: 1.2, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 20,
    hasAC: true,
    hasPantry: false,
    description: 'LHB Air-Conditioned 3-Tier coach with 72 berths. Features curtains, reading lights, and AC.',
    color: '#1E3A5F', // Dark blue
  },

  // LHB AC 3-Tier Economy
  'LHB_3E': {
    id: 'LHB_3E',
    name: 'LHB AC 3-Tier Economy',
    category: '3E',
    generation: 'LHB',
    totalBerths: 83,
    totalBays: 11,
    berthsPerBay: 8,
    dimensions: { ...LHB_COMMON_DIMENSIONS, height: 4250 },
    berthDimensions: AC3_BERTH_DIMS,
    berths: generateAC3EconomyBerths(),
    toilets: {
      count: 3,
      positions: [
        { x: 0.6, z: 0.8 },
        { x: 22.5, z: 0.8 },
        { x: 22.5, z: -0.8 },
      ],
    },
    doors: {
      count: 4,
      positions: [
        { x: 1.2, z: 1.4, side: 'LEFT' },
        { x: 1.2, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 22,
    hasAC: true,
    hasPantry: false,
    description: 'LHB AC 3-Tier Economy with 83 berths. More berths per coach at a lower fare, with reduced toilet count.',
    color: '#2C5F8A', // Medium blue
  },

  // LHB AC 2-Tier
  'LHB_2A': {
    id: 'LHB_2A',
    name: 'LHB AC 2-Tier',
    category: '2A',
    generation: 'LHB',
    totalBerths: 52,
    totalBays: 9,
    berthsPerBay: 6,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: AC2_BERTH_DIMS,
    berths: generateAC2Berths(),
    toilets: {
      count: 4,
      positions: [
        { x: 0.6, z: 0.8 },
        { x: 0.6, z: -0.8 },
        { x: 22.5, z: 0.8 },
        { x: 22.5, z: -0.8 },
      ],
    },
    doors: {
      count: 4,
      positions: [
        { x: 1.2, z: 1.4, side: 'LEFT' },
        { x: 1.2, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 18,
    hasAC: true,
    hasPantry: false,
    description: 'LHB AC 2-Tier coach with 52 berths. More spacious than 3A with only upper and lower berths plus side berths. Individual curtains for privacy.',
    color: '#4B0082', // Indigo
  },

  // LHB First AC
  'LHB_1A': {
    id: 'LHB_1A',
    name: 'LHB First AC',
    category: '1A',
    generation: 'LHB',
    totalBerths: 24,
    totalBays: 8,
    berthsPerBay: 3, // average
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: FIRST_AC_BERTH_DIMS,
    berths: generateFirstACBerths(),
    toilets: {
      count: 2,
      positions: [
        { x: 0.6, z: 0.0 },
        { x: 22.5, z: 0.0 },
      ],
    },
    doors: {
      count: 2,
      positions: [
        { x: 1.0, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 12,
    hasAC: true,
    hasPantry: false,
    description: 'LHB First AC coach with 24 berths in 4 lockable cabins (4 berths each) and 4 lockable coupes (2 berths each). Corridor on one side. Most premium class.',
    color: '#8B0000', // Dark red
  },

  // LHB Chair Car
  'LHB_CC': {
    id: 'LHB_CC',
    name: 'LHB AC Chair Car',
    category: 'CC',
    generation: 'LHB',
    totalBerths: 78,
    totalBays: 16,
    berthsPerBay: 5,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: {
      ...SLEEPER_BERTH_DIMS,
      'SEAT': { length: 450, width: 430, height: 1000, confidence: 'APPROXIMATE' },
    },
    berths: generateChairCarSeats(),
    toilets: {
      count: 2,
      positions: [
        { x: 0.6, z: 0.0 },
        { x: 22.5, z: 0.0 },
      ],
    },
    doors: {
      count: 4,
      positions: [
        { x: 1.0, z: 1.4, side: 'LEFT' },
        { x: 1.0, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 28,
    hasAC: true,
    hasPantry: false,
    description: 'LHB AC Chair Car with 78 reclining seats in 2+3 configuration. Used in Shatabdi, Jan Shatabdi, and other day trains.',
    color: '#B8860B', // Dark goldenrod
  },

  // LHB General/Unreserved
  'LHB_GS': {
    id: 'LHB_GS',
    name: 'LHB General Second Class',
    category: 'GS',
    generation: 'LHB',
    totalBerths: 100,
    totalBays: 20,
    berthsPerBay: 5,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: {
      ...SLEEPER_BERTH_DIMS,
      'SEAT': { length: 430, width: 400, height: 900, confidence: 'ESTIMATED' },
    },
    berths: generateGeneralSeats(),
    toilets: {
      count: 4,
      positions: [
        { x: 0.5, z: 0.8 },
        { x: 0.5, z: -0.8 },
        { x: 22.5, z: 0.8 },
        { x: 22.5, z: -0.8 },
      ],
    },
    doors: {
      count: 6,
      positions: [
        { x: 0.8, z: 1.4, side: 'LEFT' },
        { x: 0.8, z: -1.4, side: 'RIGHT' },
        { x: 11.5, z: 1.4, side: 'LEFT' },
        { x: 11.5, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: 1.4, side: 'LEFT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 30,
    hasAC: false,
    hasPantry: false,
    description: 'LHB General Second class unreserved coach with approximately 100 bench-style seats.',
    color: '#556B2F', // Dark olive green
  },

  // Pantry Car
  'LHB_PC': {
    id: 'LHB_PC',
    name: 'LHB Pantry Car',
    category: 'PC',
    generation: 'LHB',
    totalBerths: 0,
    totalBays: 0,
    berthsPerBay: 0,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: SLEEPER_BERTH_DIMS,
    berths: [],
    toilets: { count: 1, positions: [{ x: 22.0, z: 0.0 }] },
    doors: {
      count: 2,
      positions: [
        { x: 1.0, z: -1.4, side: 'RIGHT' },
        { x: 22.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 8,
    hasAC: true,
    hasPantry: true,
    description: 'LHB Pantry/Kitchen Car for food preparation and service. No passenger berths.',
    color: '#CD853F', // Peru/tan
  },

  // EOG (End on Generator)
  'LHB_EOG': {
    id: 'LHB_EOG',
    name: 'LHB End on Generator',
    category: 'EOG',
    generation: 'LHB',
    totalBerths: 0,
    totalBays: 0,
    berthsPerBay: 0,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: SLEEPER_BERTH_DIMS,
    berths: [],
    toilets: { count: 0, positions: [] },
    doors: { count: 2, positions: [{ x: 1.0, z: -1.4, side: 'RIGHT' }, { x: 22.0, z: -1.4, side: 'RIGHT' }] },
    windows: 4,
    hasAC: false,
    hasPantry: false,
    description: 'End-on Generator car that provides electric power for AC coaches in LHB rakes. Usually positioned at both ends of the train.',
    color: '#696969', // Dim gray
  },

  // SLR (Seating cum Luggage Rake)
  'LHB_SLR': {
    id: 'LHB_SLR',
    name: 'LHB SLR / Brake Van',
    category: 'SLR',
    generation: 'LHB',
    totalBerths: 0,
    totalBays: 0,
    berthsPerBay: 0,
    dimensions: LHB_COMMON_DIMENSIONS,
    berthDimensions: SLEEPER_BERTH_DIMS,
    berths: [],
    toilets: { count: 1, positions: [{ x: 20.0, z: 0.0 }] },
    doors: {
      count: 4,
      positions: [
        { x: 1.0, z: 1.4, side: 'LEFT' },
        { x: 1.0, z: -1.4, side: 'RIGHT' },
        { x: 12.0, z: 1.4, side: 'LEFT' },
        { x: 12.0, z: -1.4, side: 'RIGHT' },
      ],
    },
    windows: 8,
    hasAC: false,
    hasPantry: false,
    description: 'LHB Seating cum Luggage Rake / Brake Van. Half for guard/luggage compartment, half for unreserved passengers.',
    color: '#A9A9A9', // Dark gray
  },
};

// ============================================================
// COACH TYPE MAPPING
// ============================================================

/**
 * Map coach label prefixes to blueprint IDs
 * Real train composition labels like S1, S2, B1, A1 map to specific blueprints
 */
export const COACH_LABEL_TO_BLUEPRINT: Record<string, string> = {
  // Sleeper coaches
  'S': 'LHB_SL',
  'SL': 'LHB_SL',
  
  // AC 3 Tier
  'B': 'LHB_3A',
  '3A': 'LHB_3A',
  
  // AC 3 Tier Economy
  '3E': 'LHB_3E',
  
  // AC 2 Tier
  'A': 'LHB_2A',
  '2A': 'LHB_2A',
  
  // First AC
  'H': 'LHB_1A',
  'HA': 'LHB_1A',
  '1A': 'LHB_1A',
  
  // Chair Car
  'C': 'LHB_CC',
  'CC': 'LHB_CC',
  
  // General
  'GS': 'LHB_GS',
  'D': 'LHB_GS',
  'G': 'LHB_GS',
  
  // Pantry
  'PC': 'LHB_PC',
  'PANTRY': 'LHB_PC',
  
  // EOG
  'EOG': 'LHB_EOG',
  'GENERATOR': 'LHB_EOG',
  
  // SLR
  'SLR': 'LHB_SLR',
  'BRAKE': 'LHB_SLR',
};

/**
 * Resolve a coach label (e.g., "S1", "B2", "A1") to a blueprint ID
 */
export function resolveCoachBlueprint(label: string): string {
  const upper = label.toUpperCase().trim();
  
  // Direct match first
  if (COACH_LABEL_TO_BLUEPRINT[upper]) return COACH_LABEL_TO_BLUEPRINT[upper];
  
  // Try prefix match (e.g., "S1" -> "S")
  for (const [prefix, blueprintId] of Object.entries(COACH_LABEL_TO_BLUEPRINT)) {
    if (upper.startsWith(prefix) && /\d/.test(upper.slice(prefix.length))) {
      return blueprintId;
    }
  }
  
  // Fallback
  return 'LHB_GS';
}

/**
 * Get coach color based on class
 */
export function getCoachColor(category: CoachCategory): string {
  const colors: Record<CoachCategory, string> = {
    'SL': '#4A7C59',
    '3A': '#1E3A5F',
    '3E': '#2C5F8A',
    '2A': '#4B0082',
    '1A': '#8B0000',
    '2S': '#556B2F',
    'CC': '#B8860B',
    'EC': '#DAA520',
    'GS': '#556B2F',
    'EA': '#C0392B',
    'HA': '#8B0000',
    'PC': '#CD853F',
    'EOG': '#696969',
    'SLR': '#A9A9A9',
    'LOCO': '#2C3E50',
    'GEN': '#696969',
    'VP': '#2E86C1',
  };
  return colors[category] || '#666666';
}

// ============================================================
// COUPLING AND DISTANCE CONSTANTS
// ============================================================

export const COUPLING_GAP_METERS = 0.6; // Approximate gap between coupled coaches
export const GANGWAY_LENGTH_METERS = 1.2; // Vestibule/gangway connecting coaches
export const LHB_COACH_LENGTH_METERS = 24.0; // Length over couplers
export const ICF_COACH_LENGTH_METERS = 22.28;
export const LOCOMOTIVE_LENGTH_METERS = 20.562; // WAP-7 electric locomotive

/**
 * Calculate distance between two coaches in a rake
 */
export function calculateCoachDistance(
  coachIndex1: number,
  coachIndex2: number,
  coachLengths: number[] // meters for each coach
): {
  coachCount: number;
  approximateMeters: number;
  basis: string;
} {
  const minIdx = Math.min(coachIndex1, coachIndex2);
  const maxIdx = Math.max(coachIndex1, coachIndex2);
  const coachCount = maxIdx - minIdx;
  
  let distance = 0;
  for (let i = minIdx; i < maxIdx; i++) {
    distance += coachLengths[i] + COUPLING_GAP_METERS;
  }
  // Remove last coupling gap and add half of destination coach
  distance -= COUPLING_GAP_METERS;
  
  return {
    coachCount,
    approximateMeters: Math.round(distance * 10) / 10,
    basis: 'Model calculation using LHB/ICF standard coach lengths + coupling gaps',
  };
}

