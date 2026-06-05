// Persistent local store using localStorage — no database needed for dev

export const localStore = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`oi:${key}`);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },

  set<T>(key: string, value: T): void {
    try { localStorage.setItem(`oi:${key}`, JSON.stringify(value)); } catch { /* quota exceeded */ }
  },

  delete(key: string): void {
    localStorage.removeItem(`oi:${key}`);
  },
};

// Achievements store
export const achievements = {
  getUnlocked: (): string[] => localStore.get('achievements', []),
  unlock: (id: string) => {
    const current = achievements.getUnlocked();
    if (!current.includes(id)) localStore.set('achievements', [...current, id]);
  },
  isUnlocked: (id: string): boolean => achievements.getUnlocked().includes(id),
};

// Mission log
export const missionLog = {
  getAll: (): Array<{ body: string; ts: number }> => localStore.get('missionLog', []),
  add: (celestialBody: string) => {
    const log = missionLog.getAll();
    localStore.set('missionLog', [{ body: celestialBody, ts: Date.now() }, ...log.slice(0, 49)]);
  },
};
