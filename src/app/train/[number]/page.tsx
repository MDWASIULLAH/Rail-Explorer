'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useSearchParams } from 'next/navigation';
import { useTrainStore } from '@/store/train-store';
import TrainComposition from '@/components/ui/TrainComposition';
import BerthInfoPanel from '@/components/ui/BerthInfoPanel';
import DistancePanel from '@/components/ui/DistancePanel';
import CoachSeatGrid from '@/components/ui/CoachSeatGrid';
import PlatformCoachLocator from '@/components/ui/PlatformCoachLocator';
import LiveStatusFeed from '@/components/live-status/LiveStatusFeed';
import { COACH_BLUEPRINTS, resolveCoachBlueprint } from '@/data/coach-database';
import { getOrSynthesizeTrain } from '@/data/train-directory';
import { formatBerthInfo } from '@/lib/berth-finder';
import { analyzeLiveJourney } from '@/lib/live-tracking-engine';
import StarTrainButton from '@/components/ui/StarTrainButton';
import HornButton from '@/components/ui/HornButton';
import { useAuth } from '@/context/AuthContext';
import {
  Train, Loader2, AlertCircle, MapPin, ArrowRight, Clock, Eye,
  Maximize2, ChevronRight, Navigation, Ruler, Activity, CheckCircle2,
} from 'lucide-react';

// Dynamic import of 3D scene (no SSR)
const TrainScene = dynamic(() => import('@/components/3d/TrainScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Loading 3D Engine...</p>
      </div>
    </div>
  ),
});

// Default composition when API doesn't provide one
const DEFAULT_COMPOSITION = [
  { coachId: 'EOG', coachType: 'EOG', position: 1 },
  { coachId: 'GS1', coachType: 'GS', position: 2 },
  { coachId: 'S1', coachType: 'SL', position: 3 },
  { coachId: 'S2', coachType: 'SL', position: 4 },
  { coachId: 'S3', coachType: 'SL', position: 5 },
  { coachId: 'S4', coachType: 'SL', position: 6 },
  { coachId: 'B1', coachType: '3A', position: 7 },
  { coachId: 'B2', coachType: '3A', position: 8 },
  { coachId: 'A1', coachType: '2A', position: 9 },
  { coachId: 'PC', coachType: 'PC', position: 10 },
  { coachId: 'S5', coachType: 'SL', position: 11 },
  { coachId: 'S6', coachType: 'SL', position: 12 },
  { coachId: 'SLR', coachType: 'SLR', position: 13 },
];

interface PageProps {}

function TrainExplorerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trainNumber = (params.number as string) || '18403';
  const targetCoachParam = searchParams?.get('coach');
  const targetBerthParam = searchParams?.get('berth');

  const {
    selectedTrain, trainStatus, selectedCoach, selectedBerth, isLoading, error,
    selectTrain, fetchTrainStatus, selectCoach, selectBerth, setViewMode, viewMode, clearError,
  } = useTrainStore();

  const { user } = useAuth();
  const [berthInput, setBerthInput] = useState('');
  const [distanceFrom, setDistanceFrom] = useState<string | null>(null);
  const [distanceTo, setDistanceTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'3d' | 'schedule' | 'status'>('3d');

  // 1. Immediately and synchronously get verified data for THIS EXACT trainNumber
  const verifiedFallback = useMemo(() => getOrSynthesizeTrain(trainNumber), [trainNumber]);

  // 2. Active train data: strictly match route trainNumber, NEVER use stale previous train!
  const isStoreMatching = Boolean(selectedTrain && selectedTrain.trainNumber === trainNumber);
  const activeTrain = isStoreMatching && selectedTrain ? selectedTrain : {
    trainNumber: verifiedFallback.trainNumber,
    trainName: verifiedFallback.trainName,
    origin: verifiedFallback.origin,
    destination: verifiedFallback.destination,
    classes: verifiedFallback.classes,
    schedule: null,
    route: null,
    coaches: {
      trainNumber: verifiedFallback.trainNumber,
      trainName: verifiedFallback.trainName,
      rakeType: verifiedFallback.rakeType,
      totalCoaches: verifiedFallback.coaches.length,
      coaches: verifiedFallback.coaches.map((c, i) => ({
        position: i + 1,
        coachId: c.coachId,
        coachType: c.coachType,
        coachClass: c.coachType,
        classCode: c.coachType,
        category: ['EOG', 'SLR'].includes(c.coachType)
          ? 'POWER_CAR'
          : c.coachType === 'PC'
          ? 'PANTRY'
          : 'PASSENGER',
        berthCount: c.berthCount,
      })),
    },
  };

  const analyzedJourney = useMemo(
    () => analyzeLiveJourney(
      trainNumber,
      activeTrain.trainName,
      (activeTrain.schedule || verifiedFallback) as any,
      trainStatus,
      trainStatus?.journeyDate,
    ),
    [activeTrain.schedule, activeTrain.trainName, trainNumber, trainStatus, verifiedFallback],
  );
  const analyzedPosition = analyzedJourney.position;

  // 3. Coaches strictly of THIS EXACT train
  const coaches = activeTrain.coaches?.coaches?.map((c) => ({
    coachId: c.coachId,
    coachType: c.coachType || c.coachClass || c.coachId,
    position: c.position,
  })) || verifiedFallback.coaches.map((c, i) => ({
    coachId: c.coachId,
    coachType: c.coachType,
    position: i + 1,
  }));

  // Trigger store fetch for this train, and reset view to full-train so previous train coach is never stuck
  useEffect(() => {
    if (trainNumber) {
      selectTrain(trainNumber);
      setViewMode('full-train');
    }
  }, [trainNumber, selectTrain, setViewMode]);

  useEffect(() => {
    if (!trainNumber) return;
    const timer = window.setInterval(() => fetchTrainStatus(trainNumber), 30_000);
    return () => window.clearInterval(timer);
  }, [trainNumber, fetchTrainStatus]);

  // Ensure selected coach belongs to the CURRENT train's coaches
  useEffect(() => {
    if (!coaches || coaches.length === 0) return;

    // Check if target coach param was passed in URL (e.g. ?coach=S1)
    if (targetCoachParam) {
      const paramCoach = coaches.find((c) => c.coachId.toUpperCase() === targetCoachParam.toUpperCase());
      if (paramCoach) {
        if (selectedCoach?.coachId !== paramCoach.coachId) {
          selectCoach(paramCoach.coachId, true); // explicitly requested via URL
        }
        if (targetBerthParam) {
          const bNum = parseInt(targetBerthParam);
          if (bNum && (selectedBerth?.berthNumber !== bNum || selectedBerth.coachId !== paramCoach.coachId)) {
            selectBerth(bNum, paramCoach.coachId);
          }
        }
        return;
      }
    }

    // Otherwise ensure selectedCoach exists in this train's coaches WITHOUT changing viewMode away from 'full-train'
    const coachExists = selectedCoach && coaches.some((c) => c.coachId === selectedCoach.coachId);
    if (!coachExists) {
      const firstPassenger = coaches.find(
        (c) => !['LOCO', 'EOG', 'SLR', 'END'].includes(c.coachType)
      ) || coaches[0];
      if (firstPassenger) {
        selectCoach(firstPassenger.coachId, false); // DO NOT switch viewMode! Default stays full-train!
      }
    }
  }, [coaches, selectedCoach, selectedBerth, selectCoach, selectBerth, targetCoachParam, targetBerthParam]);

  // Resolve selected coach blueprint
  const selectedBlueprint = selectedCoach
    ? COACH_BLUEPRINTS[resolveCoachBlueprint(selectedCoach.coachId)]
    : null;

  // Get berth info for selected berth
  const berthInfo = selectedCoach && selectedBerth
    ? (() => {
        const bp = selectedBlueprint || COACH_BLUEPRINTS['LHB_3A'];
        if (!bp) return null;
        return formatBerthInfo(bp, selectedBerth.berthNumber);
      })()
    : null;

  const handleBerthLookup = () => {
    const num = parseInt(berthInput);
    if (!num || !selectedCoach) return;
    selectBerth(num, selectedCoach.coachId);
  };

  const handleCoachClick = useCallback((coachId: string) => {
    selectCoach(coachId, true); // Explicit user click on coach -> switch to coach interior
  }, [selectCoach]);

  const handleBerthClick = useCallback((berthNumber: number) => {
    if (selectedCoach) {
      selectBerth(berthNumber, selectedCoach.coachId);
    }
  }, [selectedCoach, selectBerth]);

  const handleBackToTrain = useCallback(() => {
    setViewMode('full-train');
  }, [setViewMode]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Train Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Train className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {activeTrain.trainNumber}{' '}
                    <span className="font-normal text-slate-300">
                      {activeTrain.trainName}
                    </span>
                  </h1>
                  {activeTrain.origin && activeTrain.destination && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeTrain.origin.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span>{activeTrain.destination.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons & Tab navigation */}
            <div className="flex items-center gap-2 flex-wrap">
              {user && (
                <>
                  <StarTrainButton
                    trainNumber={activeTrain.trainNumber}
                    trainName={activeTrain.trainName}
                    origin={activeTrain.origin}
                    destination={activeTrain.destination}
                    size="sm"
                    showLabel={true}
                  />
                  <HornButton size="sm" showLabel={false} />
                </>
              )}

              <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
                {[
                  { key: '3d' as const, label: '3D View', icon: Eye },
                  { key: 'schedule' as const, label: 'Schedule', icon: Clock },
                  { key: 'status' as const, label: 'Status', icon: Navigation },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && !error.includes('429') && !error.includes('Rate limited') && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={clearError} className="ml-auto text-amber-400 hover:text-amber-300">×</button>
            </div>
          )}
        </div>
      </div>

      {/* Coach composition strip & 3D Camera Switcher (Active only in 3D View) */}
      {activeTab === '3d' && (
        <>
          <div className="bg-slate-900/50 border-b border-slate-800/50 px-3 sm:px-6 py-2.5 sm:py-3">
            <div className="max-w-7xl mx-auto">
              <TrainComposition
                coaches={coaches}
                selectedCoachId={selectedCoach?.coachId || null}
                onCoachClick={handleCoachClick}
                compact
              />
            </div>
          </div>

          {/* View Mode Switcher Bar */}
          <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider hidden xs:inline">View:</span>
              <button
                onClick={() => setViewMode('full-train')}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'full-train'
                    ? 'bg-blue-600 text-white shadow ring-1 ring-blue-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>🚆</span>
                <span>Full Train</span>
              </button>

              <button
                onClick={() => {
                  if (selectedCoach) {
                    setViewMode('coach-interior');
                  } else if (coaches.length > 0) {
                    const p = coaches.find(c => !['LOCO', 'EOG', 'SLR', 'END'].includes(c.coachType)) || coaches[0];
                    selectCoach(p.coachId, true);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'coach-interior' || viewMode === 'berth-detail'
                    ? 'bg-amber-500 text-slate-950 font-black shadow ring-1 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>💺</span>
                <span>Coach ({selectedCoach?.coachId || 'S1'})</span>
              </button>

              <button
                onClick={() => {
                  if (!selectedCoach && coaches.length > 0) {
                    const p = coaches.find(c => !['LOCO', 'EOG', 'SLR', 'END'].includes(c.coachType)) || coaches[0];
                    selectCoach(p.coachId);
                  }
                  setViewMode('walkthrough');
                }}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'walkthrough'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow ring-1 ring-emerald-400'
                    : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>🚶</span>
                <span>Walkthrough</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="hidden sm:inline">Active: <strong className="text-white">{selectedCoach ? `Coach ${selectedCoach.coachId}` : 'Full Train'}</strong></span>
              {selectedBerth && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                  Berth #{selectedBerth.berthNumber} ({selectedBerth.berthType})
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      {activeTab === '3d' && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* 3D Viewport - Responsive Height Optimized for Mobile & Desktop */}
            <div className="flex-1 h-[50vh] sm:h-[58vh] lg:h-[650px] min-h-[350px] sm:min-h-[460px] relative">
              {isLoading && !selectedTrain ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <TrainScene
                  coaches={coaches}
                  selectedCoachId={selectedCoach?.coachId || null}
                  selectedBerthNumber={selectedBerth?.berthNumber || null}
                  highlightedCoachId={null}
                  viewMode={viewMode}
                  onCoachClick={handleCoachClick}
                  onBerthClick={handleBerthClick}
                  onBackToTrain={handleBackToTrain}
                  distanceFrom={distanceFrom}
                  distanceTo={distanceTo}
                  onSelectDistanceCoaches={(from, to) => {
                    setDistanceFrom(from);
                    setDistanceTo(to);
                  }}
                  initialIsMoving={true}
                  initialSpeedKmph={analyzedPosition.speedKmph && analyzedPosition.speedKmph > 0 ? analyzedPosition.speedKmph : 88}
                  trainStatusText={analyzedJourney.statusConfidence === 'ESTIMATED' ? 'TIMETABLE ESTIMATE' : trainStatus?.status || 'RUNNING ON TIME'}
                  stationName={analyzedPosition.currentStationName || analyzedPosition.previousStationName || trainStatus?.origin?.name || activeTrain.origin.name}
                  nextStationName={analyzedPosition.nextStationName || activeTrain.destination.name}
                  distanceToNextKm={analyzedPosition.distanceToNextKm || 10}
                  isAtStation={false}
                  showStationEnvironment={false}
                  speedIsReported={analyzedJourney.statusConfidence !== 'ESTIMATED' && trainStatus?.speedKmph != null}
                />
              )}
            </div>

            {/* Side Panel */}
            <div className="w-full lg:w-84 xl:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 overflow-y-auto max-h-[40vh] sm:max-h-[60vh] lg:max-h-[650px]">
              <div className="p-4 space-y-4">
                {/* Coach Seat Grid & Berth Selection */}
                {selectedCoach && selectedBlueprint && (
                  <CoachSeatGrid
                    blueprint={selectedBlueprint}
                    selectedBerthNumber={selectedBerth?.berthNumber || null}
                    onSelectBerth={handleBerthClick}
                    coachId={selectedCoach.coachId}
                  />
                )}

                {/* Berth Info Card */}
                {berthInfo && selectedBerth && (
                  <BerthInfoPanel
                    berthNumber={selectedBerth.berthNumber}
                    berthType={selectedBerth.berthType as any}
                    coachId={selectedBerth.coachId}
                    bayNumber={berthInfo.bayNumber}
                    side={berthInfo.position}
                    deck={0}
                    distanceToDoor={berthInfo.distanceToNearestDoor}
                    neighbors={berthInfo.neighbors}
                    onClose={() => setViewMode('coach-interior')}
                  />
                )}

                {/* Berth lookup input */}
                {selectedCoach && (
                  <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Quick Find Berth / Seat Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={berthInput}
                        onChange={(e) => setBerthInput(e.target.value)}
                        placeholder="e.g. 15, 32, 64"
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        min={1}
                        max={selectedBlueprint?.totalBerths || 80}
                      />
                      <button
                        onClick={handleBerthLookup}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Locate
                      </button>
                    </div>
                  </div>
                )}

                {/* Distance Calculator */}
                <DistancePanel
                  coaches={coaches}
                  fromCoachId={distanceFrom}
                  toCoachId={distanceTo}
                  onFromChange={setDistanceFrom}
                  onToChange={setDistanceTo}
                />

                {/* Coach list */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="font-semibold text-white mb-3 text-sm">All Coaches in Rake ({coaches.length})</h3>
                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {coaches.map((coach) => {
                      const bp = COACH_BLUEPRINTS[resolveCoachBlueprint(coach.coachId)];
                      const isSelected = selectedCoach?.coachId === coach.coachId;
                      return (
                        <button
                          key={coach.coachId}
                          onClick={() => handleCoachClick(coach.coachId)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 font-bold border border-amber-300 shadow'
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <span className="font-medium">{coach.coachId}</span>
                          <span className={`text-xs ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                            {bp?.totalBerths ? `${bp.totalBerths} berths` : coach.coachType}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Coach Locator Section */}
          <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800">
            <PlatformCoachLocator
              coaches={coaches}
              selectedCoachId={selectedCoach?.coachId || null}
              onSelectCoach={handleCoachClick}
              trainNumber={trainNumber}
              trainName={selectedTrain?.trainName}
            />
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {(() => {
            const scheduleStations = activeTrain.schedule?.stations || verifiedFallback.schedule || [];
            return scheduleStations.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">
                  Schedule — {activeTrain.trainName} ({activeTrain.trainNumber})
                </h2>
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800 text-slate-300">
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">Station</th>
                        <th className="px-4 py-3 text-left">Arrival</th>
                        <th className="px-4 py-3 text-left">Departure</th>
                        <th className="px-4 py-3 text-left">Halt</th>
                        <th className="px-4 py-3 text-left">Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleStations.map((stn, i) => (
                        <tr key={i} className="border-t border-slate-800 hover:bg-slate-800/50">
                          <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-2.5">
                            <span className="font-medium text-white">{stn.stationName}</span>
                            <span className="text-slate-500 ml-1 text-xs font-mono">({stn.stationCode})</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-300 font-mono">{stn.arrivalTime || '--'}</td>
                          <td className="px-4 py-2.5 text-slate-300 font-mono">{stn.departureTime || '--'}</td>
                          <td className="px-4 py-2.5 text-slate-400">{stn.haltMinutes ? `${stn.haltMinutes}m` : '--'}</td>
                          <td className="px-4 py-2.5 text-slate-400 font-mono">{stn.distance} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Schedule data not available for this train.</p>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'status' && (
        <LiveStatusFeed
          trainNumber={trainNumber}
          trainName={activeTrain.trainName}
          trainStatus={trainStatus}
          analyzedJourney={analyzedJourney}
          activeTrain={activeTrain}
          onRefresh={() => fetchTrainStatus(trainNumber)}
          isRefreshing={isLoading}
          onSwitchTo3D={() => setActiveTab('3d')}
        />
      )}
    </div>
  );
}

export default function TrainExplorerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading Train Explorer...</p>
        </div>
      </div>
    }>
      <TrainExplorerContent />
    </Suspense>
  );
}

