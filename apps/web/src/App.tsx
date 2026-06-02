import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { createRenderer } from './engine/core/Renderer';
import { createCameraController } from './engine/core/Camera';
import { createSceneGraph, SceneLayer } from './engine/core/SceneGraph';
import { startRenderLoop } from './engine/core/RenderLoop';
import { StarField } from './engine/bodies/StarField';
import { SolarSystem } from './engine/bodies/SolarSystem';
import { RayCaster } from './engine/interaction/RayCaster';
import { InfoPanel } from './ui/InfoPanel';
import { TimeController } from './engine/simulation/TimeController';
import { TimeControls } from './ui/TimeControls';
import { usePlanetStore } from './store/usePlanetStore';
import { useEngineStore } from './store/useEngineStore';
import { usePerformanceStore } from './store/usePerformanceStore';
import './styles/tokens.css';

// ── PERSISTENT CANVAS CONTAINER ──────────────────────────────────
const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useEngineStore((state) => state.isInitialized);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    const canvas = canvasRef.current;
    
    // 1. Initialize core systems
    const renderer = createRenderer(canvas);
    const sceneGraph = createSceneGraph();
    
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 20000);
    camera.position.set(0, 100, 350); // Set camera slightly higher and further back to see orbits

    const cameraController = createCameraController(camera, canvas);
    cameraController.setOrbitTarget(new THREE.Vector3(0, 0, 0));

    // 2. Add stars background and Solar System bodies
    const starField = new StarField();
    sceneGraph.addObject(starField.points, SceneLayer.UNIVERSE);

    const solarSystem = new SolarSystem();
    sceneGraph.addObject(solarSystem.group, SceneLayer.PLANETS);

    const raycaster = new RayCaster(camera, sceneGraph.scene, canvas, solarSystem.planets);

    // 3. Register systems globally
    useEngineStore.getState().initEngine(
      renderer,
      sceneGraph.scene,
      camera,
      cameraController,
      sceneGraph
    );

    const timeController = new TimeController();

    // 4. Run loop
    let elapsedSeconds = 0;
    const loop = startRenderLoop(renderer, sceneGraph.scene, camera, (delta) => {
      elapsedSeconds += delta;

      // Update virtual date with time controller
      const simulatedDate = timeController.update(delta);

      // Update solar system positions and animations
      solarSystem.update(simulatedDate, elapsedSeconds);
      
      // Update starfield twinkle cycles
      starField.update(elapsedSeconds);

      // Update camera systems (dampening)
      cameraController.update();
    });

    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      loop.stop();
      cameraController.dispose();
      starField.dispose();
      solarSystem.dispose();
      raycaster.dispose();
      renderer.dispose();
    };
  }, [isInitialized]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 'var(--z-universe)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};

// ── HUD OVERLAYS & PAGES ─────────────────────────────────────────

// Top bar stats
const TopHudStats: React.FC = () => {
  const fps = usePerformanceStore((state) => state.fps);
  const isLowPerformance = usePerformanceStore((state) => state.isLowPerformance);
  const cameraController = useEngineStore((state) => state.cameraController);
  const activeMode = cameraController?.mode || 'FREE_ROAM';

  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        left: 'var(--space-2)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        gap: 'var(--space-2)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        textShadow: '0 0 10px rgba(0, 188, 212, 0.4)',
        background: 'rgba(5, 8, 16, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(74, 144, 226, 0.2)',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
      }}
    >
      <div>SYS_OK</div>
      <div style={{ color: isLowPerformance ? 'red' : 'var(--color-teal-cyan)' }}>
        FPS: {fps}
      </div>
      <div>CAMERA: {activeMode}</div>
    </div>
  );
};

