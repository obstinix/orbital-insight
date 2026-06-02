import * as THREE from 'three';
import { useEventStore } from '../../store/useEventStore';
import { Planet } from './Planet';

export class SpecialEvents {
  public group: THREE.Group;
  
  // Meteor Shower assets
  private meteorLines: THREE.Line[] = [];
  private meteorLifes: number[] = [];
  private meteorStarts: THREE.Vector3[] = [];
  private meteorEnds: THREE.Vector3[] = [];
  private METEOR_COUNT = 25;

  // Supernova assets
  private supernovaCore: THREE.Mesh;
  private supernovaGlow: THREE.Sprite;
  private supernovaParticles: THREE.Points;
  private supernovaParticleGeom: THREE.BufferGeometry;
  private supernovaVelocities: Float32Array;
  private supernovaPosCenter = new THREE.Vector3(-150, 250, -450); // Location in deep sky

  // Comet assets
  private cometGroup: THREE.Group;
  private cometCore: THREE.Mesh;
  private cometIonTail: THREE.Mesh;
  private cometDustTail: THREE.Mesh;

  // Eclipse assets
  private sunCoronaGlow: THREE.Sprite;

  // References to solar system objects
  private earthPlanet: Planet | null = null;
  private moonPlanet: Planet | null = null;

  constructor(scene: THREE.Scene, planets: Planet[]) {
    this.group = new THREE.Group();
    this.group.name = 'special_events_group';
    scene.add(this.group);

    // Find Earth and Moon references
    this.earthPlanet = planets.find((p) => p.id === 'earth') || null;
    this.moonPlanet = planets.find((p) => p.id === 'moon') || null;

    // ─── 1. INITIALIZE METEOR SHOWER ──────────────────────────────
    const meteorMat = new THREE.LineBasicMaterial({
      color: 0x88ffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < this.METEOR_COUNT; i++) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const line = new THREE.Line(geom, meteorMat.clone());
      line.visible = false;
      this.group.add(line);
      this.meteorLines.push(line);
      this.meteorLifes.push(Math.random()); // randomized phase
      this.meteorStarts.push(new THREE.Vector3());
      this.meteorEnds.push(new THREE.Vector3());
    }

    // ─── 2. INITIALIZE SUPERNOVA ──────────────────────────────────
    // Explosion Core Star Mesh
    const coreGeom = new THREE.SphereGeometry(2.0, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.supernovaCore = new THREE.Mesh(coreGeom, coreMat);
    this.supernovaCore.position.copy(this.supernovaPosCenter);
    this.supernovaCore.visible = false;
    this.group.add(this.supernovaCore);

    // Lens Flare Glow Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.2, 'rgba(200,240,255,0.8)');
      grad.addColorStop(0.5, 'rgba(0,180,255,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const glowTexture = new THREE.CanvasTexture(canvas);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.0,
    });
    this.supernovaGlow = new THREE.Sprite(glowMat);
    this.supernovaGlow.position.copy(this.supernovaPosCenter);
    this.supernovaGlow.scale.set(50, 50, 1);
    this.supernovaGlow.visible = false;
    this.group.add(this.supernovaGlow);

    // Expanding Gas Dust Particles
    const PARTICLE_COUNT = 2000;
    this.supernovaParticleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    this.supernovaVelocities = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Start inside core center
      const i3 = i * 3;
      positions[i3] = this.supernovaPosCenter.x;
      positions[i3 + 1] = this.supernovaPosCenter.y;
      positions[i3 + 2] = this.supernovaPosCenter.z;

      // Spherical random velocity vector
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const speed = 40.0 + Math.random() * 80.0; // speed units/sec

      this.supernovaVelocities[i3] = speed * Math.sin(phi) * Math.cos(theta);
      this.supernovaVelocities[i3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      this.supernovaVelocities[i3 + 2] = speed * Math.cos(phi);

      // Star gas color (white-orange-cyan shifts)
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i3 + 2] = 0.2 + Math.random() * 0.8;
    }

    this.supernovaParticleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.supernovaParticleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.supernovaParticles = new THREE.Points(this.supernovaParticleGeom, particleMat);
    this.supernovaParticles.visible = false;
    this.group.add(this.supernovaParticles);

    // ─── 3. INITIALIZE COMET ──────────────────────────────────────
    this.cometGroup = new THREE.Group();
    this.cometGroup.name = 'comet_group';
    this.cometGroup.visible = false;

    // Rocky nucleus
    const cometCoreGeom = new THREE.DodecahedronGeometry(0.8, 1);
    const cometCoreMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    this.cometCore = new THREE.Mesh(cometCoreGeom, cometCoreMat);
    this.cometGroup.add(this.cometCore);

    // Ion tail: thin, blue/cyan glowing cone pointing away from Sun
    const ionTailGeom = new THREE.ConeGeometry(0.3, 20.0, 8);
    ionTailGeom.translate(0, -10.0, 0); // shift pivot to tip
    ionTailGeom.rotateX(Math.PI / 2); // align tail along Z-axis
    const ionTailMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.cometIonTail = new THREE.Mesh(ionTailGeom, ionTailMat);
    this.cometIonTail.position.set(0, 0, 0);
    this.cometGroup.add(this.cometIonTail);

