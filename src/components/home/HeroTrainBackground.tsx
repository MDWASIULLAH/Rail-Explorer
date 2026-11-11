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
  const sceneryItems = useMemo(() => {
    const items: Array<{ position: [number, number, number]; size: [number, number, number]; color: string }> = [];
    for (const side of [-1, 1]) {
      for (let index = 0; index < 24; index += 1) {
        const z = -24 + index * 1.55;
        const height = 0.5 + ((index * 17) % 11) / 13;
        items.push({
          position: [side * (2.85 + ((index * 7) % 6) * 0.16), 0.15 + height / 2, z],
          size: [0.12 + ((index * 3) % 5) * 0.07, height, 0.18 + ((index * 5) % 4) * 0.12],
          color: index % 5 === 0 ? '#38bdf8' : index % 3 === 0 ? '#34d399' : '#334c71',
        });
      }
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    if (!paused && scenery.current) {
      scenery.current.position.z = (scenery.current.position.z + delta * 2.8) % 1.55;
    }
  });

  return (
    <group ref={scenery}>
      {sceneryItems.map((item, index) => (
        <mesh key={index} position={item.position}>
          <boxGeometry args={item.size} />
          <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.08} />
        </mesh>
      ))}
      {[-1, 1].map((side) =>
        Array.from({ length: 10 }, (_, index) => (
          <mesh key={`${side}-${index}`} position={[side * 2.62, 1.15, -22 + index * 3.15]}>
            <boxGeometry args={[0.045, 2.3, 0.055]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.42} />
          </mesh>
        )),
      )}
    </group>
  );
}

function CoachInterior({ paused }: { paused: boolean }) {
  const cameraRig = useRef<THREE.Group>(null);
  const seatBases = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 0.65, z] as [number, number, number])), []);
  const seatBacks = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 1.12, z + 0.25] as [number, number, number])), []);
  const headrests = useMemo(() => rowZ.flatMap((z) => [-0.92, 0.92].map((x) => [x, 1.58, z + 0.28] as [number, number, number])), []);

  useFrame(({ clock }) => {
    if (cameraRig.current && !paused) {
      const t = clock.getElapsedTime();
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
        <CoachInterior paused={reducedMotion} />
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
