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
import { SpacecraftController } from './spacecraft/SpacecraftController';
import { GuideChatPanel } from './ui/GuideChatPanel';
import { JourneyMode } from './modes/JourneyMode';
import { ChapterSelector } from './ui/ChapterSelector';
import { ConstellationLines } from './engine/bodies/ConstellationLines';
import { useConstellationStore } from './store/useConstellationStore';
import { ExoplanetRenderer } from './engine/bodies/ExoplanetRenderer';
import { useExoplanetStore } from './store/useExoplanetStore';
import { SpacecraftTracker } from './engine/bodies/SpacecraftTracker';
import { SpecialEvents } from './engine/bodies/SpecialEvents';
import { AudioEngine } from './engine/audio/AudioEngine';

// Lazy-loaded route panels for performance optimizations
const ConstellationPanel = React.lazy(() => 
  import('./ui/ConstellationPanel').then(m => ({ default: m.ConstellationPanel }))
);
const ExoplanetPanel = React.lazy(() => 
  import('./ui/ExoplanetPanel').then(m => ({ default: m.ExoplanetPanel }))
);
const MissionsPanel = React.lazy(() => 
  import('./ui/MissionsPanel').then(m => ({ default: m.MissionsPanel }))
);
const AchievementsPanel = React.lazy(() => 
  import('./ui/AchievementsPanel').then(m => ({ default: m.AchievementsPanel }))
);
import { AchievementToast } from './ui/AchievementToast';
import { AudioControls } from './ui/AudioControls';
import { useAchievementStore } from './store/useAchievementStore';
import { useJourneyStore } from './store/useJourneyStore';
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

    // 2. Add sky sphere group (for geolocation alignment), stars, and constellation lines
    const skySphereGroup = new THREE.Group();
    skySphereGroup.name = 'sky_sphere_group';
    sceneGraph.addObject(skySphereGroup, SceneLayer.UNIVERSE);

    const starField = new StarField();
    skySphereGroup.add(starField.points);

    const constellationLines = new ConstellationLines();
    skySphereGroup.add(constellationLines.group);

    const solarSystem = new SolarSystem();
    sceneGraph.addObject(solarSystem.group, SceneLayer.PLANETS);

    const earthPlanet = solarSystem.planets.find((p) => p.id === 'earth');
    let spacecraftTracker: SpacecraftTracker | null = null;
    if (earthPlanet) {
      spacecraftTracker = new SpacecraftTracker(
        earthPlanet.group,
        earthPlanet.bodyMesh,
        sceneGraph.scene
      );
    }

    const exoplanetRenderer = new ExoplanetRenderer();
    sceneGraph.addObject(exoplanetRenderer.mesh, SceneLayer.PLANETS);
    exoplanetRenderer.mesh.visible = false;

    const specialEvents = new SpecialEvents(sceneGraph.scene, solarSystem.planets);

    const audioEngine = new AudioEngine();

    const raycaster = new RayCaster(camera, sceneGraph.scene, canvas, solarSystem.planets);

    const spacecraft = new SpacecraftController(sceneGraph.scene, camera);

    const journeyMode = new JourneyMode(sceneGraph.scene, camera, spacecraft);

    const handleExoplanetVisualUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ category: string }>;
      exoplanetRenderer.setCategory(customEvent.detail.category);
    };
    window.addEventListener('exoplanetVisualUpdate', handleExoplanetVisualUpdate);

    // 3. Register systems globally
    useEngineStore.getState().initEngine(
      renderer,
      sceneGraph.scene,
      camera,
      cameraController,
      sceneGraph,
      spacecraft,
      journeyMode,
      constellationLines
    );

    const timeController = new TimeController();

    // 4. Run loop
    let elapsedSeconds = 0;
    const loop = startRenderLoop(renderer, sceneGraph.scene, camera, (delta) => {
      elapsedSeconds += delta;

      // Update virtual date with time controller
      const simulatedDate = timeController.update(delta);

      // Toggle visibility between Solar System and Exoplanet visualizers
      const { showExoplanetCanvas } = useExoplanetStore.getState();
      exoplanetRenderer.mesh.visible = showExoplanetCanvas;
      solarSystem.group.visible = !showExoplanetCanvas;

      if (showExoplanetCanvas) {
        exoplanetRenderer.update(elapsedSeconds);
      } else {
        // Update solar system positions and animations
        solarSystem.update(simulatedDate, elapsedSeconds);
      }

      if (spacecraftTracker) {
        spacecraftTracker.update(elapsedSeconds);
      }

      specialEvents.update(elapsedSeconds, delta);
      
      // Update starfield twinkle cycles
      starField.update(elapsedSeconds);

      // Update constellation lines and pulsating nodes
      constellationLines.update(elapsedSeconds);

      // Toggle constellation lines based on state
      const { latitude, longitude, showConstellations } = useConstellationStore.getState();
      constellationLines.group.visible = showConstellations;

      // Rotate sky sphere based on user coordinates and calculated Sidereal Time
      const now = new Date();
      const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const gst = (utcHours * 1.0027379 + 6.6) % 24;
      const lst = (gst + longitude / 15.0 + 24.0) % 24;
      const lstRad = lst * 15 * (Math.PI / 180);

      skySphereGroup.rotation.x = (90 - latitude) * (Math.PI / 180);
      skySphereGroup.rotation.y = lstRad;

      // Update spacecraft FSM and animations
      spacecraft.update(elapsedSeconds);

      // Update journey mode deep space animations
      journeyMode.update(elapsedSeconds);

      // Update spatial audio engine — find nearest planet for proximity hum
      let nearestPos: THREE.Vector3 | null = null;
      let nearestMass = 0;
      let minDist = Infinity;
      for (const planet of solarSystem.planets) {
        const d = camera.position.distanceTo(planet.group.position);
        if (d < minDist) {
          minDist = d;
          nearestPos = planet.group.position;
          nearestMass = planet.config.mass_kg;
        }
      }
      audioEngine.update(camera, nearestPos, nearestMass, spacecraft.state);

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

    // Listen for audio unlock event (from LandingHero CTA click)
    const handleAudioUnlock = () => {
      audioEngine.init();
    };
    window.addEventListener('orbitalInsightAudioUnlock', handleAudioUnlock);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('exoplanetVisualUpdate', handleExoplanetVisualUpdate);
      window.removeEventListener('orbitalInsightAudioUnlock', handleAudioUnlock);
      loop.stop();
      cameraController.dispose();
      starField.dispose();
      solarSystem.dispose();
      raycaster.dispose();
      spacecraft.dispose();
      if (spacecraftTracker) {
        spacecraftTracker.dispose();
      }
      specialEvents.dispose();
      constellationLines.dispose();
      exoplanetRenderer.dispose();
      audioEngine.dispose();
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
      aria-label="HUD telemetry statistics"
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
      aria-label="HUD primary navigation"
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
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.75rem',
          color: 'var(--color-muted)',
          marginBottom: 'var(--space-1)',
          letterSpacing: '2px',
          margin: '0 0 var(--space-1) 0',
        }}
      >
        ORBITAL INSIGHT
      </h1>
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
  animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
};

