import React, { useEffect, useState } from 'react';
import { useAchievementStore } from '../store/useAchievementStore';

export const AchievementToast: React.FC = () => {
  const { activeToast, clearToast } = useAchievementStore();
  const [visible, setVisible] = useState(false);

  // Play browser synthesizer space chime sound
  const playSpaceChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      
      // Node 1: Bell Oscillator
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
      
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Node 2: Sub-harmony synth glow
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
      osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.08); // G4
      osc2.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.3); // A5

      gain2.gain.setValueAtTime(0.06, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio context blocked or unsupported
    }
  };

  useEffect(() => {
    if (activeToast) {
      setVisible(true);
      playSpaceChime();

      // Automatically hide and clear after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        // Delay clearing store state slightly to allow exit transition
        setTimeout(clearToast, 350);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [activeToast, clearToast]);

  if (!activeToast) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'var(--space-3)',
        right: 'var(--space-3)',
        width: '320px',
        background: 'rgba(10, 14, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1.5px solid var(--color-cosmic-gold)',
        boxShadow: '0 0 25px rgba(245, 166, 35, 0.4), inset 0 0 15px rgba(245, 166, 35, 0.1)',
        padding: '1rem',
        borderRadius: '8px',
        zIndex: 'var(--z-overlay)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(350px) scale(0.9)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Icon Badge */}
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'rgba(245, 166, 35, 0.15)',
          border: '1px solid var(--color-cosmic-gold)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '1.6rem',
          boxShadow: '0 0 10px rgba(245, 166, 35, 0.2)',
          flexShrink: 0,
          animation: 'pulse 1.5s infinite ease-in-out alternate',
        }}
      >
        {activeToast.icon}
      </div>

      {/* Info details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--color-cosmic-gold)',
            letterSpacing: '1px',
          }}
        >
          🏆 ACHIEVEMENT UNLOCKED!
        </span>
        <h4
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.85rem',
            color: '#fff',
            margin: 0,
          }}
        >
          {activeToast.title}
        </h4>
        <p
          style={{
            fontSize: '0.7rem',
            color: 'var(--color-starlight)',
            opacity: 0.8,
            lineHeight: '1.25',
          }}
        >
          {activeToast.description}
        </p>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-teal-cyan)',
            fontWeight: 'bold',
            marginTop: '2px',
          }}
        >
          +{activeToast.xpAward} XP
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(clearToast, 350);
        }}
        style={{
          position: 'absolute',
          top: '6px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-muted)',
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>
    </div>
  );
};
