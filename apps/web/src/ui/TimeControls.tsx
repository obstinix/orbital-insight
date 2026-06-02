import React, { useState } from 'react';
import { useTimeStore } from '../store/useTimeStore';
import { useEventStore } from '../store/useEventStore';
import { useAchievementStore } from '../store/useAchievementStore';

const SPEED_OPTIONS = [
  { value: -10000, label: '◀◀ -10k' },
  { value: -100, label: '◀ -100x' },
  { value: 1, label: '1x' },
  { value: 100, label: '100x ▶' },
  { value: 1000, label: '1k ▶▶' },
  { value: 10000, label: '10k ▶▶▶' },
  { value: 100000, label: '100k Warp' },
];

export const TimeControls: React.FC = () => {
  const simulatedDate = useTimeStore((state) => state.simulatedDate);
  const speedMultiplier = useTimeStore((state) => state.speedMultiplier);
  const isPaused = useTimeStore((state) => state.isPaused);

  const setSpeedMultiplier = useTimeStore((state) => state.setSpeedMultiplier);
  const setIsPaused = useTimeStore((state) => state.setIsPaused);
  const setSimulatedDate = useTimeStore((state) => state.setSimulatedDate);

  // Special Events Store
  const {
    isMeteorActive,
    isSupernovaActive,
    isEclipseActive,
    isCometActive,
    triggerMeteorShower,
    triggerSupernova,
    triggerEclipse,
    triggerComet,
  } = useEventStore();

  const [showEventDrawer, setShowEventDrawer] = useState(false);

  const formatDate = (date: Date) => {
    const day = date.getUTCDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getUTCMonth()];
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} — ${hours}:${minutes} UTC`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSimulatedDate(new Date(e.target.value));
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'var(--space-2)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.6rem',
        minWidth: '460px',
      }}
    >
      {/* Visual Event Trigger Drawer */}
      {showEventDrawer && (
        <div
          style={{
            background: 'rgba(10, 14, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            boxShadow: '0 -4px 20px rgba(0, 240, 255, 0.15)',
            padding: '0.6rem 1.2rem',
            borderRadius: '6px',
            display: 'flex',
            gap: '8px',
            animation: 'slideIn 0.25s ease-out',
            marginBottom: '4px',
          }}
        >
          {/* Meteor Shower Button */}
          <button
            onClick={() => triggerMeteorShower(!isMeteorActive)}
            style={eventBtnStyle(isMeteorActive, '#00ffff')}
          >
            ☄️ METEOR SHOWER: {isMeteorActive ? 'ON' : 'OFF'}
          </button>

          {/* Comet Button */}
          <button
            onClick={triggerComet}
            disabled={isCometActive}
            style={eventBtnStyle(isCometActive, '#ffffff')}
          >
            ☄️ SWEEP COMET
          </button>

          {/* Solar Eclipse Button */}
          <button
            onClick={() => triggerEclipse(!isEclipseActive)}
            style={eventBtnStyle(isEclipseActive, '#ffaa00')}
          >
            🌑 ECLIPSE ALIGN: {isEclipseActive ? 'ON' : 'OFF'}
          </button>

          {/* Supernova Button */}
          <button
            onClick={triggerSupernova}
            disabled={isSupernovaActive}
            style={eventBtnStyle(isSupernovaActive, '#ff3366')}
          >
            💥 EXPLODE SUPERNOVA
          </button>
        </div>
      )}

      {/* Main Clock & Speed controls */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.6rem',
          background: 'rgba(10, 14, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(74, 144, 226, 0.2)',
          padding: '0.8rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Date Readout Display */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.05rem',
            color: 'var(--color-starlight)',
            letterSpacing: '1px',
            textShadow: '0 0 8px rgba(74, 144, 226, 0.4)',
          }}
        >
          {formatDate(simulatedDate)}
        </div>

        {/* Control buttons row */}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          {/* Play/Pause */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Resume Simulation Time' : 'Pause Simulation Time'}
            style={{
              background: isPaused ? 'var(--color-stellar-blue)' : 'rgba(74, 144, 226, 0.15)',
              border: '1px solid var(--color-stellar-blue)',
              color: 'var(--color-starlight)',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              transition: 'all 0.15s ease',
            }}
          >
            {isPaused ? '▶ PLAY' : '⏸ PAUSE'}
          </button>

          {/* Speed selectors */}
          <div style={{ display: 'flex', gap: '2px', background: 'rgba(5, 8, 16, 0.5)', padding: '2px', borderRadius: '4px' }}>
            {SPEED_OPTIONS.map((opt) => {
              const isSelected = speedMultiplier === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSpeedMultiplier(opt.value);
                    setIsPaused(false); // Auto resume on speed setting change
                    if (opt.value === 100000) {
                      useAchievementStore.getState().unlock('time_warp');
                    }
                  }}
                  style={{
                    background: isSelected ? 'var(--color-teal-cyan)' : 'transparent',
                    border: 'none',
                    color: isSelected ? 'var(--color-void)' : 'var(--color-muted)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Date Jump Picker */}
          <input
            type="date"
            onChange={handleDateChange}
            aria-label="Select custom simulation date"
            style={{
              background: 'rgba(5, 8, 16, 0.6)',
              border: '1px solid rgba(74, 144, 226, 0.3)',
              borderRadius: '4px',
              color: 'var(--color-starlight)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              padding: '0.2rem 0.4rem',
              cursor: 'pointer',
              outline: 'none',
              marginRight: '6px',
            }}
          />

          {/* Toggle Event Drawer */}
          <button
            onClick={() => setShowEventDrawer(!showEventDrawer)}
            style={{
              background: showEventDrawer ? 'var(--color-cosmic-gold)' : 'rgba(245, 166, 35, 0.15)',
              border: '1px solid var(--color-cosmic-gold)',
              color: showEventDrawer ? 'var(--color-void)' : 'var(--color-cosmic-gold)',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡ EVENTS
          </button>
        </div>
      </div>
    </div>
  );
};

const eventBtnStyle = (active: boolean, color: string): React.CSSProperties => ({
  background: active ? `rgba(${color === '#ff3366' ? '255, 51, 102' : color === '#ffaa00' ? '255, 170, 0' : '0, 240, 255'}, 0.25)` : 'rgba(5, 8, 16, 0.5)',
  border: `1.5px solid ${color}`,
  color: color,
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  fontSize: '0.7rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  transition: 'all 0.15s ease',
  opacity: active ? 1.0 : 0.7,
});

