import { AmbientSoundType } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Apple-style tactile click sound for buttons and dials
 */
export function playTickSound(volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.015);

  filter.type = 'highpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);

  gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.025);
}

/**
 * Apple-style harmonious completion chime (like iOS timer finished)
 */
export function playChimeSound(volume = 0.6) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Harmonic chord: F5 (698.46), A5 (880), C6 (1046.5), F6 (1396.9)
  const notes = [698.46, 880, 1046.5, 1396.9];
  const now = ctx.currentTime;

  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + idx * 0.09);

    const noteStart = now + idx * 0.09;
    const duration = 1.4;

    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(volume * 0.18, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteStart);
    osc.stop(noteStart + duration + 0.05);
  });
}

/**
 * Mode change subtle chime
 */
export function playModeChangeSound(volume = 0.4) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

/**
 * Synthesized continuous ambient sound engine (zero external dependencies)
 */
class SynthesizedAmbientPlayer {
  private ambientGain: GainNode | null = null;
  private activeNodes: Array<AudioNode | { stop?: () => void }> = [];
  private currentType: AmbientSoundType = 'none';
  private intervalId: number | null = null;

  public setVolume(volume: number) {
    if (this.ambientGain && audioCtx) {
      this.ambientGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume * 0.4)), audioCtx.currentTime, 0.1);
    }
  }

  public play(type: AmbientSoundType, volume = 0.5) {
    this.stop();
    if (type === 'none') {
      this.currentType = 'none';
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    this.currentType = type;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(volume * 0.4, ctx.currentTime + 1.2);
    this.ambientGain.connect(ctx.destination);

    if (type === 'white-noise') {
      this.initWhiteNoise(ctx);
    } else if (type === 'rain') {
      this.initRain(ctx);
    } else if (type === 'binaural') {
      this.initBinaural(ctx);
    } else if (type === 'deep-drone') {
      this.initDeepDrone(ctx);
    }
  }

  private initWhiteNoise(ctx: AudioContext) {
    if (!this.ambientGain) return;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    // Pink / Warm noise approximation
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(this.ambientGain);
    whiteNoise.start();

    this.activeNodes.push(whiteNoise, filter);
  }

  private initRain(ctx: AudioContext) {
    if (!this.ambientGain) return;
    // Pink noise bed for rain murmur
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const rainBed = ctx.createBufferSource();
    rainBed.buffer = noiseBuffer;
    rainBed.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(0.7, ctx.currentTime);

    rainBed.connect(filter);
    filter.connect(this.ambientGain);
    rainBed.start();
    this.activeNodes.push(rainBed, filter);

    // Random gentle droplet generator
    const triggerDrop = () => {
      if (!ctx || !this.ambientGain || this.currentType !== 'rain') return;
      try {
        const dropOsc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const startFreq = 1200 + Math.random() * 800;
        const now = ctx.currentTime;

        dropOsc.type = 'sine';
        dropOsc.frequency.setValueAtTime(startFreq, now);
        dropOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, now + 0.04);

        dropGain.gain.setValueAtTime(0, now);
        dropGain.gain.linearRampToValueAtTime(0.04, now + 0.005);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

        dropOsc.connect(dropGain);
        dropGain.connect(this.ambientGain);
        dropOsc.start(now);
        dropOsc.stop(now + 0.08);
      } catch {
        // Safe catch on unmounted context
      }
    };

    this.intervalId = window.setInterval(triggerDrop, 220);
  }

  private initBinaural(ctx: AudioContext) {
    if (!this.ambientGain) return;
    // 216Hz in Left, 226Hz in Right = 10Hz Alpha Waves
    const baseFreq = 216;
    const diff = 10;

    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscRight.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, ctx.currentTime);
    oscRight.frequency.setValueAtTime(baseFreq + diff, ctx.currentTime);

    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0);
    oscRight.connect(merger, 0, 1);

    merger.connect(this.ambientGain);
    oscLeft.start();
    oscRight.start();

    this.activeNodes.push(oscLeft, oscRight, merger);
  }

  private initDeepDrone(ctx: AudioContext) {
    if (!this.ambientGain) return;
    // Warm rich pad chord: C2 (65.41), G2 (98.0), E3 (164.81)
    const freqs = [65.41, 98.0, 164.81];

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const oscFilter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(220, ctx.currentTime);

      osc.connect(oscFilter);
      oscFilter.connect(this.ambientGain!);
      osc.start();

      this.activeNodes.push(osc, oscFilter);
    });
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.ambientGain && audioCtx) {
      try {
        this.ambientGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      } catch {
        // Ignore if context changed
      }
    }

    setTimeout(() => {
      this.activeNodes.forEach((node) => {
        try {
          if ('stop' in node && typeof node.stop === 'function') {
            node.stop();
          }
          if ('disconnect' in node && typeof (node as AudioNode).disconnect === 'function') {
            (node as AudioNode).disconnect();
          }
        } catch {
          // ignore
        }
      });
      this.activeNodes = [];
      this.ambientGain = null;
    }, 550);
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }
}

export const ambientPlayer = new SynthesizedAmbientPlayer();
