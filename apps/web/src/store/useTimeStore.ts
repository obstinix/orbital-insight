import { create } from 'zustand';

interface TimeState {
  simulatedDate: Date;
  speedMultiplier: number; // 1, 100, 1000, 10000, 100000, and negative (reverse)
  isPaused: boolean;
  setSimulatedDate: (date: Date) => void;
  setSpeedMultiplier: (speed: number) => void;
  setIsPaused: (paused: boolean) => void;
}

export const useTimeStore = create<TimeState>((set) => ({
  simulatedDate: new Date('2026-01-01T12:00:00Z'),
  speedMultiplier: 1,
  isPaused: false,
  setSimulatedDate: (date) => set({ simulatedDate: date }),
  setSpeedMultiplier: (speed) => set({ speedMultiplier: speed }),
  setIsPaused: (paused) => set({ isPaused: paused }),
}));
