'use client';

import { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { CoachCategory } from '@/data/coach-database';
import { getCoachColor } from '@/data/coach-database';

interface CoachExteriorProps {
  coachId: string;
  coachType: string;
  category: CoachCategory;
  position: [number, number, number];
  isSelected: boolean;
  isHighlighted: boolean;
  isMoving?: boolean;
  speedKmph?: number;
  onClick: () => void;
}

export default function CoachExterior({
  coachId,
  coachType,
  category,
  position,
  isSelected,
  isHighlighted,
  isMoving = false,
  speedKmph = 88,
  onClick,
}: CoachExteriorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const [hovered, setHovered] = useState(false);
  const wheelAngle = useRef(0);

  // RDSO standard LHB coach dimensions (in meters)
  const coachLength = 23.54;
  const coachWidth = 3.245;
  const coachHeight = 2.8;
  const roofHeight = 0.55;
  const underframeHeight = 0.45;
  const wheelRadius = 0.4575; // 915 mm standard new diameter
  const wheelFlangeRadius = 0.485;
  const color = getCoachColor(category);
  const isAC = ['3A', '2A', '1A', '3E', 'CC', 'EC'].includes(category);

  // Animate dynamic wheels rotation and suspension bounce
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isMoving) {
      // Angular velocity omega = v / r (v in m/s)
      const speedMs = (speedKmph * 1000) / 3600;
      wheelAngle.current -= (speedMs / wheelRadius) * delta;

      // Rotate all wheel groups
      wheelsRef.current.forEach((w) => {
        if (w) w.rotation.z = wheelAngle.current;
      });

      // High-speed track micro-vibration and FIAT bogie suspension sway
      const trackVibration = Math.sin(Date.now() * 0.02 + position[0] * 0.1) * 0.02;
      const coachSway = Math.sin(Date.now() * 0.008 + position[0] * 0.08) * 0.005;
      groupRef.current.position.y = position[1] + trackVibration;
      groupRef.current.rotation.z = coachSway;
    } else {
      // Resting position or gentle selection float
      groupRef.current.position.y = isSelected
        ? position[1] + Math.sin(Date.now() * 0.003) * 0.03
        : position[1];
      groupRef.current.rotation.z = 0;
    }
  });

  // Calculate window cutouts
  const windowPositions = useMemo(() => {
    const positions: number[] = [];
    const count = category === 'EOG' || category === 'LOCO' ? 4 : category === 'PC' ? 6 : 14;
    const spacing = (coachLength - 4.5) / count;
    for (let i = 0; i < count; i++) {
      positions.push(-coachLength / 2 + 2.25 + i * spacing + spacing / 2);
    }
    return positions;
  }, [category, coachLength]);

  // FIAT bogie centers: spaced 14.9m apart (RDSO specification)
  // Wheelbase per bogie: 2.56m (axles at -1.28m and +1.28m from bogie center)
  const bogieCenters = [-7.45, 7.45];
  const axleOffsets = [-1.28, 1.28];

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Main LHB Coach Shell */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[coachLength, coachHeight, coachWidth]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#fbbf24' : isHighlighted ? '#60a5fa' : hovered ? '#94a3b8' : '#000000'}
          emissiveIntensity={isSelected ? 0.35 : isHighlighted ? 0.2 : hovered ? 0.12 : 0}
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>

      {/* 2. Stainless Steel Aerodynamic Ribbed Roof */}
      <mesh position={[0, coachHeight / 2 + roofHeight / 2, 0]} castShadow>
        <boxGeometry args={[coachLength - 0.15, roofHeight, coachWidth - 0.25]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Roof AC Package Units (RMPU) for Air-Conditioned coaches */}
      {isAC && (
        <>
          {[-5, 5].map((rx, idx) => (
            <group key={`rmpu-${idx}`} position={[rx, coachHeight / 2 + roofHeight + 0.15, 0]}>
              <mesh castShadow>
                <boxGeometry args={[3.2, 0.3, coachWidth - 0.8]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.7} />
              </mesh>
              {/* AC Fan intake grilles */}
              {[-0.8, 0.8].map((fx, fi) => (
                <mesh key={fi} position={[fx, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.35, 0.35, 0.05, 16]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
                </mesh>
              ))}
            </group>
          ))}
        </>
      )}

      {/* 3. Underframe Chassis & Equipment */}
      <mesh position={[0, -coachHeight / 2 - underframeHeight / 2, 0]}>
        <boxGeometry args={[coachLength - 0.8, underframeHeight, coachWidth - 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.6} />
      </mesh>

      {/* Bio-Toilet Vacuum Retention Tanks (2 pairs under ends) */}
      {[-8.5, 8.5].map((tx, idx) => (
        <group key={`bio-tank-${idx}`} position={[tx, -coachHeight / 2 - underframeHeight - 0.15, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 2.2, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Auxiliary Air Brake Reservoirs (Center Underframe) */}
      {[-1.5, 1.5].map((rx, idx) => (
        <mesh key={`reservoir-${idx}`} position={[rx, -coachHeight / 2 - underframeHeight - 0.15, 0.7]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.8, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Battery Box & Power Inverter (Center Underframe other side) */}
      <mesh position={[0, -coachHeight / 2 - underframeHeight - 0.18, -0.6]}>
        <boxGeometry args={[2.8, 0.45, 0.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.5} />
      </mesh>

      {/* 4. Windows (Sealed tinted glass with frames) */}
      {windowPositions.map((wx, i) => (
        <group key={`win-${i}`}>
          {/* Corridor side */}
          <mesh position={[wx, 0.25, coachWidth / 2 + 0.015]}>
            <planeGeometry args={[0.95, 0.72]} />
            <meshStandardMaterial
              color={isAC ? '#0369a1' : '#ca8a04'}
              emissive={isAC ? '#38bdf8' : '#fef08a'}
              emissiveIntensity={0.65}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>
          {/* Cabin side */}
          <mesh position={[wx, 0.25, -coachWidth / 2 - 0.015]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.95, 0.72]} />
            <meshStandardMaterial
              color={isAC ? '#0369a1' : '#ca8a04'}
              emissive={isAC ? '#38bdf8' : '#fef08a'}
              emissiveIntensity={0.65}
              roughness={0.1}
              metalness={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* 5. Passenger Doors (2 on each side with windows & handles) */}
      {[-coachLength / 2 + 1.2, coachLength / 2 - 1.2].map((dx, i) => (
        <group key={`door-${i}`}>
          <mesh position={[dx, -0.25, coachWidth / 2 + 0.02]}>
            <planeGeometry args={[0.95, 1.95]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh position={[dx, -0.25, -coachWidth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.95, 1.95]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 6. FIAT Bogies with Realistic Spinning Wheelsets & Axles */}
      {bogieCenters.map((bx, bIdx) => (
        <group key={`fiat-bogie-${bIdx}`} position={[bx, -coachHeight / 2 - underframeHeight - 0.25, 0]}>
          {/* Heavy Cast Steel Bogie Frame */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[3.2, 0.25, coachWidth - 0.7]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.6} />
          </mesh>

          {/* Secondary Air Suspension Bellows (Center Bolster) */}
          {[-0.9, 0.9].map((sz, si) => (
            <mesh key={`air-spring-${si}`} position={[0, 0.35, sz]}>
              <cylinderGeometry args={[0.28, 0.3, 0.25, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
          ))}

          {/* 2 Wheelset Axles per Bogie (2,560mm FIAT Wheelbase) */}
          {axleOffsets.map((ax, aIdx) => {
            const wheelIndex = bIdx * 2 + aIdx;
            return (
              <group key={`axle-${aIdx}`} position={[ax, -0.15, 0]}>
                {/* Rotating Wheelset Group (Driven by useFrame delta) */}
                <group
                  ref={(el) => {
                    if (el) wheelsRef.current[wheelIndex] = el;
                  }}
                >
                  {/* Solid Steel Axle */}
                  <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.08, 0.08, coachWidth - 0.9, 16]} />
                    <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
                  </mesh>

                  {/* Axle Disc Brakes (2 Per Axle - Standard FIAT Disc Brakes) */}
                  {[-0.45, 0.45].map((dz, di) => (
                    <mesh key={`disc-${di}`} position={[0, 0, dz]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.32, 0.32, 0.06, 24]} />
                      <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                    </mesh>
                  ))}

                  {/* Left Rail Wheel (Tread + Rim Flange + Hub) */}
                  <group position={[0, 0, coachWidth / 2 - 0.58]}>
                    {/* Wheel Rim Flange (Inner Rail Contact) */}
                    <mesh position={[0, 0, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelFlangeRadius, wheelFlangeRadius, 0.03, 24]} />
                      <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
                    </mesh>
                    {/* Wheel Tread */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelRadius, wheelRadius, 0.12, 24]} />
                      <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
                    </mesh>
                    {/* High-Contrast White Radial Inspection Marks (Indian Railways Safety Slips) */}
                    {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, ai) => (
                      <mesh
                        key={`rad-l-${ai}`}
                        position={[
                          Math.cos(angle) * (wheelRadius * 0.62),
                          Math.sin(angle) * (wheelRadius * 0.62),
                          0.065,
                        ]}
                        rotation={[0, 0, angle]}
                      >
                        <boxGeometry args={[wheelRadius * 0.45, 0.03, 0.015]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} roughness={0.1} />
                      </mesh>
                    ))}
                    {/* Ventilated Brake Disc Slots */}
                    {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((holeAngle, hi) => (
                      <mesh
                        key={`hole-l-${hi}`}
                        position={[
                          Math.cos(holeAngle) * (wheelRadius * 0.4),
                          Math.sin(holeAngle) * (wheelRadius * 0.4),
                          0.066,
                        ]}
                      >
                        <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
                        <meshStandardMaterial color="#020617" roughness={0.9} />
                      </mesh>
                    ))}
                    {/* Wheel Hub */}
                    <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
                      <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
                    </mesh>
                    {/* Hex Center Hub Bolt */}
                    <mesh position={[0, 0, 0.095]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.065, 0.065, 0.02, 6]} />
                      <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                    </mesh>
                  </group>

                  {/* Right Rail Wheel (Tread + Rim Flange + Hub) */}
                  <group position={[0, 0, -coachWidth / 2 + 0.58]}>
                    {/* Wheel Rim Flange (Inner Rail Contact) */}
                    <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelFlangeRadius, wheelFlangeRadius, 0.03, 24]} />
                      <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.25} />
                    </mesh>
                    {/* Wheel Tread */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelRadius, wheelRadius, 0.12, 24]} />
                      <meshStandardMaterial color="#64748b" metalness={0.95} roughness={0.15} />
                    </mesh>
                    {/* High-Contrast White Radial Inspection Marks (Indian Railways Safety Slips) */}
                    {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, ai) => (
                      <mesh
                        key={`rad-r-${ai}`}
                        position={[
                          Math.cos(angle) * (wheelRadius * 0.62),
                          Math.sin(angle) * (wheelRadius * 0.62),
                          -0.065,
                        ]}
                        rotation={[0, 0, angle]}
                      >
                        <boxGeometry args={[wheelRadius * 0.45, 0.03, 0.015]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} roughness={0.1} />
                      </mesh>
                    ))}
                    {/* Ventilated Brake Disc Slots */}
                    {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((holeAngle, hi) => (
                      <mesh
                        key={`hole-r-${hi}`}
                        position={[
                          Math.cos(holeAngle) * (wheelRadius * 0.4),
                          Math.sin(holeAngle) * (wheelRadius * 0.4),
                          -0.066,
                        ]}
                      >
                        <cylinderGeometry args={[0.035, 0.035, 0.02, 10]} />
                        <meshStandardMaterial color="#020617" roughness={0.9} />
                      </mesh>
                    ))}
                    {/* Wheel Hub */}
                    <mesh position={[0, 0, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
                      <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
                    </mesh>
                    {/* Hex Center Hub Bolt */}
                    <mesh position={[0, 0, -0.095]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.065, 0.065, 0.02, 6]} />
                      <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                    </mesh>
                  </group>
                </group>

                {/* Static Axle Box Journal Housings with Primary Coil Springs */}
                {[-coachWidth / 2 + 0.45, coachWidth / 2 - 0.45].map((jz, ji) => (
                  <group key={`journal-${ji}`} position={[0, 0, jz]}>
                    {/* Axle Box Bearing */}
                    <mesh>
                      <boxGeometry args={[0.35, 0.28, 0.25]} />
                      <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.6} />
                    </mesh>
                    {/* Primary Coil Spring */}
                    <mesh position={[0, 0.22, 0]}>
                      <cylinderGeometry args={[0.12, 0.12, 0.24, 12]} />
                      <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
                    </mesh>
                  </group>
                ))}
              </group>
            );
          })}
        </group>
      ))}

      {/* 7. Coach Labels & Livery Bands */}
      <Text
        position={[0, coachHeight / 2 + roofHeight + 0.5, 0]}
        fontSize={0.85}
        color={isSelected ? '#fbbf24' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {coachId}
      </Text>

      {/* Coach class abbreviation on body */}
      <Text
        position={[0, 0.85, coachWidth / 2 + 0.05]}
        fontSize={0.42}
        color="#f8fafc"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {coachType}
      </Text>

      {/* Iconic Indian Railways White/Cream Stripe */}
      <mesh position={[0, -0.5, coachWidth / 2 + 0.025]}>
        <planeGeometry args={[coachLength - 0.2, 0.18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.5, -coachWidth / 2 - 0.025]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[coachLength - 0.2, 0.18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* 8. Selection Aura Ring */}
      {isSelected && (
        <mesh position={[0, -coachHeight / 2 - underframeHeight - 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[coachLength / 2 - 0.5, coachLength / 2 + 0.2, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
