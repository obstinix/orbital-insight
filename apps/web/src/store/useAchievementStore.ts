import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAccountStore } from './useAccountStore';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji representing badge
  xpAward: number;
  unlockedAt: number | null;
}

interface AchievementState {
  achievements: Achievement[];
  activeToast: Achievement | null;
  unlock: (id: string) => void;
  clearToast: () => void;
  resetAchievements: () => void;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'journey_start',
    title: 'Launch Trajectory',
    description: 'Began space exploration by starting Journey Mode.',
    icon: '🚀',
    xpAward: 50,
    unlockedAt: null,
  },
  {
    id: 'journey_voyager',
    title: 'Interstellar Boundary',
    description: 'Travelled past the heliosphere to Voyager 1 in Journey Mode.',
    icon: '🛰️',
    xpAward: 100,
    unlockedAt: null,
  },
  {
    id: 'journey_complete',
    title: 'Cosmic Horizon',
    description: 'Reached the edge of the observable universe in Journey Mode.',
    icon: '🌌',
    xpAward: 200,
    unlockedAt: null,
  },
  {
    id: 'constellations_toggle',
    title: 'Cosmic Cartographer',
    description: 'Rendered stellar constellation mapping overlays.',
    icon: '✨',
    xpAward: 50,
    unlockedAt: null,
  },
  {
    id: 'exoplanet_habitable',
    title: 'Golden Zone',
    description: 'Inspected a habitable terrestrial exoplanet in the catalog.',
    icon: '🍀',
    xpAward: 75,
    unlockedAt: null,
  },
  {
    id: 'exoplanet_lava',
    title: 'Lava Surfer',
    description: 'Analyzed a carbon-rich molten lava world.',
    icon: '🔥',
    xpAward: 75,
    unlockedAt: null,
  },
  {
    id: 'mission_iss',
    title: 'Orbital Docking',
    description: 'Locked camera telemetry onto the International Space Station.',
    icon: '🛰️',
    xpAward: 50,
    unlockedAt: null,
  },
  {
    id: 'mission_jwst',
    title: 'Lagrange Vantage',
    description: 'Locked camera telemetry onto the James Webb Space Telescope.',
    icon: '🔭',
    xpAward: 50,
    unlockedAt: null,
  },
  {
    id: 'event_eclipse',
    title: 'Umbra Umbrage',
    description: 'Triggered a solar eclipse alignment sequence.',
    icon: '🌑',
    xpAward: 100,
    unlockedAt: null,
  },
  {
    id: 'event_meteor',
    title: 'Shooting Star',
    description: 'Triggered a procedural meteor shower event.',
    icon: '🌠',
    xpAward: 75,
    unlockedAt: null,
  },
  {
    id: 'event_supernova',
    title: 'Stellar Death',
    description: 'Witnessed a triggered supernova stellar explosion.',
    icon: '💥',
    xpAward: 150,
    unlockedAt: null,
  },
  {
    id: 'event_comet',
    title: 'Ice and Fire',
    description: 'Observed a comet sweep through the solar system.',
    icon: '☄️',
    xpAward: 100,
    unlockedAt: null,
  },
  {
    id: 'event_cme',
    title: 'Solar Flare',
    description: 'Triggered a coronal mass ejection solar storm.',
    icon: '🌞',
    xpAward: 100,
    unlockedAt: null,
  },
  {
    id: 'time_warp',
    title: 'Time Lord',
    description: 'Accelerated simulation time warp to maximum speed.',
    icon: '⏳',
    xpAward: 50,
    unlockedAt: null,
  },
];

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      achievements: DEFAULT_ACHIEVEMENTS,
      activeToast: null,
      unlock: (id) => {
        const list = get().achievements;
        const index = list.findIndex((a) => a.id === id);
        if (index === -1 || list[index].unlockedAt !== null) return;

        const updated = [...list];
        const unlockedAt = Date.now();
        updated[index] = { ...updated[index], unlockedAt };

        set({
          achievements: updated,
          activeToast: updated[index],
        });

        // Award XP to the user account
        useAccountStore.getState().addXp(updated[index].xpAward);
      },
      clearToast: () => set({ activeToast: null }),
      resetAchievements: () => set({ achievements: DEFAULT_ACHIEVEMENTS, activeToast: null }),
    }),
    {
      name: 'orbital-insight-achievements',
      partialize: (state) => ({
        achievements: state.achievements,
      }),
    }
  )
);
