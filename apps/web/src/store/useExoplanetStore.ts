import { create } from 'zustand';

interface ExoplanetState {
  selectedExoplanetId: string | null;
  showExoplanetCanvas: boolean;
  setSelectedExoplanetId: (id: string | null) => void;
  setShowExoplanetCanvas: (val: boolean) => void;
}

export const useExoplanetStore = create<ExoplanetState>((set) => ({
  selectedExoplanetId: null,
  showExoplanetCanvas: false,
  setSelectedExoplanetId: (id) => set({ selectedExoplanetId: id }),
  setShowExoplanetCanvas: (val) => set({ showExoplanetCanvas: val }),
}));
