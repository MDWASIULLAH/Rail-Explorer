'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Text, useAnimations, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

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
  emissive,
}: {
  positions: Array<[number, number, number]>;
  size: [number, number, number];
  color: string;
  emissive?: string;
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
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissive ? 0.65 : 0} roughness={0.78} metalness={0.04} />
    </instancedMesh>
  );
}

function InstancedWheelParts({ positions }: { positions: Array<[number, number, number]> }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!mesh.current) return;
    positions.forEach(([x, y, z], index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, Math.PI / 2);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [dummy, positions]);

  return <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]}><cylinderGeometry args={[0.31, 0.31, 0.13, 14]} /><meshStandardMaterial color="#161f28" metalness={0.55} roughness={0.48} /></instancedMesh>;
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
        <group key={`${side}-${index}`} position={[side * (12.5 + (index % 2) * 0.45), 0, tree.z]}>
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
  const occupiedSeats = useMemo(() => rowZ.filter((_, index) => index % 3 === 1).flatMap((z) => [-0.92, 0.92].map((x) => [x, 1.08, z + 0.18] as [number, number, number])), []);
  const seatedHeads = useMemo(() => occupiedSeats.map(([x, , z]) => [x, 1.55, z] as [number, number, number]), [occupiedSeats]);

  useFrame(({ clock }) => {
    if (cameraRig.current) {
      const t = clock.getElapsedTime() % 90;
      cameraRig.current.visible = !paused && t < 10;
      if (paused) return;
      cameraRig.current.position.x = Math.sin(t * 0.35) * 0.025;
      cameraRig.current.position.y = Math.sin(t * 0.7) * 0.018;
      cameraRig.current.rotation.z = Math.sin(t * 0.32) * 0.002;
    }
  });

  return (
    <group ref={cameraRig} visible={!paused}>
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
      <InstancedSeatParts positions={occupiedSeats} size={[0.36, 0.62, 0.24]} color="#85483e" />
      <InstancedSeatParts positions={seatedHeads} size={[0.2, 0.22, 0.18]} color="#bc8e70" />

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

function PassengerFigure({
  position,
  outfit,
  phase,
  walking = false,
  facing = 0,
}: {
  position: [number, number, number];
  outfit: string;
  phase: number;
  walking?: boolean;
  facing?: number;
}) {
  const figure = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime * (walking ? 3.2 : 1.4) + phase;
    const stride = walking ? Math.sin(time) * 0.48 : Math.sin(time) * 0.025;
    if (leftLeg.current) leftLeg.current.rotation.x = stride;
    if (rightLeg.current) rightLeg.current.rotation.x = -stride;
    if (leftArm.current) leftArm.current.rotation.x = -stride * 0.62 + Math.sin(time * 0.5) * 0.05;
    if (rightArm.current) rightArm.current.rotation.x = stride * 0.62 + Math.sin(time * 1.8) * (walking ? 0.04 : 0.12);
    if (head.current) head.current.rotation.y = Math.sin(time * 0.32) * 0.16;
    if (torso.current) torso.current.rotation.x = walking ? Math.sin(time * 2) * 0.025 : Math.sin(time * 0.8) * 0.012;
    if (figure.current && walking) {
      figure.current.position.z = position[2] + Math.sin(clock.elapsedTime * 0.16 + phase) * 2.8;
      figure.current.position.y = Math.abs(Math.sin(time * 2)) * 0.035;
    }
  });

  return (
    <group ref={figure} position={position} rotation={[0, facing, 0]}>
      <group ref={torso}>
        <mesh position={[0, 0.98, 0]} castShadow><capsuleGeometry args={[0.145, 0.48, 5, 10]} /><meshStandardMaterial color={outfit} roughness={0.78} /></mesh>
        <mesh position={[0, 1.34, 0]} castShadow><cylinderGeometry args={[0.092, 0.13, 0.12, 10]} /><meshStandardMaterial color="#bc8e70" roughness={0.84} /></mesh>
        <mesh ref={head} position={[0, 1.56, 0.015]} castShadow><sphereGeometry args={[0.145, 14, 12]} /><meshStandardMaterial color="#bc8e70" roughness={0.86} /></mesh>
        <mesh position={[0, 1.65, 0.005]}><sphereGeometry args={[0.147, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} /><meshStandardMaterial color={phase % 2 > 1 ? '#211c1a' : '#30221f'} roughness={1} /></mesh>
        {[-0.052, 0.052].map((eye) => <mesh key={eye} position={[eye, 1.565, 0.151]}><sphereGeometry args={[0.011, 6, 6]} /><meshBasicMaterial color="#17191b" /></mesh>)}
      </group>
      <group ref={leftArm} position={[-0.2, 1.31, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow><capsuleGeometry args={[0.055, 0.25, 4, 7]} /><meshStandardMaterial color={outfit} roughness={0.85} /></mesh>
        <mesh position={[0, -0.43, 0]} castShadow><capsuleGeometry args={[0.04, 0.2, 4, 7]} /><meshStandardMaterial color={outfit} roughness={0.85} /></mesh>
      </group>
      <group ref={rightArm} position={[0.2, 1.31, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow><capsuleGeometry args={[0.055, 0.25, 4, 7]} /><meshStandardMaterial color={outfit} roughness={0.85} /></mesh>
        <mesh position={[0, -0.43, 0]} castShadow><capsuleGeometry args={[0.04, 0.2, 4, 7]} /><meshStandardMaterial color={outfit} roughness={0.85} /></mesh>
      </group>
      <group ref={leftLeg} position={[-0.095, 0.48, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow><capsuleGeometry args={[0.066, 0.3, 4, 7]} /><meshStandardMaterial color="#263647" roughness={0.9} /></mesh>
        <mesh position={[0, -0.38, 0.055]} castShadow><boxGeometry args={[0.13, 0.08, 0.25]} /><meshStandardMaterial color="#202833" roughness={0.85} /></mesh>
      </group>
      <group ref={rightLeg} position={[0.095, 0.48, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow><capsuleGeometry args={[0.066, 0.3, 4, 7]} /><meshStandardMaterial color="#263647" roughness={0.9} /></mesh>
        <mesh position={[0, -0.38, 0.055]} castShadow><boxGeometry args={[0.13, 0.08, 0.25]} /><meshStandardMaterial color="#202833" roughness={0.85} /></mesh>
      </group>
      {phase % 2 < 1 && (
        <mesh position={[0.31, 0.57, -0.08]} castShadow>
          <boxGeometry args={[0.24, 0.32, 0.2]} />
          <meshStandardMaterial color="#7c5138" roughness={0.88} />
        </mesh>
      )}
    </group>
  );
}

function StationCrowd() {
  const passengers = useMemo(() => [
    { position: [-4.72, 0, -6] as [number, number, number], outfit: '#a5433e', phase: 0.2, walking: true },
    { position: [-4.5, 0, -13] as [number, number, number], outfit: '#d5a84d', phase: 1.2, facing: Math.PI / 2 },
    { position: [-3.85, 0, -12.5] as [number, number, number], outfit: '#355d78', phase: 2.1, facing: -Math.PI / 2 },
    { position: [-3.2, 0, -4] as [number, number, number], outfit: '#59856c', phase: 3.5, walking: true },
    { position: [-4.72, 0, 2] as [number, number, number], outfit: '#70528c', phase: 4.4 },
    { position: [-4.68, 0, 4.1] as [number, number, number], outfit: '#c77b42', phase: 5.2 },
    { position: [-3.22, 0, 12] as [number, number, number], outfit: '#397a82', phase: 6.2, walking: true },
    { position: [-4.72, 0, 21] as [number, number, number], outfit: '#b74e66', phase: 7.1 },
  ], []);

  return (
    <group>
      <Suspense fallback={null}>
        <AnimatedStationPassenger position={passengers[0].position} phase={passengers[0].phase} />
      </Suspense>
      {passengers.slice(1).map((passenger) => <PassengerFigure key={passenger.phase} {...passenger} />)}
    </group>
  );
}

function AnimatedStationPassenger({ position, phase, boarding = false, tint = '#ffffff' }: { position: [number, number, number]; phase: number; boarding?: boolean; tint?: string }) {
  const root = useRef<THREE.Group>(null);
  const walkAction = useRef<THREE.AnimationAction | null>(null);
  const { scene, animations } = useGLTF('/models/station-passenger.glb');
  const model = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const tinted = materials.map((material) => {
          const instance = material.clone();
          instance.color.multiply(new THREE.Color(tint));
          return instance;
        });
        object.material = Array.isArray(object.material) ? tinted : tinted[0];
      }
    });
    return clone;
  }, [scene, tint]);
  const { actions } = useAnimations(animations, root);

  useEffect(() => {
    const walk = actions.Walk;
    if (!walk) return;
    walkAction.current = walk;
    walk.reset().fadeIn(0.35).setLoop(THREE.LoopRepeat, Infinity).play();
    return () => { walkAction.current = null; walk.fadeOut(0.25); };
  }, [actions]);

  useFrame(({ clock }) => {
    if (!root.current) return;
    if (boarding) {
      const cycle = (clock.elapsedTime + phase) % 24;
      const walking = cycle >= 4 && cycle < 12;
      const progress = THREE.MathUtils.clamp((cycle - 4) / 8, 0, 1);
      root.current.visible = cycle < 12 || cycle > 21;
      root.current.position.x = cycle > 21 ? 8.35 : THREE.MathUtils.lerp(8.35, 6.18, progress);
      root.current.position.z = position[2];
      root.current.rotation.y = -Math.PI / 2;
      if (walkAction.current) walkAction.current.paused = !walking;
      return;
    }
    root.current.position.z = position[2] + Math.sin(clock.elapsedTime * 0.16 + phase) * 2.8;
  });

  return <group ref={root} position={position} scale={0.96}><primitive object={model} /></group>;
}

function BoardingCrowd() {
  const boarders = [
    { position: [8.35, 0, -5] as [number, number, number], phase: 0, tint: '#fff7ed' },
    { position: [8.35, 0, 1] as [number, number, number], phase: 7, tint: '#e2edff' },
    { position: [8.35, 0, 7] as [number, number, number], phase: 14, tint: '#f4eadb' },
  ];
  return <Suspense fallback={null}>{boarders.map((person) => <AnimatedStationPassenger key={person.phase} {...person} boarding />)}</Suspense>;
}

useGLTF.preload('/models/station-passenger.glb');

function MovingRake({ paused }: { paused: boolean }) {
  const rake = useRef<THREE.Group>(null);
  const coaches = useMemo(() => Array.from({ length: 16 }, (_, index) => index), []);
  const coachZ = useMemo(() => coaches.filter((index) => index > 0).map((index) => 18 - index * 4.25), [coaches]);
  const coachWindows = useMemo(() => coachZ.flatMap((z) => [-1, 1].flatMap((side) => Array.from({ length: 5 }, (_, index) => [side * 1.115, 1.72, z - 1.4 + index * 0.7] as [number, number, number]))), [coachZ]);
  const coachDoors = useMemo(() => coachZ.flatMap((z) => [-1, 1].flatMap((side) => [-1.78, 1.78].map((doorZ) => [side * 1.115, 1.44, z + doorZ] as [number, number, number]))), [coachZ]);
  const coachStripes = useMemo(() => coachZ.flatMap((z) => [-1, 1].map((side) => [side * 1.115, 0.72, z] as [number, number, number])), [coachZ]);
  const coachBogieFrames = useMemo(() => coachZ.flatMap((z) => [-1.25, 1.25].map((offset) => [0, 0.43, z + offset] as [number, number, number])), [coachZ]);
  const coachAxles = useMemo(() => coachZ.flatMap((z) => [-1.25, 1.25].flatMap((bogie) => [-0.72, 0.72].map((offset) => [0, 0.45, z + bogie + offset] as [number, number, number]))), [coachZ]);
  const coachWheels = useMemo(() => coachZ.flatMap((z) => [-1.25, 1.25].flatMap((bogie) => [-0.78, 0.78].flatMap((x) => [-0.26, 0.26].map((offset) => [x, 0.34, z + bogie + offset] as [number, number, number])))), [coachZ]);

  useFrame(({ clock }) => {
    if (!rake.current || paused) return;
    const time = clock.getElapsedTime() % 62;
    // The engine starts at the far end, enters the station, and pulls the full rake past.
    rake.current.position.z = -32 + time * 2.35;
    rake.current.position.x = Math.sin(time * 0.16) * 0.035;
  });

  return (
    <>
      <group ref={rake} position={[0, 0, -32]}>
      {/* A long, continuous rake gives the outside camera a real train to reveal. */}
      <InstancedSeatParts positions={coachZ.map((z) => [0, 1.45, z] as [number, number, number])} size={[2.2, 2.3, 4]} color="#b8c9d7" />
      <InstancedSeatParts positions={coachZ.map((z) => [0, 2.77, z] as [number, number, number])} size={[2.06, 0.13, 3.78]} color="#71889b" />
      <InstancedSeatParts positions={coachStripes} size={[0.035, 0.16, 3.78]} color="#1977ad" />
      <InstancedSeatParts positions={coachWindows} size={[0.035, 0.75, 0.5]} color="#f6bf70" emissive="#a76c30" />
      <InstancedSeatParts positions={coachDoors} size={[0.035, 1.65, 0.25]} color="#d8a347" />
      <InstancedSeatParts positions={coachBogieFrames} size={[1.82, 0.2, 0.68]} color="#303c4a" />
      <InstancedSeatParts positions={coachAxles} size={[1.55, 0.09, 0.12]} color="#697987" />
      <InstancedWheelParts positions={coachWheels} />
      {coaches.map((index) => {
        const isEngine = index === 0;
        if (!isEngine) return null;
        const z = 18 - index * 4.25;
        return (
          <group key={index} position={[0, 0, z]}>
            <mesh position={[0, 1.45, 0]}>
              <boxGeometry args={isEngine ? [2.3, 2.55, 4.1] : [2.2, 2.3, 4]} />
              <meshStandardMaterial color={isEngine ? '#123c66' : '#b8c9d7'} metalness={0.32} roughness={0.48} />
            </mesh>
            <mesh position={[0, 2.77, 0]}>
              <boxGeometry args={isEngine ? [2.12, 0.14, 3.8] : [2.06, 0.13, 3.78]} />
              <meshStandardMaterial color={isEngine ? '#6da5c8' : '#71889b'} metalness={0.48} roughness={0.38} />
            </mesh>
            {!isEngine && [-1, 1].map((side) => <mesh key={`stripe-${side}`} position={[side * 1.115, 0.72, 0]}><boxGeometry args={[0.035, 0.16, 3.78]} /><meshStandardMaterial color="#1977ad" metalness={0.2} roughness={0.5} /></mesh>)}
            {[-1, 1].flatMap((side) => Array.from({ length: isEngine ? 2 : 5 }, (_, windowIndex) => {
              const zOffset = isEngine ? (windowIndex === 0 ? -0.55 : 0.55) : -1.4 + windowIndex * 0.7;
              return (
                <group key={`${side}-${windowIndex}`}>
                  <mesh position={[side * 1.115, isEngine ? 1.7 : 1.72, zOffset]}>
                    <boxGeometry args={[0.035, 0.75, isEngine ? 0.46 : 0.5]} />
                    <meshStandardMaterial color="#ffd38b" emissive="#d88736" emissiveIntensity={1.15} roughness={0.22} />
                  </mesh>
                  {!isEngine && windowIndex % 2 === 1 && (
                    <mesh position={[side * 1.075, 1.64, zOffset + 0.02]}>
                      <capsuleGeometry args={[0.11, 0.28, 3, 5]} />
                      <meshBasicMaterial color="#172536" />
                    </mesh>
                  )}
                </group>
              );
            }))}
            {[-1.5, 0, 1.5].map((bogieZ) => (
              <group key={`bogie-${bogieZ}`} position={[0, 0.43, bogieZ]}>
                <mesh><boxGeometry args={[1.82, 0.2, 0.68]} /><meshStandardMaterial color="#303c4a" metalness={0.42} roughness={0.62} /></mesh>
                {[-0.72, 0.72].map((axle) => <mesh key={axle} position={[0, 0.02, axle]}><boxGeometry args={[1.55, 0.09, 0.12]} /><meshStandardMaterial color="#697987" metalness={0.68} roughness={0.42} /></mesh>)}
                {[-0.78, 0.78].flatMap((x) => [-0.26, 0.26].map((wheelZ) => (
                  <mesh key={`${x}-${wheelZ}`} position={[x, -0.09, wheelZ]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.31, 0.31, 0.13, 14]} />
                    <meshStandardMaterial color="#161f28" metalness={0.55} roughness={0.48} />
                  </mesh>
                )))}
              </group>
            ))}
            {isEngine && <>
              {[-0.48, 0.48].map((x) => <mesh key={`cab-${x}`} position={[x, 2.12, 2.08]}><boxGeometry args={[0.58, 0.48, 0.04]} /><meshStandardMaterial color="#79b7d3" metalness={0.35} roughness={0.2} emissive="#2b6582" emissiveIntensity={0.35} /></mesh>)}
              <mesh position={[0, 0.65, 2.08]}><boxGeometry args={[1.8, 0.4, 0.2]} /><meshStandardMaterial color="#273543" metalness={0.55} roughness={0.5} /></mesh>
              {[-0.68, 0.68].map((x) => <mesh key={x} position={[x, 1.85, 2.08]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color="#fff2bf" emissive="#ffbd54" emissiveIntensity={2.4} /></mesh>)}
              <mesh position={[0, 1.2, 2.1]}><boxGeometry args={[0.26, 0.28, 0.08]} /><meshBasicMaterial color="#ff493c" toneMapped={false} /></mesh>
              <group position={[0, 2.83, -0.1]}>
                <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.72, 0.12, 0.55]} /><meshStandardMaterial color="#303d49" metalness={0.68} roughness={0.34} /></mesh>
                {[-0.27, 0.27].map((x) => <mesh key={x} position={[x * 0.5, 1.38, 0]} rotation={[0, 0, x < 0 ? -0.19 : 0.19]}><boxGeometry args={[0.075, 2.72, 0.07]} /><meshStandardMaterial color="#d2d9dd" metalness={0.85} roughness={0.28} /></mesh>)}
                <mesh position={[0, 2.76, 0]}><boxGeometry args={[1.05, 0.07, 0.1]} /><meshStandardMaterial color="#e6ecef" metalness={0.9} roughness={0.22} /></mesh>
                <mesh position={[-0.35, 0.2, 0]} rotation={[0, 0, -0.2]}><boxGeometry args={[0.55, 0.055, 0.05]} /><meshStandardMaterial color="#87949d" metalness={0.82} roughness={0.32} /></mesh>
              </group>
            </>}
            {!isEngine && <mesh position={[0, 0.62, 2.04]}><boxGeometry args={[0.22, 0.2, 0.34]} /><meshStandardMaterial color="#d7a14e" metalness={0.42} roughness={0.44} /></mesh>}
          </group>
        );
      })}
      </group>
      <StationEnvironment />
    </>
  );
}

function StationEnvironment() {
  return (
    <group>
      <OverheadEquipment />
      <SecondPlatform />
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
      <mesh position={[-4, -0.2, -10]}>
        <boxGeometry args={[2.5, 0.32, 74]} />
        <meshStandardMaterial color="#77818a" roughness={0.9} />
      </mesh>
      <mesh position={[-2.73, -0.005, -10]}><boxGeometry args={[0.08, 0.025, 73]} /><meshBasicMaterial color="#f5c84c" /></mesh>
      <mesh position={[0, -0.27, -10]}><boxGeometry args={[3.3, 0.18, 76]} /><meshStandardMaterial color="#36424d" roughness={1} /></mesh>
      <InstancedSeatParts
        positions={Array.from({ length: 42 }, (_, index) => [0, -0.15, -46 + index * 1.75] as [number, number, number])}
        size={[2.25, 0.14, 0.22]}
        color="#5a5145"
      />
      <mesh position={[-4.9, 4.65, -10]}>
        <boxGeometry args={[5.2, 0.2, 52]} />
        <meshStandardMaterial color="#394b5b" metalness={0.22} roughness={0.66} />
      </mesh>
      {[-33, -21, -9, 3, 15].map((z) => (
        <group key={`platform-lamp-${z}`} position={[-4.8, 0, z]}>
          <mesh position={[-2.35, 2.28, 0]}><boxGeometry args={[0.16, 4.56, 0.16]} /><meshStandardMaterial color="#64788a" metalness={0.5} roughness={0.45} /></mesh>
          <mesh position={[2.35, 2.28, 0]}><boxGeometry args={[0.16, 4.56, 0.16]} /><meshStandardMaterial color="#64788a" metalness={0.5} roughness={0.45} /></mesh>
          <mesh position={[0, 4.5, 0]}><boxGeometry args={[4.9, 0.15, 0.2]} /><meshStandardMaterial color="#718596" metalness={0.6} roughness={0.4} /></mesh>
          <mesh position={[0, 4.46, 0]}><boxGeometry args={[1.55, 0.07, 0.36]} /><meshBasicMaterial color="#fff0bf" toneMapped={false} /></mesh>
          <pointLight position={[0, 4.1, 0]} intensity={1.25} distance={9} color="#ffd99b" />
        </group>
      ))}
      {[-6, -2, 2, 6].map((z) => (
        <group key={`bench-${z}`} position={[-4.55, 0, z]}>
          <mesh position={[0, 0.48, 0]}><boxGeometry args={[0.85, 0.08, 1.6]} /><meshStandardMaterial color="#6f503a" roughness={0.72} /></mesh>
          {[-0.65, 0.65].map((offset) => <mesh key={offset} position={[0, 0.24, offset]}><boxGeometry args={[0.72, 0.46, 0.08]} /><meshStandardMaterial color="#65727d" metalness={0.35} roughness={0.62} /></mesh>)}
        </group>
      ))}
      <group position={[-4.3, 3.55, -34]}>
        <mesh><boxGeometry args={[2.8, 1.05, 0.14]} /><meshStandardMaterial color="#163c59" metalness={0.18} roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.08]}><boxGeometry args={[2.55, 0.78, 0.025]} /><meshBasicMaterial color="#e8d18b" /></mesh>
        <Billboard position={[0, 0, 0.105]}>
          <Text fontSize={0.23} color="#153e5b" anchorX="center" anchorY="middle" fontWeight="bold">BHUBANESWAR</Text>
        </Billboard>
        <Billboard position={[0, -0.28, 0.105]}>
          <Text fontSize={0.11} color="#153e5b" anchorX="center" anchorY="middle" letterSpacing={0.04}>RAILWAY STATION</Text>
        </Billboard>
      </group>
      <StationCrowd />
    </group>
  );
}

