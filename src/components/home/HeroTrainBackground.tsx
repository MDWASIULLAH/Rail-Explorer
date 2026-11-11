'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const rowZ = Array.from({ length: 11 }, (_, index) => -1.4 - index * 1.28);
const windowCenters = rowZ.filter((_, index) => index % 2 === 0).sort((a, b) => a - b);
const windowPiers = (() => {
  const segments: Array<[number, number]> = [];
  let cursor = -20;
  for (const center of windowCenters) {
    const start = center - 0.84;
    if (start > cursor) segments.push([(cursor + start) / 2, start - cursor]);
    cursor = center + 0.84;
  }
  if (cursor < 4) segments.push([(cursor + 4) / 2, 4 - cursor]);
  return segments;
})();

function InstancedSeatParts({
  positions,
  size,
  color,
}: {
  positions: Array<[number, number, number]>;
  size: [number, number, number];
  color: string;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!mesh.current) return;
    positions.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [dummy, positions]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.78} metalness={0.04} />
    </instancedMesh>
  );
}

function PassingScenery({ paused }: { paused: boolean }) {
  const scenery = useRef<THREE.Group>(null);
  const trees = useMemo(() => Array.from({ length: 14 }, (_, index) => ({
    z: -25 + index * 2.2,
    height: 1.1 + (index % 3) * 0.18,
    color: index % 2 === 0 ? '#244a43' : '#31584a',
  })), []);

  useFrame((_, delta) => {
    if (!paused && scenery.current) {
      scenery.current.position.z = (scenery.current.position.z + delta * 2.8) % 1.55;
    }
  });

  return (
    <group ref={scenery}>
      {[-1, 1].flatMap((side) => trees.map((tree, index) => (
        <group key={`${side}-${index}`} position={[side * (4.3 + (index % 2) * 0.45), 0, tree.z]}>
          <mesh position={[0, tree.height * 0.42, 0]}>
            <cylinderGeometry args={[0.055, 0.09, tree.height * 0.84, 6]} />
            <meshStandardMaterial color="#594b3d" roughness={1} />
          </mesh>
          <mesh position={[0, tree.height * 1.15, 0]}>
            <coneGeometry args={[0.52 + (index % 2) * 0.12, tree.height * 1.3, 7]} />
            <meshStandardMaterial color={tree.color} roughness={1} />
          </mesh>
        </group>
      )))}
    </group>
  );
}

function CoachInterior({ paused }: { paused: boolean }) {
  const cameraRig = useRef<THREE.Group>(null);
  const seatBases = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 0.65, z] as [number, number, number])), []);
  const seatBacks = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 1.12, z + 0.25] as [number, number, number])), []);
  const headrests = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 1.58, z + 0.28] as [number, number, number])), []);

  useFrame(({ clock }) => {
    if (cameraRig.current) {
      const t = clock.getElapsedTime() % 26;
      cameraRig.current.visible = paused || t < 7.2 || t > 25.2;
      if (paused) return;
      cameraRig.current.position.x = Math.sin(t * 0.35) * 0.025;
      cameraRig.current.position.y = Math.sin(t * 0.7) * 0.018;
      cameraRig.current.rotation.z = Math.sin(t * 0.32) * 0.002;
    }
  });

  return (
    <group ref={cameraRig}>
      <ambientLight intensity={1.15} color="#c5ddff" />
      <directionalLight position={[0, 4, 1]} intensity={1.25} color="#e7f2ff" />
      <pointLight position={[0, 2.8, -6]} intensity={4} distance={16} color="#55b8ff" />
      <fog attach="fog" args={['#071427', 8, 28]} />

      {/* Straight coach walls and ceiling keep the camera unmistakably inside a carriage. */}
      <mesh position={[0, -0.13, -8]}>
        <boxGeometry args={[4.25, 0.22, 24]} />
        <meshStandardMaterial color="#172439" roughness={0.92} />
      </mesh>
      <mesh position={[0, 3.08, -8]}>
        <boxGeometry args={[4.25, 0.2, 24]} />
        <meshStandardMaterial color="#26364c" roughness={0.88} />
      </mesh>
      {[-2.08, 2.08].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.73, -8]}>
            <boxGeometry args={[0.18, 1.46, 24]} />
            <meshStandardMaterial color="#24364d" roughness={0.82} />
          </mesh>
          <mesh position={[x, 2.94, -8]}>
            <boxGeometry args={[0.18, 0.28, 24]} />
            <meshStandardMaterial color="#24364d" roughness={0.82} />
          </mesh>
          {windowPiers.map(([z, length]) => (
            <mesh key={`pier-${x}-${z}`} position={[x, 2.18, z]}>
              <boxGeometry args={[0.18, 1.42, length]} />
              <meshStandardMaterial color="#24364d" roughness={0.82} />
            </mesh>
          ))}
          {windowCenters.map((z) => (
            <group key={`${x}-${z}`}>
              <mesh position={[x - Math.sign(x) * 0.11, 2.16, z]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[1.5, 1.18]} />
                <meshBasicMaterial color="#2b78aa" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
              </mesh>
              <mesh position={[x - Math.sign(x) * 0.13, 2.16, z - 0.8]}>
                <boxGeometry args={[0.06, 1.34, 0.065]} />
                <meshStandardMaterial color="#aab9c9" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[x - Math.sign(x) * 0.13, 2.16, z + 0.8]}>
                <boxGeometry args={[0.06, 1.34, 0.065]} />
                <meshStandardMaterial color="#aab9c9" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[x - Math.sign(x) * 0.13, 1.51, z]}>
                <boxGeometry args={[0.06, 0.065, 1.65]} />
                <meshStandardMaterial color="#aab9c9" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[x - Math.sign(x) * 0.13, 2.81, z]}>
                <boxGeometry args={[0.06, 0.065, 1.65]} />
                <meshStandardMaterial color="#8394a9" metalness={0.55} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 2+2 passenger seating with a visible aisle. */}
      <InstancedSeatParts positions={seatBases} size={[0.74, 0.2, 0.78]} color="#176c82" />
      <InstancedSeatParts positions={seatBacks} size={[0.74, 0.82, 0.2]} color="#0e536b" />
      <InstancedSeatParts positions={headrests} size={[0.42, 0.18, 0.12]} color="#3c9bb0" />

      {rowZ.map((z, index) => (
        <mesh key={z} position={[0, 2.93, z - 0.35]}>
          <boxGeometry args={[0.66, 0.035, 0.15]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#6ee7f9' : '#dbeafe'} />
        </mesh>
      ))}

      <PassingScenery paused={paused} />
    </group>
  );
}

