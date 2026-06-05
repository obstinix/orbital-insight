import { create } from 'zustand';

export interface Telemetry {
  latitude: number;
  longitude: number;
  altitude: number; // in km
  speed: number; // in km/h
  timestamp: number;
  isSimulated: boolean;
}

export interface Launch {
  id: string;
  name: string;
  rocket: string;
  agency: string;
  date: string; // ISO date string
  description: string;
  site: string;
}

export interface HistoricalMission {
  id: string;
  name: string;
  year: number;
  agency: string;
  description: string;
  stats: Record<string, string>;
  trajectoryInfo: string;
}

interface MissionState {
  issTelemetry: Telemetry;
  launches: Launch[];
  historicalMissions: HistoricalMission[];
  selectedMissionId: string | null;
  activeSpacecraft: 'ISS' | 'JWST' | 'HUBBLE';
  showLagrangePoints: boolean;
  setIssTelemetry: (telemetry: Telemetry) => void;
  setSelectedMissionId: (id: string | null) => void;
  setActiveSpacecraft: (spacecraft: 'ISS' | 'JWST' | 'HUBBLE') => void;
  setShowLagrangePoints: (show: boolean) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  issTelemetry: {
    latitude: 0,
    longitude: 0,
    altitude: 420,
    speed: 27560,
    timestamp: Math.floor(Date.now() / 1000),
    isSimulated: true,
  },
  launches: [
    {
      id: 'artemis_2',
      name: 'Artemis II',
      rocket: 'Space Launch System (SLS) Block 1',
      agency: 'NASA',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(), // ~120 days from now
      description: 'First crewed mission of the Artemis program, sending four astronauts in the Orion spacecraft on a lunar flyby trajectory.',
      site: 'Kennedy Space Center, LC-39B',
    },
    {
      id: 'polaris_dawn',
      name: 'Polaris Dawn',
      rocket: 'Falcon 9 Block 5',
      agency: 'SpaceX',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), // ~15 days from now
      description: 'Private crewed spaceflight aiming to reach the highest Earth orbit since Apollo and conduct the first commercial extravehicular activity (EVA).',
      site: 'Kennedy Space Center, LC-39A',
    },
    {
      id: 'crew_10',
      name: 'SpaceX Crew-10',
      rocket: 'Falcon 9 Block 5',
      agency: 'NASA / SpaceX',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), // ~45 days from now
      description: 'Tenth operational crew rotation mission to the International Space Station carrying four crew members.',
      site: 'Kennedy Space Center, LC-39A',
    },
  ],
  historicalMissions: [
    {
      id: 'apollo_11',
      name: 'Apollo 11',
      year: 1969,
      agency: 'NASA',
      description: 'The historic mission that landed the first two humans on the Moon. Commander Neil Armstrong and Lunar Module Pilot Buzz Aldrin landed the Apollo Lunar Module Eagle on July 20, 1969.',
      stats: {
        'Crew': 'Neil Armstrong, Buzz Aldrin, Michael Collins',
        'Lunar Stay': '21 hours 36 minutes',
        'Samples Collected': '21.5 kg',
      },
      trajectoryInfo: 'Heliocentric / Translunar injection trajectory.',
    },
    {
      id: 'voyager_1',
      name: 'Voyager 1',
      year: 1977,
      agency: 'NASA',
      description: 'Interstellar probe launched to study the outer Solar System. It is the most distant human-made object from Earth, currently traversing interstellar space beyond the heliosphere.',
      stats: {
        'Distance from Earth': '24.4 billion km (163 AU)',
        'Speed': '61,146 km/h',
        'Status': 'Operational, sending interstellar telemetry',
      },
      trajectoryInfo: 'Hyperbolic escape trajectory out of the solar ecliptic plane.',
    },
    {
      id: 'cassini',
      name: 'Cassini-Huygens',
      year: 1997,
      agency: 'NASA / ESA / ASI',
      description: 'A flagship robotic space probe mission to Saturn. It orbited Saturn for 13 years, launching the Huygens probe onto Titan and discovering subsurface liquid water oceans on Enceladus.',
      stats: {
        'Saturn Orbit Entry': 'July 1, 2004',
        'Grand Finale Descent': 'September 15, 2017',
        'Data Collected': '635 GB',
      },
      trajectoryInfo: 'Highly elliptical Saturn-centric resonance orbits.',
    },
    {
      id: 'jwst',
      name: 'James Webb Space Telescope',
      year: 2021,
      agency: 'NASA / ESA / CSA',
      description: 'The premier space observatory designed to conduct infrared astronomy. Orbiting the Sun-Earth L2 Lagrange point, it captures deep-field cosmic history from the first galaxies.',
      stats: {
        'Primary Mirror': '6.5m Beryllium-Gold Hexagons',
        'Operating Temp': '-233°C (40K)',
        'Orbit Location': 'Lagrangian Point 2 (L2)',
      },
      trajectoryInfo: 'Halo orbit around Sun-Earth L2 Lagrange point.',
    },
  ] as HistoricalMission[],
  selectedMissionId: null,
  activeSpacecraft: 'ISS',
  showLagrangePoints: false,
  setIssTelemetry: (issTelemetry) => set({ issTelemetry }),
  setSelectedMissionId: (selectedMissionId) => set({ selectedMissionId }),
  setActiveSpacecraft: (activeSpacecraft) => set({ activeSpacecraft }),
  setShowLagrangePoints: (showLagrangePoints) => set({ showLagrangePoints }),
}));
