import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useEngineStore } from '../store/useEngineStore';
import * as THREE from 'three';
import gsap from 'gsap';

export const MissionsPanel: React.FC = () => {
  const {
    issTelemetry,
    launches,
    historicalMissions,
    selectedMissionId,
    activeSpacecraft,
    setIssTelemetry,
    setSelectedMissionId,
    setActiveSpacecraft,
  } = useMissionStore();

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'LAUNCHES' | 'TIMELINE'>('TELEMETRY');
  const [telemetryPollError, setTelemetryPollError] = useState(false);

  // Countdown timers state
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // 1. Telemetry Polling Loop
  useEffect(() => {
    if (activeSpacecraft !== 'ISS') return;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/missions/iss');
        if (!res.ok) throw new Error('API down');
        const data = await res.json();
        
        // Mock realistic altitude and speed for display
        setIssTelemetry({
          latitude: data.latitude,
          longitude: data.longitude,
          altitude: 421.4, // standard ISS height
          speed: 27560 + Math.floor(Math.random() * 20), // minor orbital fluctuation
          timestamp: data.timestamp,
          isSimulated: data.isSimulated,
        });
        setTelemetryPollError(false);
      } catch (err) {
        setTelemetryPollError(true);
        // Fallback simulated telemetry computed locally
        const totalPeriodSeconds = 5520;
        const seconds = Math.floor(Date.now() / 1000) % totalPeriodSeconds;
        const angle = (seconds / totalPeriodSeconds) * 2 * Math.PI;
        const lat = Math.sin(angle) * 51.64;
        const lon = ((angle * (180 / Math.PI)) % 360) - 180;

        setIssTelemetry({
          latitude: lat,
          longitude: lon,
          altitude: 420.0,
          speed: 27554,
          timestamp: Math.floor(Date.now() / 1000),
          isSimulated: true,
        });
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activeSpacecraft, setIssTelemetry]);

  // 2. Countdown Clocks tick loop
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdowns: Record<string, string> = {};
      launches.forEach((launch) => {
        const timeDiff = new Date(launch.date).getTime() - Date.now();
        if (timeDiff <= 0) {
          newCountdowns[launch.id] = 'LAUNCHED';
          return;
        }

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        newCountdowns[launch.id] = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      });
      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);

    return () => clearInterval(interval);
  }, [launches]);

  // 3. Camera Lock-on Helper
  const handleLockCamera = (targetName: string) => {
    const engine = useEngineStore.getState();
    if (!engine.scene || !engine.camera || !engine.cameraController) return;

    let targetObj: THREE.Object3D | null = null;

    if (targetName === 'ISS') {
      targetObj = engine.scene.getObjectByName('iss_model') || null;
      useAchievementStore.getState().unlock('mission_iss');
    } else if (targetName === 'JWST') {
      targetObj = engine.scene.getObjectByName('jwst_model') || null;
      useAchievementStore.getState().unlock('mission_jwst');
    } else if (targetName === 'moon') {
      targetObj = engine.scene.getObjectByName('planet_group_moon') || null;
    } else if (targetName === 'saturn') {
      targetObj = engine.scene.getObjectByName('planet_group_saturn') || null;
    } else if (targetName === 'earth') {
      targetObj = engine.scene.getObjectByName('planet_group_earth') || null;
    } else if (targetName === 'voyager_1') {
      // voyager target (just zoom camera out far in a specific direction)
      const targetPos = new THREE.Vector3(500, 200, -800);
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      engine.cameraController.setMode('FREE_ROAM');
      gsap.to(engine.camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: prefersReducedMotion ? 0 : 2.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (engine.camera && engine.cameraController) {
            engine.camera.lookAt(new THREE.Vector3(0, 0, 0));
          }
        }
      });
      return;
    }

    if (targetObj) {
      engine.cameraController.setOrbitTarget(targetObj);
      engine.cameraController.setMode('ORBIT');

      // Animate camera position closer to the locked target
      const worldPos = new THREE.Vector3();
      targetObj.getWorldPosition(worldPos);

      // Determine offset distance based on object size
      const dist = targetName === 'moon' || targetName === 'saturn' ? 30 : 6;
      const targetCamPos = worldPos.clone().add(new THREE.Vector3(dist, dist / 2, dist));

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(engine.camera.position, {
        x: targetCamPos.x,
        y: targetCamPos.y,
        z: targetCamPos.z,
        duration: prefersReducedMotion ? 0 : 2.0,
        ease: 'power2.inOut',
      });
    }
  };

  const handleHistoricalMissionClick = (id: string) => {
    setSelectedMissionId(id === selectedMissionId ? null : id);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '340px',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        overflow: 'hidden',
        animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
      }}
    >
      {/* Tracker Menu Cards */}
      <div
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
          ORBITAL TELEMETRY MODULE
        </span>
        <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
          Mission Tracker
        </h2>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(5, 8, 16, 0.6)',
            borderRadius: '4px',
            padding: '2px',
            marginTop: '6px',
            border: '1px solid rgba(74, 144, 226, 0.15)',
          }}
        >
          {(['TELEMETRY', 'LAUNCHES', 'TIMELINE'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                background: activeTab === tab ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                border: 'none',
                color: activeTab === tab ? 'var(--color-teal-cyan)' : 'var(--color-muted)',
                padding: '0.4rem 0',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                borderRadius: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents: TELEMETRY */}
      {activeTab === 'TELEMETRY' && (
        <div
          style={{
            background: 'rgba(10, 14, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(74, 144, 226, 0.15)',
            padding: '1.2rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Spacecraft Toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSpacecraft('ISS')}
              style={{
                flex: 1,
                background: activeSpacecraft === 'ISS' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(5, 8, 16, 0.4)',
                border: activeSpacecraft === 'ISS' ? '1px solid #00f0ff' : '1px solid rgba(74, 144, 226, 0.15)',
                color: activeSpacecraft === 'ISS' ? '#00f0ff' : 'var(--color-muted)',
                padding: '0.4rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              ISS (IN EQUATORIAL)
            </button>
            <button
              onClick={() => setActiveSpacecraft('JWST')}
              style={{
                flex: 1,
                background: activeSpacecraft === 'JWST' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(5, 8, 16, 0.4)',
                border: activeSpacecraft === 'JWST' ? '1px solid #ffaa00' : '1px solid rgba(74, 144, 226, 0.15)',
                color: activeSpacecraft === 'JWST' ? '#ffaa00' : 'var(--color-muted)',
                padding: '0.4rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              JWST (HALO L2)
            </button>
          </div>

          {/* Telemetry Display */}
          {activeSpacecraft === 'ISS' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: telemetryPollError ? '#ff3333' : '#00ffff',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {issTelemetry.isSimulated
                  ? '⚠️ SIGNAL LOSS: KEPLER SIM ACTIVE'
                  : '🛰️ LIVE ISS NETWORK ONLINE'}
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>LATITUDE:</span>
                <span style={telemetryVal}>{issTelemetry.latitude.toFixed(5)}°</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>LONGITUDE:</span>
                <span style={telemetryVal}>{issTelemetry.longitude.toFixed(5)}°</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>ALTITUDE:</span>
                <span style={telemetryVal}>{issTelemetry.altitude.toFixed(1)} km</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>ORBIT SPEED:</span>
                <span style={telemetryVal}>{issTelemetry.speed.toLocaleString()} km/h</span>
              </div>

              <button
                onClick={() => handleLockCamera('ISS')}
                style={lockBtnStyle('#00f0ff')}
              >
                LOCK CAMERA ON ISS
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: '#ffaa00',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                🔭 DEEP INFRARED SKY OBSERVED
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>ORBIT LOCATION:</span>
                <span style={telemetryVal}>Earth-Sun L2</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>DISTANCE:</span>
                <span style={telemetryVal}>1,500,000 km</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>SHIELD TEMP:</span>
                <span style={telemetryVal}>-233°C (40K)</span>
              </div>
              <div style={telemetryRow}>
                <span style={telemetryLabel}>INSTRUMENTS:</span>
                <span style={{ ...telemetryVal, color: '#33ff33' }}>OK / OPERATIONAL</span>
              </div>

              <button
                onClick={() => handleLockCamera('JWST')}
                style={lockBtnStyle('#ffaa00')}
              >
                LOCK CAMERA ON JWST
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab Contents: LAUNCHES */}
      {activeTab === 'LAUNCHES' && (
        <div
          style={{
            background: 'rgba(10, 14, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(74, 144, 226, 0.15)',
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          <span style={sectionHeader}>UPCOMING FLIGHT DEPARTURES</span>
          {launches.map((launch) => (
            <div
              key={launch.id}
              style={{
                background: 'rgba(5, 8, 16, 0.4)',
                border: '1px solid rgba(74, 144, 226, 0.12)',
                borderRadius: '4px',
                padding: '0.6rem 0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                  {launch.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
                  {launch.agency}
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
                {launch.rocket} • {launch.site}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', margin: '4px 0', lineHeight: '1.3' }}>
                {launch.description}
              </p>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#00ffff',
                  background: 'rgba(0, 240, 255, 0.05)',
                  padding: '4px 8px',
                  borderRadius: '3px',
                  textAlign: 'center',
                  marginTop: '4px',
                  letterSpacing: '1px',
                }}
              >
                T-MINUS: {countdowns[launch.id] || 'CALCULATING...'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Contents: TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div
          style={{
            background: 'rgba(10, 14, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(74, 144, 226, 0.15)',
            padding: '1rem',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          <span style={sectionHeader}>HISTORICAL MISSIONS ARCHIVE</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {historicalMissions.map((m) => {
              const isSelected = m.id === selectedMissionId;
              return (
                <div
                  key={m.id}
                  style={{
                    background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(5, 8, 16, 0.3)',
                    border: isSelected
                      ? '1px solid rgba(0, 240, 255, 0.4)'
                      : '1px solid rgba(74, 144, 226, 0.12)',
                    borderRadius: '4px',
                    padding: '0.6rem 0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleHistoricalMissionClick(m.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                      {m.name} ({m.year})
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      {m.agency}
                    </span>
                  </div>

                  {isSelected && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '6px' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', margin: 0, lineHeight: '1.3' }}>
                        {m.description}
                      </p>
                      
                      {/* Stats table */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                        {Object.entries(m.stats).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-muted)' }}>{k.toUpperCase()}:</span>
                            <span style={{ color: '#fff' }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* Camera Teleport Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (m.id === 'apollo_11') handleLockCamera('moon');
                          else if (m.id === 'cassini') handleLockCamera('saturn');
                          else if (m.id === 'jwst') handleLockCamera('JWST');
                          else if (m.id === 'voyager_1') handleLockCamera('voyager_1');
                        }}
                        style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: '1px solid rgba(0, 240, 255, 0.4)',
                          color: '#00f0ff',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '3px',
                          fontSize: '0.65rem',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-display)',
                          textTransform: 'uppercase',
                          marginTop: '4px',
                          alignSelf: 'flex-start',
                        }}
                      >
                        {m.id === 'voyager_1' ? 'ESCAPE ECLIPTIC VIEW' : `CENTER CAMERA ON ${m.id === 'apollo_11' ? 'MOON' : m.id === 'cassini' ? 'SATURN' : 'OBJECT'}`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable CSS styles mapping
const telemetryRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  borderBottom: '1px solid rgba(74, 144, 226, 0.08)',
  paddingBottom: '4px',
};

const telemetryLabel: React.CSSProperties = {
  color: 'var(--color-muted)',
};

const telemetryVal: React.CSSProperties = {
  color: 'var(--color-starlight)',
};

const sectionHeader: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--color-muted)',
  letterSpacing: '1px',
  marginBottom: '4px',
};

const lockBtnStyle = (color: string): React.CSSProperties => ({
  background: `rgba(${color === '#ffaa00' ? '255, 170, 0' : '0, 240, 255'}, 0.1)`,
  border: `1px solid ${color}`,
  color: color,
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  transition: 'all 0.15s ease',
  marginTop: '8px',
});
