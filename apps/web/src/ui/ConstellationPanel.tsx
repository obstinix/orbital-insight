import React, { useState, useEffect } from 'react';
import { useConstellationStore } from '../store/useConstellationStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useEngineStore } from '../store/useEngineStore';
import { ConstellationLines } from '../engine/bodies/ConstellationLines';
import gsap from 'gsap';
import * as THREE from 'three';

export const ConstellationPanel: React.FC = () => {
  const {
    latitude,
    longitude,
    showConstellations,
    selectedId,
    setUserLocation,
    setShowConstellations,
    setSelectedId,
    constellationsList,
  } = useConstellationStore();

  const [siderealTime, setSiderealTime] = useState('');
  const [geoStatus, setGeoStatus] = useState<'IDLE' | 'LOCATING' | 'SUCCESS' | 'ERROR'>('IDLE');

  // Sidereal Time Calculation loop
  useEffect(() => {
    const updateSidereal = () => {
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      
      // Rough Local Sidereal Time (LST) approximation
      const gst = (utcHours * 1.0027379 + 6.6) % 24;
      const lst = (gst + longitude / 15.0 + 24.0) % 24;

      const hrs = Math.floor(lst);
      const mins = Math.floor((lst - hrs) * 60);
      const secs = Math.floor(((lst - hrs) * 60 - mins) * 60);
      
      setSiderealTime(
        `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );
    };

    updateSidereal();
    const interval = setInterval(updateSidereal, 1000);
    return () => clearInterval(interval);
  }, [longitude]);

  // Handle Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('ERROR');
      return;
    }

    setGeoStatus('LOCATING');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation(position.coords.latitude, position.coords.longitude);
        setGeoStatus('SUCCESS');
      },
      () => {
        setGeoStatus('ERROR');
      }
    );
  };

  const handleConstellationClick = (id: string) => {
    setSelectedId(id);
    setShowConstellations(true);

    const rawConst = constellationsList.find((c) => c.id === id);
    if (!rawConst) return;

    const starPos = ConstellationLines.getCoordinates3D(rawConst.ra, rawConst.dec);
    const engine = useEngineStore.getState();

    if (engine.camera && engine.cameraController) {
      // Switch camera to FREE_ROAM
      engine.cameraController.setMode('FREE_ROAM');
      engine.cameraController.setOrbitTarget(new THREE.Vector3(0, 0, 0));

      // Position camera looking outwards along the direction vector to the constellation
      const direction = starPos.clone().normalize();
      const targetCamPos = direction.clone().multiplyScalar(-300); // 300 units from origin

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      gsap.to(engine.camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: prefersReducedMotion ? 0 : 2.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (engine.camera) {
            engine.camera.lookAt(starPos);
          }
        },
      });
    }
  };

  return (
    <div
      role="region"
      aria-label="Constellation Mapper HUD"
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
      {/* Geolocation Card */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.8)',
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
          CELESTIAL ROTATION MATRICES
        </span>
        <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
          Constellation Mapper
        </h2>

        {/* Telemetry rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-starlight)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>LATITUDE:</span>
            <span>{latitude.toFixed(4)}°</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>LONGITUDE:</span>
            <span>{longitude.toFixed(4)}°</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>LOCAL SIDEREAL TIME:</span>
            <span style={{ color: 'var(--color-teal-cyan)' }}>{siderealTime}</span>
          </div>
        </div>

        {/* Locate/Detect Button */}
        <button
          onClick={handleDetectLocation}
          aria-label="Detect current location and align night sky position"
          style={{
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00f0ff',
            padding: '0.4rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            transition: 'all 0.15s ease',
            marginTop: '6px',
          }}
        >
          {geoStatus === 'LOCATING'
            ? 'RESOLVING GEOLOCATION...'
            : geoStatus === 'ERROR'
            ? 'GEO ERROR (FALLBACK ACTIVE)'
            : 'DETECT NIGHT SKY POSITION'}
        </button>

        {/* Visibility Toggle */}
        <label
          htmlFor="render-constellations-checkbox"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: '#fff',
            cursor: 'pointer',
            marginTop: '8px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <input
            id="render-constellations-checkbox"
            type="checkbox"
            checked={showConstellations}
            onChange={(e) => {
              setShowConstellations(e.target.checked);
              if (e.target.checked) {
                useAchievementStore.getState().unlock('constellations_toggle');
              }
            }}
            style={{
              accentColor: 'var(--color-teal-cyan)',
              cursor: 'pointer',
            }}
          />
          RENDER CONSTELLATION OVERLAYS
        </label>
      </div>

      {/* Constellation List */}
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
          IAU REGISTERED FIGURES
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {constellationsList.map((c) => {
            const isSelected = c.id === selectedId;
            return (
              <div
                key={c.id}
                style={{
                  background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(5, 8, 16, 0.3)',
                  border: isSelected
                    ? '1px solid rgba(0, 240, 255, 0.4)'
                    : '1px solid rgba(74, 144, 226, 0.12)',
                  borderRadius: '4px',
                  padding: '0.6rem 0.8rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                    {c.name} ({c.abbreviation})
                  </span>
                  <button
                    onClick={() => handleConstellationClick(c.id)}
                    aria-label={`Lock target to ${c.name} constellation`}
                    aria-pressed={isSelected}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--color-teal-cyan)' : 'var(--color-muted)',
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    LOCK TARGET
                  </button>
                </div>
                {isSelected && (
                  <p
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-muted)',
                      lineHeight: '1.3',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {c.mythology}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
