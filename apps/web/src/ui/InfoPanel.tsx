import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePlanetStore, planetRegistry } from '../store/usePlanetStore';
import { useEngineStore } from '../store/useEngineStore';

export const InfoPanel: React.FC = () => {
  const selectedPlanetId = usePlanetStore((state) => state.selectedPlanetId);
  const setSelectedPlanetId = usePlanetStore((state) => state.setSelectedPlanetId);
  
  const distanceRef = useRef<HTMLSpanElement>(null);
  const velocityRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const config = selectedPlanetId ? planetRegistry[selectedPlanetId] : null;
  const [activeFactIndex, setActiveFactIndex] = useState(0);

  // Reset carousel index when planet changes
  useEffect(() => {
    setActiveFactIndex(0);
  }, [selectedPlanetId]);

  // Auto-rotate fun facts every 8 seconds
  useEffect(() => {
    if (!config?.facts?.fun_facts || config.facts.fun_facts.length === 0) return;

    const timer = setInterval(() => {
      setActiveFactIndex((prev) => (prev + 1) % config.facts.fun_facts!.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [config, selectedPlanetId]);

  // 1. Focus trap & Escape key closing for accessibility compliance
  useEffect(() => {
    if (!config) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPlanetId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    // Focus the panel when it opens
    panelRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [config, setSelectedPlanetId]);

  // 2. High-performance direct DOM updates for dynamic physics readouts
  useEffect(() => {
    if (!config || !selectedPlanetId) return;

    let animFrameId: number;
    const isMoon = selectedPlanetId === 'moon';
    const isSun = selectedPlanetId === 'sun';

    const tick = () => {
      const engine = useEngineStore.getState();
      if (!engine.scene) {
        animFrameId = requestAnimationFrame(tick);
        return;
      }

      const bodyGroup = engine.scene.getObjectByName(`planet_group_${selectedPlanetId}`);
      
      if (bodyGroup) {
        let distanceAU = 0;
        let velocityKms = 0;

        if (isSun) {
          distanceAU = 0;
          velocityKms = 0;
        } else if (isMoon) {
          const earthGroup = engine.scene.getObjectByName('planet_group_earth');
          if (earthGroup) {
            // Distance from Earth in km (1 unit = 1 million km)
            const distUnits = bodyGroup.position.distanceTo(earthGroup.position);
            distanceAU = distUnits / 150;
            
            // Standard Moon velocity ≈ 1.02 km/s
            velocityKms = 1.022;
          }
        } else {
          // Normal planet heliocentric calculations (centered at Sun origin)
          const distUnits = bodyGroup.position.length();
          distanceAU = distUnits / 150; // 150 units = 1 AU
          
          // Keplerian orbital velocity approximation: v = sqrt(GM/r)
          // Earth is ~29.78 km/s at 1 AU
          if (distanceAU > 0) {
            velocityKms = 29.78 / Math.sqrt(distanceAU);
          }
        }

        if (distanceRef.current) {
          distanceRef.current.innerText = isSun 
            ? '0.0000 AU' 
            : isMoon
              ? `${(distanceAU * 389).toFixed(4)} LD` // Lunar Distance
              : `${distanceAU.toFixed(4)} AU`;
        }

        if (velocityRef.current) {
          velocityRef.current.innerText = isSun 
            ? '0.00 km/s' 
            : `${velocityKms.toFixed(2)} km/s`;
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [config, selectedPlanetId]);

  if (!config) return null;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={`${config.name} Information`}
        aria-live="polite"
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 120 }}
        style={{
          position: 'absolute',
          top: 'var(--space-2)',
          right: 'var(--space-2)',
          width: '360px',
          maxHeight: 'calc(100% - var(--space-4))',
          overflowY: 'auto',
          zIndex: 'var(--z-panel)',
          background: 'rgba(10, 14, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(74, 144, 226, 0.25)',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--color-starlight)' }}>{config.name}</h2>
          <button
            onClick={() => setSelectedPlanetId(null)}
            aria-label="Close Info Panel"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.2rem',
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Orbital Data (Refs updated at 60fps) */}
        <div
          style={{
            background: 'rgba(5, 8, 16, 0.6)',
            padding: '1rem',
            borderRadius: '4px',
            border: '1px solid rgba(74, 144, 226, 0.1)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          <div style={{ color: 'var(--color-teal-cyan)', fontWeight: 'bold' }}>LIVE TELEMETRY</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>DISTANCE:</span>
            <span ref={distanceRef} style={{ color: 'var(--color-starlight)' }}>Calculating...</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>VELOCITY:</span>
            <span ref={velocityRef} style={{ color: 'var(--color-starlight)' }}>Calculating...</span>
          </div>
        </div>

        {/* Physics Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div style={{ borderBottom: '1px solid rgba(107, 127, 163, 0.2)', paddingBottom: '0.3rem' }}>
            <span style={{ color: 'var(--color-muted)' }}>Equatorial Radius:</span>{' '}
            <strong style={{ float: 'right' }}>{config.radius_km.toLocaleString()} km</strong>
          </div>
          <div style={{ borderBottom: '1px solid rgba(107, 127, 163, 0.2)', paddingBottom: '0.3rem' }}>
            <span style={{ color: 'var(--color-muted)' }}>Mass:</span>{' '}
            <strong style={{ float: 'right' }}>{config.mass_kg.toExponential(3)} kg</strong>
          </div>
          <div style={{ borderBottom: '1px solid rgba(107, 127, 163, 0.2)', paddingBottom: '0.3rem' }}>
            <span style={{ color: 'var(--color-muted)' }}>Orbital Period:</span>{' '}
            <strong style={{ float: 'right' }}>{config.orbital_period_days} Days</strong>
          </div>
          <div style={{ borderBottom: '1px solid rgba(107, 127, 163, 0.2)', paddingBottom: '0.3rem' }}>
            <span style={{ color: 'var(--color-muted)' }}>Axial Tilt:</span>{' '}
            <strong style={{ float: 'right' }}>{config.axial_tilt_deg}°</strong>
          </div>
        </div>

        {/* Fun Facts Carousel */}
        {config.facts.fun_facts && config.facts.fun_facts.length > 0 && (
          <div
            style={{
              background: 'rgba(0, 240, 255, 0.04)',
              border: '1px solid rgba(0, 240, 255, 0.15)',
              borderRadius: '6px',
              padding: '0.8rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '1.5px', fontWeight: 'bold' }}>
                DID YOU KNOW?
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setActiveFactIndex((prev) => (prev - 1 + config.facts.fun_facts!.length) % config.facts.fun_facts!.length)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-teal-cyan)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                  }}
                  aria-label="Previous fact"
                >
                  ◀
                </button>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {activeFactIndex + 1}/{config.facts.fun_facts.length}
                </span>
                <button
                  onClick={() => setActiveFactIndex((prev) => (prev + 1) % config.facts.fun_facts!.length)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-teal-cyan)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                  }}
                  aria-label="Next fact"
                >
                  ▶
                </button>
              </div>
            </div>

            <div style={{ minHeight: '52px', display: 'flex', alignItems: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeFactIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-starlight)',
                    lineHeight: '1.45',
                    margin: 0,
                    fontStyle: 'italic'
                  }}
                >
                  {config.facts.fun_facts[activeFactIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Overview facts link */}
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>
          <p>Factual data sourced from official JPL planetary ephemeris tables.</p>
          <a
            href={config.facts.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Source: ${config.facts.source} (opens in a new tab)`}
            style={{ color: 'var(--color-stellar-blue)', textDecoration: 'none', display: 'block', marginTop: '0.3rem' }}
          >
            Source: {config.facts.source} ↗
          </a>
        </div>

        {/* AI Guide CTA */}
        <button
          onClick={() => {
            // Emulate click event to trigger chat launch
            window.dispatchEvent(new CustomEvent('launchAIGuide', { detail: { target: config.id } }));
          }}
          aria-label={`Ask ship guide about ${config.name}`}
          style={{
            marginTop: '0.8rem',
            background: 'linear-gradient(135deg, var(--color-nebula-purple), var(--color-stellar-blue))',
            color: 'var(--color-starlight)',
            border: 'none',
            padding: '0.8rem 1rem',
            borderRadius: '4px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.9rem',
            letterSpacing: '1px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(123, 47, 190, 0.4)',
            transition: 'all 0.2s var(--ease-orbit)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(123, 47, 190, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(123, 47, 190, 0.4)';
          }}
        >
          ASK SHIP GUIDE
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
