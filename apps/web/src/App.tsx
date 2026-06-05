import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { AccountButton } from './ui/AccountButton';
import { InfoPanel } from './ui/InfoPanel';
import { TimeControls } from './ui/TimeControls';
import { ChapterSelector } from './ui/ChapterSelector';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { useEngineInit } from './hooks/useEngineInit';
import { GuideChatPanel } from './ui/GuideChatPanel';
import { useConstellationStore } from './store/useConstellationStore';
import { CompassRose } from './ui/CompassRose';
import { Attribution } from './ui/Attribution';
import { EngineErrorBoundary } from './components/EngineErrorBoundary';

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
import { KeyboardShortcuts } from './ui/KeyboardShortcuts';
import { LandingHero } from './ui/LandingHero';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAchievementStore } from './store/useAchievementStore';
import { useJourneyStore } from './store/useJourneyStore';
import { usePlanetStore } from './store/usePlanetStore';
import { useEngineStore } from './store/useEngineStore';
import { usePerformanceStore } from './store/usePerformanceStore';
import { useAccountStore } from './store/useAccountStore';
import './styles/tokens.css';
import './styles/fonts.css';

// ── PERSISTENT CANVAS CONTAINER ──────────────────────────────────
const ThreeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isContextLost } = useEngineInit(canvasRef);

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
      {isContextLost && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(10, 5, 5, 0.95)',
            backdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999,
            color: '#fff',
            fontFamily: 'var(--font-mono, monospace)',
            textAlign: 'center',
            padding: '2rem',
            animation: 'fadeIn var(--duration-medium) ease'
          }}
        >
          <div style={{ color: '#ff3b30', fontSize: '1rem', letterSpacing: '4px', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            ⚠️ CRITICAL ERROR: GPU CONTEXT LOSS ⚠️
          </div>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-display, sans-serif)', marginBottom: '1rem' }}>
            Cosmic Visualization Suspended
          </h2>
          <p style={{ maxWidth: '550px', fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
            Your system&apos;s graphics context was reclaimed by the browser or operating system. 
            Telemetry is currently offline. Re-engaging engine sub-systems...
          </p>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255, 59, 48, 0.2)',
            borderTop: '2px solid #ff3b30',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
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
  const mode = useConstellationStore((state) => state.mode);
  const setMode = useConstellationStore((state) => state.setMode);

  return (
    <div
      aria-label="HUD telemetry statistics"
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        left: 'var(--space-2)',
        zIndex: 'var(--z-hud)',
        display: 'flex',
        alignItems: 'center',
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
      <div style={{ borderLeft: '1px solid rgba(74, 144, 226, 0.2)', height: '14px', margin: '0 8px' }} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setMode('solar-system')}
          style={{
            background: mode === 'solar-system' ? 'var(--color-teal-cyan)' : 'transparent',
            color: mode === 'solar-system' ? 'var(--color-void)' : 'var(--color-muted)',
            border: 'none',
            borderRadius: '2px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontWeight: 'bold',
          }}
        >
          ORBITAL VIEW
        </button>
        <button
          onClick={() => setMode('skymap')}
          style={{
            background: mode === 'skymap' ? 'var(--color-teal-cyan)' : 'transparent',
            color: mode === 'skymap' ? 'var(--color-void)' : 'var(--color-muted)',
            border: 'none',
            borderRadius: '2px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
            padding: '2px 6px',
            fontWeight: 'bold',
          }}
        >
          SKY MAP VIEW
        </button>
      </div>
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
      <div style={{ marginTop: 'var(--space-2)', borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: 'var(--space-2)' }}>
        <AccountButton />
      </div>
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

function MockAppContent() {
  const setSelectedPlanetId = usePlanetStore((state) => state.setSelectedPlanetId);
  const currentChapterId = useJourneyStore((state) => state.currentChapterId);
  const { isShortcutsPanelOpen, setShortcutsPanelOpen } = useKeyboardShortcuts();
  const [showLandingHero, setShowLandingHero] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('orbital_insight_visited') !== 'true'
  );

  const handleHeroComplete = useCallback(() => {
    setShowLandingHero(false);
  }, []);

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
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Core 3D engine canvas - persists across routes */}
      <EngineErrorBoundary fallbackName="Universe Engine">
        <ThreeCanvas />
      </EngineErrorBoundary>

      {/* Global HUD Layout components */}
      <TopHudStats />
      <LeftNavigationPanel />
      <ErrorBoundary name="Info Panel">
        <InfoPanel />
      </ErrorBoundary>
      <TimeControls />
      <ErrorBoundary name="Guide Chat Panel">
        <GuideChatPanel />
      </ErrorBoundary>
      <AchievementToast />
      <AudioControls />
      <CompassRose />
      <Attribution />

      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcuts
        isOpen={isShortcutsPanelOpen}
        onClose={() => setShortcutsPanelOpen(false)}
      />

      {/* Router-controlled HUD overlays wrapped in dynamic loader */}
      <ErrorBoundary name="HUD Panels">
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
      </ErrorBoundary>

      {/* Cinematic landing hero — first visit only */}
      {showLandingHero && <LandingHero onComplete={handleHeroComplete} />}
    </div>
  );
}