function SecondPlatform() {
  return (
    <group>
      <mesh position={[5, -0.28, -10]}><boxGeometry args={[2.2, 0.12, 72]} /><meshStandardMaterial color="#64748b" metalness={0.72} roughness={0.38} /></mesh>
      {[4.28, 5.72].map((x) => <mesh key={x} position={[x, -0.18, -10]}><boxGeometry args={[0.09, 0.12, 74]} /><meshStandardMaterial color="#aeb8bf" metalness={0.86} roughness={0.28} /></mesh>)}
      <InstancedSeatParts positions={Array.from({ length: 42 }, (_, index) => [5, -0.24, -46 + index * 1.75] as [number, number, number])} size={[2.2, 0.11, 0.22]} color="#7d7568" />
      <mesh position={[8.05, -0.2, -10]}><boxGeometry args={[2.7, 0.32, 74]} /><meshStandardMaterial color="#87929b" roughness={0.86} /></mesh>
      <mesh position={[6.69, -0.005, -10]}><boxGeometry args={[0.08, 0.025, 73]} /><meshBasicMaterial color="#f8d25d" /></mesh>
      <mesh position={[7.95, 4.65, -10]}><boxGeometry args={[5.2, 0.2, 52]} /><meshStandardMaterial color="#455a68" metalness={0.28} roughness={0.58} /></mesh>
      <mesh position={[8.05, 4.48, -10]}><boxGeometry args={[4.7, 0.07, 52]} /><meshBasicMaterial color="#fff1c2" toneMapped={false} /></mesh>
      <InstancedSeatParts positions={Array.from({ length: 18 }, (_, index) => [8.05, 0.35, -24 + index * 2.1] as [number, number, number])} size={[2.05, 0.14, 0.22]} color="#526273" />
      {[-31, -15, 1, 17].map((z) => <group key={`p2-light-${z}`} position={[8.05, 0, z]}>
        <mesh position={[2.25, 2.25, 0]}><boxGeometry args={[0.14, 4.5, 0.14]} /><meshStandardMaterial color="#8293a0" metalness={0.55} roughness={0.4} /></mesh>
        <mesh position={[0, 4.45, 0]}><boxGeometry args={[4.4, 0.12, 0.18]} /><meshStandardMaterial color="#8798a4" metalness={0.62} roughness={0.38} /></mesh>
      </group>)}
      <group position={[8.35, 3.55, -34]}>
        <mesh><boxGeometry args={[2.8, 1.05, 0.14]} /><meshStandardMaterial color="#174565" metalness={0.18} roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.08]}><boxGeometry args={[2.55, 0.78, 0.025]} /><meshBasicMaterial color="#e8d18b" /></mesh>
        <Billboard position={[0, 0, 0.105]}><Text fontSize={0.22} color="#153e5b" anchorX="center" anchorY="middle" fontWeight="bold">BHUBANESWAR</Text></Billboard>
        <Billboard position={[0, -0.28, 0.105]}><Text fontSize={0.12} color="#153e5b" anchorX="center" anchorY="middle">PLATFORM 2</Text></Billboard>
      </group>
      <ParkedTrain />
      <BoardingCrowd />
    </group>
  );
}

