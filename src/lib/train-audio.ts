/**
 * Indian Railways Locomotive Audio Synthesizer
 * 
 * Procedural Web Audio API sound generator:
 * - Authentic dual-tone air horn (WAP-7 / WDM-3D signature: 370 Hz & 311 Hz)
 * - Rhythmic wheel-rail track joint sounds ("clack-clack") proportional to speed
 * - Zero external media files needed; works completely offline with zero latency
 */

class TrainAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private trackInterval: any = null;
  private isTrackSoundRunning: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopTrackRhythm();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Play the iconic Indian Railways Dual-Tone Locomotive Air Horn
   * Standard WAP-7 / WAP-5 dual tones: 370 Hz (F#4) and 311 Hz (D#4) with harmonics
   */
  public playHorn(durationSeconds: number = 1.1) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master volume gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.05); // Rapid attack
    masterGain.gain.setValueAtTime(0.35, now + durationSeconds - 0.15);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds); // Decay
    masterGain.connect(ctx.destination);

    // Tone frequencies for Indian Railway air horn
    // Fundamental pair + first octave overtones for brass resonance
    const freqs = [
      { f: 370, gain: 0.6 },  // Primary High Horn (370 Hz)
      { f: 311, gain: 0.55 }, // Primary Low Horn (311 Hz)
      { f: 740, gain: 0.25 }, // Harmonic overtone
      { f: 622, gain: 0.22 }, // Harmonic overtone
      { f: 1110, gain: 0.1 }, // Upper air shimmer
    ];

    freqs.forEach(({ f, gain: relGain }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      // Sawtooth + lowpass filter gives the distinctive metallic compressed air timbre
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      // Add subtle air pressure modulation (vibrato/flutter)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(14, now); // 14 Hz acoustic flutter
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + durationSeconds);

      // Lowpass filter to shave harsh digital highs
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      oscGain.gain.setValueAtTime(relGain, now);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + durationSeconds);
    });
  }

  /**
   * Start procedural wheel-rail joint track rhythm ("click-clack")
   */
  public startTrackRhythm(speedKmph: number = 88) {
    if (this.isMuted || this.isTrackSoundRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isTrackSoundRunning = true;
    const intervalMs = Math.max(250, Math.min(1200, Math.round((70 / Math.max(10, speedKmph)) * 1000)));

    const playClickClack = () => {
      if (!this.isTrackSoundRunning || this.isMuted) return;
      const t = ctx.currentTime;

      // Double-strike click-clack of bogie wheels passing rail joints
      [0, 0.08].forEach((delay) => {
        const strikeTime = t + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, strikeTime);
        osc.frequency.exponentialRampToValueAtTime(45, strikeTime + 0.05);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, strikeTime);
        filter.Q.setValueAtTime(3, strikeTime);

        gain.gain.setValueAtTime(0.08, strikeTime);
        gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(strikeTime);
        osc.stop(strikeTime + 0.07);
      });
    };

    playClickClack();
    this.trackInterval = setInterval(playClickClack, intervalMs);
  }

  /**
   * Stop track rhythm sound
   */
  public stopTrackRhythm() {
    this.isTrackSoundRunning = false;
    if (this.trackInterval) {
      clearInterval(this.trackInterval);
      this.trackInterval = null;
    }
  }
}

// Global singleton audio engine instance
export const trainAudio = new TrainAudioEngine();

