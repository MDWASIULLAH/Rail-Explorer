'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

interface LocomotiveProps {
  position: [number, number, number];
  direction?: 'forward' | 'backward';
  isMoving?: boolean;
  speedKmph?: number;
}

export default function Locomotive({
  position,
  direction = 'forward',
  isMoving = false,
  speedKmph = 88,
}: LocomotiveProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelsRef = useRef<THREE.Group[]>([]);
  const wheelAngle = useRef(0);

  // WAP-7 standard dimensions (in meters)
  const locoLength = 20.5;
  const bodyWidth = 3.1;
  const bodyHeight = 3.0;
  const noseLength = 3.5;
  const wheelRadius = 0.546; // 1,092 mm standard new wheel diameter for WAP-7 Co-Co
  const wheelFlangeRadius = 0.575;
  // For forward movement towards -X (leading coaches at +X), flip along X so aerodynamic nose faces forward into open track
  const scaleX = direction === 'forward' ? -1 : 1;

  // Animate wheel rotation and track micro-vibrations
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isMoving) {
      // Angular velocity omega = v / r (v in m/s)
      const speedMs = (speedKmph * 1000) / 3600;
      wheelAngle.current -= (speedMs / wheelRadius) * delta;

      // Rotate all locomotive wheels
      wheelsRef.current.forEach((w) => {
        if (w) w.rotation.z = wheelAngle.current;
      });

      // Realistic high-speed track micro-vibration and suspension rumble
      const vibration = Math.sin(Date.now() * 0.024) * 0.022;
      const rollSway = Math.sin(Date.now() * 0.01) * 0.005;
      groupRef.current.position.y = position[1] + vibration;
      groupRef.current.rotation.z = rollSway;
    } else {
      groupRef.current.position.y = position[1];
      groupRef.current.rotation.z = 0;
    }
  });

  // WAP-7 has Co-Co bogies: 2 bogies, each with 3 axles (axle spacing 1.75m)
  // Bogie centers at -5.8m and +5.8m from locomotive center
  const bogieCenters = [-5.8, 5.8];
  const axleOffsets = [-1.75, 0, 1.75]; // 3 axles per Co-Co bogie

  return (
    <group ref={groupRef} position={position} scale={[scaleX, 1, 1]}>
      {/* 1. Main Locomotive Body (WAP-7 Aerodynamic Monocoque Body) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[locoLength - noseLength, bodyHeight, bodyWidth]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* 2. Aerodynamic Tapered Nose / Cab */}
      <mesh position={[(locoLength - noseLength) / 2 + noseLength / 2, -0.25, 0]} castShadow>
        <boxGeometry args={[noseLength, bodyHeight - 0.5, bodyWidth - 0.2]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Slanted windshield cowl */}
      <mesh
        position={[(locoLength - noseLength) / 2 + noseLength * 0.65, bodyHeight / 2 - 0.45, 0]}
        rotation={[0, 0, -Math.PI / 8]}
      >
        <boxGeometry args={[1.6, 0.9, bodyWidth - 0.25]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* Rear Cab section */}
      <mesh position={[-(locoLength - noseLength) / 2 - 0.6, -0.25, 0]} castShadow>
        <boxGeometry args={[1.2, bodyHeight - 0.5, bodyWidth - 0.2]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* 3. Front Windshields (tinted laminated glass) */}
      <mesh position={[(locoLength - noseLength) / 2 + noseLength - 0.05, 0.35, 0]}>
        <planeGeometry args={[0.08, 1.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* 4. Twin-Beam High Intensity Headlights */}
      {[0.8, -0.8].map((z, i) => (
        <group key={`hl-${i}`} position={[(locoLength - noseLength) / 2 + noseLength + 0.05, -0.05, z]}>
          {/* Headlight housing */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.26, 0.15, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Glowing Lens */}
          <mesh position={[0.08, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.2, 24]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fef08a"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      ))}

      {/* Forward Headlight Spotlight Beam casting light along tracks */}
      <spotLight
        position={[(locoLength - noseLength) / 2 + noseLength + 0.5, 0, 0]}
        target-position={[(locoLength - noseLength) / 2 + noseLength + 40, -4.5, 0]}
        angle={Math.PI / 7}
        penumbra={0.4}
        intensity={2.8}
        color="#fef08a"
        distance={60}
      />

      {/* Red Marker / Tail Lights */}
      {[1.1, -1.1].map((z, i) => (
        <mesh key={`marker-${i}`} position={[(locoLength - noseLength) / 2 + noseLength + 0.02, -0.6, z]}>
          <circleGeometry args={[0.09, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* 5. Dual Air Horn Trumpets on Cab Roof */}
      <group position={[(locoLength - noseLength) / 2 + 1.2, bodyHeight / 2 + 0.18, 0]}>
        {[-0.45, 0.45].map((z, i) => (
          <group key={`horn-${i}`} position={[0, 0, z]}>
            {/* Horn pipe tube */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.06, 0.7, 12]} />
              <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Bell flare opening */}
            <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.13, 0.25, 16, 1, true]} />
              <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. High-Voltage Pantographs on Roof (Dual Pantographs for 25kV AC OHE) */}
      {[-4.5, 3.5].map((px, pIdx) => (
        <group key={`panto-${pIdx}`} position={[px, bodyHeight / 2 + 0.1, 0]}>
          {/* Base insulators */}
          {[-0.6, 0.6].map((bx, bi) => (
            <mesh key={bi} position={[bx, 0.1, 0]}>
              <cylinderGeometry args={[0.08, 0.1, 0.2, 12]} />
              <meshStandardMaterial color="#7c2d12" roughness={0.4} />
            </mesh>
          ))}
          {/* Pantograph lower arm */}
          <mesh position={[-0.2, 0.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
            <cylinderGeometry args={[0.03, 0.03, 1.1, 8]} />
            <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Upper arm */}
          <mesh position={[0.3, 1.1, 0]} rotation={[0, 0, Math.PI / 6]}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
            <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Contact collector strip */}
          <mesh position={[0.5, 1.6, 0]}>
            <boxGeometry args={[0.08, 0.04, 1.8]} />
            <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* 7. Underframe Heavy Transformer & Traction Inverter Bay */}
      <mesh position={[0, -bodyHeight / 2 - 0.35, 0]}>
        <boxGeometry args={[locoLength - 1.2, 0.6, bodyWidth - 0.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.5} />
      </mesh>

      {/* Main Traction Transformer (center underslung tank) */}
      <mesh position={[0, -bodyHeight / 2 - 0.85, 0]} castShadow>
        <boxGeometry args={[4.2, 0.65, bodyWidth - 0.5]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* 8. Heavy Co-Co 3-Axle Bogies with Detailed Wheels */}
      {bogieCenters.map((bcX, bIdx) => (
        <group key={`bogie-${bIdx}`} position={[bcX, -bodyHeight / 2 - 0.8, 0]}>
          {/* Bogie cast steel sideframes */}
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[4.4, 0.35, bodyWidth - 0.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
          </mesh>

          {/* Primary flexicoil suspension springs above each axle */}
          {axleOffsets.map((ax, aIdx) => (
            <group key={`susp-${aIdx}`} position={[ax, 0.15, 0]}>
              {[-bodyWidth / 2 + 0.2, bodyWidth / 2 - 0.2].map((sz, si) => (
                <mesh key={si} position={[0, 0, sz]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.32, 12]} />
                  <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
                </mesh>
              ))}
            </group>
          ))}

          {/* 3 Axles per Bogie = 6 Heavy Wheels with Steel Rims, Flanges & Discs */}
          {axleOffsets.map((ax, aIdx) => {
            const wheelSetIndex = bIdx * 3 + aIdx;
            return (
              <group
                key={`axle-${aIdx}`}
                position={[ax, -0.15, 0]}
                ref={(el) => {
                  if (el) wheelsRef.current[wheelSetIndex] = el;
                }}
              >
                {/* Solid Steel Axle Shaft */}
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.09, 0.09, bodyWidth - 0.6, 16]} />
                  <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
                </mesh>

                {/* Left & Right Wheel Assemblies */}
                {[-bodyWidth / 2 + 0.45, bodyWidth / 2 - 0.45].map((wz, wi) => (
                  <group key={wi} position={[0, 0, wz]}>
                    {/* Wheel Rim & Tread */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelRadius, wheelRadius, 0.15, 24]} />
                      <meshStandardMaterial color="#334155" roughness={0.25} metalness={0.85} />
                    </mesh>

                    {/* Wheel Flange (inner rail safety flange) */}
                    <mesh position={[0, 0, wi === 0 ? 0.08 : -0.08]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelFlangeRadius, wheelFlangeRadius, 0.03, 24]} />
                      <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
                    </mesh>

                    {/* Heavy Axle-Mounted Brake Disc */}
                    <mesh position={[0, 0, wi === 0 ? 0.15 : -0.15]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[wheelRadius * 0.72, wheelRadius * 0.72, 0.04, 20]} />
                      <meshStandardMaterial color="#64748b" roughness={0.2} metalness={0.9} />
                    </mesh>

                    {/* High-Contrast White Radial Inspection Marks (Indian Railways Safety Slips) */}
                    {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, ai) => (
                      <mesh
                        key={`radial-mark-${ai}`}
                        position={[
                          Math.cos(angle) * (wheelRadius * 0.62),
                          Math.sin(angle) * (wheelRadius * 0.62),
                          wi === 0 ? 0.082 : -0.082,
                        ]}
                        rotation={[0, 0, angle]}
                      >
                        <boxGeometry args={[wheelRadius * 0.45, 0.035, 0.015]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.6} roughness={0.1} />
                      </mesh>
                    ))}

                    {/* Ventilated Brake Disc Slots / Cooling Holes */}
                    {[0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3].map((holeAngle, hi) => (
                      <mesh
                        key={`disc-hole-${hi}`}
                        position={[
                          Math.cos(holeAngle) * (wheelRadius * 0.42),
                          Math.sin(holeAngle) * (wheelRadius * 0.42),
                          wi === 0 ? 0.083 : -0.083,
                        ]}
                      >
                        <cylinderGeometry args={[0.04, 0.04, 0.02, 10]} />
                        <meshStandardMaterial color="#020617" roughness={0.9} />
                      </mesh>
                    ))}

                    {/* Wheel Hub */}
                    <mesh position={[0, 0, wi === 0 ? -0.08 : 0.08]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
                      <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
                    </mesh>

                    {/* Hex Center Hub Bolt */}
                    <mesh position={[0, 0, wi === 0 ? 0.09 : -0.09]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.07, 0.07, 0.03, 6]} />
                      <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
                    </mesh>
                  </group>
                ))}
              </group>
            );
          })}
        </group>
      ))}

      {/* 9. Authentic Indian Railways WAP-7 Crimson & Navy Stripes */}
      {/* Crimson Red speed band */}
      <mesh position={[0, -0.6, bodyWidth / 2 + 0.02]}>
        <planeGeometry args={[locoLength - noseLength - 0.4, 0.35]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.6, -bodyWidth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[locoLength - noseLength - 0.4, 0.35]} />
        <meshStandardMaterial color="#dc2626" roughness={0.3} />
      </mesh>

      {/* Navy Blue lower stripe */}
      <mesh position={[0, -1.05, bodyWidth / 2 + 0.02]}>
        <planeGeometry args={[locoLength - noseLength - 0.4, 0.2]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.05, -bodyWidth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[locoLength - noseLength - 0.4, 0.2]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} />
      </mesh>

      {/* 10. Side Typography: WAP-7 & भारतीय रेल / INDIAN RAILWAYS */}
      <Text
        position={[0, 0.35, bodyWidth / 2 + 0.03]}
        scale={[scaleX < 0 ? -1 : 1, 1, 1]}
        fontSize={0.42}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        WAP-7 30201 · भारतीय रेल
      </Text>
      <Text
        position={[0, 0.35, -bodyWidth / 2 - 0.03]}
        rotation={[0, Math.PI, 0]}
        scale={[scaleX < 0 ? -1 : 1, 1, 1]}
        fontSize={0.42}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        WAP-7 30201 · INDIAN RAILWAYS
      </Text>

      {/* Overhead 3D Identifier Label */}
      <Text
        position={[0, bodyHeight / 2 + 2.3, 0]}
        scale={[scaleX < 0 ? -1 : 1, 1, 1]}
        fontSize={0.75}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        WAP-7 LOCOMOTIVE
      </Text>
    </group>
  );
}
