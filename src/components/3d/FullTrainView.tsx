'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CoachExterior from './CoachExterior';
import Locomotive from './Locomotive';
import {
  resolveCoachBlueprint,
  LHB_COACH_LENGTH_METERS,
  COUPLING_GAP_METERS,
  LOCOMOTIVE_LENGTH_METERS,
} from '@/data/coach-database';
import type { CoachCategory } from '@/data/coach-database';

export interface TrainCoach {
  coachId: string;
  coachType: string;
  position: number;
}

interface FullTrainViewProps {
  coaches: TrainCoach[];
  selectedCoachId: string | null;
  highlightedCoachId: string | null;
  onCoachClick: (coachId: string) => void;
  distanceFrom?: string | null;
  distanceTo?: string | null;
  isMoving?: boolean;
  speedKmph?: number;
  stationName?: string;
  nextStationName?: string;
  distanceToNextKm?: number;
  isAtStation?: boolean;
  showStationEnvironment?: boolean;
  showCouplerGaps?: boolean;
  isExploded?: boolean;
}

function getHindiStationName(name?: string): string {
  if (!name) return 'भारतीय रेल';
  const upper = name.toUpperCase().trim();
  const map: Record<string, string> = {
    'BHUBANESWAR': 'भुवनेश्वर',
    'CUTTACK': 'कटक',
    'DHANBAD': 'धनबाद',
    'BARBIL': 'बड़बिल',
    'BARA JAMDA': 'बड़ा जामदा जं.',
    'CHAKRADHARPUR': 'चक्रधरपुर',
    'NOAMUNDI': 'नोवामुंडी',
    'PADA PAHAR': 'पड़ा पहाड़ जं.',
    'DANGOAPOSI': 'डांगोवापोसी',
    'KENDPOSI': 'केंदपोसी',
    'ROURKELA': 'राउरकेला',
    'HOWRAH': 'हावड़ा',
    'NEW DELHI': 'नई दिल्ली',
    'TATANAGAR': 'टाटानगर',
    'PURI': 'पुरी',
    'NERGUNDI': 'नेरगुंडी',
    'BADA PADAGAON': 'बड़ा पड़ागांव',
    'RAJ ATHGARH': 'राज आठगढ़',
    'DHENKANAL': 'ढेंकनाल',
    'HINDOL ROAD': 'हिन्दोल रोड',
  };
  for (const [k, v] of Object.entries(map)) {
    if (upper.includes(k)) return v;
  }
  return 'भारतीय रेल';
}

/**
 * 1. AT-STATION ENVIRONMENT: Rendered when the train is halted at the station platform.
 * Spans alongside the full rake with concrete platform deck, canopy, FOB, yellow station boards,
 * digital coach position indicators, platform benches, water booths, and IRCTC stalls.
 */
