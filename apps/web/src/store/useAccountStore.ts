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
  addXp: (amount: number) => void;
  updateProfile: (username: string, avatar: string) => void;
  resetAccount: () => void;
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
      },
      resetAccount: () => {
        set({
          profile: {
            ...DEFAULT_PROFILE,
            joinDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          },
        });
      },
    }),
    {
      name: 'orbital-insight-account',
    }
  )
);
