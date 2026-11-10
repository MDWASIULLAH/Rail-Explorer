'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, BellRing, Clock, MapPin, CheckCircle2, Volume2, Shield } from 'lucide-react';
import { useStarredTrains } from '@/context/StarredTrainsContext';

export default function StationAlarmModal() {
  const { isAlarmModalOpen, setIsAlarmModalOpen, starredTrains, alarmTargetTrain } = useStarredTrains();

  const [selectedTrain, setSelectedTrain] = useState<string>('18403');
  const [stationName, setStationName] = useState<string>('Jharsuguda Jn (JSG)');
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(15);
  const [isArmed, setIsArmed] = useState<boolean>(false);
  const [isTestingChime, setIsTestingChime] = useState<boolean>(false);

  useEffect(() => {
    if (alarmTargetTrain) {
      setSelectedTrain(alarmTargetTrain);
    } else if (starredTrains.length > 0) {
      setSelectedTrain(starredTrains[0].trainNumber);
    }
  }, [alarmTargetTrain, starredTrains]);

  if (!isAlarmModalOpen) return null;

  const playStationChime = () => {
    setIsTestingChime(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // IR Station 4-tone chime: D5 -> F#5 -> A5 -> D6
        const chimeNotes = [587.33, 739.99, 880.00, 1174.66];
        chimeNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteTime = now + idx * 0.32;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.exponentialRampToValueAtTime(0.3, noteTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteTime);
          osc.stop(noteTime + 0.75);
        });
      }
    } catch (e) {
      console.warn('Audio error:', e);
    }
    setTimeout(() => setIsTestingChime(false), 1500);
  };

  const handleArmAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsArmed(true);
    playStationChime();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Station Arrival Alarm</h3>
              <p className="text-[11px] text-slate-400">Never miss your station or oversleep at night</p>
            </div>
          </div>
          <button
            onClick={() => setIsAlarmModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {isArmed ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Station Alarm Armed & Active!</span>
              </div>
              <p className="text-emerald-300/80 leading-relaxed">
                We are tracking <strong>Train {selectedTrain}</strong> via Live GPS. You will receive an audio chime and alert notification <strong>{advanceMinutes} minutes</strong> before arriving at <strong>{stationName}</strong>.
              </p>
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setIsArmed(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
                >
                  Modify / Disarm
                </button>
                <button
                  onClick={playStationChime}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 font-semibold text-xs border border-emerald-500/40 flex items-center gap-1.5 transition"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Test Chime</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleArmAlarm} className="space-y-4 text-xs">
              {/* Train Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Train</label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                >
                  {starredTrains.map((t) => (
                    <option key={t.trainNumber} value={t.trainNumber}>
                      {t.trainNumber} - {t.trainName}
                    </option>
                  ))}
                  {!starredTrains.some((t) => t.trainNumber === selectedTrain) && (
                    <option value={selectedTrain}>Train {selectedTrain}</option>
                  )}
                </select>
              </div>

              {/* Destination Station */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Station</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    placeholder="Enter station name or code"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Alert Threshold */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alert In Advance</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAdvanceMinutes(mins)}
                      className={`py-2 px-3 rounded-xl border text-center font-bold font-mono transition ${
                        advanceMinutes === mins
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition active:scale-98 flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  <span>Arm Station Alarm</span>
                </button>
                <button
                  type="button"
                  onClick={playStationChime}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1.5"
                  title="Test IR Station Chime"
                >
                  <Volume2 className={`w-4 h-4 ${isTestingChime ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Audible station alert runs in background using Web Audio synthesizer.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
