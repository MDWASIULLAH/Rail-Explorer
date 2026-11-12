'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { BerthDimensions, BerthPosition, BerthType } from '@/data/coach-database';

const BERTH_COLORS: Record<BerthType, string> = {
  LB: '#168a68',
  // Keep central middle berths visually distinct from the side berths.
  MB: '#3478b9',
  UB: '#7957a8',
  // Side lower is a real lower berth, not a third middle berth.
  SL: '#087f8c',
  SU: '#b56a36',
  SEAT: '#0f766e',
  CABIN_LB: '#22c55e',
  CABIN_UB: '#f97316',
  COUPE_LB: '#10b981',
  COUPE_UB: '#ef4444',
};

interface BerthMeshProps {
  berth: BerthPosition;
  isSelected: boolean;
  isHighlighted: boolean;
  dimensions?: BerthDimensions;
  isGeneralSeat?: boolean;
  onClick: (berthNumber: number) => void;
}

export default function BerthMesh({ berth, isSelected, isHighlighted, onClick, dimensions, isGeneralSeat = false }: BerthMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const baseColor = BERTH_COLORS[berth.berthType] || '#666666';

  const berthWidth = Math.max(0.4, (dimensions?.width || 600) / 1000);
  const berthLength = Math.max(0.4, (dimensions?.length || 1800) / 1000);
  const berthHeight = 0.08;
  const isSeat = berth.berthType === 'SEAT';

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (isSelected) {
      mat.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
    } else if (hovered || isHighlighted) {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.3, delta * 5);
    } else {
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0, delta * 5);
    }
  });

  return (
    <group position={[berth.x, berth.y, berth.z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(berth.berthNumber); }}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[isGeneralSeat ? Math.min(berthLength, 0.28) : berthLength, isGeneralSeat ? 0.08 : berthHeight, berthWidth]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      {/* Pillow/cushion accent */}
      {!isSeat && (
        <mesh position={[berthLength * 0.38, berthHeight * 0.8, 0]}>
          <boxGeometry args={[0.3, 0.06, berthWidth * 0.8]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
      )}
      {/* Berth number label */}
      <Billboard position={[0, (isGeneralSeat ? 0.12 : berthHeight) + 0.1, 0]}>
        <Text
          fontSize={isGeneralSeat ? 0.08 : 0.12}
          color={isSelected ? '#fbbf24' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
          fontWeight={isSelected ? 'bold' : 'normal'}
        >
          {berth.berthNumber.toString()}
        </Text>
      </Billboard>
      {(berth.berthType === 'SL' || berth.berthType === 'SU') && (
        <Billboard position={[0, (isGeneralSeat ? 0.12 : berthHeight) + 0.24, 0]}>
          <Text
            fontSize={0.075}
            color="#e2e8f0"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
          >
            {berth.berthType}
          </Text>
        </Billboard>
      )}
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[berthLength * 0.55, berthLength * 0.6, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