    // Dust tail: wider, white/grey glowing cone curved back
    const dustTailGeom = new THREE.ConeGeometry(1.2, 16.0, 8);
    dustTailGeom.translate(0, -8.0, 0);
    dustTailGeom.rotateX(Math.PI / 2 + 0.15); // slight angle deflection
    const dustTailMat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    this.cometDustTail = new THREE.Mesh(dustTailGeom, dustTailMat);
    this.cometGroup.add(this.cometDustTail);

    this.group.add(this.cometGroup);

    // ─── 4. INITIALIZE ECLIPSE CORONA GLOW ────────────────────────
    const coronaCanvas = document.createElement('canvas');
    coronaCanvas.width = 128;
    coronaCanvas.height = 128;
    const coronaCtx = coronaCanvas.getContext('2d');
    if (coronaCtx) {
      const grad = coronaCtx.createRadialGradient(64, 64, 15, 64, 64, 64);
      grad.addColorStop(0, 'rgba(255, 230, 150, 0.0)');
      grad.addColorStop(0.2, 'rgba(255, 220, 100, 1.0)'); // strong thin ring
      grad.addColorStop(0.4, 'rgba(255, 150, 50, 0.6)');
      grad.addColorStop(0.7, 'rgba(255, 100, 0, 0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      coronaCtx.fillStyle = grad;
      coronaCtx.fillRect(0, 0, 128, 128);
    }
    const coronaTexture = new THREE.CanvasTexture(coronaCanvas);
    const coronaMat = new THREE.SpriteMaterial({
      map: coronaTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.0,
    });
    this.sunCoronaGlow = new THREE.Sprite(coronaMat);
    this.sunCoronaGlow.scale.set(40.0, 40.0, 1.0); // wrap around Sun (R=15)
    this.sunCoronaGlow.position.set(0, 0, 0); // Sun is at origin
    this.sunCoronaGlow.visible = false;
    this.group.add(this.sunCoronaGlow);
  }

  /**
   * Main loops updater called in standard frame ticking.
   */
  public update(elapsedSeconds: number, delta: number): void {
    const eventStore = useEventStore.getState();

    // ─── A. METEOR SHOWER RUNNER ──────────────────────────────────
    if (eventStore.isMeteorActive) {
      this.meteorLines.forEach((line, idx) => {
        line.visible = true;
        this.meteorLifes[idx] += delta * 1.5; // speed parameter

        if (this.meteorLifes[idx] >= 1.0) {
          // Reset shooting star with new random trajectory
          this.meteorLifes[idx] = 0;
          
          // Random point on outer sky dome ($R = 900$)
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.random() * Math.PI * 0.35; // upper sky only
          const R = 850;

          const start = new THREE.Vector3(
            R * Math.sin(phi) * Math.cos(theta),
            R * Math.cos(phi),
            R * Math.sin(phi) * Math.sin(theta)
          );

          // Shooting star direction (down and to the right)
          const dir = new THREE.Vector3(0.5, -0.6, -0.2).normalize();
          const length = 50.0 + Math.random() * 50.0;
          const end = start.clone().add(dir.clone().multiplyScalar(length));

          this.meteorStarts[idx].copy(start);
          this.meteorEnds[idx].copy(end);
        }

        // Draw line trailing length segment
        const t = this.meteorLifes[idx];
        const segStart = new THREE.Vector3().lerpVectors(this.meteorStarts[idx], this.meteorEnds[idx], t);
        const segEnd = new THREE.Vector3().lerpVectors(this.meteorStarts[idx], this.meteorEnds[idx], Math.min(t + 0.1, 1.0));

        line.geometry.setFromPoints([segStart, segEnd]);

        // Fade in / out opacity curve
        const opacity = Math.sin(t * Math.PI);
        (line.material as THREE.LineBasicMaterial).opacity = opacity * 0.8;
      });
    } else {
      // Hide meteor trails
      this.meteorLines.forEach((line) => {
        if (line.visible) line.visible = false;
      });
    }

    // ─── B. SUPERNOVA RUNNER ──────────────────────────────────────
    if (eventStore.isSupernovaActive) {
      this.supernovaCore.visible = true;
      this.supernovaGlow.visible = true;
      this.supernovaParticles.visible = true;

      // Update timer 0 to 1 over 10 seconds
      const newT = Math.min(eventStore.supernovaTimer + delta * 0.1, 1.0);
      eventStore.setSupernovaTimer(newT);

      // 1. Core mesh pulse flash
      if (newT < 0.15) {
        const scaleVal = 1.0 + (newT / 0.15) * 20.0;
        this.supernovaCore.scale.set(scaleVal, scaleVal, scaleVal);
        this.supernovaGlow.scale.set(scaleVal * 10.0, scaleVal * 10.0, 1.0);
        this.supernovaGlow.material.opacity = 1.0;
      } else {
        // fade core out
        this.supernovaCore.visible = false;
        this.supernovaGlow.material.opacity = Math.max(0, 1.0 - (newT - 0.15) * 1.5);
      }

      // 2. Expand gas particles
      const posAttr = this.supernovaParticleGeom.getAttribute('position') as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;
      const pCount = array.length / 3;

      for (let i = 0; i < pCount; i++) {
        const i3 = i * 3;
        
        // Translate particles along velocity
        array[i3] = this.supernovaPosCenter.x + this.supernovaVelocities[i3] * newT * 8.0;
        array[i3 + 1] = this.supernovaPosCenter.y + this.supernovaVelocities[i3 + 1] * newT * 8.0;
        array[i3 + 2] = this.supernovaPosCenter.z + this.supernovaVelocities[i3 + 2] * newT * 8.0;
      }
      posAttr.needsUpdate = true;

      // Fade out particles opacity towards the end
      const partOpacity = newT < 0.2 
        ? (newT / 0.2) // fade in
        : Math.max(0, 1.0 - (newT - 0.2) / 0.8); // fade out
      
      (this.supernovaParticles.material as THREE.PointsMaterial).opacity = partOpacity * 0.9;
    } else {
      this.supernovaCore.visible = false;
      this.supernovaGlow.visible = false;
      this.supernovaParticles.visible = false;
    }

    // ─── C. COMET RUNNER ──────────────────────────────────────────
    if (eventStore.isCometActive) {
      this.cometGroup.visible = true;

      const newT = Math.min(eventStore.cometTimer + delta * 0.08, 1.0); // 12 seconds duration
      eventStore.setCometTimer(newT);

      // Math: Sweep along a parabolic trajectory near Sun (origin)
      const t = (newT - 0.5) * 4.0; // -2.0 to 2.0
      const x = 90.0 * (1.0 - t * t * 0.15);
      const z = 160.0 * t * 0.5;
      const y = 25.0 * t; // inclination orbit

      const currentCometPos = new THREE.Vector3(x, y, z);
      this.cometGroup.position.copy(currentCometPos);

      // Rotate nucleus core slowly
      this.cometCore.rotation.x += delta * 0.5;
      this.cometCore.rotation.y += delta * 0.2;

      // Orient tails pointing exactly away from Sun (origin)
      const tailDirection = currentCometPos.clone().normalize();
      this.cometIonTail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailDirection);
      this.cometDustTail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailDirection);

