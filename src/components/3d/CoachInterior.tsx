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

      {/* Left wall */}
      <mesh position={[coachLen / 2, coachH / 2, coachW / 2 + wallThickness / 2]}>
        <boxGeometry args={[coachLen, coachH, wallThickness]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Right wall */}
      <mesh position={[coachLen / 2, coachH / 2, -coachW / 2 - wallThickness / 2]}>
        <boxGeometry args={[coachLen, coachH, wallThickness]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* End walls */}
      <mesh position={[0, coachH / 2, 0]}>
        <boxGeometry args={[wallThickness, coachH, coachW]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} transparent opacity={0.5} />
      </mesh>
      <mesh position={[coachLen, coachH / 2, 0]}>
        <boxGeometry args={[wallThickness, coachH, coachW]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.6} transparent opacity={0.5} />
      </mesh>

      {/* Aisle floor (darker strip) */}
      <mesh position={[coachLen / 2, 0.001, 0]} receiveShadow>
        <boxGeometry args={[coachLen - 0.5, 0.002, 0.7]} />
        <meshStandardMaterial color="#475569" roughness={0.9} />
      </mesh>

      {/* Bay dividers */}
      {Array.from({ length: blueprint.totalBays + 1 }, (_, i) => {
        const x = 2.0 + i * (coachLen - 4) / blueprint.totalBays;
        return (
          <group key={`divider-${i}`}>
            {/* Left side partition */}
            <mesh position={[x, coachH * 0.4, coachW / 4]}>
              <boxGeometry args={[0.03, coachH * 0.8, coachW / 2 - 0.4]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} transparent opacity={0.3} />
            </mesh>
            {/* Right side partition */}
            <mesh position={[x, coachH * 0.4, -coachW / 4]}>
              <boxGeometry args={[0.03, coachH * 0.8, coachW / 2 - 0.4]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} transparent opacity={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Windows (light panels on walls) */}
      {Array.from({ length: Math.min(blueprint.windows, 20) }, (_, i) => {
        const wx = 2.5 + i * (coachLen - 5) / Math.min(blueprint.windows, 20);
        return (
          <group key={`window-${i}`}>
            <mesh position={[wx, coachH * 0.55, coachW / 2 + 0.01]}>
              <planeGeometry args={[0.8, 0.6]} />
              <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.3} transparent opacity={0.5} />
            </mesh>
            <mesh position={[wx, coachH * 0.55, -coachW / 2 - 0.01]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.8, 0.6]} />
              <meshStandardMaterial color="#87ceeb" emissive="#87ceeb" emissiveIntensity={0.3} transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}

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
        position={[coachLen / 2, coachH + 0.5, 0]}
        fontSize={0.5}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {blueprint.name} — {blueprint.totalBerths} Berths
      </Text>
    </group>
  );
}