function MovingRake({ paused }: { paused: boolean }) {
  const rake = useRef<THREE.Group>(null);
  const coaches = useMemo(() => Array.from({ length: 16 }, (_, index) => index), []);

  useFrame(({ clock }) => {
    if (!rake.current || paused) return;
    const time = clock.getElapsedTime();
    // The consist advances steadily; a long rake keeps the camera surrounded by coaches.
    rake.current.position.z = (time * 0.72) % 4.25;
    rake.current.position.x = Math.sin(time * 0.16) * 0.035;
  });

  return (
    <group ref={rake} position={[0, 0, 0]}>
      {/* A long, continuous rake gives the outside camera a real train to reveal. */}
      {coaches.map((index) => {
        const z = 18 - index * 4.25;
        const isEngine = index === 0;
        return (
          <group key={index} position={[0, 0, z]}>
            <mesh position={[0, 1.45, 0]}>
              <boxGeometry args={isEngine ? [2.3, 2.55, 4.1] : [2.2, 2.3, 4]} />
              <meshStandardMaterial color={isEngine ? '#123c66' : '#183454'} metalness={0.52} roughness={0.34} />
            </mesh>
            <mesh position={[0, 2.77, 0]}>
              <boxGeometry args={isEngine ? [2.12, 0.14, 3.8] : [2.06, 0.13, 3.78]} />
              <meshStandardMaterial color="#6da5c8" metalness={0.65} roughness={0.3} />
            </mesh>
            {Array.from({ length: isEngine ? 2 : 5 }, (_, windowIndex) => {
              const zOffset = isEngine ? (windowIndex === 0 ? -0.55 : 0.55) : -1.4 + windowIndex * 0.7;
              return (
                <mesh key={windowIndex} position={[1.115, isEngine ? 1.7 : 1.72, zOffset]}>
                  <boxGeometry args={[0.035, 0.75, isEngine ? 0.46 : 0.5]} />
                  <meshBasicMaterial color="#6fd8ff" transparent opacity={0.8} />
                </mesh>
              );
            })}
            {!isEngine && [-1.25, 1.25].map((bogieZ) => (
              <mesh key={`bogie-${bogieZ}`} position={[0, 0.43, bogieZ]}>
                <boxGeometry args={[1.82, 0.16, 0.62]} />
                <meshStandardMaterial color="#283446" metalness={0.38} roughness={0.72} />
              </mesh>
            ))}
            {!isEngine && [-1.78, 1.78].map((doorZ) => (
              <mesh key={doorZ} position={[1.115, 1.44, doorZ]}>
                <boxGeometry args={[0.035, 1.65, 0.25]} />
                <meshStandardMaterial color="#d8a347" metalness={0.35} roughness={0.4} />
              </mesh>
            ))}
            {[-0.78, 0.78].flatMap((x) => [-1.25, 1.25].map((wheelZ) => (
              <mesh key={`${x}-${wheelZ}`} position={[x, 0.34, wheelZ]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.32, 0.32, 0.13, 12]} />
                <meshStandardMaterial color="#111827" metalness={0.48} roughness={0.6} />
              </mesh>
            )))}
            {isEngine && <mesh position={[0, 1.2, 2.09]}><boxGeometry args={[0.3, 0.32, 0.08]} /><meshBasicMaterial color="#fff0a6" /></mesh>}
          </group>
        );
      })}
      <mesh position={[0, -0.28, -10]}>
        <boxGeometry args={[2.2, 0.12, 72]} />
        <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
      </mesh>
      {[-0.72, 0.72].map((x) => (
        <mesh key={`rail-${x}`} position={[x, -0.18, -10]}>
          <boxGeometry args={[0.09, 0.12, 74]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.82} roughness={0.32} />
        </mesh>
      ))}
      {/* Generic Indian station platform and canopy, kept deliberately unlabelled. */}
      <mesh position={[8.7, -0.2, -10]}>
        <boxGeometry args={[2.5, 0.32, 74]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[9.6, 4.65, -10]}>
        <boxGeometry args={[5.2, 0.18, 44]} />
        <meshStandardMaterial color="#26374b" metalness={0.22} roughness={0.72} />
      </mesh>
      {[-29, -20, -11, -2, 7].map((z) => (
        <group key={`platform-lamp-${z}`} position={[9.45, 0, z]}>
          <mesh position={[0, 2.25, 0]}><boxGeometry args={[0.12, 4.5, 0.12]} /><meshStandardMaterial color="#64748b" metalness={0.5} /></mesh>
          <mesh position={[0, 4.4, 0]}><boxGeometry args={[1.05, 0.08, 0.24]} /><meshBasicMaterial color="#c5e7ff" /></mesh>
          <pointLight position={[-0.25, 4.15, 0]} intensity={0.65} distance={10} color="#dceeff" />
        </group>
      ))}
    </group>
  );
}

