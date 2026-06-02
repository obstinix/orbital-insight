import * as THREE from 'three';
import { Planet } from './Planet';
import { PlanetConfig } from '@orbital-insight/shared-types';

// Native JSON factsheet imports
import sunData from '../../../../../packages/content/solar-system/sun.json';
import mercuryData from '../../../../../packages/content/solar-system/mercury.json';
import venusData from '../../../../../packages/content/solar-system/venus.json';
import earthData from '../../../../../packages/content/solar-system/earth.json';
import moonData from '../../../../../packages/content/solar-system/moon.json';
import marsData from '../../../../../packages/content/solar-system/mars.json';
import jupiterData from '../../../../../packages/content/solar-system/jupiter.json';
import saturnData from '../../../../../packages/content/solar-system/saturn.json';
import uranusData from '../../../../../packages/content/solar-system/uranus.json';
import neptuneData from '../../../../../packages/content/solar-system/neptune.json';

const CORONA_PARTICLE_COUNT = 100000;
const SUN_RADIUS = 15.0;

export class SolarSystem {
  public planets: Planet[] = [];
  public group: THREE.Group;
  public coronaParticles: THREE.Points;
  public orbitLinesGroup: THREE.Group;

  private coronaGeometry: THREE.BufferGeometry;
  private coronaMaterial: THREE.PointsMaterial;
  private coronaRotations: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'solar_system_group';

    this.orbitLinesGroup = new THREE.Group();
    this.orbitLinesGroup.name = 'orbit_lines_group';
    this.group.add(this.orbitLinesGroup);

    // 1. Pack configs and instantiate Planet objects
    const planetConfigs: PlanetConfig[] = [
      sunData as PlanetConfig,
      mercuryData as PlanetConfig,
      venusData as PlanetConfig,
      earthData as PlanetConfig,
      moonData as PlanetConfig,
      marsData as PlanetConfig,
      jupiterData as PlanetConfig,
      saturnData as PlanetConfig,
      uranusData as PlanetConfig,
      neptuneData as PlanetConfig,
    ];

    for (const config of planetConfigs) {
      const planet = new Planet(config);
      this.planets.push(planet);
      this.group.add(planet.group);

      // Add orbit line if available
      if (planet.orbitLine) {
        this.orbitLinesGroup.add(planet.orbitLine);
      }
    }

    // 2. Build Sun Corona Particle System
    this.coronaGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(CORONA_PARTICLE_COUNT * 3);
    const colors = new Float32Array(CORONA_PARTICLE_COUNT * 3);
    this.coronaRotations = new Float32Array(CORONA_PARTICLE_COUNT);

    for (let i = 0; i < CORONA_PARTICLE_COUNT; i++) {
      // Position particles randomly on a thin shell surrounding the Sun (distance 15 to 22 units)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2 * Math.PI;
      const phi = Math.acos(2 * v - 1);
      const radius = SUN_RADIUS + Math.random() * 7.0;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Golden solar gradient colors
      const t = Math.random();
      const r = 1.0;
      const g = 0.5 + t * 0.35; // ranges between orange and golden yellow
      const b = 0.05;

      colors[i3] = r;
      colors[i3 + 1] = g;
      colors[i3 + 2] = b;

      this.coronaRotations[i] = Math.random() * Math.PI * 2;
    }

    this.coronaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.coronaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.coronaMaterial = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.coronaParticles = new THREE.Points(this.coronaGeometry, this.coronaMaterial);
    this.coronaParticles.name = 'sun_corona';
    this.group.add(this.coronaParticles);
  }

  /**
   * Updates all planets, orbits, and corona particles animations.
   * @param elapsedSeconds Elapsed time in simulation.
   */
  public update(simulatedDate: Date, elapsedSeconds: number): void {
    // 1. Animate Corona particle positions/glow oscillates
    const posAttribute = this.coronaGeometry.getAttribute('position') as THREE.BufferAttribute;
    const array = posAttribute.array as Float32Array;

    for (let i = 0; i < CORONA_PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const phase = this.coronaRotations[i];
      
      // Gentle radial breathing oscillation
      const scale = 1.0 + 0.02 * Math.sin(elapsedSeconds * 3.0 + phase);
      
      array[i3] *= scale;
      array[i3 + 1] *= scale;
      array[i3 + 2] *= scale;

      // Keep particles inside boundary bounds
      const dist = Math.sqrt(array[i3]**2 + array[i3 + 1]**2 + array[i3 + 2]**2);
      if (dist > SUN_RADIUS + 9.0 || dist < SUN_RADIUS) {
        // Reset position on boundaries break
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2 * Math.PI;
        const phi = Math.acos(2 * v - 1);
        const radius = SUN_RADIUS + Math.random() * 4.0;
        
        array[i3] = radius * Math.sin(phi) * Math.cos(theta);
        array[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        array[i3 + 2] = radius * Math.cos(phi);
      }
    }
    posAttribute.needsUpdate = true;

    // 2. Update planets and moon positions
    const earth = this.planets.find((p) => p.id === 'earth');
    const moon = this.planets.find((p) => p.id === 'moon');

    for (const planet of this.planets) {
      if (planet.id === 'moon') continue; // Moon handled separately
      planet.update(simulatedDate);
    }

    if (earth && moon) {
      // Calculate moon heliocentric position relative to Earth
      moon.update(simulatedDate, earth.group.position);
    }
  }

  /**
   * Toggles orbital line rendering visibility.
   */
  public setOrbitsVisible(visible: boolean): void {
    this.orbitLinesGroup.visible = visible;
  }

  public dispose(): void {
    this.planets.forEach((p) => p.dispose());
    this.coronaGeometry.dispose();
    this.coronaMaterial.dispose();
  }
}
