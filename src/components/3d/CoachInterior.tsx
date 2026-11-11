'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import BerthMesh from './BerthMesh';
import type { CoachBlueprint } from '@/data/coach-database';

interface CoachInteriorProps {
  blueprint: CoachBlueprint;
  selectedBerth: number | null;
  highlightedBerths?: number[];
  onBerthClick: (berthNumber: number) => void;
}

function GeneratorCarInterior({ blueprint }: { blueprint: CoachBlueprint }) {
  const length = blueprint.dimensions.lengthOverBody / 1000;
  const width = blueprint.dimensions.interiorWidth / 1000;
  const fanRefs = useRef<Array<THREE.Group | null>>([]);
  const indicatorRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_, delta) => {
    fanRefs.current.forEach((fan) => {
      if (fan) fan.rotation.z += delta * 4;
    });
    if (indicatorRef.current) {
      indicatorRef.current.emissiveIntensity = 0.4 + (Math.sin(Date.now() / 450) + 1) * 0.45;
    }
  });

  return (
    <group>
      <mesh position={[length / 2, -0.02, 0]} receiveShadow>
        <boxGeometry args={[length, 0.04, width]} />
        <meshStandardMaterial color="#374151" roughness={0.85} />
      </mesh>
      <mesh position={[length / 2, 2.75, 0]}>
        <boxGeometry args={[length, 0.06, width]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`wall-${side}`} position={[length / 2, 1.35, side * (width / 2)]}>
          <boxGeometry args={[length, 2.7, 0.06]} />
          <meshStandardMaterial color="#475569" roughness={0.75} />
        </mesh>
      ))}
      {[length * 0.3, length * 0.68].map((x, index) => (
        <group key={`genset-${index}`} position={[x, 0, index === 0 ? -0.65 : 0.65]}>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[7.2, 0.35, 2.15]} />
            <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.02, 0]} castShadow>
            <boxGeometry args={[6.5, 1.45, 1.8]} />
            <meshStandardMaterial color={index === 0 ? '#475569' : '#52525b'} metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.02, 0.93]}>
            <boxGeometry args={[5.6, 1.05, 0.08]} />
            <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[-2.35, 1.05, 1.0]}>
            <cylinderGeometry args={[0.34, 0.34, 0.16, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.25} />
          </mesh>
          <group ref={(node) => { fanRefs.current[index] = node; }} position={[2.15, 1.05, 1.03]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.035, 8, 24]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
            {[0, 1, 2, 3].map((blade) => (
              <mesh key={blade} rotation={[0, 0, (blade * Math.PI) / 2]} position={[0, 0.16, 0]}>
                <boxGeometry args={[0.12, 0.34, 0.045]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.6} />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.5} />
            </mesh>
          </group>
          <mesh position={[-2.3, 1.7, 0.95]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshStandardMaterial ref={index === 0 ? indicatorRef : undefined} color="#22c55e" emissive="#22c55e" emissiveIntensity={0.7} />
          </mesh>
          <Text position={[0, 1.95, 1.03]} fontSize={0.25} color="#f8fafc" anchorX="center" anchorY="middle">
            {`DIESEL GENERATOR ${index === 0 ? 'A' : 'B'}`}
          </Text>
        </group>
      ))}
      <Text position={[length / 2, 2.25, 0]} fontSize={0.42} color="#fbbf24" anchorX="center" anchorY="middle" fontWeight="bold">
        END-ON GENERATOR CAR · ILLUSTRATIVE MODEL
      </Text>
    </group>
  );
}

