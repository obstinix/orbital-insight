import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  username: string;
  avatar: string;
  xp: number;
  level: number;
  rank: string;
  joinDate: string;
}

interface AccountState {
  profile: UserProfile;
  authToken: string | null;
  addXp: (amount: number) => void;
  updateProfile: (username: string, avatar: string) => void;
  resetAccount: () => void;
  setAuthToken: (token: string | null) => void;
  fetchProfile: (token?: string | null) => Promise<void>;
  saveProfile: (token?: string | null) => Promise<void>;
}

const getRankFromXp = (xp: number): string => {
  if (xp < 100) return 'Flight Cadet';
  if (xp < 300) return 'Mission Specialist';
  if (xp < 600) return 'Pilot Officer';
  if (xp < 1000) return 'Space Commander';
  return 'Fleet Admiral';
};

const getLevelFromXp = (xp: number): number => {
  // Let level increase every 100 XP
  return Math.floor(xp / 100) + 1;
};

const DEFAULT_PROFILE: UserProfile = {
  username: 'Explorer One',
  avatar: '🚀',
  xp: 0,
  level: 1,
  rank: 'Flight Cadet',
  joinDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
};

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      authToken: null,
      addXp: (amount) => {
        const currentProfile = get().profile;
        const newXp = currentProfile.xp + amount;
        const newLevel = getLevelFromXp(newXp);
        const newRank = getRankFromXp(newXp);
        
        set({
          profile: {
            ...currentProfile,
            xp: newXp,
            level: newLevel,
            rank: newRank,
          },
        });

        const token = get().authToken;
        if (token) {
          get().saveProfile(token);
        }
      },
      updateProfile: (username, avatar) => {
        const currentProfile = get().profile;
        set({
          profile: {
            ...currentProfile,
            username: username || currentProfile.username,
            avatar: avatar || currentProfile.avatar,
          },
        });

        const token = get().authToken;
        if (token) {
          get().saveProfile(token);
        }
      },
      resetAccount: () => {
        set({
          profile: {
            ...DEFAULT_PROFILE,
            joinDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          },
        });
      },
      setAuthToken: (token) => {
        set({ authToken: token });
      },
      fetchProfile: async (token) => {
        if (import.meta.env.VITE_USE_MOCK === 'true') return;
        const activeToken = token || get().authToken;
        if (!activeToken) return;
        const API_BASE = import.meta.env.VITE_API_URL || '';
        try {
          const res = await fetch(`${API_BASE}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${activeToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            set({
              profile: {
                username: data.profile.username,
                avatar: data.profile.avatar,
                xp: Number(data.profile.xp),
                level: Number(data.profile.level),
                rank: data.profile.rank,
                joinDate: new Date(data.profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
              }
            });

            // Sync achievements store dynamically to avoid circular dependencies
            const achievementStore = (await import('./useAchievementStore')).useAchievementStore;
            const achievementsList = achievementStore.getState().achievements;
            const updatedAchievements = achievementsList.map(a => {
              const unlocked = data.achievements.find(
                (dbA: { achievement_id: string; unlocked_at: string }) => dbA.achievement_id === a.id
              );
              return {
                ...a,
                unlockedAt: unlocked ? new Date(unlocked.unlocked_at).getTime() : null
              };
            });
            achievementStore.setState({ achievements: updatedAchievements });
          }
        } catch (err) {
          console.error('[AccountStore] Failed to fetch backend profile:', err);
        }
      },
      saveProfile: async (token) => {
        if (import.meta.env.VITE_USE_MOCK === 'true') return;
        const activeToken = token || get().authToken;
        if (!activeToken) return;
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const currentProfile = get().profile;
        try {
          const achievementStore = (await import('./useAchievementStore')).useAchievementStore;
          const unlockedList = achievementStore.getState().achievements
            .filter(a => a.unlockedAt !== null)
            .map(a => a.id);

          await fetch(`${API_BASE}/api/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
              username: currentProfile.username,
              avatar: currentProfile.avatar,
              xp: currentProfile.xp,
              level: currentProfile.level,
              rank: currentProfile.rank,
              achievements: unlockedList,
            })
          });
        } catch (err) {
          console.error('[AccountStore] Failed to save backend profile:', err);
        }
      }
    }),
    {
      name: 'orbital-insight-account',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
);
