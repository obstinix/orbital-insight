import React, { useState, useEffect } from 'react';
import { useExoplanetStore } from '../store/useExoplanetStore';
import { useEngineStore } from '../store/useEngineStore';
import exoplanetsData from '../../../../packages/content/exoplanets.json';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAchievementStore } from '../store/useAchievementStore';


export const ExoplanetPanel: React.FC = () => {
  const {
    selectedExoplanetId,
    setSelectedExoplanetId,
    setShowExoplanetCanvas,
  } = useExoplanetStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  
  // Set showExoplanetCanvas on mount/unmount
  useEffect(() => {
    setShowExoplanetCanvas(true);
    return () => setShowExoplanetCanvas(false);
  }, [setShowExoplanetCanvas]);

  const activeExoplanet = exoplanetsData.find((p) => p.id === selectedExoplanetId) || null;

  const handleExoplanetClick = (id: string, category: string) => {
    setSelectedExoplanetId(id);

    if (category === 'habitable') {
      useAchievementStore.getState().unlock('exoplanet_habitable');
    } else if (category === 'lava') {
      useAchievementStore.getState().unlock('exoplanet_lava');
    }

    const engine = useEngineStore.getState();
    const mesh = engine.scene?.getObjectByName('exoplanet_mesh');

    if (mesh) {
      // Set the procedural category in 3D renderer
      // We stored the renderer in the store
      // Let's retrieve it from engine state or set it via a custom event
      window.dispatchEvent(
        new CustomEvent('exoplanetVisualUpdate', {
          detail: { category },
        })
      );

      // Reset camera view to frame the exoplanet close up
      if (engine.camera && engine.cameraController) {
        engine.cameraController.setMode('FREE_ROAM');
        engine.cameraController.setOrbitTarget(new THREE.Vector3(0, 0, 0));

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        gsap.to(engine.camera.position, {
          x: 0,
          y: 0,
          z: 220, // close up distance
          duration: prefersReducedMotion ? 0 : 1.5,
          ease: 'power2.inOut',
          onUpdate: () => {
            if (engine.camera) {
              engine.camera.lookAt(0, 0, 0);
            }
          },
        });
      }
    }
  };

  // Filter exoplanets
  const filteredExoplanets = exoplanetsData.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = activeCategory === 'ALL' || p.category.toUpperCase() === activeCategory;
    return matchesSearch && matchesCat;
  });

  // Auto-select first in filtered list if nothing selected
  useEffect(() => {
    if (!selectedExoplanetId && filteredExoplanets.length > 0) {
      handleExoplanetClick(filteredExoplanets[0].id, filteredExoplanets[0].category);
    }
  }, [selectedExoplanetId, filteredExoplanets]);

  return (
    <div
      role="region"
      aria-label="Exoplanet Catalog HUD"
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '320px',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        overflow: 'hidden',
        animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
      }}
    >
      {/* Exoplanet Details Card */}
      {activeExoplanet && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(10, 14, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            padding: '1.2rem',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--color-teal-cyan)',
              letterSpacing: '1.5px',
            }}
          >
            DISCOVERED EXOPLANET
          </span>
          <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
            {activeExoplanet.name}
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--color-teal-cyan)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
              {activeExoplanet.type.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(74, 144, 226, 0.15)', color: 'var(--color-stellar-blue)', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
              ESI: {activeExoplanet.habitabilityScore}%
            </span>
          </div>

          {/* Stats Sheet */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-starlight)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>DISTANCE:</span>
              <span>{activeExoplanet.distance} Light Years</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>MASS:</span>
              <span>{activeExoplanet.mass} M⊕ (Earths)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>HOST STAR:</span>
              <span>{activeExoplanet.star}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-muted)' }}>DISCOVERY YEAR:</span>
              <span>{activeExoplanet.discoveryYear} ({activeExoplanet.method})</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: '1.4', margin: '6px 0 0 0' }}>
            {activeExoplanet.description}
          </p>
        </div>
      )}

      {/* Catalog browser list */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(74, 144, 226, 0.15)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-muted)',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}
        >
          EXPLORE CONFIRMED CATALOG
        </span>

        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search exoplanets..."
          aria-label="Search exoplanets catalog"
          style={{
            background: 'rgba(5, 8, 16, 0.6)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '0.75rem',
            padding: '0.4rem 0.6rem',
            outline: 'none',
            fontFamily: 'var(--font-display)',
          }}
        />

        {/* Category Filters row */}
        <div 
          aria-label="Filter category choices"
          style={{ display: 'flex', gap: '3px', background: 'rgba(5, 8, 16, 0.5)', padding: '2px', borderRadius: '4px', overflowX: 'auto' }}
        >
          {['ALL', 'HABITABLE', 'OCEAN', 'LAVA', 'ICE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              aria-label={`Filter catalog by ${cat.toLowerCase()} planets`}
              style={{
                background: activeCategory === cat ? 'var(--color-teal-cyan)' : 'transparent',
                border: 'none',
                color: activeCategory === cat ? 'var(--color-void)' : 'var(--color-muted)',
                padding: '0.2rem 0.4rem',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: activeCategory === cat ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Planet List buttons */}
        <div 
          aria-label="Exoplanet matches"
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '180px' }}
        >
          {filteredExoplanets.map((p) => {
            const isSelected = p.id === selectedExoplanetId;
            return (
              <button
                key={p.id}
                onClick={() => handleExoplanetClick(p.id, p.category)}
                aria-pressed={isSelected}
                aria-label={`Select exoplanet ${p.name}, type is ${p.type}, category is ${p.category}`}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isSelected ? 'rgba(0, 240, 255, 0.1)' : 'rgba(5, 8, 16, 0.3)',
                  border: isSelected ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(74, 144, 226, 0.12)',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: isSelected ? '#fff' : 'var(--color-starlight)', fontWeight: isSelected ? 'bold' : 'normal' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: '0.55rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                    {p.type}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.6rem',
                    color: p.category === 'habitable' ? '#00f0ff' : p.category === 'ocean' ? '#4a90e2' : p.category === 'lava' ? '#ff3333' : '#a6e3e9',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {p.category.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