      // Tail size scale & opacity react to distance from Sun
      const distance = currentCometPos.length();
      const heatFactor = Math.max(0, 1.0 - distance / 150.0); // peak heating when close

      this.cometIonTail.scale.set(1.0 + heatFactor * 1.5, 0.2 + heatFactor * 2.0, 1.0 + heatFactor * 1.5);
      (this.cometIonTail.material as THREE.MeshBasicMaterial).opacity = heatFactor * 0.7;

      this.cometDustTail.scale.set(1.0 + heatFactor * 2.0, 0.2 + heatFactor * 1.6, 1.0 + heatFactor * 2.0);
      (this.cometDustTail.material as THREE.MeshBasicMaterial).opacity = heatFactor * 0.5;
    } else {
      this.cometGroup.visible = false;
    }

    // ─── D. SOLAR ECLIPSE RUNNER ──────────────────────────────────
    if (eventStore.isEclipseActive && this.earthPlanet && this.moonPlanet) {
      this.sunCoronaGlow.visible = true;

      const newT = Math.min(eventStore.eclipseTimer + delta * 0.2, 1.0);
      eventStore.setEclipseTimer(newT);

      // Vector Earth -> Sun is -earthPlanet.group.position
      const earthPos = this.earthPlanet.group.position;
      const toSun = earthPos.clone().negate().normalize();
      
      // Target alignment: Moon sits exactly between Earth and Sun
      const moonOrbitRadius = 16.0; // Distance of Moon in solar system orbits
      const alignedMoonLocal = toSun.clone().multiplyScalar(moonOrbitRadius);
      const alignedMoonWorld = earthPos.clone().add(alignedMoonLocal);

      // Force Moon's solved position to interpolate towards this aligned coordinate
      this.moonPlanet.group.position.lerp(alignedMoonWorld, 0.05);

      // Fade corona in when Moon starts blocking the Sun
      this.sunCoronaGlow.material.opacity = Math.min(newT * 0.8, 0.8);
    } else {
      this.sunCoronaGlow.visible = false;
      this.sunCoronaGlow.material.opacity = 0.0;
    }
  }

  public dispose(): void {
    // Clear meteors
    this.meteorLines.forEach((line) => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });

    // Clear supernova
    this.supernovaCore.geometry.dispose();
    (this.supernovaCore.material as THREE.Material).dispose();
    this.supernovaGlow.material.dispose();
    this.supernovaParticleGeom.dispose();
    (this.supernovaParticles.material as THREE.Material).dispose();

    // Clear comet
    this.cometCore.geometry.dispose();
    (this.cometCore.material as THREE.Material).dispose();
    this.cometIonTail.geometry.dispose();
    (this.cometIonTail.material as THREE.Material).dispose();
    this.cometDustTail.geometry.dispose();
    (this.cometDustTail.material as THREE.Material).dispose();

    // Clear corona
    this.sunCoronaGlow.material.dispose();
  }
}