function ParkedTrain() {
  const cars = useMemo(() => Array.from({ length: 8 }, (_, index) => 15 - index * 4.25), []);
  const coaches = useMemo(() => cars.slice(1), [cars]);
  const passengers = useMemo(() => coaches.flatMap((z) => [
    [1.135, 1.53, z - 0.65], [1.135, 1.53, z + 0.72],
  ] as Array<[number, number, number]>), [coaches]);
  const passengerHeads = useMemo(() => passengers.map(([x, , z]) => [x, 1.82, z] as [number, number, number]), [passengers]);
  const windows = useMemo(() => coaches.flatMap((z) => [-1, 1].flatMap((side) => Array.from({ length: 4 }, (_, i) => [side * 1.115, 1.72, z - 1.25 + i * 0.82] as [number, number, number]))), [coaches]);
  const doors = useMemo(() => coaches.flatMap((z) => [-1, 1].flatMap((side) => [-1.72, 1.72].map((offset) => [side * 1.115, 1.44, z + offset] as [number, number, number]))), [coaches]);
  const stripes = useMemo(() => coaches.flatMap((z) => [-1, 1].map((side) => [side * 1.115, 0.72, z] as [number, number, number])), [coaches]);
  const bogies = useMemo(() => coaches.flatMap((z) => [-1.25, 1.25].map((offset) => [0, 0.43, z + offset] as [number, number, number])), [coaches]);
  const axles = useMemo(() => coaches.flatMap((z) => [-1.25, 1.25].flatMap((offset) => [-0.75, 0.75].map((axle) => [0, 0.45, z + offset + axle] as [number, number, number]))), [coaches]);
  const wheels = useMemo(() => cars.flatMap((z) => [-1.25, 1.25].flatMap((offset) => [-0.78, 0.78].flatMap((x) => [-0.24, 0.24].map((axle) => [x, 0.34, z + offset + axle] as [number, number, number])))), [cars]);

  return (
    <group position={[5, 0, 0]}>
      <InstancedSeatParts positions={coaches.map((z) => [0, 1.45, z] as [number, number, number])} size={[2.2, 2.3, 4]} color="#c8d7df" />
      <InstancedSeatParts positions={coaches.map((z) => [0, 2.77, z] as [number, number, number])} size={[2.06, 0.13, 3.8]} color="#8299a8" />
      <InstancedSeatParts positions={stripes} size={[0.035, 0.16, 3.8]} color="#1687b5" />
      <InstancedSeatParts positions={bogies} size={[1.85, 0.2, 0.68]} color="#344452" />
      <InstancedSeatParts positions={axles} size={[1.55, 0.08, 0.12]} color="#77848c" />
      <group position={[0, 0, cars[0]]}>
        <mesh position={[0, 1.45, 0]}><boxGeometry args={[2.3, 2.55, 4.2]} /><meshStandardMaterial color="#16527c" metalness={0.32} roughness={0.42} /></mesh>
        <mesh position={[0, 2.8, 0]}><boxGeometry args={[2.12, 0.14, 3.9]} /><meshStandardMaterial color="#6d9db5" metalness={0.55} roughness={0.3} /></mesh>
        <mesh position={[0, 2.05, 2.1]}><boxGeometry args={[1.25, 0.65, 0.05]} /><meshStandardMaterial color="#8ec7dd" metalness={0.32} roughness={0.18} emissive="#367893" emissiveIntensity={0.2} /></mesh>
        {[-0.72, 0.72].map((x) => <mesh key={x} position={[x, 1.02, 2.17]}><sphereGeometry args={[0.16, 12, 10]} /><meshStandardMaterial color="#fff3c4" emissive="#ffbf50" emissiveIntensity={2.2} /></mesh>)}
        <group position={[0, 2.83, -0.1]}><mesh position={[0, 0.06, 0]}><boxGeometry args={[0.72, 0.12, 0.55]} /><meshStandardMaterial color="#344452" metalness={0.7} roughness={0.3} /></mesh>
          {[-0.27, 0.27].map((x) => <mesh key={x} position={[x * 0.5, 1.38, 0]} rotation={[0, 0, x < 0 ? -0.19 : 0.19]}><boxGeometry args={[0.075, 2.72, 0.07]} /><meshStandardMaterial color="#d2d9dd" metalness={0.85} roughness={0.28} /></mesh>)}
          <mesh position={[0, 2.76, 0]}><boxGeometry args={[1.05, 0.07, 0.1]} /><meshStandardMaterial color="#e6ecef" metalness={0.9} roughness={0.22} /></mesh>
        </group>
      </group>
      <InstancedSeatParts positions={windows} size={[0.035, 0.75, 0.56]} color="#ffd38b" emissive="#9d6127" />
      <InstancedSeatParts positions={doors} size={[0.035, 1.65, 0.28]} color="#e7b351" />
      <InstancedSeatParts positions={passengers} size={[0.18, 0.42, 0.05]} color="#263749" />
      <InstancedSeatParts positions={passengerHeads} size={[0.14, 0.16, 0.05]} color="#bd8e70" />
      <InstancedWheelParts positions={wheels} />
    </group>
  );
}