// Left navigation bar
const LeftNavigationPanel: React.FC = () => {
  const location = useLocation();
  
  const links = [
    { path: '/', label: 'System' },
    { path: '/journey', label: 'Journey' },
    { path: '/constellations', label: 'Mapper' },
    { path: '/exoplanets', label: 'Catalog' },
    { path: '/missions', label: 'Tracker' },
    { path: '/achievements', label: 'Mission Log' },
  ];

  return (
    <nav
      style={{
        position: 'absolute',
        left: 'var(--space-2)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        background: 'rgba(10, 14, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(74, 144, 226, 0.15)',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          color: 'var(--color-muted)',
          marginBottom: 'var(--space-1)',
          letterSpacing: '2px',
        }}
      >
        ORBITAL INSIGHT
      </div>
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              fontSize: '0.9rem',
              color: isActive ? 'var(--color-teal-cyan)' : 'var(--color-starlight)',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              transition: 'all var(--duration-fast) var(--ease-orbit)',
              borderLeft: isActive ? '3px solid var(--color-teal-cyan)' : '3px solid transparent',
              background: isActive ? 'rgba(74, 144, 226, 0.1)' : 'transparent',
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
};

// Route View wrappers
const UniverseView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Solar System Orbit</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Click and drag the central wireframe sphere to orbit. Scroll to zoom in/out.
    </p>
  </div>
);

const JourneyView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Journey Mode</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Prepare for warp. Select a journey path scaling from Earth to the edge of the cosmic horizon.
    </p>
  </div>
);

const ConstellationView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Constellations</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Toggle sky map to explore official IAU celestial figures rotated relative to your geolocation.
    </p>
  </div>
);

const ExoplanetView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Exoplanet catalog</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Explore 5,000+ confirmed exoplanets parsed from the NASA Exoplanet archive database.
    </p>
  </div>
);

const MissionsView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Live Trackers</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Visualize real-time orbital path trajectories of spacecraft and active satellite missions.
    </p>
  </div>
);

const AchievementsView: React.FC = () => (
  <div style={panelStyle}>
    <h2>Mission Log</h2>
    <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
      Achievements: 0 / 50 discovered. Complete navigation milestones to unlock starmap nodes.
    </p>
  </div>
);

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'var(--space-2)',
  right: 'var(--space-2)',
  width: '320px',
  zIndex: 'var(--z-panel)',
  background: 'rgba(10, 14, 42, 0.8)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(74, 144, 226, 0.15)',
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  animation: 'slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
};

// ── ROOT APP ENTRY ───────────────────────────────────────────────
export default function App() {
  const setSelectedPlanetId = usePlanetStore((state) => state.setSelectedPlanetId);

  useEffect(() => {
    const handleSelection = (e: Event) => {
      const customEvent = e as CustomEvent<{ planetId: string }>;
      const planetId = customEvent.detail.planetId;
      setSelectedPlanetId(planetId);

      // Focus camera on Selected Planet in Orbit mode
      const engine = useEngineStore.getState();
      const planetObj = engine.scene?.getObjectByName(`planet_group_${planetId}`);
      if (planetObj && engine.cameraController) {
        engine.cameraController.setOrbitTarget(planetObj);
        engine.cameraController.setMode('ORBIT');
      }
    };

    window.addEventListener('celestialBodySelected', handleSelection);
    return () => {
      window.removeEventListener('celestialBodySelected', handleSelection);
    };
  }, [setSelectedPlanetId]);

  return (
    <HashRouter>
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Core 3D engine canvas - persists across routes */}
        <ThreeCanvas />

        {/* Global HUD Layout components */}
        <TopHudStats />
        <LeftNavigationPanel />
        <InfoPanel />
        <TimeControls />

        {/* Router-controlled HUD overlays */}
        <Routes>
          <Route path="/" element={<UniverseView />} />
          <Route path="/journey" element={<JourneyView />} />
          <Route path="/constellations" element={<ConstellationView />} />
          <Route path="/exoplanets" element={<ExoplanetView />} />
          <Route path="/missions" element={<MissionsView />} />
          <Route path="/achievements" element={<AchievementsView />} />
        </Routes>
      </div>
    </HashRouter>
  );
}
