import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../store/useMissionStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useEngineStore } from '../store/useEngineStore';
import * as THREE from 'three';
import gsap from 'gsap';
import { TelemetryTab } from './TelemetryTab';
import { LaunchesTab } from './LaunchesTab';
import { TimelineTab } from './TimelineTab';

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
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_BASE}/api/missions/iss`);
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
    } else if (targetName === 'HUBBLE') {
      targetObj = engine.scene.getObjectByName('hubble_model') || null;
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
      role="region"
      aria-label="Space Mission Tracker HUD"
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
          role="tablist"
          aria-label="Mission Tracker Tabs"
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
              id={`tab-${tab}`}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
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
        <TelemetryTab
          activeSpacecraft={activeSpacecraft}
          setActiveSpacecraft={setActiveSpacecraft}
          issTelemetry={issTelemetry}
          telemetryPollError={telemetryPollError}
          onLockCamera={handleLockCamera}
        />
      )}

      {/* Tab Contents: LAUNCHES */}
      {activeTab === 'LAUNCHES' && (
        <LaunchesTab
          launches={launches}
          countdowns={countdowns}
        />
      )}

      {/* Tab Contents: TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <TimelineTab
          historicalMissions={historicalMissions}
          selectedMissionId={selectedMissionId}
          onHistoricalMissionClick={handleHistoricalMissionClick}
          onLockCamera={handleLockCamera}
        />
      )}
    </div>
  );
};
