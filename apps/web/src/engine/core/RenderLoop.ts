import * as THREE from 'three';
import { usePerformanceStore } from '../../store/usePerformanceStore';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';

/**
 * Starts the application frame animation and rendering loop.
 * 
 * Features:
 * - Employs a requestAnimationFrame loop with frame capping (max delta: 100ms)
 * - Tracks a rolling 60-frame FPS average and stores it in the Zustand performance store
 * - Auto-detects low performance (<30 fps for 3 seconds) and fires a 'performanceWarning' event
 * - Halts the animation loop on page visibility loss to preserve GPU/CPU cycles
 */
export function startRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  composer: EffectComposer | null,
  onFrame: (delta: number) => void
): { stop: () => void } {
  let animationFrameId: number | null = null;
  let lastTime = performance.now();

  // Rolling 60-frame window metrics
  const frameDeltas: number[] = [];
  const maxRollingFrames = 60;

  // Performance degradation indicators
  let lowPerformanceStart: number | null = null;
  let lowPerformanceDispatched = false;
  const fpsThreshold = 30;
  const fpsWarningDelayMs = 3000;

  const tick = (now: number) => {
    // Delta time in seconds
    let delta = (now - lastTime) / 1000;
    lastTime = now;

    // Delta time capping to avoid large jumps during stutter
    if (delta > 0.1) {
      delta = 0.1;
    }

    // Add current frame delta to rolling average
    frameDeltas.push(delta);
    if (frameDeltas.length > maxRollingFrames) {
      frameDeltas.shift();
    }

    // Calculate rolling average FPS
    const averageDelta = frameDeltas.reduce((a, b) => a + b, 0) / frameDeltas.length;
    const rollingFps = averageDelta > 0 ? 1 / averageDelta : 60;
    const stableFps = Math.round(rollingFps);

    // Update Zustand state store
    usePerformanceStore.getState().setFps(stableFps);

    // Low performance warning monitor
    if (stableFps < fpsThreshold) {
      if (lowPerformanceStart === null) {
        lowPerformanceStart = now;
      } else if (now - lowPerformanceStart > fpsWarningDelayMs && !lowPerformanceDispatched) {
        lowPerformanceDispatched = true;
        usePerformanceStore.getState().setLowPerformance(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('performanceWarning', { detail: { fps: stableFps } })
          );
        }
        console.warn(`[Performance] FPS dropped to ${stableFps} for more than 3 seconds. Dispatching warning.`);
      }
    } else {
      lowPerformanceStart = null;
      if (lowPerformanceDispatched) {
        lowPerformanceDispatched = false;
        usePerformanceStore.getState().setLowPerformance(false);
      }
    }

    // Run frame logical updates
    onFrame(delta);

    // Execute WebGL render pass or post-processing composer
    const isLowPerformance = usePerformanceStore.getState().isLowPerformance;
    if (composer && !isLowPerformance) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    animationFrameId = requestAnimationFrame(tick);
  };

  // Visbility listener to halt/resume the loop
  const handleVisibilityChange = () => {
    if (document.hidden) {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else {
      lastTime = performance.now();
      lowPerformanceStart = null;
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(tick);
      }
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Start the tick animation
  animationFrameId = requestAnimationFrame(tick);

  return {
    stop() {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    },
  };
}
