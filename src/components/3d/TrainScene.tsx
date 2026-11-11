'use client';

import { Suspense, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import FullTrainView, { type TrainCoach } from './FullTrainView';
import CoachInterior from './CoachInterior';
import WalkthroughCamera from './WalkthroughCamera';
import { COACH_BLUEPRINTS, resolveCoachBlueprint } from '@/data/coach-database';
import { trainAudio } from '@/lib/train-audio';
import {
  Volume2,
  VolumeX,
  Bell,
  Ruler,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Zap,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface TrainSceneProps {
  coaches: TrainCoach[];
  selectedCoachId: string | null;
  selectedBerthNumber: number | null;
  highlightedCoachId: string | null;
  viewMode: 'full-train' | 'coach-interior' | 'berth-detail' | 'walkthrough' | 'comparison';
  onCoachClick: (coachId: string) => void;
  onBerthClick: (berthNumber: number) => void;
  onBackToTrain: () => void;
  distanceFrom?: string | null;
  distanceTo?: string | null;
  onSelectDistanceCoaches?: (from: string | null, to: string | null) => void;
  initialIsMoving?: boolean;
  initialSpeedKmph?: number;
  trainStatusText?: string;
  stationName?: string;
  nextStationName?: string;
  distanceToNextKm?: number;
  isAtStation?: boolean;
  speedIsReported?: boolean;
  showStationEnvironment?: boolean;
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

function CameraController({
  viewMode,
  coachesCount,
  controlsRef,
  selectedBerth,
  blueprint,
  cameraPreset,
  selectedCoachId,
}: {
  viewMode: string;
  coachesCount: number;
  controlsRef: any;
  selectedBerth: number | null;
  blueprint: any;
  cameraPreset: 'railfan' | 'full-rake' | 'coach';
  selectedCoachId: string | null;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;

    if (viewMode === 'full-train') {
      const trainLen = coachesCount * 24.6;
      if (cameraPreset === 'railfan') {
        // Dynamic Railfan Action Cam: trackside close-up on locomotive nose & spinning wheels
        controlsRef.current.target.set(16, 1.8, 0);
        camera.position.set(28, 2.6, 12);
        controlsRef.current.update();
      } else if (cameraPreset === 'coach') {
        // Coach window side cam
        controlsRef.current.target.set(45, 1.8, 0);
        camera.position.set(52, 2.5, 9.5);
        controlsRef.current.update();
      } else {
        // Full train cinematic overview - perfectly centered vertically & horizontally
        const targetX = trainLen / 2;
        // Center vertically on train: target y = 0.5
        controlsRef.current.target.set(targetX, 0.5, 0);
        // Responsive camera distance and elevation:
        // Position camera at y = 3.2 (just above train centerline) with gentle angle
        const aspect = typeof window !== 'undefined' ? window.innerWidth / Math.max(1, window.innerHeight) : 1.77;
        const zDist = aspect < 1.0
          ? Math.max(70, Math.min(135, (trainLen * 0.36) / aspect))
          : Math.max(55, Math.min(105, trainLen * 0.28));
        camera.position.set(targetX, 3.2, zDist);
        controlsRef.current.update();
      }
    } else if (viewMode === 'coach-interior') {
      controlsRef.current.target.set(12, 1.3, 0);
      camera.position.set(12, 3.2, 5.5);
      controlsRef.current.update();
    } else if (viewMode === 'berth-detail' && selectedBerth && blueprint) {
      const berth = blueprint.berths?.find((b: any) => b.berthNumber === selectedBerth);
      if (berth) {
        controlsRef.current.target.set(berth.x, berth.y, berth.z);
        camera.position.set(berth.x + 1.2, berth.y + 0.9, berth.z + 1.6);
        controlsRef.current.update();
      }
    }
  }, [viewMode, coachesCount, camera, controlsRef, selectedBerth, blueprint, cameraPreset, selectedCoachId]);

  return null;
}

export default function TrainScene({
  coaches,
  selectedCoachId,
  selectedBerthNumber,
  highlightedCoachId,
  viewMode,
  onCoachClick,
  onBerthClick,
  onBackToTrain,
  distanceFrom,
  distanceTo,
  onSelectDistanceCoaches,
  initialIsMoving = true,
  initialSpeedKmph = 88,
  trainStatusText = 'RUNNING ON TIME',
  stationName = 'Indian Railways Station',
  nextStationName = 'Upcoming Junction',
  distanceToNextKm = 10,
  isAtStation,
  speedIsReported = false,
  showStationEnvironment = false,
}: TrainSceneProps) {
  const controlsRef = useRef<any>(null);
  const [isWalkthrough, setIsWalkthrough] = useState(false);
  // Default to active running motion at 88 km/h cruising speed
  const [isMoving, setIsMoving] = useState(true);
  const [speedKmph, setSpeedKmph] = useState(initialSpeedKmph > 0 ? initialSpeedKmph : 88);
  const [isAtStationState, setIsAtStationState] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [showCouplerGaps, setShowCouplerGaps] = useState(true);
  const [isHornActive, setIsHornActive] = useState(false);

  // Environment & Camera Preset States (Night and Full Rake as DEFAULT!)
  const [skyMode, setSkyMode] = useState<'daylight' | 'sunset' | 'night'>('night');
  const [cameraPreset, setCameraPreset] = useState<'railfan' | 'full-rake' | 'coach'>('full-rake');
  const [isCaliperOpen, setIsCaliperOpen] = useState(false);
  const [isExploded, setIsExploded] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isDpadOpen, setIsDpadOpen] = useState(false);

  // Walkthrough Interactive States
  const [autoTour, setAutoTour] = useState(false);
  const [targetBayX, setTargetBayX] = useState<number | null>(null);
  const [walkSpeedMult, setWalkSpeedMult] = useState(1.0);
  const [virtualMove, setVirtualMove] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    turnLeft: false,
    turnRight: false,
  });

  // Local state for 3D distance measurement dropdowns
  const [localFrom, setLocalFrom] = useState<string>(distanceFrom || 'LOCO');
  const [localTo, setLocalTo] = useState<string>(distanceTo || selectedCoachId || 'S1');

  // Sync speed if live status provides a reported positive speed
  useEffect(() => {
    if (initialSpeedKmph && initialSpeedKmph > 0) {
      setSpeedKmph(initialSpeedKmph);
    }
  }, [initialSpeedKmph]);

  // Sync external distance props
  useEffect(() => {
    if (distanceFrom) setLocalFrom(distanceFrom);
    if (distanceTo) setLocalTo(distanceTo);
    else if (selectedCoachId) setLocalTo(selectedCoachId);
  }, [distanceFrom, distanceTo, selectedCoachId]);

  // Auto reset walkthrough when switching back to full-train
  useEffect(() => {
    if (viewMode === 'full-train') {
      setIsWalkthrough(false);
      setAutoTour(false);
      setTargetBayX(null);
    }
  }, [viewMode]);

  // Manage track rhythm audio proportional to motion and sound toggle
  useEffect(() => {
    if (isMoving && isSoundEnabled && viewMode === 'full-train') {
      trainAudio.setMuted(false);
      trainAudio.startTrackRhythm(speedKmph);
    } else {
      trainAudio.stopTrackRhythm();
    }

    return () => {
      trainAudio.stopTrackRhythm();
    };
  }, [isMoving, isSoundEnabled, speedKmph, viewMode]);

  // Handle Honking Locomotive Horn
  const handleHonkHorn = useCallback(() => {
    setIsHornActive(true);
    trainAudio.setMuted(false);
    trainAudio.playHorn(1.2);
    setTimeout(() => setIsHornActive(false), 1200);
  }, []);

  // Handle Sound Toggle
  const handleToggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      trainAudio.setMuted(!next);
      return next;
    });
  }, []);

  // Handle Coach selection for 3D distance measurement
  const handleFromChange = (coachId: string) => {
    setLocalFrom(coachId);
    if (onSelectDistanceCoaches) {
      onSelectDistanceCoaches(coachId === 'LOCO' ? null : coachId, localTo);
    }
  };

  const handleToChange = (coachId: string) => {
    setLocalTo(coachId);
    if (onSelectDistanceCoaches) {
      onSelectDistanceCoaches(localFrom === 'LOCO' ? null : localFrom, coachId);
    }
  };

  // Get selected coach blueprint, fallback to AC3 or Sleeper
  const selectedBlueprint = selectedCoachId
    ? COACH_BLUEPRINTS[resolveCoachBlueprint(selectedCoachId)]
    : COACH_BLUEPRINTS['LHB_3A'] || COACH_BLUEPRINTS['LHB_SL'];

  // Get highlighted berths from surrounding
  const highlightedBerths: number[] = [];
  if (selectedBerthNumber && selectedBlueprint) {
    const berth = selectedBlueprint.berths.find((b) => b.berthNumber === selectedBerthNumber);
    if (berth) {
      selectedBlueprint.berths
        .filter((b) => b.bayNumber === berth.bayNumber && b.berthNumber !== selectedBerthNumber)
        .forEach((b) => highlightedBerths.push(b.berthNumber));
    }
  }

  const effectiveWalkthrough = isWalkthrough || viewMode === 'walkthrough';

  // Compute Bay positions for Quick-Jump in Walkthrough
  const coachLen = (selectedBlueprint?.dimensions.lengthOverBody || 23540) / 1000;
  const totalBays = selectedBlueprint?.totalBays || 9;
  const bayPositions = Array.from({ length: totalBays }, (_, i) => ({
    bayNumber: i + 1,
    x: 2.0 + (i + 0.5) * ((coachLen - 4) / totalBays),
  }));

  // Compute canvas background gradient according to sky mode
  const canvasBgClass =
    skyMode === 'daylight'
      ? '!bg-gradient-to-b from-sky-400 via-sky-200 to-amber-50'
      : skyMode === 'sunset'
      ? '!bg-gradient-to-b from-indigo-950 via-rose-900 to-amber-600'
      : '!bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950';

  return (
    <div className="w-full h-full relative select-none">
      <Canvas shadows className={canvasBgClass}>
        <PerspectiveCamera makeDefault position={[160, 3.2, 85]} fov={50} near={0.1} far={2000} />

        <CameraController
          viewMode={viewMode}
          coachesCount={coaches.length}
          controlsRef={controlsRef}
          selectedBerth={selectedBerthNumber}
          blueprint={selectedBlueprint}
          cameraPreset={cameraPreset}
          selectedCoachId={selectedCoachId}
        />

        {effectiveWalkthrough && viewMode !== 'full-train' ? (
          <WalkthroughCamera
            autoTour={autoTour}
            targetBayX={targetBayX}
            speedMultiplier={walkSpeedMult}
            virtualMove={virtualMove}
          />
        ) : (
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            maxPolarAngle={Math.PI * 0.85}
            minDistance={viewMode === 'full-train' ? 6 : 1}
            maxDistance={viewMode === 'full-train' ? 550 : 35}
          />
        )}

        {/* Dynamic Sky Mode Lighting */}
        {skyMode === 'daylight' ? (
          <>
            <ambientLight intensity={0.7} color="#f0f9ff" />
            <directionalLight
              position={[60, 80, 40]}
              intensity={1.6}
              color="#fffbeb"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-40, 30, -30]} intensity={0.5} color="#bae6fd" />
            <hemisphereLight args={['#38bdf8', '#4d7c0f', 0.6]} />
            <fog attach="fog" args={['#bae6fd', 250, 950]} />
          </>
        ) : skyMode === 'sunset' ? (
          <>
            <ambientLight intensity={0.5} color="#fde047" />
            <directionalLight
              position={[80, 30, 40]}
              intensity={1.5}
              color="#fb923c"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[-40, 20, -20]} intensity={0.4} color="#f43f5e" />
            <hemisphereLight args={['#fb923c', '#78350f', 0.5]} />
            <fog attach="fog" args={['#ea580c', 200, 750]} />
          </>
        ) : (
          <>
            <ambientLight intensity={0.65} color="#94a3b8" />
            <directionalLight
              position={[(coaches.length * 24.6) / 2, 22, 50]}
              intensity={1.25}
              color="#cbd5e1"
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <directionalLight position={[(coaches.length * 24.6) / 2, 14, -30]} intensity={0.4} color="#64748b" />
            <hemisphereLight args={['#334155', '#0f172a', 0.5]} />
            <Stars radius={250} depth={80} count={2400} factor={4} fade speed={0.5} />
            <fog attach="fog" args={['#090d16', 180, 800]} />
          </>
        )}

        {/* Coach Interior Specific Lights */}
        {(viewMode === 'coach-interior' || viewMode === 'berth-detail' || viewMode === 'walkthrough') && (
          <>
            <pointLight position={[6, 2.2, 0]} intensity={2.0} distance={14} color="#fef08a" />
            <pointLight position={[12, 2.2, 0]} intensity={2.2} distance={14} color="#ffffff" />
            <pointLight position={[18, 2.2, 0]} intensity={2.0} distance={14} color="#fef08a" />
          </>
        )}

        <Suspense fallback={<LoadingFallback />}>
          {viewMode === 'full-train' ? (
            <FullTrainView
              coaches={coaches}
              selectedCoachId={selectedCoachId}
              highlightedCoachId={highlightedCoachId}
              onCoachClick={onCoachClick}
              distanceFrom={localFrom === 'LOCO' ? null : localFrom}
              distanceTo={localTo}
              isMoving={isMoving}
              speedKmph={speedKmph}
              stationName={stationName}
              nextStationName={nextStationName}
              distanceToNextKm={distanceToNextKm}
              isAtStation={isAtStationState}
              showCouplerGaps={showCouplerGaps}
              isExploded={isExploded}
            />
          ) : (
            selectedBlueprint && (
              <CoachInterior
                blueprint={selectedBlueprint}
                selectedBerth={selectedBerthNumber}
                highlightedBerths={highlightedBerths}
                onBerthClick={onBerthClick}
              />
            )
          )}
        </Suspense>
      </Canvas>

      {/* ======================================================== */}
      {/* UNIFIED TOP BAR: Clean, Minimal, Non-Overlapping HUD     */}
      {/* ======================================================== */}
      <div className="absolute top-2 inset-x-2 sm:top-4 sm:inset-x-6 flex items-center justify-between gap-1.5 sm:gap-2 z-20 pointer-events-none">
        {/* Left: Compact Speed & Status Pill OR Back Button */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 shrink-0">
          {viewMode !== 'full-train' ? (
            <>
              <button
                onClick={onBackToTrain}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl backdrop-blur border border-slate-700 transition flex items-center gap-1 shadow-xl active:scale-95"
              >
                <span>←</span>
                <span>Train</span>
              </button>

              <span className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-blue-600/90 text-white text-xs font-bold rounded-xl border border-blue-400 backdrop-blur shadow">
                Coach {selectedCoachId || 'S1'}
              </span>

              <button
                onClick={() => {
                  const next = !effectiveWalkthrough;
                  setIsWalkthrough(next);
                  if (!next) {
                    setAutoTour(false);
                    setTargetBayX(null);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-xl backdrop-blur border transition flex items-center gap-1 shadow-xl active:scale-95 ${
                  effectiveWalkthrough
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400 font-black'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-white border-slate-700'
                }`}
              >
                <span>🚶</span>
                <span className="hidden xs:inline">{effectiveWalkthrough ? 'Exit Walk' : 'Walk'}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-800 shadow-xl text-xs text-white max-w-[280px] sm:max-w-md">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isMoving ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-mono font-black text-amber-400 text-xs sm:text-sm shrink-0">
                {isMoving ? speedKmph : 0}{' '}
                <span className="text-[10px] text-slate-400 font-normal">km/h</span>
              </span>
              <span className="hidden xs:inline text-slate-600">·</span>
              <span className="hidden xs:inline text-[11px] text-slate-200 font-medium truncate">
                {isMoving
                  ? `Approaching ${nextStationName || 'Station'} (${distanceToNextKm || 10} km)`
                  : `Halted at ${stationName || 'Station'} (PF 2)`}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Quick Controls Bar (sm:hidden) */}
        <div className="flex sm:hidden items-center gap-1.5 pointer-events-auto">
          {viewMode === 'full-train' && (
            <button
              onClick={() => {
                const nextMoving = !isMoving;
                setIsMoving(nextMoving);
                setIsAtStationState(!nextMoving);
                if (nextMoving && speedKmph === 0) setSpeedKmph(88);
              }}
              className={`px-2 py-1 rounded-xl font-black text-[10px] transition border flex items-center gap-1 shadow-md ${
                isMoving
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                  : 'bg-amber-500 text-slate-950 border-amber-300'
              }`}
            >
              <span>{isMoving ? '⏸' : '▶'}</span>
              <span>{isMoving ? `${speedKmph}k` : 'Halt'}</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
            className="px-2.5 py-1 rounded-xl bg-slate-900/90 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1 shadow-lg backdrop-blur-md active:scale-95"
          >
            <span>⚙️ View</span>
          </button>
        </div>

        {/* Mobile Expanded View Drawer Popover */}
        {isMobileControlsOpen && (
          <div className="sm:hidden absolute top-14 right-3 z-30 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-in fade-in duration-150 w-64 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-bold text-white">3D View Controls</span>
              <button
                onClick={() => setIsMobileControlsOpen(false)}
                className="text-xs text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Sky */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Environment</span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setSkyMode('night')}
                  className={`py-1 rounded-lg text-xs font-bold ${skyMode === 'night' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  🌌 Night
                </button>
                <button
                  onClick={() => setSkyMode('daylight')}
                  className={`py-1 rounded-lg text-xs font-bold ${skyMode === 'daylight' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                >
                  ☀️ Day
                </button>
                <button
                  onClick={() => setSkyMode('sunset')}
                  className={`py-1 rounded-lg text-xs font-bold ${skyMode === 'sunset' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  🌅 Sunset
                </button>
              </div>
            </div>

            {/* Camera Presets in Full Train */}
            {viewMode === 'full-train' && (
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Camera Mode</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setCameraPreset('full-rake')}
                    className={`py-1 rounded-lg text-xs font-bold ${cameraPreset === 'full-rake' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    🚆 Overview
                  </button>
                  <button
                    onClick={() => setCameraPreset('railfan')}
                    className={`py-1 rounded-lg text-xs font-bold ${cameraPreset === 'railfan' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    🎥 Action
                  </button>
                  <button
                    onClick={() => setCameraPreset('coach')}
                    className={`py-1 rounded-lg text-xs font-bold ${cameraPreset === 'coach' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                  >
                    💺 Side
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-800 text-xs">
              {viewMode === 'full-train' && (
                <button
                  onClick={() => setIsExploded(!isExploded)}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold ${isExploded ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  💥 {isExploded ? 'Exploded' : 'Explode'}
                </button>
              )}
              <button
                onClick={handleHonkHorn}
                className="py-1 px-2.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
              >
                🔔 Horn
              </button>
              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border ${isSoundEnabled ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Desktop Full Control Dock (hidden sm:flex) */}
        <div className="hidden sm:flex pointer-events-auto items-center bg-slate-950/90 backdrop-blur-md p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 shadow-2xl gap-0.5 sm:gap-1 text-xs">
          {/* Sky Switcher (Default: Night!) */}
          <div className="flex items-center bg-slate-900/90 rounded-lg sm:rounded-xl p-0.5 border border-slate-800">
            <button
              onClick={() => setSkyMode('night')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                skyMode === 'night'
                  ? 'bg-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Night Express (Default)"
            >
              <span>🌌</span>
              <span className="hidden md:inline">Night</span>
            </button>
            <button
              onClick={() => setSkyMode('daylight')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                skyMode === 'daylight'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Bright Daylight Corridor"
            >
              <span>☀️</span>
              <span className="hidden md:inline">Day</span>
            </button>
            <button
              onClick={() => setSkyMode('sunset')}
              className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                skyMode === 'sunset'
                  ? 'bg-orange-500 text-white shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Golden Sunset"
            >
              <span>🌅</span>
              <span className="hidden md:inline">Sunset</span>
            </button>
          </div>

          <div className="h-3.5 w-px bg-slate-800 my-auto" />

          {/* Camera Presets in Full Train View (Full as first & default!) */}
          {viewMode === 'full-train' && (
            <>
              <div className="flex items-center bg-slate-900/90 rounded-lg sm:rounded-xl p-0.5 border border-slate-800">
                <button
                  onClick={() => setCameraPreset('full-rake')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    cameraPreset === 'full-rake'
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Full Train Bird's Eye Overview (Default)"
                >
                  <span>🚆</span>
                  <span className="hidden lg:inline">Full</span>
                </button>
                <button
                  onClick={() => setCameraPreset('railfan')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    cameraPreset === 'railfan'
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Railfan Action Cam"
                >
                  <span>🎥</span>
                  <span className="hidden lg:inline">Action</span>
                </button>
                <button
                  onClick={() => setCameraPreset('coach')}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    cameraPreset === 'coach'
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Coach Side Cam"
                >
                  <span>💺</span>
                  <span className="hidden lg:inline">Coach</span>
                </button>

                {/* Auto Explode Rake Button */}
                <button
                  onClick={() => setIsExploded(!isExploded)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    isExploded
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md font-black animate-pulse'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Auto Explode Rake: Separate coaches with live HUD details"
                >
                  <span>💥</span>
                  <span className="hidden lg:inline">{isExploded ? 'Exploded' : 'Explode'}</span>
                </button>
              </div>
              <div className="h-3.5 w-px bg-slate-800 my-auto" />
            </>
          )}

          {/* Honk Horn */}
          <button
            onClick={handleHonkHorn}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-bold text-xs transition border flex items-center gap-1 active:scale-95 ${
              isHornActive
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400 animate-pulse font-black'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
            }`}
            title="Play authentic Indian Railways WAP-7 dual-tone horn"
          >
            <Bell className={`w-3.5 h-3.5 ${isHornActive ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">Honk</span>
          </button>

          {/* Motion & Station Toggle: Switch between running towards distant station and halted at platform */}
          {viewMode === 'full-train' && (
            <button
              onClick={() => {
                const nextMoving = !isMoving;
                setIsMoving(nextMoving);
                setIsAtStationState(!nextMoving);
                if (nextMoving && speedKmph === 0) {
                  setSpeedKmph(88);
                }
              }}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs transition border flex items-center gap-1 active:scale-95 whitespace-nowrap shadow-md ${
                isMoving
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-300 ring-2 ring-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-500/40'
              }`}
              title={
                isMoving
                  ? 'Train is cruising on track. Click to halt at station platform.'
                  : 'Train is halted at platform. Click to depart and run on track.'
              }
            >
              <span className="text-xs">{isMoving ? '⏸' : '▶'}</span>
              <span>{isMoving ? 'Running' : 'Halted'}</span>
              <span className="hidden sm:inline text-[9px] font-mono opacity-90">
                {isMoving ? `(${speedKmph} km/h)` : '(PF 2)'}
              </span>
            </button>
          )}

          {/* Audio Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition border active:scale-95 ${
              isSoundEnabled
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isSoundEnabled ? 'Track Sound ON' : 'Track Sound OFF'}
          >
            {isSoundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Coupler Gaps Toggle in Full Train View */}
          {viewMode === 'full-train' && (
            <button
              onClick={() => setShowCouplerGaps(!showCouplerGaps)}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition border active:scale-95 ${
                showCouplerGaps
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
              title={showCouplerGaps ? 'Hide 0.60m Coupler Gaps' : 'Show 0.60m Coupler Gaps'}
            >
              <Ruler className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* WALKTHROUGH MODE: INTERACTIVE ON-SCREEN CONTROLS        */}
      {/* ======================================================== */}
      {effectiveWalkthrough && viewMode !== 'full-train' && (
        <>
          {/* Top Center: Bay Jumper Selector */}
          <div className="absolute top-12 sm:top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-2.5 py-1 sm:px-3 sm:py-1.5 shadow-2xl flex items-center gap-1 sm:gap-1.5 max-w-[94vw] overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 whitespace-nowrap mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3" />
              <span>Bay:</span>
            </span>
            {bayPositions.map((b) => (
              <button
                key={`bay-btn-${b.bayNumber}`}
                onClick={() => {
                  setAutoTour(false);
                  setTargetBayX(b.x);
                }}
                className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-bold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-400 transition shadow-sm whitespace-nowrap active:scale-95"
              >
                Bay {b.bayNumber}
              </button>
            ))}
          </div>

          {/* Bottom Left: Collapsible Virtual D-Pad / Touch Walk Controls */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-auto">
            {!isDpadOpen && (
              <button
                onClick={() => setIsDpadOpen(true)}
                className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-950/90 border border-blue-500/50 text-blue-300 font-bold text-xs flex items-center gap-1.5 shadow-2xl backdrop-blur-md active:scale-95"
              >
                <span>🚶 Controls</span>
              </button>
            )}

            <div
              className={`${
                !isDpadOpen ? 'hidden sm:block' : 'block'
              } bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-2xl p-2.5 sm:p-3 shadow-2xl space-y-2`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <span>🚶</span>
                  <span>Walk Controls</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWalkSpeedMult((prev) => (prev === 1.0 ? 2.0 : 1.0))}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                      walkSpeedMult > 1.0
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                    title="Toggle between Normal Walk and Jog Speed"
                  >
                    <Zap className="w-2.5 h-2.5 inline mr-0.5" />
                    {walkSpeedMult > 1.0 ? '2x' : '1x'}
                  </button>
                  <button
                    onClick={() => setIsDpadOpen(false)}
                    className="sm:hidden p-1 text-slate-400 hover:text-white rounded"
                    title="Hide Walkpad"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* D-Pad Buttons */}
              <div className="grid grid-cols-3 gap-1.5 w-32 sm:w-36 mx-auto">
              <div />
              {/* Forward Button */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, forward: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, forward: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, forward: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, forward: false }))}
                onClick={() => {
                  setTargetBayX((prev) => (prev === null ? 3.5 : Math.min(prev + 2.0, 21.0)));
                }}
                className="h-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-400 text-white rounded-xl flex items-center justify-center font-bold shadow-lg border border-blue-400/40 active:scale-95"
                title="Walk Forward (Hold or Click / W / Up Arrow / Scroll Up)"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div />

              {/* Strafe Left */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, left: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, left: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, left: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, left: false }))}
                className="h-9 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl flex items-center justify-center font-bold border border-slate-700 active:scale-95"
                title="Step Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Backward Button */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, backward: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, backward: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, backward: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, backward: false }))}
                onClick={() => {
                  setTargetBayX((prev) => (prev === null ? 2.5 : Math.max(prev - 2.0, 2.0)));
                }}
                className="h-9 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl flex items-center justify-center font-bold border border-slate-700 active:scale-95"
                title="Walk Backward (Hold or Click / S / Down Arrow / Scroll Down)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Strafe Right */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, right: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, right: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, right: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, right: false }))}
                className="h-9 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded-xl flex items-center justify-center font-bold border border-slate-700 active:scale-95"
                title="Step Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Turn Left */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, turnLeft: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, turnLeft: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, turnLeft: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, turnLeft: false }))}
                className="h-8 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center border border-slate-800 active:scale-95"
                title="Turn Camera Left (Q)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Auto Tour Button */}
              <button
                onClick={() => setAutoTour((prev) => !prev)}
                className={`h-8 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center justify-center border transition shadow ${
                  autoTour
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                }`}
                title="Toggle continuous smooth walkthrough tour"
              >
                {autoTour ? 'Touring' : 'Tour'}
              </button>

              {/* Turn Right */}
              <button
                onMouseDown={() => setVirtualMove((v) => ({ ...v, turnRight: true }))}
                onMouseUp={() => setVirtualMove((v) => ({ ...v, turnRight: false }))}
                onTouchStart={() => setVirtualMove((v) => ({ ...v, turnRight: true }))}
                onTouchEnd={() => setVirtualMove((v) => ({ ...v, turnRight: false }))}
                className="h-8 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg flex items-center justify-center border border-slate-800 active:scale-95"
                title="Turn Camera Right (E)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </>
    )}

      {/* ======================================================== */}
      {/* FULL TRAIN MODE: 3D Coach-to-Coach Distance Caliper     */}
      {/* ======================================================== */}
      {viewMode === 'full-train' && (
        <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-20">
          {!isCaliperOpen ? (
            <button
              onClick={() => setIsCaliperOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl backdrop-blur-md border border-slate-700/80 shadow-xl transition active:scale-95"
            >
              <Ruler className="w-3.5 h-3.5 text-amber-400" />
              <span>3D Caliper</span>
            </button>
          ) : (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl w-72 sm:w-84 animate-fadeIn">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Ruler className="w-3.5 h-3.5 text-amber-400" />
                  <span>3D Coach Distance Caliper</span>
                </div>
                <button
                  onClick={() => setIsCaliperOpen(false)}
                  className="w-5 h-5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs font-bold"
                  title="Close Caliper"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* From dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5 truncate">
                    From
                  </label>
                  <select
                    value={localFrom}
                    onChange={(e) => handleFromChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 truncate"
                  >
                    <option value="LOCO">Loco (WAP-7)</option>
                    {coaches.map((c) => (
                      <option key={`from-${c.coachId}`} value={c.coachId}>
                        Coach {c.coachId}
                      </option>
                    ))}
                  </select>
                </div>

                <ArrowRight className="w-3.5 h-3.5 text-slate-500 mt-3 flex-shrink-0" />

                {/* To dropdown */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-0.5 truncate">
                    To
                  </label>
                  <select
                    value={localTo}
                    onChange={(e) => handleToChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 truncate"
                  >
                    {coaches.map((c) => (
                      <option key={`to-${c.coachId}`} value={c.coachId}>
                        Coach {c.coachId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* BOTTOM RIGHT: Controls Navigation Hint                  */}
      {/* ======================================================== */}
      <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 text-[10px] sm:text-[11px] text-slate-300 bg-slate-900/90 px-2.5 sm:px-3 py-1 rounded-xl backdrop-blur-md border border-slate-800 shadow-xl z-20 pointer-events-none">
        {effectiveWalkthrough ? (
          <span>🚶 D-Pad to Walk · Drag to Look</span>
        ) : (
          <span>🖱️ Drag to orbit · Scroll to zoom</span>
        )}
      </div>
    </div>
  );
}