function AtStationEnvironment({
  centerX,
  length,
  stationName,
  coaches,
}: {
  centerX: number;
  length: number;
  stationName: string;
  coaches: TrainCoach[];
}) {
  const columns = Math.floor(length / 14);
  const hindiName = getHindiStationName(stationName);
  const displayName = stationName.replace(/\s*(Express|Special|Mail|SF)$/i, '').toUpperCase();

  return (
    <group position={[centerX, 0, 0]}>
      {/* Platform Concrete Slab (Top surface at y = -0.9m flush with coach footboards, width = 7.6m) */}
      <mesh position={[0, -1.75, -5.6]} receiveShadow>
        <boxGeometry args={[length, 1.7, 7.6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Tactile Yellow Safety Warning Strip at platform track edge (Z = -1.9m) */}
      <mesh position={[0, -0.89, -1.95]}>
        <boxGeometry args={[length, 0.02, 0.35]} />
        <meshStandardMaterial color="#facc15" roughness={0.7} />
      </mesh>

      {/* Alternating Black/Yellow Platform Coping Edge Tiles */}
      <mesh position={[0, -0.89, -2.15]}>
        <boxGeometry args={[length, 0.02, 0.12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Platform Roof Canopy (Steel truss canopy at y = 5.6m) */}
      <mesh position={[0, 5.6, -5.6]} castShadow>
        <boxGeometry args={[length, 0.25, 7.8]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 5.75, -5.6]} castShadow>
        <boxGeometry args={[length - 0.4, 0.1, 7.4]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Steel Support Columns & Warm Overhead Platform Lights */}
      {Array.from({ length: columns + 1 }, (_, i) => {
        const x = -length / 2 + i * 14;
        return (
          <group key={`pf-col-${i}`} position={[x, 0, -5.6]}>
            {/* Main Portal Column */}
            <mesh position={[0, 2.35, 0]} castShadow>
              <boxGeometry args={[0.3, 6.5, 0.3]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Cross cantilever girder */}
            <mesh position={[0, 5.4, 0]}>
              <boxGeometry args={[0.2, 0.25, 6.8]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
            {/* Fluorescent Light Fixture */}
            <mesh position={[0, 5.25, 1.2]}>
              <boxGeometry args={[1.2, 0.08, 0.18]} />
              <meshStandardMaterial color="#fef3c7" emissive="#fcd34d" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
            {/* Cast warm light downward onto platform */}
            {i % 2 === 0 && (
              <pointLight position={[0, 4.8, 1.2]} intensity={1.8} distance={20} color="#fef3c7" />
            )}
            {/* Platform Number Board */}
            <group position={[0, 3.8, 0.2]}>
              <mesh>
                <boxGeometry args={[1.2, 0.65, 0.08]} />
                <meshStandardMaterial color="#1d4ed8" roughness={0.3} />
              </mesh>
              <Text position={[0, 0.08, 0.05]} fontSize={0.24} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
                PF 2
              </Text>
              <Text position={[0, -0.16, 0.05]} fontSize={0.12} color="#93c5fd" anchorX="center" anchorY="middle">
                प्लेटफार्म 2
              </Text>
            </group>
          </group>
        );
      })}

      {/* Iconic Indian Railways Yellow Station Boards (Bilingual Hindi + English + MSL) */}
      {[-length * 0.35, length * 0.35].map((bx, bIdx) => (
        <group key={`stn-board-${bIdx}`} position={[bx, 2.8, -3.2]}>
          {/* Support Stanchions */}
          {[-2.2, 2.2].map((sx, si) => (
            <mesh key={si} position={[sx, -1.8, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 3.8, 12]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} />
            </mesh>
          ))}
          {/* Yellow Board Backing */}
          <mesh castShadow>
            <boxGeometry args={[5.8, 1.8, 0.12]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} />
          </mesh>
          {/* Black Board Trim */}
          <mesh position={[0, 0, 0.065]}>
            <boxGeometry args={[5.6, 1.65, 0.02]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[5.45, 1.5, 0.02]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          {/* Devanagari Hindi Text */}
          <Text position={[0, 0.42, 0.1]} fontSize={0.42} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
            {hindiName}
          </Text>
          {/* English Station Text */}
          <Text position={[0, -0.05, 0.1]} fontSize={0.46} color="#000000" anchorX="center" anchorY="middle" fontWeight="black">
            {displayName}
          </Text>
          {/* Elevation / MSL Info */}
          <Text position={[0, -0.48, 0.1]} fontSize={0.16} color="#1e293b" anchorX="center" anchorY="middle">
            समुद्र तल से ऊंचाई / HEIGHT ABOVE MSL +245 M
          </Text>
        </group>
      ))}

      {/* Overhead Foot Over Bridge (FOB) across the tracks at x = 24m */}
      <group position={[24, 0, 0]}>
        {/* Truss Girder Bridge Span across tracks (clears catenary wire at 4.8m) */}
        <mesh position={[0, 6.4, -2.5]}>
          <boxGeometry args={[4.2, 2.6, 15.0]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0, 7.8, -2.5]}>
          <boxGeometry args={[4.6, 0.35, 15.6]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>
        {/* Covered Staircase descending onto the platform */}
        <mesh position={[0, 2.7, -7.5]} rotation={[Math.PI / 6, 0, 0]}>
          <boxGeometry args={[3.2, 0.25, 7.8]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
        <Text position={[0, 7.2, 4.8]} fontSize={0.32} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          FOOT OVER BRIDGE · पदयात्री पुल
        </Text>
      </group>

      {/* Digital Coach Position Indicators hanging from canopy above each coach */}
      {coaches.slice(0, 14).map((c, idx) => {
        const coachX = -length / 2 + 25 + idx * 24.6;
        return (
          <group key={`coach-ind-${idx}`} position={[coachX, 5.1, -2.2]}>
            <mesh>
              <boxGeometry args={[0.7, 0.35, 0.12]} />
              <meshStandardMaterial color="#020617" roughness={0.4} />
            </mesh>
            <Text position={[0, 0.02, 0.07]} fontSize={0.18} color="#38bdf8" anchorX="center" anchorY="middle" fontWeight="bold">
              {c.coachId}
            </Text>
          </group>
        );
      })}

      {/* Platform Furniture: Cast Iron Benches, Water Tap, IRCTC Tea Stall, Clock */}
      {[-50, -15, 30, 65].map((bx) => (
        <group key={`bench-${bx}`} position={[bx, -0.38, -6.8]}>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[2.8, 0.08, 0.55]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.6, -0.24]}>
            <boxGeometry args={[2.8, 0.45, 0.08]} />
            <meshStandardMaterial color="#b45309" roughness={0.5} />
          </mesh>
          {[-1.1, 1.1].map((lx) => (
            <mesh key={lx} position={[lx, 0.15, 0]}>
              <boxGeometry args={[0.1, 0.5, 0.55]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Red Drinking Water Tap Booth (स्वच्छ पेयजल) */}
      <group position={[-32, -0.15, -7.2]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[2.4, 1.8, 0.8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        <Text position={[0, 1.45, 0.42]} fontSize={0.16} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          DRINKING WATER / स्वच्छ पेयजल
        </Text>
      </group>

      {/* IRCTC Tea & Snacks Refreshment Stall */}
      <group position={[48, 0.35, -7.2]}>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[3.8, 2.5, 1.2]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[4.2, 0.3, 1.4]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        <Text position={[0, 2.22, 0.72]} fontSize={0.2} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
          IRCTC TEA & REFRESHMENTS
        </Text>
      </group>

      {/* Double-Sided Analogue Platform Clock hanging from canopy */}
      <group position={[0, 4.4, -4.2]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.0, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.22, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <circleGeometry args={[0.48, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Station Building Facade (Waiting Hall / Station Master Office) */}
      <mesh position={[0, 1.6, -9.4]}>
        <boxGeometry args={[length * 0.75, 4.2, 0.6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.8, -9.3]}>
        <boxGeometry args={[length * 0.78, 0.45, 0.8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>
      <Text position={[0, 2.2, -9.05]} fontSize={0.45} color="#1e3a8a" anchorX="center" anchorY="middle" fontWeight="bold">
        WAITING HALL & TICKET COUNTER · प्रतीक्षालय
      </Text>
    </group>
  );
}

/**
 * 2. DISTANT-STATION ENVIRONMENT: Rendered when the train is RUNNING on open tracks.
 * Visible far down the line in front of the locomotive (at x ≈ -180m), showing the upcoming
 * station platform, canopy, high-mast yard lighting towers, Foot Over Bridge, approach signal,
 * and large Indian Railways yellow board with the upcoming station name and distance!
 */
function DistantStationEnvironment({
  centerX = -180,
  nextStationName = 'Upcoming Station',
  distanceKm = 10,
}: {
  centerX?: number;
  nextStationName?: string;
  distanceKm?: number;
}) {
  const hindiNext = getHindiStationName(nextStationName);
  const displayNext = nextStationName.replace(/\s*(Express|Special|Mail|SF)$/i, '').toUpperCase();
  const stationLength = 130;

  return (
    <group position={[centerX, 0, 0]}>
      {/* Distant Platform Deck on far side of track */}
      <mesh position={[0, -1.75, -5.6]} receiveShadow>
        <boxGeometry args={[stationLength, 1.7, 7.6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.85} />
      </mesh>

      {/* Tactile Yellow Safety Warning Strip */}
      <mesh position={[0, -0.89, -1.95]}>
        <boxGeometry args={[stationLength, 0.02, 0.35]} />
        <meshStandardMaterial color="#facc15" roughness={0.7} />
      </mesh>

      {/* Distant Platform Canopy Shed */}
      <mesh position={[0, 5.6, -5.6]}>
        <boxGeometry args={[stationLength, 0.25, 7.8]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Canopy Support Columns */}
      {Array.from({ length: 9 }, (_, i) => {
        const cx = -stationLength / 2 + i * 16;
        return (
          <group key={`dist-col-${i}`} position={[cx, 0, -5.6]}>
            <mesh position={[0, 2.35, 0]}>
              <boxGeometry args={[0.3, 6.5, 0.3]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} />
            </mesh>
            <mesh position={[0, 5.3, 1.0]}>
              <boxGeometry args={[1.0, 0.08, 0.18]} />
              <meshStandardMaterial color="#fef3c7" emissive="#fcd34d" emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </group>
        );
      })}

      {/* Distant High-Mast Yard Lighting Towers casting warm pool of light */}
      {[-55, 45].map((hx, hi) => (
        <group key={`high-mast-${hi}`} position={[hx, 0, -7.5]}>
          <mesh position={[0, 7.5, 0]}>
            <cylinderGeometry args={[0.18, 0.35, 15, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          {/* Floodlight ring */}
          <mesh position={[0, 14.8, 0]}>
            <torusGeometry args={[0.8, 0.12, 8, 16]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 14.5, 0]} intensity={2.5} distance={75} color="#fef08a" />
        </group>
      ))}

      {/* Distant Overhead Foot Over Bridge (FOB) bridging the tracks */}
      <group position={[20, 0, 0]}>
        <mesh position={[0, 6.4, -2.5]}>
          <boxGeometry args={[4.2, 2.6, 15.0]} />
          <meshStandardMaterial color="#1e3a8a" metalness={0.6} />
        </mesh>
        <mesh position={[0, 7.8, -2.5]}>
          <boxGeometry args={[4.6, 0.35, 15.6]} />
          <meshStandardMaterial color="#334155" metalness={0.5} />
        </mesh>
      </group>

      {/* Large Indian Railways Yellow Nameboard facing approaching train */}
      <group position={[52, 3.2, -3.2]}>
        {/* Support Stanchions */}
        {[-2.2, 2.2].map((sx, si) => (
          <mesh key={si} position={[sx, -1.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3.8, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        ))}
        {/* Board Surface */}
        <mesh>
          <boxGeometry args={[6.8, 2.2, 0.12]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.065]}>
          <boxGeometry args={[6.6, 2.05, 0.02]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <boxGeometry args={[6.45, 1.9, 0.02]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
        <Text position={[0, 0.58, 0.1]} fontSize={0.38} color="#000000" anchorX="center" anchorY="middle" fontWeight="bold">
          अगला स्टेशन / UPCOMING STATION
        </Text>
        <Text position={[0, 0.05, 0.1]} fontSize={0.52} color="#000000" anchorX="center" anchorY="middle" fontWeight="black">
          {displayNext}
        </Text>
        <Text position={[0, -0.52, 0.1]} fontSize={0.24} color="#1e3a8a" anchorX="center" anchorY="middle" fontWeight="bold">
          {hindiNext} · {distanceKm} KM AHEAD
        </Text>
      </group>

      {/* Station Approach Home / Starter Signal Gantry (Green aspect guiding train) */}
      <group position={[78, 0, -2.8]}>
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 6.4, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 5.8, 0.1]}>
          <boxGeometry args={[0.4, 1.4, 0.3]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
        <mesh position={[0, 5.5, 0.26]}>
          <circleGeometry args={[0.13, 24]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={3.0} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 5.5, 0.6]} intensity={1.8} distance={14} color="#10b981" />
      </group>

      {/* Station Building Facade */}
      <mesh position={[0, 1.8, -9.4]}>
        <boxGeometry args={[stationLength * 0.8, 4.5, 0.6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.2, -9.3]}>
        <boxGeometry args={[stationLength * 0.82, 0.45, 0.8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>
      <Text position={[0, 2.5, -9.05]} fontSize={0.52} color="#1e3a8a" anchorX="center" anchorY="middle" fontWeight="bold">
        {displayNext} RAILWAY JUNCTION
      </Text>
    </group>
  );
}

export default function FullTrainView({
  coaches,
  selectedCoachId,
  highlightedCoachId,
  onCoachClick,
  distanceFrom,
  distanceTo,
  isMoving = true,
  speedKmph = 88,
  stationName = 'Indian Railways Station',
  nextStationName = 'Upcoming Junction',
  distanceToNextKm = 10,
  isAtStation = false,
  showStationEnvironment = false,
  showCouplerGaps = true,
  isExploded = false,
}: FullTrainViewProps) {
  const { camera } = useThree();
  const sleepersGroupRef = useRef<THREE.Group>(null);
  const oheGroupRef = useRef<THREE.Group>(null);
  const sceneryGroupRef = useRef<THREE.Group>(null);
  const hillsGroupRef = useRef<THREE.Group>(null);

  const sleeperOffset = useRef(0);
  const oheOffset = useRef(0);
  const sceneryOffset = useRef(0);
  const hillsOffset = useRef(0);

  const explodeExtra = isExploded ? 8.5 : 0;
  const coachSpacing = LHB_COACH_LENGTH_METERS + COUPLING_GAP_METERS + explodeExtra;

  // Calculate physical 3D center positions for each coach along X axis
  const coachPositions = useMemo(() => {
    const positions: Array<{ coachId: string; x: number; category: CoachCategory; position: number }> = [];
    let currentX = LOCOMOTIVE_LENGTH_METERS + COUPLING_GAP_METERS; // After locomotive

    for (const coach of coaches) {
      const blueprintId = resolveCoachBlueprint(coach.coachId);
      const category = (blueprintId.split('_')[1] || 'GS') as CoachCategory;
      positions.push({
        coachId: coach.coachId,
        x: currentX + LHB_COACH_LENGTH_METERS / 2,
        category,
        position: coach.position,
      });
      currentX += coachSpacing;
    }

    return positions;
  }, [coaches, coachSpacing]);

  // Total train length from front of locomotive to rear of last coach
  const totalLength = useMemo(() => {
    return LOCOMOTIVE_LENGTH_METERS + coaches.length * coachSpacing + 30;
  }, [coaches.length, coachSpacing]);

  // Track boundary coordinates covering both distant station ahead (-360m) and rake (+totalLength + 120m)
  const trackStart = -360;
  const trackEnd = totalLength + 120;
  const trackSpan = trackEnd - trackStart;
  const trackCenter = (trackStart + trackEnd) / 2;

  // Animate dynamic track & scenery motion when the train is running
  // Scenery scrolls toward +X as the train travels forward toward -X (toward distant station)
  useFrame((_, delta) => {
    if (!isMoving) return;

    const speedMs = (speedKmph * 1000) / 3600;

    // 1. Scrolling sleepers by modulo 0.60m (RDSO pitch)
    sleeperOffset.current = (sleeperOffset.current + speedMs * delta) % 0.6;
    if (sleepersGroupRef.current) {
      sleepersGroupRef.current.position.x = sleeperOffset.current;
    }

    // 2. OHE Electrification Masts spaced every 45 meters
    oheOffset.current = (oheOffset.current + speedMs * delta) % 45.0;
    if (oheGroupRef.current) {
      oheGroupRef.current.position.x = oheOffset.current;
    }

    // 3. Trackside Scenery (Trees, Signals, Kilometer posts) repeat cycle 45 meters
    sceneryOffset.current = (sceneryOffset.current + speedMs * delta) % 45.0;
    if (sceneryGroupRef.current) {
      sceneryGroupRef.current.position.x = sceneryOffset.current;
    }

    // 4. Distant Rolling Hills Parallax (0.12x speed, repeat cycle 300m)
    hillsOffset.current = (hillsOffset.current + speedMs * 0.12 * delta) % 300.0;
    if (hillsGroupRef.current) {
      hillsGroupRef.current.position.x = hillsOffset.current;
    }
  });

  // Camera smooth focus on selected coach
  useEffect(() => {
    if (selectedCoachId) {
      const found = coachPositions.find((c) => c.coachId === selectedCoachId);
      if (found) {
        const target = new THREE.Vector3(found.x, 2.5, 18);
        camera.position.lerp(target, 0.1);
      }
    }
  }, [selectedCoachId, coachPositions, camera]);

  // Number of sleepers spanning the full track
  const sleeperCount = Math.floor(trackSpan / 0.6);
  // Number of OHE masts spanning the full track
  const oheCount = Math.ceil(trackSpan / 45) + 2;

  const effectiveAtStation = Boolean(isAtStation);

  return (
    <group>
      {/* ======================================================== */}
      {/* 1. SCENIC INDIAN COUNTRYSIDE TERRAIN & EMBANKMENT        */}
      {/* ======================================================== */}
      {/* Expansive landscape plain */}
      <mesh position={[trackCenter, -2.7, 0]} receiveShadow>
        <boxGeometry args={[trackSpan + 180, 0.2, 420]} />
        <meshStandardMaterial color="#1e3518" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Railway Embankment Shoulder (Earth & Gravel ballast foundation) */}
      <mesh position={[trackCenter, -2.55, 0]} receiveShadow>
        <boxGeometry args={[trackSpan + 40, 0.3, 14.5]} />
        <meshStandardMaterial color="#334155" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Crushed Granite Ballast Bed (50mm ballast RDSO standard) */}
      <mesh position={[trackCenter, -2.42, 0]} receiveShadow>
        <boxGeometry args={[trackSpan, 0.26, 4.8]} />
        <meshStandardMaterial color="#475569" roughness={1.0} metalness={0.05} />
      </mesh>

      {/* ======================================================== */}
      {/* 2. CONTINUOUS STEEL RAILS (1676mm Broad Gauge Rails)    */}
      {/* ======================================================== */}
      {/* Left Rail (+0.838m from centerline) */}
      <mesh position={[trackCenter, -2.15, 0.838]} receiveShadow>
        <boxGeometry args={[trackSpan, 0.16, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Right Rail (-0.838m from centerline) */}
      <mesh position={[trackCenter, -2.15, -0.838]} receiveShadow>
        <boxGeometry args={[trackSpan, 0.16, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* ======================================================== */}
      {/* 3. DYNAMICALLY SCROLLING PRESTRESSED CONCRETE SLEEPERS   */}
      {/* ======================================================== */}
      <group ref={sleepersGroupRef}>
        {Array.from({ length: sleeperCount }, (_, i) => {
          const xPos = trackStart + i * 0.6;
          return (
            <group key={`sleeper-${i}`} position={[xPos, -2.26, 0]}>
              {/* Prestressed Concrete Sleeper */}
              <mesh receiveShadow>
                <boxGeometry args={[0.24, 0.15, 2.75]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.8} metalness={0.1} />
              </mesh>
              {/* Elastic Rail Fasteners (Pandrol Clips) */}
              {[-0.838, 0.838].map((rz, rIdx) => (
                <mesh key={rIdx} position={[0, 0.09, rz]}>
                  <boxGeometry args={[0.18, 0.04, 0.14]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>

      {/* ======================================================== */}
      {/* 4. OVERHEAD ELECTRIFICATION (25kV AC CATENARY MASTS)     */}
      {/* ======================================================== */}
      <group ref={oheGroupRef}>
        {Array.from({ length: oheCount }, (_, i) => {
          const mastX = trackStart + i * 45;
          return (
            <group key={`ohe-${i}`} position={[mastX, 0, -3.2]}>
              {/* Galvanized Steel Portal Mast */}
              <mesh position={[0, 1.8, 0]} castShadow>
                <boxGeometry args={[0.25, 8.5, 0.25]} />
                <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Cantilever Arm over the track */}
              <mesh position={[0, 5.2, 1.6]}>
                <boxGeometry args={[0.12, 0.12, 3.2]} />
                <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* High Voltage Ceramic Insulator */}
              <mesh position={[0, 5.0, 3.2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.45, 12]} />
                <meshStandardMaterial color="#7c2d12" roughness={0.4} />
              </mesh>
              {/* 25kV Warning Board */}
              <mesh position={[0, 2.2, 0.15]}>
                <boxGeometry args={[0.3, 0.4, 0.02]} />
                <meshStandardMaterial color="#dc2626" />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Continuous Catenary Contact Wire */}
      <mesh position={[trackCenter, 4.8, 0]}>
        <boxGeometry args={[trackSpan, 0.02, 0.02]} />
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ======================================================== */}
      {/* 5. STATION ENVIRONMENTS (DUAL-MODE: AT-STATION vs DISTANT) */}
      {/* ======================================================== */}
      {/* Case A: Train is at station -> Full platform spans along the rake */}
      {effectiveAtStation ? (
        <AtStationEnvironment
          centerX={totalLength / 2}
          length={Math.max(180, totalLength + 45)}
          stationName={stationName}
          coaches={coaches}
        />
      ) : (
        /* Case B: Train is running on track -> Upcoming station is visible FAR AHEAD down the line */
        <DistantStationEnvironment
          centerX={-180}
          nextStationName={nextStationName}
          distanceKm={distanceToNextKm}
        />
      )}

      {/* ======================================================== */}
      {/* 6. DYNAMIC MOVING TRACKSIDE SCENERY (Trees, Signals, KM) */}
      {/* ======================================================== */}
      <group ref={sceneryGroupRef}>
        {Array.from({ length: Math.ceil((totalLength + 250) / 45) + 4 }, (_, blockIdx) => {
          const baseX = -120 + blockIdx * 45;
          return (
            <group key={`scenery-block-${blockIdx}`}>
              {/* 3-Aspect Automatic Block Railway Signal (Green Glowing Aspect) */}
              <group position={[baseX + 10, 0, -2.8]}>
                {/* Signal Mast */}
                <mesh position={[0, 2.2, 0]} castShadow>
                  <cylinderGeometry args={[0.08, 0.1, 4.5, 16]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Signal Head Housing */}
                <mesh position={[0, 4.5, 0.1]}>
                  <boxGeometry args={[0.35, 1.1, 0.25]} />
                  <meshStandardMaterial color="#020617" roughness={0.5} />
                </mesh>
                {/* Green Aspect Lens (Glowing Bright Green!) */}
                <mesh position={[0, 4.2, 0.24]}>
                  <circleGeometry args={[0.11, 24]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive="#10b981"
                    emissiveIntensity={2.5}
                    toneMapped={false}
                  />
                </mesh>
                {/* Soft Green Trackside Glow */}
                <pointLight position={[0, 4.2, 0.6]} intensity={1.5} distance={8} color="#10b981" />
              </group>

              {/* Concrete Indian Railways Milestone Kilometer Post */}
              <group position={[baseX + 20, -2.2, 2.6]}>
                <mesh position={[0, 0.45, 0]} castShadow>
                  <cylinderGeometry args={[0.15, 0.15, 0.12, 16]} />
                  <meshStandardMaterial color="#eab308" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.3, 0.5, 0.2]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.7} />
                </mesh>
              </group>

              {/* Foreground Trackside Trees & Neem Bushes */}
              <group position={[baseX + 32, -2.4, 5.8]}>
                <mesh position={[0, 1.8, 0]} castShadow>
                  <cylinderGeometry args={[0.2, 0.32, 3.6, 12]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
                <mesh position={[0, 4.2, 0]} castShadow>
                  <dodecahedronGeometry args={[2.2, 1]} />
                  <meshStandardMaterial color="#15803d" roughness={0.8} />
                </mesh>
                <mesh position={[0.6, 5.0, 0.3]} castShadow>
                  <dodecahedronGeometry args={[1.6, 1]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.8} />
                </mesh>
              </group>

              {/* Background Trees (Lined along far railway fence) */}
              <group position={[baseX + 6, -2.4, -9.5]}>
                <mesh position={[0, 2.2, 0]}>
                  <cylinderGeometry args={[0.25, 0.4, 4.4, 12]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
                <mesh position={[0, 5.2, 0]}>
                  <dodecahedronGeometry args={[2.8, 1]} />
                  <meshStandardMaterial color="#14532d" roughness={0.8} />
                </mesh>
              </group>

              <group position={[baseX + 38, -2.4, -11.0]}>
                <mesh position={[0, 2.5, 0]}>
                  <cylinderGeometry args={[0.28, 0.45, 5.0, 12]} />
                  <meshStandardMaterial color="#78350f" roughness={0.9} />
                </mesh>
                <mesh position={[0, 5.8, 0]}>
                  <dodecahedronGeometry args={[3.2, 1]} />
                  <meshStandardMaterial color="#15803d" roughness={0.8} />
                </mesh>
              </group>

              {/* Trackside Ballast Bush */}
              <mesh position={[baseX + 24, -2.2, 2.8]}>
                <sphereGeometry args={[0.6, 12, 12]} />
                <meshStandardMaterial color="#65a30d" roughness={0.9} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ======================================================== */}
      {/* 7. DISTANT PARALLAX ROLLING HILLS HORIZON                */}
      {/* ======================================================== */}
      <group ref={hillsGroupRef} position={[0, -2.5, -95]}>
        {Array.from({ length: 14 }, (_, hillIdx) => {
          const hx = -240 + hillIdx * 60;
          const radius = hillIdx % 2 === 0 ? 50 : 38;
          return (
            <mesh key={`hill-${hillIdx}`} position={[hx, 8, 0]} scale={[1.8, 0.45, 0.8]}>
              <sphereGeometry args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
              <meshStandardMaterial color="#162e19" roughness={1.0} />
            </mesh>
          );
        })}
      </group>

      {/* ======================================================== */}
      {/* 8. LOCOMOTIVE (WAP-7 High-Horsepower Electric Engine)    */}
      {/* ======================================================== */}
      <Locomotive
        position={[LOCOMOTIVE_LENGTH_METERS / 2, 0, 0]}
        direction="forward"
        isMoving={isMoving}
        speedKmph={speedKmph}
      />

      {/* ======================================================== */}
      {/* 9. LHB COACHES WITH FIAT BOGIES & ROTATING WHEELS        */}
      {/* ======================================================== */}
      {coachPositions.map((cp, i) => {
        const coach = coaches[i];
        return (
          <group key={coach.coachId}>
            <CoachExterior
              coachId={coach.coachId}
              coachType={coach.coachType}
              category={cp.category}
              position={[cp.x, 0, 0]}
              isSelected={selectedCoachId === coach.coachId}
              isHighlighted={
                highlightedCoachId === coach.coachId ||
                distanceFrom === coach.coachId ||
                distanceTo === coach.coachId
              }
              isMoving={isMoving}
              speedKmph={speedKmph}
              onClick={() => onCoachClick(coach.coachId)}
            />

            {/* Floating 3D HUD Callout when Exploded */}
            {isExploded && (
              <group position={[cp.x, 4.2, 0]}>
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[4.2, 1.8]} />
                  <meshBasicMaterial color="#020617" transparent opacity={0.92} />
                </mesh>
                <mesh position={[0, 0, -0.01]}>
                  <planeGeometry args={[4.28, 1.88]} />
                  <meshBasicMaterial color="#3b82f6" />
                </mesh>
                <Text position={[0, 0.52, 0.02]} fontSize={0.38} color="#facc15" anchorX="center" anchorY="middle" fontWeight="bold">
                  Coach {coach.coachId}
                </Text>
                <Text position={[0, 0.12, 0.02]} fontSize={0.24} color="#38bdf8" anchorX="center" anchorY="middle" fontWeight="bold">
                  {cp.category} · {coach.coachType}
                </Text>
                <Text position={[0, -0.25, 0.02]} fontSize={0.18} color="#4ade80" anchorX="center" anchorY="middle" fontWeight="bold">
                  {speedKmph} km/h · {effectiveAtStation ? (stationName || 'At Station') : `To ${nextStationName || 'Next'} (${distanceToNextKm || 10} km)`}
                </Text>
                <Text position={[0, -0.6, 0.02]} fontSize={0.14} color="#94a3b8" anchorX="center" anchorY="middle">
                  Position #{coach.position} · LHB RDSO
                </Text>
              </group>
            )}
          </group>
        );
      })}

      {/* ======================================================== */}
      {/* 10. COUPLING GAPS & PHYSICAL DISTANCE BETWEEN COACHES    */}
      {/* ======================================================== */}
      {coachPositions.map((cp, i) => {
        let gapCenterX: number;
        let prevLabel: string;
        let nextLabel: string;

        if (i === 0) {
          const firstCoachLeft = coachPositions[0].x - LHB_COACH_LENGTH_METERS / 2;
          gapCenterX = (LOCOMOTIVE_LENGTH_METERS + firstCoachLeft) / 2;
          prevLabel = 'LOCO';
          nextLabel = cp.coachId;
        } else {
          const prevCoachRight = coachPositions[i - 1].x + LHB_COACH_LENGTH_METERS / 2;
          const currCoachLeft = cp.x - LHB_COACH_LENGTH_METERS / 2;
          gapCenterX = (prevCoachRight + currCoachLeft) / 2;
          prevLabel = coachPositions[i - 1].coachId;
          nextLabel = cp.coachId;
        }

        return (
          <group key={`gap-${i}`} position={[gapCenterX, 0, 0]}>
            {/* Centre Buffer Coupler (CBC) Tightlock Knuckle & Drawgear */}
            <mesh position={[0, -0.9, 0]} castShadow>
              <boxGeometry args={[isExploded ? 2.5 : COUPLING_GAP_METERS + 0.1, 0.35, 0.45]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
            </mesh>

            {/* Flexible Corrugated Rubber Gangway Vestibule (hidden in exploded view for clear gap) */}
            {!isExploded && (
              <>
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[COUPLING_GAP_METERS, 2.3, 1.25]} />
                  <meshStandardMaterial color="#020617" roughness={0.8} metalness={0.1} />
                </mesh>

                {/* Vestibule Corrugation Folds */}
                {[-0.15, 0, 0.15].map((foldX, fi) => (
                  <mesh key={fi} position={[foldX, 0.1, 0]}>
                    <boxGeometry args={[0.04, 2.36, 1.32]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.3} />
                  </mesh>
                ))}
              </>
            )}

            {/* Inter-coach Air Brake Hoses & Feed Pipe */}
            {[-0.25, 0.25].map((hz, hi) => (
              <mesh key={`hose-${hi}`} position={[0, -1.05, hz]} rotation={[0, 0, Math.PI / 4]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#020617" roughness={0.9} />
              </mesh>
            ))}

            {/* 3D Visual Metric Dimension Label above Coupler */}
            {(showCouplerGaps || isExploded) && (
              <group position={[0, isExploded ? 3.0 : 2.2, 0]}>
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[isExploded ? 2.2 : 1.3, 0.48]} />
                  <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
                </mesh>
                <Text
                  position={[0, 0.06, 0.02]}
                  fontSize={isExploded ? 0.2 : 0.14}
                  color={isExploded ? '#f59e0b' : '#38bdf8'}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  {isExploded ? '8.50 m (Exploded)' : '0.60 m'}
                </Text>
                <Text
                  position={[0, -0.12, 0.02]}
                  fontSize={0.09}
                  color="#94a3b8"
                  anchorX="center"
                  anchorY="middle"
                >
                  {isExploded ? `${prevLabel} ➔ ${nextLabel}` : 'CBC Gap'}
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
