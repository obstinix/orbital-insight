import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useConstellationStore } from '../store/useConstellationStore';
import { useEngineStore } from '../store/useEngineStore';

export const CompassRose: React.FC = () => {
  const mode = useConstellationStore((state) => state.mode);
  const camera = useEngineStore((state) => state.camera);
  
  const [bearing, setBearing] = useState(0); // Degrees
  const [altitude, setAltitude] = useState(0); // Degrees

  useEffect(() => {
    if (mode !== 'skymap' || !camera) return;

    let active = true;
    const dir = new THREE.Vector3();

    const updateCompass = () => {
      if (!active || !camera) return;

      camera.getWorldDirection(dir);
      
      // Calculate Azimuth (bearing): angle in XZ plane relative to North (which is -Z)
      // Math.atan2(x, -z) gives angle clockwise from -Z
      let angleRad = Math.atan2(dir.x, -dir.z);
      if (angleRad < 0) angleRad += 2 * Math.PI;
      const angleDeg = (angleRad * 180) / Math.PI;
      setBearing(angleDeg);

      // Calculate Altitude: angle above XZ plane
      const horizonDist = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
      const pitchRad = Math.atan2(dir.y, horizonDist);
      const pitchDeg = (pitchRad * 180) / Math.PI;
      setAltitude(pitchDeg);

      requestAnimationFrame(updateCompass);
    };

    updateCompass();

    return () => {
      active = false;
    };
  }, [mode, camera]);

  if (mode !== 'skymap') return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'var(--space-2)',
        right: 'var(--space-2)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(10, 14, 42, 0.7)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        width: '180px',
        animation: 'slideIn 0.3s ease-out both',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--color-teal-cyan)',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}
      >
        OBSERVER HORIZON HUD
      </span>

      {/* Compass Dial Visual */}
      <div
        style={{
          position: 'relative',
          width: '90px',
          height: '90px',
          borderRadius: '50%',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        {/* Rotating ring */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px dashed rgba(0, 240, 255, 0.4)',
            transform: `rotate(${-bearing}deg)`,
            transition: 'transform 0.1s linear',
          }}
        >
          {/* Cardinal markers inside rotating ring */}
          <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#ff3b30', fontWeight: 'bold' }}>N</div>
          <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#00f0ff' }}>S</div>
          <div style={{ position: 'absolute', top: '50%', right: '4px', transform: 'translateY(-50%)', fontSize: '10px', color: '#00f0ff' }}>E</div>
          <div style={{ position: 'absolute', top: '50%', left: '4px', transform: 'translateY(-50%)', fontSize: '10px', color: '#00f0ff' }}>W</div>
        </div>

        {/* Center crosshair */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-teal-cyan)',
            boxShadow: '0 0 8px var(--color-teal-cyan)',
          }}
        />
        {/* Pointer needle */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            width: '2px',
            height: '35%',
            background: 'linear-gradient(to top, rgba(0, 240, 255, 0), #00f0ff)',
            transformOrigin: 'bottom center',
          }}
        />
      </div>

      {/* Telemetry info */}
      <div
        style={{
          width: '100%',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-starlight)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted)' }}>AZIMUTH:</span>
          <span>{Math.round(bearing)}°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--color-muted)' }}>ALTITUDE:</span>
          <span style={{ color: altitude >= 0 ? '#4cd964' : '#ff3b30' }}>
            {Math.round(altitude)}°
          </span>
        </div>
      </div>
    </div>
  );
};
