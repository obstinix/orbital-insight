import React, { useCallback } from 'react';
import { useAudioStore } from '../store/useAudioStore';

// ── SVG ICONS ─────────────────────────────────────────────────
const SpeakerOnIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const SpeakerOffIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

// ── VOLUME SLIDER ─────────────────────────────────────────────
interface VolumeSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
}

const VolumeSlider: React.FC<VolumeSliderProps> = ({ label, value, onChange, color }) => {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--color-muted)',
          letterSpacing: '1px',
        }}
      >
        <span>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        aria-label={`${label} volume`}
        style={{
          width: '100%',
          height: '4px',
          appearance: 'none',
          background: `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
          accentColor: color,
        }}
      />
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export const AudioControls: React.FC = () => {
  const isMuted = useAudioStore((s) => s.isMuted);
  const isExpanded = useAudioStore((s) => s.isExpanded);
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const ambientVolume = useAudioStore((s) => s.ambientVolume);
  const sfxVolume = useAudioStore((s) => s.sfxVolume);
  const isAudioUnlocked = useAudioStore((s) => s.isAudioUnlocked);

  const toggleMute = useAudioStore((s) => s.toggleMute);
  const setExpanded = useAudioStore((s) => s.setExpanded);
  const setMasterVolume = useAudioStore((s) => s.setMasterVolume);
  const setAmbientVolume = useAudioStore((s) => s.setAmbientVolume);
  const setSfxVolume = useAudioStore((s) => s.setSfxVolume);

  const handleToggle = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleExpand = useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded, setExpanded]);

  // Don't render until audio has been unlocked
  if (!isAudioUnlocked) return null;

  return (
    <div
      aria-label="Audio controls"
      style={{
        position: 'absolute',
        bottom: 'var(--space-2)',
        right: 'var(--space-2)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '8px',
      }}
    >
      {/* Expanded volume panel */}
      {isExpanded && (
        <div
          style={{
            width: '200px',
            background: 'rgba(5, 8, 16, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(74, 144, 226, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 12px rgba(0, 188, 212, 0.08)',
            animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.6rem',
              color: 'var(--color-teal-cyan)',
              letterSpacing: '2px',
              textAlign: 'center',
              marginBottom: '2px',
            }}
          >
            AUDIO MIX
          </div>
          <VolumeSlider
            label="MASTER"
            value={masterVolume}
            onChange={setMasterVolume}
            color="var(--color-stellar-blue)"
          />
          <VolumeSlider
            label="AMBIENT"
            value={ambientVolume}
            onChange={setAmbientVolume}
            color="var(--color-nebula-purple)"
          />
          <VolumeSlider
            label="SFX"
            value={sfxVolume}
            onChange={setSfxVolume}
            color="var(--color-cosmic-gold)"
          />
        </div>
      )}

      {/* Mute / expand toggle buttons */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={handleExpand}
          aria-label={isExpanded ? 'Collapse audio controls' : 'Expand audio controls'}
          aria-expanded={isExpanded}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(10, 14, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isExpanded ? 'var(--color-teal-cyan)' : 'rgba(74, 144, 226, 0.25)'}`,
            color: isExpanded ? 'var(--color-teal-cyan)' : 'var(--color-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            transition: 'all var(--duration-fast) var(--ease-warp)',
            boxShadow: isExpanded ? '0 0 10px rgba(0, 188, 212, 0.3)' : 'none',
          }}
        >
          ♪
        </button>
        <button
          onClick={handleToggle}
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          aria-pressed={isMuted}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(10, 14, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isMuted ? 'rgba(255, 80, 80, 0.4)' : 'rgba(74, 144, 226, 0.25)'}`,
            color: isMuted ? '#ff5050' : 'var(--color-starlight)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--duration-fast) var(--ease-warp)',
            boxShadow: isMuted ? '0 0 10px rgba(255, 80, 80, 0.2)' : 'none',
          }}
        >
          {isMuted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
        </button>
      </div>
    </div>
  );
};
