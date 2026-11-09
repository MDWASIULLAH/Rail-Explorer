'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface WalkthroughCameraProps {
  initialPosition?: [number, number, number];
  bounds?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  autoTour?: boolean;
  targetBayX?: number | null;
  speedMultiplier?: number;
  virtualMove?: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    turnLeft?: boolean;
    turnRight?: boolean;
  };
}

export default function WalkthroughCamera({
  initialPosition = [2.2, 1.55, 0],
  bounds = { minX: 1.5, maxX: 22.2, minZ: -0.65, maxZ: 0.65 },
  autoTour = false,
  targetBayX = null,
  speedMultiplier = 1.0,
  virtualMove = { forward: false, backward: false, left: false, right: false },
}: WalkthroughCameraProps) {
  const { camera, gl } = useThree();
  const keys = useRef<{ [key: string]: boolean }>({});
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation = useRef({ yaw: -Math.PI / 2, pitch: 0 }); // Look down aisle (+X axis)
  const wheelDelta = useRef(0);
  const autoTourDirection = useRef<1 | -1>(1);

  // Setup initial camera
  useEffect(() => {
    camera.position.set(...initialPosition);
    camera.rotation.order = 'YXZ';
    rotation.current.yaw = -Math.PI / 2;
    rotation.current.pitch = 0;
    camera.rotation.y = rotation.current.yaw;
    camera.rotation.x = rotation.current.pitch;
  }, [camera, initialPosition]);

  // Smooth jump to target bay when user clicks a Bay button
  useEffect(() => {
    if (targetBayX !== null && targetBayX !== undefined) {
      camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, targetBayX));
      camera.position.z = 0; // Center in aisle
      camera.position.y = 1.55;
    }
  }, [targetBayX, bounds, camera]);

  // Keyboard handlers (WASD + Arrows + Shift)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      keys.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse wheel scroll to walk forward / backward effortlessly
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent page scroll when walking inside 3D coach
      e.preventDefault();
      wheelDelta.current += e.deltaY * 0.005;
    };

    const domElement = gl.domElement;
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      domElement.removeEventListener('wheel', handleWheel);
    };
  }, [gl]);

  // Mouse drag & Touch look handlers
  useEffect(() => {
    const domElement = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      // Primary left click or touch begins look rotation
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      const sensitivity = 0.0035;
      rotation.current.yaw -= deltaX * sensitivity;
      rotation.current.pitch -= deltaY * sensitivity;

      // Clamp pitch to avoid gimbal flip
      rotation.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, rotation.current.pitch));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Touch support for mobile devices and trackpads
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;
      const sensitivity = 0.0045;

      rotation.current.yaw -= deltaX * sensitivity;
      rotation.current.pitch -= deltaY * sensitivity;
      rotation.current.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, rotation.current.pitch));

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl]);

  // Main Movement & Camera Frame Loop
  useFrame((_, delta) => {
    // Handle turning buttons (virtual or Q/E)
    if (virtualMove?.turnLeft || keys.current['KeyQ']) {
      rotation.current.yaw += 1.8 * delta;
    }
    if (virtualMove?.turnRight || keys.current['KeyE']) {
      rotation.current.yaw -= 1.8 * delta;
    }

    // Apply camera rotation
    camera.rotation.y = rotation.current.yaw;
    camera.rotation.x = rotation.current.pitch;

    // Movement speed (base 2.8 m/s, sprint 5.5 m/s)
    const isSprint = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const baseSpeed = (isSprint ? 5.5 : 2.8) * speedMultiplier;
    const moveVector = new THREE.Vector3(0, 0, 0);

    // 1. Auto-Tour Glide mode
    if (autoTour) {
      const tourSpeed = 2.2 * speedMultiplier;
      camera.position.x += autoTourDirection.current * tourSpeed * delta;

      // Reverse direction at coach ends
      if (camera.position.x >= bounds.maxX - 0.5) {
        autoTourDirection.current = -1;
      } else if (camera.position.x <= bounds.minX + 0.5) {
        autoTourDirection.current = 1;
      }
    } else {
      // 2. Physical Keyboard & Virtual D-Pad Inputs
      // Forward/backward
      if (keys.current['KeyW'] || keys.current['ArrowUp'] || keys.current['w'] || keys.current['W'] || virtualMove?.forward) {
        moveVector.z -= 1;
      }
      if (keys.current['KeyS'] || keys.current['ArrowDown'] || keys.current['s'] || keys.current['S'] || virtualMove?.backward) {
        moveVector.z += 1;
      }
      // Strafe left/right
      if (keys.current['KeyA'] || keys.current['ArrowLeft'] || keys.current['a'] || keys.current['A'] || virtualMove?.left) {
        moveVector.x -= 1;
      }
      if (keys.current['KeyD'] || keys.current['ArrowRight'] || keys.current['d'] || keys.current['D'] || virtualMove?.right) {
        moveVector.x += 1;
      }

      if (moveVector.lengthSq() > 0) {
        moveVector.normalize();
        // Apply yaw rotation so forward aligns with look direction
        moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current.yaw);

        camera.position.x += moveVector.x * baseSpeed * delta;
        camera.position.z += moveVector.z * baseSpeed * delta;
      }

      // 3. Mouse Wheel smooth walking along aisle
      if (Math.abs(wheelDelta.current) > 0.001) {
        // Forward vector in look direction
        const forwardVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          rotation.current.yaw
        );
        camera.position.x -= forwardVector.x * wheelDelta.current * 4.0;
        camera.position.z -= forwardVector.z * wheelDelta.current * 4.0;

        // Dampen wheel delta
        wheelDelta.current *= 0.85;
        if (Math.abs(wheelDelta.current) < 0.005) {
          wheelDelta.current = 0;
        }
      }

      // Clamp position inside coach aisle boundaries
      camera.position.x = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x));
      camera.position.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z));
    }

    // Keep height constant at eye level (1.55m above floor)
    camera.position.y = 1.55;
  });

  return null;
}
