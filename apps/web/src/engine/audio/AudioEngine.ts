import * as THREE from 'three';
import { useAudioStore } from '../../store/useAudioStore';

// ── CONSTANTS ──────────────────────────────────────────────────
const AMBIENT_BASE_FREQ = 55; // Hz — deep A1 drone
const AMBIENT_LFO_RATE = 0.08; // Hz — slow modulation
const PROXIMITY_MIN_DIST = 20;
const PROXIMITY_MAX_DIST = 600;
const ENGINE_BASE_FREQ = 120; // Hz — thrust rumble
const WARP_FREQ_PEAK = 2400; // Hz — hyperspace whine

type EngineLayer = 'ambient' | 'proximity' | 'engine';

interface LayerNodes {
  source: OscillatorNode | AudioBufferSourceNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
  panner?: PannerNode;
  lfo?: OscillatorNode;
  lfoGain?: GainNode;
}

/**
 * Procedural spatial audio engine for the Orbital Insight platform.
 *
 * Three concurrent layers:
 * - **ambient**: Filtered brown noise with slow LFO modulation (deep space drone)
 * - **proximity**: Oscillator hum that intensifies as camera approaches celestial bodies
 * - **engine**: Spacecraft thrust/warp sounds (bandpass-filtered noise)
 *
 * All audio is procedurally generated — zero external audio assets.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private layers: Partial<Record<EngineLayer, LayerNodes>> = {};
  private isRunning = false;
  private reducedMotion = false;

  // Reusable vector for distance calculations
  private tmpVec = new THREE.Vector3();

  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Initialize the AudioContext. Must be called after a user gesture.
   */
  async init(): Promise<void> {
    if (this.ctx) return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    // Apply initial store volumes
    this.syncVolumes();

    // Build layers
    this.createAmbientLayer();
    this.createProximityLayer();
    this.createEngineLayer();

    this.isRunning = true;
    useAudioStore.getState().setAudioUnlocked(true);
  }

  /**
   * Resume if suspended (e.g., after tab switch).
   */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Suspend to save resources when tab is backgrounded.
   */
  async suspend(): Promise<void> {
    if (this.ctx?.state === 'running') {
      await this.ctx.suspend();
    }
  }

  // ── LAYER CREATION ────────────────────────────────────────────

  private createAmbientLayer(): void {
    if (!this.ctx || !this.masterGain) return;

    // Brown noise via BufferSource
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds of noise
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise: integrate white noise
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5; // Amplify
      }
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Low-pass filter for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.7;

    // LFO for gentle pulsing (skip if reduced-motion)
    let lfo: OscillatorNode | undefined;
    let lfoGain: GainNode | undefined;
    if (!this.reducedMotion) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = AMBIENT_LFO_RATE;
      lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 30; // Modulate filter freq ±30 Hz
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
    }

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();

    // Fade in over 3 seconds
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 3);

    this.layers.ambient = { source, gain, filter, lfo, lfoGain };
  }

  private createProximityLayer(): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = AMBIENT_BASE_FREQ;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = PROXIMITY_MIN_DIST;
    panner.maxDistance = PROXIMITY_MAX_DIST;
    panner.rolloffFactor = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 0; // Silent until a body is nearby

    osc.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);

    osc.start();

    this.layers.proximity = { source: osc, gain, panner };
  }

  private createEngineLayer(): void {
    if (!this.ctx || !this.masterGain) return;

    // Engine noise: White noise through bandpass
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = ENGINE_BASE_FREQ;
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 0; // Silent in IDLE state

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();

    this.layers.engine = { source, gain, filter };
  }

  // ── RUNTIME UPDATES ───────────────────────────────────────────

  /**
   * Call each frame from the render loop. Updates spatial audio
   * based on camera position and nearest celestial body.
   */
  update(
    camera: THREE.PerspectiveCamera,
    nearestBodyPosition: THREE.Vector3 | null,
    nearestBodyMass: number,
    spacecraftState: 'IDLE' | 'THRUSTING' | 'WARPING' | 'ORBITING'
  ): void {
    if (!this.ctx || !this.isRunning) return;

    this.syncVolumes();

    // Update AudioListener position to match camera
    if (this.ctx.listener.positionX) {
      this.ctx.listener.positionX.value = camera.position.x;
      this.ctx.listener.positionY.value = camera.position.y;
      this.ctx.listener.positionZ.value = camera.position.z;

      const forward = this.tmpVec.set(0, 0, -1).applyQuaternion(camera.quaternion);
      this.ctx.listener.forwardX.value = forward.x;
      this.ctx.listener.forwardY.value = forward.y;
      this.ctx.listener.forwardZ.value = forward.z;
    }

    // ── Proximity hum ──
    const proxLayer = this.layers.proximity;
    if (proxLayer && nearestBodyPosition) {
      const dist = camera.position.distanceTo(nearestBodyPosition);
      const t = Math.max(0, 1 - dist / PROXIMITY_MAX_DIST);
      const targetGain = t * t * 0.12; // Quadratic falloff

      // Ramp smoothly
      proxLayer.gain.gain.linearRampToValueAtTime(
        targetGain,
        this.ctx.currentTime + 0.1
      );

      // Vary frequency by body mass (heavier = deeper)
      const freq = AMBIENT_BASE_FREQ + (1 - Math.min(1, nearestBodyMass / 1000)) * 100;
      if (proxLayer.source instanceof OscillatorNode) {
        proxLayer.source.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 0.2);
      }

      // Position panner at body
      if (proxLayer.panner) {
        proxLayer.panner.positionX.value = nearestBodyPosition.x;
        proxLayer.panner.positionY.value = nearestBodyPosition.y;
        proxLayer.panner.positionZ.value = nearestBodyPosition.z;
      }
    } else if (proxLayer) {
      proxLayer.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    }

    // ── Engine layer ──
    const engLayer = this.layers.engine;
    if (engLayer && engLayer.filter) {
      switch (spacecraftState) {
        case 'THRUSTING':
          engLayer.gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.15);
          engLayer.filter.frequency.linearRampToValueAtTime(ENGINE_BASE_FREQ * 1.5, this.ctx.currentTime + 0.2);
          break;
        case 'WARPING':
          engLayer.gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.1);
          engLayer.filter.frequency.linearRampToValueAtTime(WARP_FREQ_PEAK, this.ctx.currentTime + 0.5);
          engLayer.filter.Q.linearRampToValueAtTime(8, this.ctx.currentTime + 0.5);
          break;
        case 'ORBITING':
          engLayer.gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.3);
          engLayer.filter.frequency.linearRampToValueAtTime(ENGINE_BASE_FREQ * 0.8, this.ctx.currentTime + 0.3);
          engLayer.filter.Q.linearRampToValueAtTime(2.5, this.ctx.currentTime + 0.3);
          break;
        default: // IDLE
          engLayer.gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
          engLayer.filter.frequency.linearRampToValueAtTime(ENGINE_BASE_FREQ, this.ctx.currentTime + 0.3);
          engLayer.filter.Q.linearRampToValueAtTime(2.5, this.ctx.currentTime + 0.3);
      }
    }

    // ── Ambient depth adaptation ──
    const ambLayer = this.layers.ambient;
    if (ambLayer && ambLayer.filter) {
      const distFromOrigin = camera.position.length();
      // Inner solar system: warmer (higher cutoff), deep space: colder (lower cutoff)
      const cutoff = Math.max(80, Math.min(400, 400 - distFromOrigin * 0.3));
      ambLayer.filter.frequency.linearRampToValueAtTime(cutoff, this.ctx.currentTime + 0.5);
    }
  }

  /**
   * Sync gain nodes with the Zustand store volumes.
   */
  private syncVolumes(): void {
    if (!this.masterGain || !this.ctx) return;

    const { masterVolume, ambientVolume, isMuted } = useAudioStore.getState();
    const effectiveMaster = isMuted ? 0 : masterVolume;

    this.masterGain.gain.linearRampToValueAtTime(effectiveMaster, this.ctx.currentTime + 0.05);

    // Scale individual layers
    const ambLayer = this.layers.ambient;
    if (ambLayer) {
      const ambTarget = 0.15 * ambientVolume;
      ambLayer.gain.gain.linearRampToValueAtTime(ambTarget, this.ctx.currentTime + 0.05);
    }

    // SFX volume affects proximity and engine
    const proxLayer = this.layers.proximity;
    if (proxLayer) {
      // Don't override proximity — it's dynamically computed; just scale by sfxVolume
      // This is handled in the update() proximity section
    }

    const engLayer = this.layers.engine;
    if (engLayer) {
      // Engine volume is dynamically set in update(); sfxVolume acts as a ceiling
      // We scale the master to control overall loudness
    }
  }

  /**
   * Clean up all audio nodes and close the context.
   */
  dispose(): void {
    this.isRunning = false;

    for (const layer of Object.values(this.layers)) {
      if (!layer) continue;
      try {
        if (layer.lfo) layer.lfo.stop();
        if (layer.source instanceof OscillatorNode) {
          layer.source.stop();
        } else if (layer.source instanceof AudioBufferSourceNode) {
          layer.source.stop();
        }
      } catch {
        // Already stopped
      }
    }

    this.layers = {};

    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }

    this.masterGain = null;
  }
}
