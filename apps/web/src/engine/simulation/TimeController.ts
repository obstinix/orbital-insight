import { useTimeStore } from '../../store/useTimeStore';

export class TimeController {
  /**
   * Advances the simulation date based on real time delta and speed multiplier.
   * @param delta Real elapsed time in seconds.
   * @returns The updated simulated Date.
   */
  public update(delta: number): Date {
    const { simulatedDate, speedMultiplier, isPaused, setSimulatedDate } = useTimeStore.getState();

    if (isPaused) {
      return simulatedDate;
    }

    // Advance time: delta * 1000 ms * speedMultiplier
    const deltaMs = delta * 1000 * speedMultiplier;
    const newTimeMs = simulatedDate.getTime() + deltaMs;
    const newDate = new Date(newTimeMs);

    setSimulatedDate(newDate);

    // Dispatch custom event for telemetry overlay tracking
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('simulationTimeUpdate', {
          detail: { date: newDate, speed: speedMultiplier },
        })
      );
    }

    return newDate;
  }
}