// Route View wrappers
const UniverseView: React.FC = () => (
  <div style={panelStyle} aria-labelledby="universe-title">
    <h2 id="universe-title" style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>Solar System Orbit</h2>
    <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
      Click and drag the central wireframe sphere to orbit. Scroll to zoom in/out.
    </p>
  </div>
);

// Holographic system loading HUD spinner
const PanelLoader: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '320px',
        height: '200px',
        zIndex: 'var(--z-panel)',
        background: 'rgba(10, 14, 42, 0.65)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 188, 212, 0.3)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 188, 212, 0.1)',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(0, 188, 212, 0.15)',
          borderTopColor: 'var(--color-teal-cyan)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          filter: 'drop-shadow(0 0 8px var(--color-teal-cyan))',
        }}
      />
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.8rem',
          color: 'var(--color-teal-cyan)',
          letterSpacing: '2px',
          textShadow: '0 0 8px rgba(0, 188, 212, 0.5)',
          animation: 'pulse-text 1.5s ease-in-out infinite',
        }}
      >
        LOADING SYSTEM HUD...
      </div>
    </div>
  );
};

// ── ROOT APP ENTRY ───────────────────────────────────────────────
export default function App() {
  const setSelectedPlanetId = usePlanetStore((state) => state.setSelectedPlanetId);
  const currentChapterId = useJourneyStore((state) => state.currentChapterId);

  // Monitor chapter milestones for achievements
  useEffect(() => {
    if (currentChapterId === 1) {
      useAchievementStore.getState().unlock('journey_start');
    } else if (currentChapterId === 5) {
      useAchievementStore.getState().unlock('journey_voyager');
    } else if (currentChapterId === 8) {
      useAchievementStore.getState().unlock('journey_complete');
    }
  }, [currentChapterId]);

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
        <GuideChatPanel />
        <AchievementToast />
        <AudioControls />

        {/* Router-controlled HUD overlays wrapped in dynamic loader */}
        <React.Suspense fallback={<PanelLoader />}>
          <Routes>
            <Route path="/" element={<UniverseView />} />
            <Route path="/journey" element={<ChapterSelector />} />
            <Route path="/constellations" element={<ConstellationPanel />} />
            <Route path="/exoplanets" element={<ExoplanetPanel />} />
            <Route path="/missions" element={<MissionsPanel />} />
            <Route path="/achievements" element={<AchievementsPanel />} />
          </Routes>
        </React.Suspense>
      </div>
    </HashRouter>
  );
}
