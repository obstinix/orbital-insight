import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'orbital_insight_visited';

/**
 * Full-screen cinematic landing hero that plays once on first visit.
 *
 * Sequence:
 * 1. Deep void with distant star shimmer (2s fade-in)
 * 2. Title "ORBITAL INSIGHT" reveals letter-by-letter
 * 3. Tagline fades in below
 * 4. Animated orbital rings sweep across the screen
 * 5. "BEGIN EXPLORATION" CTA pulses with neon glow
 *
 * On CTA click:
 * - Sets localStorage flag to skip on return visits
 * - Dispatches 'orbitalInsightAudioUnlock' to init AudioEngine
 * - Fades out with scale+opacity transition
 */

interface LandingHeroProps {
  onComplete: () => void;
}

const TITLE_TEXT = 'ORBITAL INSIGHT';
const TAGLINE = 'Where Science Meets the Stars';

// Check reduced motion preference
const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const LandingHero: React.FC<LandingHeroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'void' | 'title' | 'tagline' | 'cta' | 'exiting' | 'done'>('void');
  const [revealedLetters, setRevealedLetters] = useState(0);
  const reducedMotion = prefersReducedMotion();

  // Skip entirely if already visited
  const hasVisited = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'true';

  useEffect(() => {
    if (hasVisited || reducedMotion) {
      // Skip the hero sequence entirely
      setPhase('done');
      return;
    }

    // Phase timing
    const t1 = setTimeout(() => setPhase('title'), 1500);
    const t2 = setTimeout(() => setPhase('tagline'), 4200);
    const t3 = setTimeout(() => setPhase('cta'), 5800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hasVisited, reducedMotion]);

  // Letter-by-letter reveal for the title
  useEffect(() => {
    if (phase !== 'title' && phase !== 'tagline' && phase !== 'cta') return;
    if (revealedLetters >= TITLE_TEXT.length) return;

    const interval = setInterval(() => {
      setRevealedLetters((prev) => {
        if (prev >= TITLE_TEXT.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [phase, revealedLetters]);

  const handleBeginExploration = useCallback(() => {
    // Mark as visited
    localStorage.setItem(STORAGE_KEY, 'true');

    // Unlock audio context via custom event
    window.dispatchEvent(new CustomEvent('orbitalInsightAudioUnlock'));

    // Begin exit transition
    setPhase('exiting');

    // Complete after exit animation
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 800);
  }, [onComplete]);

  if (phase === 'done') return null;

  const showTitle = phase !== 'void';
  const showTagline = phase === 'tagline' || phase === 'cta' || phase === 'exiting';
  const showCta = phase === 'cta' || phase === 'exiting';
  const isExiting = phase === 'exiting';

  return (
    <div
      aria-label="Welcome to Orbital Insight"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-void)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        overflow: 'hidden',
      }}
    >
      {/* Star particles background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 40% 70%, rgba(200,220,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 20%, rgba(255,255,240,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 60%, rgba(180,200,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 10% 80%, rgba(255,255,255,0.9) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 50%, rgba(220,230,255,0.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.7) 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 90%, rgba(200,215,255,0.5) 0%, transparent 100%),
            radial-gradient(1.5px 1.5px at 30% 50%, rgba(255,255,255,0.8) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 85%, rgba(210,225,255,0.6) 0%, transparent 100%)
          `,
          animation: 'heroStarTwinkle 6s ease-in-out infinite alternate',
          opacity: 0.4,
        }}
      />

      {/* Orbital ring decorations */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          border: '1px solid rgba(74, 144, 226, 0.08)',
          animation: showTitle ? 'heroRingSweep 12s linear infinite' : 'none',
          opacity: showTitle ? 0.6 : 0,
          transition: 'opacity 2s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 188, 212, 0.06)',
          animation: showTitle ? 'heroRingSweep 20s linear infinite reverse' : 'none',
          opacity: showTitle ? 0.4 : 0,
          transition: 'opacity 2.5s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          border: '1px solid rgba(123, 47, 190, 0.1)',
          animation: showTitle ? 'heroRingSweep 8s linear infinite' : 'none',
          opacity: showTitle ? 0.5 : 0,
          transition: 'opacity 1.5s ease',
        }}
      />

      {/* Radial glow behind title */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(ellipse at center, rgba(74, 144, 226, 0.12) 0%, transparent 70%)',
          opacity: showTitle ? 1 : 0,
          transition: 'opacity 2s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <h1
        aria-label={TITLE_TEXT}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
          letterSpacing: '12px',
          color: 'transparent',
          margin: 0,
          marginBottom: '1rem',
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
        }}
      >
        {TITLE_TEXT.split('').map((char, i) => {
          const isRevealed = i < revealedLetters;
          return (
            <span
              key={i}
              style={{
                color: isRevealed ? 'var(--color-starlight)' : 'transparent',
                textShadow: isRevealed
                  ? '0 0 20px rgba(74, 144, 226, 0.6), 0 0 40px rgba(74, 144, 226, 0.3)'
                  : 'none',
                transition: 'color 0.3s ease, text-shadow 0.5s ease',
                display: 'inline-block',
                minWidth: char === ' ' ? '0.4em' : undefined,
              }}
            >
              {char}
            </span>
          );
        })}
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.9rem, 2vw, 1.2rem)',
          color: 'var(--color-muted)',
          letterSpacing: '3px',
          marginBottom: '2.5rem',
          opacity: showTagline ? 1 : 0,
          transform: showTagline ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 1.2s ease, transform 1.2s ease',
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
        }}
      >
        {TAGLINE}
      </p>

      {/* CTA Button */}
      <button
        onClick={handleBeginExploration}
        disabled={!showCta}
        aria-label="Begin space exploration"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
          letterSpacing: '4px',
          color: showCta ? 'var(--color-starlight)' : 'transparent',
          background: showCta
            ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.15), rgba(0, 188, 212, 0.1))'
            : 'transparent',
          border: showCta ? '1px solid rgba(74, 144, 226, 0.4)' : '1px solid transparent',
          borderRadius: '8px',
          padding: '1rem 2.5rem',
          cursor: showCta ? 'pointer' : 'default',
          opacity: showCta ? 1 : 0,
          transform: showCta ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          zIndex: 1,
          animation: showCta && !isExiting ? 'heroCtaPulse 2.5s ease-in-out infinite' : 'none',
          boxShadow: showCta
            ? '0 0 20px rgba(74, 144, 226, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : 'none',
        }}
      >
        BEGIN EXPLORATION
      </button>

      {/* Version tag */}
      <div
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'rgba(107, 127, 163, 0.4)',
          letterSpacing: '2px',
          opacity: showCta ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      >
        v1.0 · BUILT FOR THE COSMOS
      </div>
    </div>
  );
};