function PantryCarInterior({ blueprint }: { blueprint: CoachBlueprint }) {
  const length = blueprint.dimensions.lengthOverBody / 1000;
  const width = blueprint.dimensions.interiorWidth / 1000;
  const steamRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (steamRef.current) {
      steamRef.current.position.y = 1.35 + Math.sin(clock.elapsedTime * 2.2) * 0.12;
      steamRef.current.rotation.y = Math.sin(clock.elapsedTime) * 0.08;
    }
  });

  return (
    <group>
      <mesh position={[length / 2, -0.02, 0]}>
        <boxGeometry args={[length, 0.04, width]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`counter-${side}`} position={[length / 2, 0, side * 0.95]}>
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[length - 3, 0.95, 0.85]} />
            <meshStandardMaterial color="#7c4a2d" roughness={0.55} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[length - 2.8, 0.12, 0.95]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.3} />
          </mesh>
          {[-1, 1].map((cabinet) => (
            <mesh key={cabinet} position={[cabinet * (length / 4), 0.45, 0.44]}>
              <boxGeometry args={[0.035, 0.68, 0.025]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[length * 0.38, 1.07, -0.92]}>
        <cylinderGeometry args={[0.34, 0.34, 0.18, 24]} />
        <meshStandardMaterial color="#1f2937" metalness={0.5} roughness={0.35} emissive="#f97316" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[length * 0.38, 1.23, -0.92]}>
        <cylinderGeometry args={[0.22, 0.25, 0.3, 20]} />
        <meshStandardMaterial color="#d1d5db" metalness={0.75} roughness={0.25} />
      </mesh>
      <group ref={steamRef} position={[length * 0.38, 1.35, -0.92]}>
        {[0, 1, 2].map((puff) => (
          <mesh key={puff} position={[(puff - 1) * 0.1, puff * 0.13, 0]}>
            <sphereGeometry args={[0.07 + puff * 0.018, 10, 10]} />
            <meshBasicMaterial color="#e2e8f0" transparent opacity={0.4 - puff * 0.08} />
          </mesh>
        ))}
      </group>
      <Text position={[length / 2, 2.35, 0]} fontSize={0.4} color="#fbbf24" anchorX="center" anchorY="middle" fontWeight="bold">
        PANTRY KITCHEN · ILLUSTRATIVE COOKING ANIMATION
      </Text>
    </group>
  );
}

