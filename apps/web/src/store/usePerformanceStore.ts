import { create } from 'zustand';

interface PerformanceState {
  fps: number;
  isLowPerformance: boolean;
  setFps: (fps: number) => void;
  setLowPerformance: (isLow: boolean) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  fps: 60,
  isLowPerformance: false,
  setFps: (fps) => set({ fps }),
  setLowPerformance: (isLow) => set({ isLowPerformance: isLow }),
}));
