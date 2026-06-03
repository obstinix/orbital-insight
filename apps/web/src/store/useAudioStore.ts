import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioState {
  /** Master volume 0–1 */
  masterVolume: number;
  /** Ambient layer volume 0–1 */
  ambientVolume: number;
  /** SFX layer volume 0–1 */
  sfxVolume: number;
  /** Voice narration volume 0–1 */
  voiceVolume: number;
  /** Global mute toggle */
  isMuted: boolean;
  /** Whether guide voice text-to-speech is enabled */
  isVoiceEnabled: boolean;
  /** Whether AudioContext has been unlocked by user gesture */
  isAudioUnlocked: boolean;
  /** Whether the volume controls panel is expanded */
  isExpanded: boolean;

  setMasterVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setVoiceVolume: (v: number) => void;
  toggleMute: () => void;
  toggleVoice: () => void;
  setMuted: (muted: boolean) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  setExpanded: (expanded: boolean) => void;
}

export const useAudioStore = create<AudioState>()(
  persist(
    (set) => ({
      masterVolume: 0.5,
      ambientVolume: 0.7,
      sfxVolume: 0.8,
      voiceVolume: 0.8,
      isMuted: false,
      isVoiceEnabled: true,
      isAudioUnlocked: false,
      isExpanded: false,

      setMasterVolume: (v) => set({ masterVolume: Math.max(0, Math.min(1, v)) }),
      setAmbientVolume: (v) => set({ ambientVolume: Math.max(0, Math.min(1, v)) }),
      setSfxVolume: (v) => set({ sfxVolume: Math.max(0, Math.min(1, v)) }),
      setVoiceVolume: (v) => set({ voiceVolume: Math.max(0, Math.min(1, v)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      toggleVoice: () => set((state) => ({ isVoiceEnabled: !state.isVoiceEnabled })),
      setMuted: (muted) => set({ isMuted: muted }),
      setAudioUnlocked: (unlocked) => set({ isAudioUnlocked: unlocked }),
      setExpanded: (expanded) => set({ isExpanded: expanded }),
    }),
    {
      name: 'orbital-insight-audio',
      partialize: (state) => ({
        masterVolume: state.masterVolume,
        ambientVolume: state.ambientVolume,
        sfxVolume: state.sfxVolume,
        voiceVolume: state.voiceVolume,
        isMuted: state.isMuted,
        isVoiceEnabled: state.isVoiceEnabled,
      }),
    }
  )
);