function OverheadEquipment() {
  const dropperPositions = useMemo(() => Array.from({ length: 25 }, (_, index) => {
    const z = -46 + index * 3;
    return [-0.27, 0.27].map((x) => [x, 6.08, z] as [number, number, number]);
  }).flat(), []);
  const supports = [-39, -27, -15, -3, 9, 21, 33];

  return (
    <group>
      {/* Shared twin-track 25 kV OHE: catenaries, contact wires, droppers and portals. */}
      {[0, 5].map((track) => <group key={`wire-${track}`} position={[track, 0, 0]}>
        {[-0.27, 0.27].map((x) => <group key={x}>
          <mesh position={[x, 5.68, -10]}><boxGeometry args={[0.05, 0.05, 74]} /><meshStandardMaterial color="#f0cb7f" metalness={0.74} roughness={0.27} emissive="#5b4522" emissiveIntensity={0.16} /></mesh>
          <mesh position={[x, 6.49, -10]}><boxGeometry args={[0.04, 0.04, 74]} /><meshStandardMaterial color="#c9d3d9" metalness={0.85} roughness={0.25} /></mesh>
        </group>)}
      </group>)}
      <InstancedSeatParts positions={[...dropperPositions, ...dropperPositions.map(([x, y, z]) => [x + 5, y, z] as [number, number, number])]} size={[0.03, 0.82, 0.03]} color="#d6dfe2" />
      {supports.map((z) => (
        <group key={`ohe-${z}`} position={[0, 0, z]}>
          {[-2.55, 7.55].map((x) => <mesh key={x} position={[x, 3.63, 0]}><boxGeometry args={[0.13, 7.25, 0.13]} /><meshStandardMaterial color="#82909a" metalness={0.78} roughness={0.4} /></mesh>)}
          {[0, 5].flatMap((track) => [-0.27, 0.27].map((offset) => <group key={`${track}-${offset}`}>
            <mesh position={[track + offset, 6.55, 0]}><boxGeometry args={[0.1, 0.78, 0.1]} /><meshStandardMaterial color="#c4d2d9" metalness={0.28} roughness={0.34} /></mesh>
            <mesh position={[track + offset, 6.97, 0]}><boxGeometry args={[Math.abs(track + offset + 2.55), 0.1, 0.1]} /><meshStandardMaterial color="#89969e" metalness={0.8} roughness={0.36} /></mesh>
          </group>))}
          <mesh position={[2.5, 7.17, 0]}><boxGeometry args={[10.25, 0.12, 0.12]} /><meshStandardMaterial color="#82909a" metalness={0.78} roughness={0.4} /></mesh>
        </group>
      ))}
    </group>
  );
}