function CameraJourney({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame(({ camera, clock, size }) => {
    if (reducedMotion) return;
    const t = clock.getElapsedTime() % 26;
    const mix = (start: number, end: number, value: number) => THREE.MathUtils.smoothstep(value, start, end);
    const insideStart = new THREE.Vector3(0, 1.62, 4.25);
    const windowExit = new THREE.Vector3(2.65, 2.2, -1.4);
    const outsideWide = new THREE.Vector3(6.2, 3.8, 2.4);
    const outsideTrack = new THREE.Vector3(7.2, 3.7, -9);
    const lookInside = new THREE.Vector3(0, 1.35, -12);
    const lookWindow = new THREE.Vector3(0, 1.65, -1.4);
    const lookRake = new THREE.Vector3(0, 1.2, -15);
    const phaseTwo = mix(7.2, 10.2, t);
    const phaseThree = mix(10.2, 18, t);
    const phaseReturn = mix(20, 25.5, t);
    const cameraPosition = new THREE.Vector3();
    const cameraLook = new THREE.Vector3();
    if (t < 7.2) {
      cameraPosition.lerpVectors(insideStart, windowExit, mix(0, 7.2, t));
      cameraLook.copy(lookInside).lerp(lookWindow, mix(3.8, 7.2, t));
    } else if (t < 10.2) {
      cameraPosition.lerpVectors(windowExit, outsideWide, phaseTwo);
      cameraLook.copy(lookWindow).lerp(lookRake, phaseTwo);
    } else if (t < 20) {
      cameraPosition.lerpVectors(outsideWide, outsideTrack, phaseThree);
      cameraLook.copy(lookRake);
    } else {
      const outsideBlend = 1 - phaseReturn;
      cameraPosition.lerpVectors(insideStart, outsideTrack, outsideBlend);
      cameraLook.copy(lookInside).lerp(lookRake, outsideBlend);
    }
    const outsideAmount = THREE.MathUtils.smoothstep(t, 7.2, 10.2) * (1 - THREE.MathUtils.smoothstep(t, 20, 25.5));
    const portraitDistance = size.width / Math.max(size.height, 1) < 0.8 ? 1.45 : 1;
    cameraPosition.x *= THREE.MathUtils.lerp(1, portraitDistance, outsideAmount);
    cameraPosition.z *= THREE.MathUtils.lerp(1, portraitDistance, outsideAmount);
    camera.position.copy(cameraPosition);
    camera.lookAt(cameraLook);
  });
  return null;
}

export default function HeroTrainBackground() {
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <Canvas
        className="absolute inset-0 !h-full !w-full"
        camera={{ position: [0, 1.62, 4.25], fov: 62, near: 0.1, far: 60 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.35, -12)}
        dpr={[1, 1.25]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        frameloop={reducedMotion ? 'never' : 'always'}
        fallback={<div className="absolute inset-0 bg-slate-950" />}
      >
        <CameraJourney reducedMotion={reducedMotion} />
        <ambientLight intensity={1.3} color="#c5ddff" />
        <directionalLight position={[4, 7, 5]} intensity={1.6} color="#e7f2ff" />
        <CoachInterior paused={reducedMotion} />
        <MovingRake paused={reducedMotion} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-950/65 to-slate-950/95" />
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
    </div>
  );
}
