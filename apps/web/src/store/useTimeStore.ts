import { create } from 'zustand';

interface TimeState {
  simulatedDate: Date;
  speedMultiplier: number; // 1, 100, 1000, 10000, 100000, and negative (reverse)
  isPaused: boolean;
  setSimulatedDate: (date: Date) => void;
  setSpeedMultiplier: (speed: number) => void;
  setIsPaused: (paused: boolean) => void;
  togglePause: () => void;
  speedUp: () => void;
  slowDown: () => void;
  resetToNow: () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  simulatedDate: new Date('2026-01-01T12:00:00Z'),
  speedMultiplier: 1,
  isPaused: false,
  setSimulatedDate: (date) => set({ simulatedDate: date }),
  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
  speedUp: () => {
    const speeds = [1, 100, 1000, 10000, 100000];
    const current = get().speedMultiplier;
    const idx = speeds.indexOf(current);
    if (idx < speeds.length - 1) set({ speedMultiplier: speeds[idx + 1] });
  },
  slowDown: () => {
    const speeds = [1, 100, 1000, 10000, 100000];
    const current = get().speedMultiplier;
    const idx = speeds.indexOf(current);
    if (idx > 0) set({ speedMultiplier: speeds[idx - 1] });
  },
  resetToNow: () => set({ simulatedDate: new Date(), speedMultiplier: 1, isPaused: false }),
}));