function FirstAcPartitions({ blueprint, coachW }: { blueprint: CoachBlueprint; coachW: number }) {
  const bays = Array.from(new Set(blueprint.berths.map((berth) => berth.bayNumber)))
    .sort((a, b) => a - b)
    .map((bayNumber) => {
      const bayBerths = blueprint.berths.filter((berth) => berth.bayNumber === bayNumber);
      return Math.min(...bayBerths.map((berth) => berth.x));
    });
  const boundaries = bays.slice(0, -1).map((x, index) => (x + bays[index + 1]) / 2);
  const doorGap = 0.78;
  const panelWidth = (coachW - doorGap) / 2;
  const panelOffset = doorGap / 2 + panelWidth / 2;
  return (
    <group>
      {boundaries.map((x, index) => (
        <group key={`first-ac-partition-${index}`}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[x, 1.18, side * panelOffset]}>
              <boxGeometry args={[0.06, 2.36, panelWidth]} />
              <meshStandardMaterial color="#d8e1ec" roughness={0.72} />
            </mesh>
          ))}
          <mesh position={[x, 2.38, 0]}>
            <boxGeometry args={[0.06, 0.08, doorGap]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[x, 1.18, -doorGap / 2]}>
            <boxGeometry args={[0.08, 2.36, 0.06]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.5} />
          </mesh>
          <mesh position={[x, 1.18, doorGap / 2]}>
            <boxGeometry args={[0.08, 2.36, 0.06]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.45} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function CoachInterior({
  blueprint,
  selectedBerth,
  highlightedBerths = [],
  onBerthClick,
}: CoachInteriorProps) {
  if (blueprint.category === 'EOG') return <GeneratorCarInterior blueprint={blueprint} />;
  if (blueprint.category === 'PC') return <PantryCarInterior blueprint={blueprint} />;

  const coachLen = blueprint.dimensions.lengthOverBody / 1000;
  const coachW = blueprint.dimensions.interiorWidth / 1000;
  const coachH = 2.8;
  const wallThickness = 0.05;
  const windowCount = Math.max(1, Math.min(blueprint.windows, 20));
  const windowWidth = 0.82;
  const windowHeight = 0.62;
  const windowY = 1.72;
  const isAirConditioned = ['3A', '3E', '2A', '1A'].includes(blueprint.category);
  const windowCenters = Array.from({ length: windowCount }, (_, i) =>
    0.65 + (i + 0.5) * (coachLen - 1.3) / windowCount,
  );

  // Build each side as solid panels around the window openings. A single
  // transparent wall plane made the whole coach look like frosted glass.
  const sideWall = (side: -1 | 1) => {
    const wallZ = side * (coachW / 2 + wallThickness / 2);
    const bottomY = windowY - windowHeight / 2;
    const topY = windowY + windowHeight / 2;
    return (
      <group key={`coach-wall-${side}`}>
        {windowCenters[0] - windowWidth / 2 > 0 && (
          <mesh position={[(windowCenters[0] - windowWidth / 2) / 2, windowY, wallZ]}>
            <boxGeometry args={[windowCenters[0] - windowWidth / 2, windowHeight, wallThickness]} />
            <meshStandardMaterial color="#d1d6db" roughness={0.78} />
          </mesh>
        )}
        {windowCenters.map((center, index) => {
          return (
            <group key={`window-${side}-${index}`}>
              <mesh position={[center, windowY, wallZ]}>
                <boxGeometry args={[windowWidth - 0.08, windowHeight - 0.08, wallThickness * 0.35]} />
                <meshStandardMaterial color="#52677a" roughness={0.32} metalness={0.12} transparent opacity={0.78} />
              </mesh>
              {[-1, 1].map((horizontal) => (
                <mesh key={`frame-${horizontal}`} position={[center + horizontal * (windowWidth / 2 - 0.025), windowY, wallZ + side * 0.018]}>
                  <boxGeometry args={[0.045, windowHeight + 0.08, 0.04]} />
                  <meshStandardMaterial color="#9aa8b5" roughness={0.42} metalness={0.5} />
                </mesh>
              ))}
              {[-1, 1].map((vertical) => (
                <mesh key={`rail-${vertical}`} position={[center, windowY + vertical * (windowHeight / 2 - 0.025), wallZ + side * 0.018]}>
                  <boxGeometry args={[windowWidth, 0.045, 0.04]} />
                  <meshStandardMaterial color="#9aa8b5" roughness={0.42} metalness={0.5} />
                </mesh>
              ))}
              <mesh position={[center, windowY - windowHeight / 2 - 0.09, wallZ - side * 0.035]}>
                <boxGeometry args={[windowWidth + 0.12, 0.12, 0.14]} />
                <meshStandardMaterial color="#d1d5db" roughness={0.56} />
              </mesh>
              <mesh position={[center, windowY, wallZ + side * 0.028]}>
                <boxGeometry args={[0.025, windowHeight - 0.1, 0.035]} />
                <meshStandardMaterial color="#8b98a5" roughness={0.48} metalness={0.45} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[coachLen / 2, bottomY / 2, wallZ]}>
          <boxGeometry args={[coachLen, bottomY, wallThickness]} />
          <meshStandardMaterial color="#c7cdd2" roughness={0.78} />
        </mesh>
        <mesh position={[coachLen / 2, (topY + coachH) / 2, wallZ]}>
          <boxGeometry args={[coachLen, coachH - topY, wallThickness]} />
          <meshStandardMaterial color="#d8dde1" roughness={0.78} />
        </mesh>
        {windowCenters.map((center, index) => {
          const pillarStart = center + windowWidth / 2;
          const pillarEnd = index === windowCenters.length - 1 ? coachLen : windowCenters[index + 1] - windowWidth / 2;
          if (pillarEnd <= pillarStart) return null;
          return (
            <mesh key={`pillar-${side}-${index}`} position={[(pillarStart + pillarEnd) / 2, windowY, wallZ]}>
              <boxGeometry args={[pillarEnd - pillarStart, windowHeight, wallThickness]} />
              <meshStandardMaterial color="#d1d6db" roughness={0.78} />
            </mesh>
          );
        })}
      </group>
    );
  };

  return (
    <group>
      {/* Floor */}
      <mesh position={[coachLen / 2, -0.02, 0]} receiveShadow>
        <boxGeometry args={[coachLen, 0.04, coachW]} />
        <meshStandardMaterial color="#64748b" roughness={0.8} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[coachLen / 2, coachH, 0]}>
        <boxGeometry args={[coachLen, 0.06, coachW]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {isAirConditioned ? (
        <group>
          <mesh position={[coachLen / 2, coachH - 0.13, 0]}>
            <boxGeometry args={[coachLen - 1.2, 0.14, 0.38]} />
            <meshStandardMaterial color="#b9c3cc" roughness={0.72} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={`ac-return-${side}`} position={[coachLen / 2, coachH - 0.22, side * 0.31]}>
              <boxGeometry args={[coachLen - 1.6, 0.035, 0.06]} />
              <meshStandardMaterial color="#8795a2" roughness={0.5} metalness={0.22} />
            </mesh>
          ))}
        </group>
      ) : (
        Array.from({ length: Math.max(3, Math.floor(coachLen / 4.2)) }, (_, fanIndex) => {
          const fanX = coachLen * (fanIndex + 1) / (Math.max(3, Math.floor(coachLen / 4.2)) + 1);
          return (
            <group key={`sleeper-fan-${fanIndex}`} position={[fanX, coachH - 0.18, 0]}>
              <mesh>
                <cylinderGeometry args={[0.07, 0.08, 0.08, 16]} />
                <meshStandardMaterial color="#87929b" roughness={0.42} metalness={0.48} />
              </mesh>
              {[0, 1, 2, 3].map((blade) => (
                <mesh key={blade} position={[Math.cos(blade * Math.PI / 2) * 0.27, -0.045, Math.sin(blade * Math.PI / 2) * 0.27]} rotation={[0, -blade * Math.PI / 2, 0]}>
                  <boxGeometry args={[0.14, 0.025, 0.52]} />
                  <meshStandardMaterial color="#8c969f" roughness={0.52} metalness={0.3} />
                </mesh>
              ))}
              <mesh>
                <sphereGeometry args={[0.07, 12, 12]} />
                <meshStandardMaterial color="#73808b" roughness={0.35} metalness={0.5} />
              </mesh>
            </group>
          );
        })
      )}

      {sideWall(-1)}
      {sideWall(1)}

      {/* End walls */}
      <mesh position={[0, coachH / 2, 0]}>
        <boxGeometry args={[wallThickness, coachH, coachW]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} transparent opacity={0.5} />
      </mesh>
      <mesh position={[coachLen, coachH / 2, 0]}>
        <boxGeometry args={[wallThickness, coachH, coachW]} />
        <meshStandardMaterial color="#aeb7c0" roughness={0.72} />
      </mesh>

      {/* Aisle floor (darker strip) */}
      <mesh position={[coachLen / 2, 0.001, 0]} receiveShadow>
        <boxGeometry args={[coachLen - 0.5, 0.002, 0.7]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {blueprint.category === '1A' && <FirstAcPartitions blueprint={blueprint} coachW={coachW} />}

      {/* Berths */}
      {blueprint.category === 'GS' && Array.from({ length: blueprint.totalBays }, (_, bayIndex) => {
        const bayNumber = bayIndex + 1;
        return (['LEFT', 'RIGHT'] as const).map((side) => {
          const seats = blueprint.berths.filter((berth) => berth.bayNumber === bayNumber && berth.side === side);
          if (!seats.length) return null;

          const minX = Math.min(...seats.map((seat) => seat.x));
          const maxX = Math.max(...seats.map((seat) => seat.x));
          const seatLength = (blueprint.berthDimensions.SEAT.length || 430) / 1000;
          const seatWidth = (blueprint.berthDimensions.SEAT.width || 400) / 1000;
          const benchLength = Math.max(seatLength, maxX - minX + seatLength);
          const centerX = (minX + maxX) / 2;
          const centerZ = seats.reduce((total, seat) => total + seat.z, 0) / seats.length;
          const wallDirection = centerZ > 0 ? 1 : -1;

          return (
            <group key={`general-bench-${bayNumber}-${side}`} position={[centerX, 0, centerZ]}>
              {/* One shared bench base and backrest per side of the aisle. */}
              <mesh position={[0, 0.35, 0]} receiveShadow>
                <boxGeometry args={[benchLength, 0.12, seatWidth]} />
                <meshStandardMaterial color="#334155" roughness={0.82} />
              </mesh>
              <mesh position={[0, 0.62, wallDirection * (seatWidth / 2 - 0.03)]}>
                <boxGeometry args={[benchLength, 0.42, 0.07]} />
                <meshStandardMaterial color="#475569" roughness={0.78} />
              </mesh>
            </group>
          );
        });
      })}

      {blueprint.berths.map((berth) => (
        <BerthMesh
          key={berth.berthNumber}
          berth={berth}
          isSelected={selectedBerth === berth.berthNumber}
          isHighlighted={highlightedBerths.includes(berth.berthNumber)}
          dimensions={blueprint.berthDimensions[berth.berthType]}
          isGeneralSeat={blueprint.category === 'GS'}
          onClick={onBerthClick}
        />
      ))}

      {/* Luggage racks (upper level bars along both sides) */}
      {blueprint.category !== 'CC' && blueprint.category !== 'GS' && (
        <>
          <mesh position={[coachLen / 2, coachH - 0.3, coachW / 2 - 0.3]}>
            <boxGeometry args={[coachLen - 4, 0.04, 0.5]} />
            <meshStandardMaterial color="#78716c" roughness={0.4} metalness={0.6} />
          </mesh>
          <mesh position={[coachLen / 2, coachH - 0.3, -coachW / 2 + 0.3]}>
            <boxGeometry args={[coachLen - 4, 0.04, 0.5]} />
            <meshStandardMaterial color="#78716c" roughness={0.4} metalness={0.6} />
          </mesh>
        </>
      )}

      {/* Interior lighting (emissive strips on ceiling) */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`light-${i}`} position={[coachLen * (i + 1) / 5, coachH - 0.05, 0]}>
          <boxGeometry args={[2, 0.02, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} />
        </mesh>
      ))}

      {/* Coach label */}
      <Text
        position={[coachLen / 2, coachH + 0.3, 0]}
        fontSize={0.18}
        color="#c4d0d8"
        anchorX="center"
        anchorY="middle"
        fontWeight="medium"
      >
        {blueprint.name} — {blueprint.totalBerths} Berths
      </Text>
    </group>
  );
}

