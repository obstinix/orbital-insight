import { create } from 'zustand';
import { useAchievementStore } from './useAchievementStore';

interface EventState {
  isMeteorActive: boolean;
  isSupernovaActive: boolean;
  isEclipseActive: boolean;
  isCometActive: boolean;
  
  // Timers or status readouts
  supernovaTimer: number; // 0 to 1
  cometTimer: number; // 0 to 1
  eclipseTimer: number; // 0 to 1

  triggerMeteorShower: (active: boolean) => void;
  triggerSupernova: () => void;
  triggerEclipse: (active: boolean) => void;
  triggerComet: () => void;

  setSupernovaTimer: (t: number) => void;
  setCometTimer: (t: number) => void;
  setEclipseTimer: (t: number) => void;
}

export const useEventStore = create<EventState>((set, get) => ({
  isMeteorActive: false,
  isSupernovaActive: false,
  isEclipseActive: false,
  isCometActive: false,
  
  supernovaTimer: 0,
  cometTimer: 0,
  eclipseTimer: 0,

  triggerMeteorShower: (active) => {
    set({ isMeteorActive: active });
    if (active) {
      useAchievementStore.getState().unlock('event_meteor');
    }
  },
  
  triggerSupernova: () => {
    if (get().isSupernovaActive) return;
    set({ isSupernovaActive: true, supernovaTimer: 0 });
    useAchievementStore.getState().unlock('event_supernova');
    
    // Automatically reset after 10 seconds (duration of explosion)
    setTimeout(() => {
      set({ isSupernovaActive: false, supernovaTimer: 0 });
    }, 10000);
  },

  triggerEclipse: (active) => {
    set({ isEclipseActive: active, eclipseTimer: 0 });
    if (active) {
      useAchievementStore.getState().unlock('event_eclipse');
    }
  },

  triggerComet: () => {
    if (get().isCometActive) return;
    set({ isCometActive: true, cometTimer: 0 });
    useAchievementStore.getState().unlock('event_comet');

    // Automatically reset after 12 seconds (duration of comet fly-by)
    setTimeout(() => {
      set({ isCometActive: false, cometTimer: 0 });
    }, 12000);
  },

  setSupernovaTimer: (supernovaTimer) => set({ supernovaTimer }),
  setCometTimer: (cometTimer) => set({ cometTimer }),
  setEclipseTimer: (eclipseTimer) => set({ eclipseTimer }),
}));