// Inner component that lives inside the Router context so hooks like
// useNavigate (used by useKeyboardShortcuts) work correctly.
function AppContent() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const setAuthToken = useAccountStore((state) => state.setAuthToken);
  const fetchProfile = useAccountStore((state) => state.fetchProfile);

  useEffect(() => {
    const syncToken = async () => {
      if (isLoaded && isSignedIn) {
        try {
          const token = await getToken();
          setAuthToken(token);
          await fetchProfile(token);
        } catch (e) {
          console.error('[Auth] Failed to sync token:', e);
        }
      } else {
        setAuthToken(null);
      }
    };
    syncToken();
  }, [isLoaded, isSignedIn, getToken, setAuthToken, fetchProfile]);

  const setSelectedPlanetId = usePlanetStore((state) => state.setSelectedPlanetId);
  const currentChapterId = useJourneyStore((state) => state.currentChapterId);
  const { isShortcutsPanelOpen, setShortcutsPanelOpen } = useKeyboardShortcuts();
  const [showLandingHero, setShowLandingHero] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('orbital_insight_visited') !== 'true'
  );

  const handleHeroComplete = useCallback(() => {
    setShowLandingHero(false);
  }, []);

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
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Core 3D engine canvas - persists across routes */}
      <EngineErrorBoundary fallbackName="Universe Engine">
        <ThreeCanvas />
      </EngineErrorBoundary>

      {/* Global HUD Layout components */}
      <TopHudStats />
      <LeftNavigationPanel />
      <ErrorBoundary name="Info Panel">
        <InfoPanel />
      </ErrorBoundary>
      <TimeControls />
      <ErrorBoundary name="Guide Chat Panel">
        <GuideChatPanel />
      </ErrorBoundary>
      <AchievementToast />
      <AudioControls />
      <CompassRose />
      <Attribution />

      {/* Keyboard shortcuts overlay */}
      <KeyboardShortcuts
        isOpen={isShortcutsPanelOpen}
        onClose={() => setShortcutsPanelOpen(false)}
      />

      {/* Router-controlled HUD overlays wrapped in dynamic loader */}
      <ErrorBoundary name="HUD Panels">
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
      </ErrorBoundary>

      {/* Cinematic landing hero — first visit only */}
      {showLandingHero && <LandingHero onComplete={handleHeroComplete} />}
    </div>
  );
}

function LoadingSplash({ progress }: { progress: number }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000008',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Courier New", monospace',
      color: '#fff',
      gap: '2rem',
      zIndex: 9999,
    }}>
      {/* Animated star field using CSS */}
      <style>{`
        @keyframes twinkle { 0%,100%{opacity:0.2} 50%{opacity:1} }
        .star { position:absolute; width:2px; height:2px; background:#fff; border-radius:50%; animation:twinkle var(--d,2s) infinite; }
      `}</style>
      {Array.from({ length: 60 }, (_, i) => (
        <div key={i} className="star" style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          ['--d' as string]: `${1 + Math.random() * 3}s`,
          opacity: Math.random(),
          width: Math.random() > 0.8 ? '3px' : '1px',
          height: Math.random() > 0.8 ? '3px' : '1px',
        }} />
      ))}

      <div style={{ fontSize: 'clamp(1.5rem,4vw,3rem)', fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
        Orbital Insight
      </div>
      <div style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#8888aa' }}>
        Initializing universe engine...
      </div>

      {/* Progress bar */}
      <div style={{ width: 'min(400px, 80vw)', height: '1px', background: '#111133', borderRadius: '1px' }}>
        <div style={{
          height: '100%',
          borderRadius: '1px',
          background: 'linear-gradient(90deg, #3344ff, #88aaff)',
          width: `${progress}%`,
          transition: 'width 0.3s ease',
          boxShadow: '0 0 8px #3344ff',
        }} />
      </div>
      <div style={{ fontSize: '0.7rem', color: '#444466', letterSpacing: '0.15em' }}>
        {progress < 100 ? `${Math.round(progress)}%` : 'Ready'}
      </div>
    </div>
  );
}

export default function App() {
  const [engineReady, setEngineReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setEngineReady(true), 400);
      }
      setLoadProgress(p);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const renderContent = () => {
    if (clerkPubKey) {
      return (
        <ClerkProvider publishableKey={clerkPubKey}>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </ClerkProvider>
      );
    }
    return (
      <HashRouter>
        <MockAppContent />
      </HashRouter>
    );
  };

  return (
    <>
      {!engineReady && <LoadingSplash progress={loadProgress} />}
      {renderContent()}
    </>
  );
}
