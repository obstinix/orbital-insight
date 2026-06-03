import { create } from 'zustand';
import { PlanetConfig } from '@orbital-insight/shared-types';

// Registry imports
import sunData from '../../../../packages/content/solar-system/sun.json';
import mercuryData from '../../../../packages/content/solar-system/mercury.json';
import venusData from '../../../../packages/content/solar-system/venus.json';
import earthData from '../../../../packages/content/solar-system/earth.json';
import moonData from '../../../../packages/content/solar-system/moon.json';
import marsData from '../../../../packages/content/solar-system/mars.json';
import jupiterData from '../../../../packages/content/solar-system/jupiter.json';
import saturnData from '../../../../packages/content/solar-system/saturn.json';
import uranusData from '../../../../packages/content/solar-system/uranus.json';
import neptuneData from '../../../../packages/content/solar-system/neptune.json';
import ioData from '../../../../packages/content/solar-system/io.json';
import europaData from '../../../../packages/content/solar-system/europa.json';
import ganymedeData from '../../../../packages/content/solar-system/ganymede.json';
import callistoData from '../../../../packages/content/solar-system/callisto.json';
import titanData from '../../../../packages/content/solar-system/titan.json';
import enceladusData from '../../../../packages/content/solar-system/enceladus.json';

export const planetRegistry: Record<string, PlanetConfig> = {
  sun: sunData as PlanetConfig,
  mercury: mercuryData as PlanetConfig,
  venus: venusData as PlanetConfig,
  earth: earthData as PlanetConfig,
  moon: moonData as PlanetConfig,
  mars: marsData as PlanetConfig,
  jupiter: jupiterData as PlanetConfig,
  saturn: saturnData as PlanetConfig,
  uranus: uranusData as PlanetConfig,
  neptune: neptuneData as PlanetConfig,
  io: ioData as PlanetConfig,
  europa: europaData as PlanetConfig,
  ganymede: ganymedeData as PlanetConfig,
  callisto: callistoData as PlanetConfig,
  titan: titanData as PlanetConfig,
  enceladus: enceladusData as PlanetConfig,
};

interface PlanetState {
  selectedPlanetId: string | null;
  setSelectedPlanetId: (id: string | null) => void;
  getPlanetConfig: (id: string) => PlanetConfig | null;
}

export const usePlanetStore = create<PlanetState>((set) => ({
  selectedPlanetId: null,
  setSelectedPlanetId: (id) => set({ selectedPlanetId: id }),
  getPlanetConfig: (id) => planetRegistry[id] || null,
}));
