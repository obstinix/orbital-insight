import { create } from 'zustand';

interface ConstellationState {
  latitude: number;
  longitude: number;
  showConstellations: boolean;
  selectedId: string | null;
  setUserLocation: (lat: number, lon: number) => void;
  setShowConstellations: (show: boolean) => void;
  setSelectedId: (id: string | null) => void;
}

export const useConstellationStore = create<ConstellationState>((set) => ({
  latitude: 40.7128, // Default New York
  longitude: -74.0060,
  showConstellations: false,
  selectedId: null,
  setUserLocation: (lat, lon) => set({ latitude: lat, longitude: lon }),
  setShowConstellations: (show) => set({ showConstellations: show }),
  setSelectedId: (id) => set({ selectedId: id }),
}));
