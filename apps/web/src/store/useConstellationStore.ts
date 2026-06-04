import { create } from 'zustand';

export interface ConstellationListItem {
  id: string;
  name: string;
  abbreviation: string;
  mythology: string;
  ra: number;  // degrees
  dec: number; // degrees
}

interface ConstellationState {
  latitude: number;
  longitude: number;
  showConstellations: boolean;
  selectedId: string | null;
  constellationsList: ConstellationListItem[];
  mode: 'solar-system' | 'skymap';
  setUserLocation: (lat: number, lon: number) => void;
  setShowConstellations: (show: boolean) => void;
  setSelectedId: (id: string | null) => void;
  toggleConstellations: () => void;
  setConstellationsList: (list: ConstellationListItem[]) => void;
  setMode: (mode: 'solar-system' | 'skymap') => void;
}

export const useConstellationStore = create<ConstellationState>((set) => ({
  latitude: 40.7128, // Default New York
  longitude: -74.0060,
  showConstellations: false,
  selectedId: null,
  constellationsList: [],
  mode: 'solar-system',
  setUserLocation: (lat, lon) => set({ latitude: lat, longitude: lon }),
  setShowConstellations: (show) => set({ showConstellations: show }),
  setSelectedId: (id) => set({ selectedId: id }),
  toggleConstellations: () => set((s) => ({ showConstellations: !s.showConstellations })),
  setConstellationsList: (list) => set({ constellationsList: list }),
  setMode: (mode) => set({ mode }),
}));
