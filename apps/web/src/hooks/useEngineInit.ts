import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import { createRenderer, createComposer } from '../engine/core/Renderer';
import { initAssetManager, loadTexture } from '../engine/loaders/AssetManager';
import { createCameraController } from '../engine/core/Camera';
import { createSceneGraph, SceneLayer } from '../engine/core/SceneGraph';
import { startRenderLoop } from '../engine/core/RenderLoop';
import { StarField } from '../engine/bodies/StarField';
import { SolarSystem } from '../engine/bodies/SolarSystem';
import { RayCaster } from '../engine/interaction/RayCaster';
import { TimeController } from '../engine/simulation/TimeController';
import { SpacecraftController } from '../spacecraft/SpacecraftController';
import { JourneyMode } from '../modes/JourneyMode';
import { ConstellationLines } from '../engine/bodies/ConstellationLines';
import { useConstellationStore } from '../store/useConstellationStore';
import { ExoplanetRenderer } from '../engine/bodies/ExoplanetRenderer';
import { useExoplanetStore } from '../store/useExoplanetStore';
import { SpacecraftTracker } from '../engine/bodies/SpacecraftTracker';
import { SpecialEvents } from '../engine/bodies/SpecialEvents';
import { AudioEngine } from '../engine/audio/AudioEngine';
import { useEngineStore } from '../store/useEngineStore';
import { SkyMapMode } from '../engine/modes/SkyMapMode';
import { detectGpuTier } from './gpuTier';
import { usePerformanceStore } from '../store/usePerformanceStore';
import { LagrangePoints } from '../engine/bodies/LagrangePoints';
import { useMissionStore } from '../store/useMissionStore';
import { SolarCME } from '../engine/bodies/SolarCME';
import { useEventStore } from '../store/useEventStore';

export function useEngineInit(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const isInitialized = useEngineStore((state) => state.isInitialized);
  const [isContextLost, setIsContextLost] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    const canvas = canvasRef.current;

    // WebGL Context Loss event handlers
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('[WebGL] WebGL context lost.');
      setIsContextLost(true);
    };

    const handleContextRestored = () => {
      console.log('[WebGL] WebGL context restored. Re-initializing engine.');
      setIsContextLost(false);
      window.location.reload();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // 1. Initialize core systems
    const renderer = createRenderer(canvas);

    // Detect GPU hardware performance tier and optimize workload
    const gpuInfo = detectGpuTier();
    console.log(`[WebGL] GPU Renderer: ${gpuInfo.renderer}, Vendor: ${gpuInfo.vendor}, Tier: ${gpuInfo.tier}`);
    if (gpuInfo.tier === 'LOW') {
      usePerformanceStore.getState().setLowPerformance(true);
      renderer.setPixelRatio(1.0);
    }

    initAssetManager(renderer);
    const sceneGraph = createSceneGraph();

    // Load Milky Way background skybox
    loadTexture('skybox/milkyway_8k.jpg').then((texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      sceneGraph.scene.background = texture;
    }).catch(err => {
      console.warn('[EngineInit] Failed to load Milky Way skybox:', err);
    });

    const width = canvas.clientWidth || window.innerWidth || 800;
    const height = canvas.clientHeight || window.innerHeight || 600;
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 20000);
    camera.layers.enableAll();
    camera.position.set(0, 100, 350); // Set camera slightly higher and further back to see orbits

    // 1b. Initialize post-processing pipeline
    const composer = createComposer(renderer, sceneGraph.scene, camera);

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
    const moonPlanet = solarSystem.planets.find((p) => p.id === 'moon');

    let spacecraftTracker: SpacecraftTracker | null = null;
    if (earthPlanet) {
      spacecraftTracker = new SpacecraftTracker(
        earthPlanet.group,
        earthPlanet.bodyMesh,
        sceneGraph.scene
      );
    }

    let lagrangePoints: LagrangePoints | null = null;
    if (earthPlanet && moonPlanet) {
      lagrangePoints = new LagrangePoints(
        earthPlanet.group,
        moonPlanet.group
      );
      sceneGraph.addObject(lagrangePoints.group, SceneLayer.PLANETS);
      
      const { showLagrangePoints } = useMissionStore.getState();
      lagrangePoints.setVisible(showLagrangePoints);
    }

    const exoplanetRenderer = new ExoplanetRenderer();
    sceneGraph.addObject(exoplanetRenderer.mesh, SceneLayer.PLANETS);
    exoplanetRenderer.mesh.visible = false;

    const solarCME = new SolarCME();
    sceneGraph.addObject(solarCME.group, SceneLayer.PLANETS);

    const specialEvents = new SpecialEvents(sceneGraph.scene, solarSystem.planets);

    const audioEngine = new AudioEngine();

    const raycaster = new RayCaster(camera, sceneGraph.scene, canvas, solarSystem.planets);

    const spacecraft = new SpacecraftController(sceneGraph.scene, camera);

    const journeyMode = new JourneyMode(sceneGraph.scene, camera, spacecraft);

    const skyMapMode = new SkyMapMode(sceneGraph.scene, camera, cameraController.controls);

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
    let lastCMEActive = false;
    const loop = startRenderLoop(renderer, sceneGraph.scene, camera, composer, (delta) => {
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

      if (lagrangePoints) {
        lagrangePoints.update(elapsedSeconds);
        const { showLagrangePoints } = useMissionStore.getState();
        lagrangePoints.setVisible(showLagrangePoints);
      }

      // Update Solar CME particle bursts
      const { isCMEActive } = useEventStore.getState();
      if (isCMEActive && !lastCMEActive) {
        solarCME.trigger();
      }
      lastCMEActive = isCMEActive;
      solarCME.update(delta);

      specialEvents.update(elapsedSeconds, delta);

      // Update starfield twinkle cycles
      starField.update(elapsedSeconds);

      // Update constellation lines and pulsating nodes
      constellationLines.update(elapsedSeconds);

      // Toggle constellation lines based on state
      const { latitude, longitude, showConstellations, mode } = useConstellationStore.getState();
      constellationLines.group.visible = showConstellations;

      // Toggle Sky Map mode and update it reactively
      if (mode === 'skymap') {
        if (!skyMapMode.isActive) {
          if (cameraController.mode !== 'FREE_ROAM') {
            cameraController.setMode('FREE_ROAM');
          }
          skyMapMode.enable();
        }
        skyMapMode.update();
      } else {
        if (skyMapMode.isActive) {
          skyMapMode.disable();
        }
      }

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
      const width = canvasRef.current.clientWidth || window.innerWidth || 800;
      const height = canvasRef.current.clientHeight || window.innerHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);
    
    // Call once immediately to align sizes on mount
    handleResize();

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
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      loop.stop();
      cameraController.dispose();
      starField.dispose();
      solarSystem.dispose();
      raycaster.dispose();
      spacecraft.dispose();
      if (spacecraftTracker) {
        spacecraftTracker.dispose();
      }
      if (lagrangePoints) {
        lagrangePoints.dispose();
      }
      solarCME.dispose();
      specialEvents.dispose();
      constellationLines.dispose();
      skyMapMode.disable();
      exoplanetRenderer.dispose();
      audioEngine.dispose();
      composer.dispose();
      renderer.dispose();
    };
  }, [canvasRef, isInitialized]);

  return { isContextLost };
}