function CameraJourney({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame(({ camera, clock, size }) => {
    if (reducedMotion) {
      camera.position.set(-16, 7.2, 5);
      camera.lookAt(2.5, 1.2, -10);
      return;
    }
    const elapsed = clock.getElapsedTime() % 90;
    if (elapsed < 10) {
      camera.position.set(0, 1.58, 2.35);
      camera.lookAt(0, 1.58, -12);
      return;
    }
    const ease = (value: number) => {
      const t = THREE.MathUtils.clamp(value, 0, 1);
      return t * t * (3 - 2 * t);
    };
    const lerp = THREE.MathUtils.lerp;
    const portraitDistance = size.width / Math.max(size.height, 1) < 0.8 ? 1.12 : 1;
    if (elapsed < 14) {
      const p = ease((elapsed - 10) / 4);
      camera.position.set(0, lerp(1.58, 4.8, p), lerp(2.35, 6.2, p));
      camera.lookAt(lerp(0, 2.5, p), lerp(1.58, 1.4, p), lerp(-12, -10, p));
      return;
    }
    if (elapsed < 42) {
      const angle = ((elapsed - 14) / 28) * Math.PI * 2;
      camera.position.set(2.5 + Math.sin(angle) * 17 * portraitDistance, 4.7 + Math.sin(angle * 2) * 0.65, -10 + Math.cos(angle) * 15 * portraitDistance);
      camera.lookAt(2.5, 1.25, -10);
      return;
    }
    if (elapsed < 62) {
      const angle = ((elapsed - 42) / 20) * Math.PI * 2;
      camera.position.set(2.5 + Math.sin(angle) * 21 * portraitDistance, 13.5 + Math.sin(angle * 2) * 1.2, -10 + Math.cos(angle) * 22 * portraitDistance);
      camera.lookAt(2.5, 0.3, -10);
      return;
    }
    if (elapsed < 80) {
      const angle = ((elapsed - 62) / 18) * Math.PI * 2;
      camera.position.set(2.5 + Math.sin(angle) * 12.5 * portraitDistance, 4.7 + Math.sin(angle * 2) * 0.35, -10 + Math.cos(angle) * 9.5 * portraitDistance);
      camera.lookAt(3.1, 1.35, -10);
      return;
    }
    const p = ease((elapsed - 80) / 10);
    camera.position.set(lerp(2.5, 0, p), lerp(4.7, 1.58, p), lerp(-0.5, 2.35, p));
    camera.lookAt(lerp(2.5, 0, p), 1.58, lerp(-10, -12, p));
  });
  return null;
}

export default function HeroTrainBackground() {
  const container = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={container} className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_54%,#263947_0%,#101923_78%)]" />
      <Canvas
        className="home-hero-canvas absolute inset-0 !h-full !w-full"
        camera={{ position: reducedMotion ? [-11, 5.2, 2.5] : [0, 4.2, 0.5], fov: 58, near: 0.1, far: 150 }}
        onCreated={({ camera }) => {
          camera.lookAt(0, 0.8, -10);
        }}
        dpr={[1, 1.1]}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        frameloop={reducedMotion || !isVisible ? 'never' : 'always'}
        performance={{ min: 0.65 }}
        fallback={<div className="absolute inset-0 bg-slate-950" />}
      >
        <CameraJourney reducedMotion={reducedMotion} />
        <ambientLight intensity={1.65} color="#d3e5f2" />
        <directionalLight position={[4, 7, 5]} intensity={2.05} color="#f2f6fa" />
        <CoachInterior paused={reducedMotion} />
        <MovingRake paused={reducedMotion} />
      </Canvas>
      <div className="home-scene-wash" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#101923]/35 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#101923]/55 to-transparent pointer-events-none" />
    </div>
  );
}
