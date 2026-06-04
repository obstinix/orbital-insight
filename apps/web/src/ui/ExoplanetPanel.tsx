import React, { useState, useEffect, useCallback } from 'react';
import { useExoplanetStore } from '../store/useExoplanetStore';
import { useEngineStore } from '../store/useEngineStore';
import * as THREE from 'three';
import gsap from 'gsap';
import { useAchievementStore } from '../store/useAchievementStore';

export const ExoplanetPanel: React.FC = () => {
  const {
    selectedExoplanetId,
    setSelectedExoplanetId,
    setShowExoplanetCanvas,
    exoplanets,
    totalCount,
    loading,
    searchTerm,
    category,
    page,
    limit,
    setSearch,
    setCategory,
    setPage,
    fetchExoplanets,
    activeExoplanet,
  } = useExoplanetStore();

  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Set showExoplanetCanvas on mount/unmount
  useEffect(() => {
    setShowExoplanetCanvas(true);
    fetchExoplanets();
    return () => setShowExoplanetCanvas(false);
  }, [setShowExoplanetCanvas, fetchExoplanets]);

  const handleExoplanetClick = useCallback((id: string, cat: string) => {
    setSelectedExoplanetId(id);

    if (cat === 'habitable') {
      useAchievementStore.getState().unlock('exoplanet_habitable');
    } else if (cat === 'lava') {
      useAchievementStore.getState().unlock('exoplanet_lava');
    }

    const engine = useEngineStore.getState();
    const mesh = engine.scene?.getObjectByName('exoplanet_mesh');

    if (mesh) {
      // Set the procedural category in 3D renderer
      window.dispatchEvent(
        new CustomEvent('exoplanetVisualUpdate', {
          detail: { category: cat },
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
  }, [setSelectedExoplanetId]);

  // Auto-select first in list if nothing selected
  useEffect(() => {
    if (!selectedExoplanetId && exoplanets.length > 0) {
      handleExoplanetClick(exoplanets[0].id, exoplanets[0].category);
    }
  }, [selectedExoplanetId, exoplanets, handleExoplanetClick]);

  // Debounce/sync local search term
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearch(localSearch);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [localSearch, searchTerm, setSearch]);

  const totalPages = Math.ceil(totalCount / limit);

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
          EXPLORE CONFIRMED CATALOG ({totalCount})
        </span>

        {/* Search */}
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
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
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              aria-label={`Filter catalog by ${cat.toLowerCase()} planets`}
              style={{
                background: category === cat ? 'var(--color-teal-cyan)' : 'transparent',
                border: 'none',
                color: category === cat ? 'var(--color-void)' : 'var(--color-muted)',
                padding: '0.2rem 0.4rem',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: category === cat ? 'bold' : 'normal',
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
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '180px', flex: 1 }}
        >
          {exoplanets.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              {loading ? 'SCANNING DEEP SPACE...' : 'NO PLANETS FOUND'}
            </div>
          ) : (
            exoplanets.map((p) => {
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
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '4px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(74, 144, 226, 0.12)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
            }}
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                background: 'rgba(5, 8, 16, 0.6)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                color: page === 1 ? 'var(--color-muted)' : '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '3px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                opacity: page === 1 ? 0.5 : 1,
                fontSize: '0.6rem',
                transition: 'all 0.15s ease',
              }}
            >
              PREV
            </button>
            <span style={{ color: 'var(--color-starlight)' }}>
              PAGE {page} OF {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              style={{
                background: 'rgba(5, 8, 16, 0.6)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                color: page >= totalPages ? 'var(--color-muted)' : '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '3px',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                opacity: page >= totalPages ? 0.5 : 1,
                fontSize: '0.6rem',
                transition: 'all 0.15s ease',
              }}
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
