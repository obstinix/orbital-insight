import * as THREE from 'three';
import { PlanetConfig } from '@orbital-insight/shared-types';
import { loadTexture } from '../loaders/AssetManager';
import atmosphereVertexShader from '../shaders/atmosphere.vert';
import atmosphereFragmentShader from '../shaders/atmosphere.frag';
import sunVertexShader from '../shaders/sun.vert';
import sunFragmentShader from '../shaders/sun.frag';
import earthVertexShader from '../shaders/earth.vert';
import earthFragmentShader from '../shaders/earth.frag';
import ringsVertexShader from '../shaders/rings.vert';
import ringsFragmentShader from '../shaders/rings.frag';

// Scale factor: 1 AU = 150 Three.js units
const AU_TO_UNITS = 150;
const VISUAL_PLANET_SCALE = 0.0015; // Visual scaling factor so planets can be seen in orbits
const BASE_DATE_MS = new Date('2026-01-01T00:00:00Z').getTime();

export class Planet {
  public id: string;
  public name: string;
  public config: PlanetConfig;
  public group: THREE.Group;
  public bodyMesh: THREE.LOD;
  public atmosphereMesh: THREE.Mesh | null = null;
  public cloudsMesh: THREE.Mesh | null = null;
  public orbitLine: THREE.Line | null = null;

  private rotationSpeed: number; // Rad/sec
  private axialTiltRad: number;
  private sunMaterial: THREE.ShaderMaterial | null = null;
  private earthMaterial: THREE.ShaderMaterial | null = null;
  private ringMaterial: THREE.ShaderMaterial | null = null;

  constructor(config: PlanetConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.group = new THREE.Group();
    this.group.name = `planet_group_${this.id}`;

    // 1. Calculate visual radius (Sun is huge, planets smaller but scaled up compared to real space)
    const MOON_IDS = ['moon', 'io', 'europa', 'ganymede', 'callisto', 'titan', 'enceladus'];
    let visualRadius = config.radius_km * VISUAL_PLANET_SCALE;
    if (config.id === 'sun') {
      visualRadius = 15.0; // Hard-coded Sun size
    } else if (MOON_IDS.includes(config.id)) {
      // Scale moons to be distinct but smaller than planets (0.5 to 1.2 units)
      visualRadius = Math.max(0.5, Math.min(config.radius_km * VISUAL_PLANET_SCALE * 0.4, 1.2));
    } else {
      // Capping visual radius sizes so they are distinguishable and fit inside orbits
      visualRadius = Math.max(1.5, Math.min(visualRadius, 7.5));
    }

    // 2. Set up rotation properties
    // 23.934 hours for Earth -> 2 * PI rad / (period * 3600 sec)
    const periodHours = config.rotation_period_hours || 24;
    this.rotationSpeed = periodHours !== 0 ? (2 * Math.PI) / (Math.abs(periodHours) * 3600) : 0;
    // Handle reverse rotation (Venus spin)
    if (periodHours < 0) {
      this.rotationSpeed = -this.rotationSpeed;
    }
    this.axialTiltRad = THREE.MathUtils.degToRad(config.axial_tilt_deg);

    // 3. Create Planet Geometry using LOD (Level of Detail)
    this.bodyMesh = new THREE.LOD();
    this.bodyMesh.name = `planet_lod_${this.id}`;

    // Deduce a representative fallback solid color for standard material
    const baseColor = this.getPlanetColor(config.id);

    let planetMaterial: THREE.Material;

    if (config.id === 'sun') {
      const sunMat = new THREE.ShaderMaterial({
        vertexShader: sunVertexShader,
        fragmentShader: sunFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          sunTexture: { value: new THREE.Texture() },
        },
      });
      this.sunMaterial = sunMat;
      planetMaterial = sunMat;

      if (config.textures && config.textures.diffuse) {
        loadTexture(config.textures.diffuse).then((texture) => {
          sunMat.uniforms.sunTexture.value = texture;
          sunMat.needsUpdate = true;
        });
      }
    } else if (config.id === 'earth') {
      const earthMat = new THREE.ShaderMaterial({
        vertexShader: earthVertexShader,
        fragmentShader: earthFragmentShader,
        uniforms: {
          dayTexture: { value: new THREE.Texture() },
          nightTexture: { value: new THREE.Texture() },
          normalMap: { value: new THREE.Texture() },
          specularMap: { value: new THREE.Texture() },
          sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        },
      });
      this.earthMaterial = earthMat;
      planetMaterial = earthMat;

      if (config.textures) {
        if (config.textures.diffuse) {
          loadTexture(config.textures.diffuse).then((texture) => {
            earthMat.uniforms.dayTexture.value = texture;
            earthMat.needsUpdate = true;
          });
        }
        if (config.textures.night) {
          loadTexture(config.textures.night).then((texture) => {
            earthMat.uniforms.nightTexture.value = texture;
            earthMat.needsUpdate = true;
          });
        }
        if (config.textures.normal) {
          loadTexture(config.textures.normal).then((texture) => {
            earthMat.uniforms.normalMap.value = texture;
            earthMat.needsUpdate = true;
          });
        }
        if (config.textures.specular) {
          loadTexture(config.textures.specular).then((texture) => {
            earthMat.uniforms.specularMap.value = texture;
            earthMat.needsUpdate = true;
          });
        }
      }
    } else {
      const stdMat = new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.8,
        metalness: 0.1,
      });
      planetMaterial = stdMat;

      if (config.textures) {
        if (config.textures.diffuse) {
          loadTexture(config.textures.diffuse).then((texture) => {
            stdMat.map = texture;
            stdMat.color.setHex(0xffffff); // clear fallback tint
            stdMat.needsUpdate = true;
          });
        }
        if (config.textures.normal) {
          loadTexture(config.textures.normal).then((texture) => {
            stdMat.normalMap = texture;
            stdMat.normalScale.set(1.2, 1.2);
            stdMat.needsUpdate = true;
          });
        }
        if (config.textures.specular) {
          loadTexture(config.textures.specular).then((texture) => {
            stdMat.roughnessMap = texture;
            stdMat.metalnessMap = texture;
            stdMat.needsUpdate = true;
          });
        }
      }
    }

    // 3.1 Earth-like cloud layer sphere addition
    if (config.textures && config.textures.clouds) {
      const cloudGeom = new THREE.SphereGeometry(visualRadius * 1.008, 64, 64);
      const cloudMat = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.0, // starts invisible until loaded
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.cloudsMesh = new THREE.Mesh(cloudGeom, cloudMat);
      this.group.add(this.cloudsMesh);

      loadTexture(config.textures.clouds).then((texture) => {
        cloudMat.map = texture;
        cloudMat.opacity = 0.45;
        cloudMat.needsUpdate = true;
      });
    }

    // LOD Level 0: Close-up (Distance < 50)
    const geom0 = new THREE.SphereGeometry(visualRadius, 64, 64);
    const mesh0 = new THREE.Mesh(geom0, planetMaterial);
    mesh0.castShadow = config.id !== 'sun';
    mesh0.receiveShadow = config.id !== 'sun';
    this.bodyMesh.addLevel(mesh0, 0);

    // LOD Level 1: Medium-close (Distance 50 - 200)
    const geom1 = new THREE.SphereGeometry(visualRadius, 32, 32);
    const mesh1 = new THREE.Mesh(geom1, planetMaterial);
    this.bodyMesh.addLevel(mesh1, 50);

    // LOD Level 2: Mid-range (Distance 200 - 1000)
    const geom2 = new THREE.SphereGeometry(visualRadius, 16, 16);
    const mesh2 = new THREE.Mesh(geom2, planetMaterial);
    this.bodyMesh.addLevel(mesh2, 200);

    // LOD Level 3: Far-away (Distance > 1000)
    const geom3 = new THREE.SphereGeometry(visualRadius, 8, 8);
    const mesh3 = new THREE.Mesh(geom3, planetMaterial);
    this.bodyMesh.addLevel(mesh3, 1000);

    // Apply axial tilt to the planet body group
    this.bodyMesh.rotation.z = this.axialTiltRad;
    this.group.add(this.bodyMesh);

    // 4. Custom Ring System (Saturn, Uranus)
    if (config.ring) {
      const innerRad = visualRadius * config.ring.inner_radius_scale;
      const outerRad = visualRadius * config.ring.outer_radius_scale;
      const ringGeom = new THREE.RingGeometry(
        innerRad,
        outerRad,
        64
      );
      // Align ring horizontally
      ringGeom.rotateX(Math.PI / 2);

      let ringMat: THREE.Material;
      if (config.ring.texture) {
        const customRingMat = new THREE.ShaderMaterial({
          vertexShader: ringsVertexShader,
          fragmentShader: ringsFragmentShader,
          uniforms: {
            ringTexture: { value: new THREE.Texture() },
            sunDirection: { value: new THREE.Vector3(1, 0, 0) },
            innerRadius: { value: innerRad },
            outerRadius: { value: outerRad },
          },
          side: THREE.DoubleSide,
          transparent: true,
        });
        this.ringMaterial = customRingMat;
        ringMat = customRingMat;

        loadTexture(config.ring.texture).then((texture) => {
          customRingMat.uniforms.ringTexture.value = texture;
          customRingMat.needsUpdate = true;
        });
      } else {
        ringMat = new THREE.MeshStandardMaterial({
          color: baseColor.clone().multiplyScalar(0.85),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          roughness: 0.6,
        });
      }

      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.name = `ring_${this.id}`;
      // Ring follows axial tilt
      ringMesh.rotation.z = this.axialTiltRad;
      this.group.add(ringMesh);
    }

    // 5. Custom Atmosphere Rayleigh limb glow shader
    if (config.atmosphere) {
      const atmRadius = visualRadius * config.atmosphere.radius_scale;
      const atmGeom = new THREE.SphereGeometry(atmRadius, 64, 64);
      
      const rayleighRGB = new THREE.Vector3(
        config.atmosphere.rayleigh[0],
        config.atmosphere.rayleigh[1],
        config.atmosphere.rayleigh[2]
      );

      const atmMat = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
          uRayleighColor: { value: rayleighRGB },
          uDensity: { value: config.atmosphere.density },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      });

      this.atmosphereMesh = new THREE.Mesh(atmGeom, atmMat);
      this.atmosphereMesh.name = `atmosphere_${this.id}`;
      this.group.add(this.atmosphereMesh);
    }

    // 6. Pre-calculate static Keplerian Orbit Line
    if (config.id !== 'sun') {
      this.orbitLine = this.generateOrbitLine();
    }
  }

  /**
   * Updates rotation and dynamic Keplerian orbital positions.
   * @param simulatedDate Simulated datetime.
   * @param parentPos Coordinates of parent body (e.g. Earth position for Moon).
   */
  public update(simulatedDate: Date, parentPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0)): void {
    // 1. Rotation (spin on axial tilt)
    const hoursSinceBase = (simulatedDate.getTime() - BASE_DATE_MS) / 3600000;
    const periodHours = this.config.rotation_period_hours || 24;
    
    // Scale rotation mapping for aesthetic clarity
    const rotationRad = periodHours !== 0 
      ? (hoursSinceBase / periodHours) * 2 * Math.PI * 10.0 // spin speed scalar
      : 0;
    this.bodyMesh.rotation.y = rotationRad;

    // 2. Orbital mechanics position solving
    if (this.config.id === 'sun') {
      this.group.position.set(0, 0, 0);
    } else {
      const position = this.solveKeplerOrbit(simulatedDate);
      // Offset by parent position (for moons)
      this.group.position.copy(position).add(parentPos);
    }

    // Update shader uniforms
    if (this.sunMaterial) {
      this.sunMaterial.uniforms.uTime.value = (simulatedDate.getTime() - BASE_DATE_MS) / 1000;
    }

    // Determine direction pointing to the sun from the planet (Sun is at 0, 0, 0)
    const toSun = this.group.position.clone().negate().normalize();

    if (this.earthMaterial) {
      this.earthMaterial.uniforms.sunDirection.value.copy(toSun);
    }

    if (this.ringMaterial) {
      this.ringMaterial.uniforms.sunDirection.value.copy(toSun);
    }

    // 3. Rotate clouds at a slightly offset rate
    if (this.cloudsMesh) {
      this.cloudsMesh.rotation.y = hoursSinceBase * (this.rotationSpeed * 1.08 * 10.0);
    }
  }

  /**
   * Helper to retrieve visually scaled semi-major axis values for moons.
   */
  private getOrbitSemiMajorAxis(): number {
    const a = this.config.semi_major_axis_au * AU_TO_UNITS;
    switch (this.id) {
      case 'moon': return a * 12.0;      // Earth's Moon: ~4.6 units (Earth radius: 1.5)
      case 'io': return a * 25.0;        // Io: ~10.5 units (Jupiter radius: 7.5)
      case 'europa': return a * 25.0;    // Europa: ~16.8 units
      case 'ganymede': return a * 25.0;  // Ganymede: ~26.8 units
      case 'callisto': return a * 25.0;  // Callisto: ~47.2 units
      case 'enceladus': return a * 70.0; // Enceladus: ~16.7 units (Saturn radius: 6.0 + rings)
      case 'titan': return a * 30.0;     // Titan: ~36.7 units
      default: return a;
    }
  }

  /**
   * Evaluates Keplerian orbit equations to find heliocentric positions.
   */
  private solveKeplerOrbit(simulatedDate: Date): THREE.Vector3 {
    const a = this.getOrbitSemiMajorAxis();
    const e = this.config.eccentricity;
    const i = THREE.MathUtils.degToRad(this.config.inclination_deg);
    const T = this.config.orbital_period_days;

    if (T === 0) return new THREE.Vector3(0, 0, 0);

    // Calculate number of simulated days since base epoch
    const diffDays = (simulatedDate.getTime() - BASE_DATE_MS) / (1000 * 86400);
    
    // Keplerian Mean Anomaly
    const M = (diffDays / T) * 2 * Math.PI;

    // Solve Kepler's equation E - e sin(E) = M using Newtonian approximation
    let E = M;
    for (let iteration = 0; iteration < 5; iteration++) {
      E = E - (E - e * Math.sin(E) - M) / (1.0 - e * Math.cos(E));
    }

    // Position in orbital plane coordinate space
    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

    // Rotate by inclination angle i (Omega = 0)
    const x = xOrb;
    const y = yOrb * Math.sin(i);
    const z = yOrb * Math.cos(i);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Generates a Line loop depicting the planet's Keplerian orbital ellipse.
   */
  private generateOrbitLine(): THREE.Line {
    const points: THREE.Vector3[] = [];
    const a = this.getOrbitSemiMajorAxis();
    const e = this.config.eccentricity;
    const i = THREE.MathUtils.degToRad(this.config.inclination_deg);
    const segments = 128;

    for (let j = 0; j <= segments; j++) {
      const E = (j / segments) * 2 * Math.PI;
      const xOrb = a * (Math.cos(E) - e);
      const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
      
      const x = xOrb;
      const y = yOrb * Math.sin(i);
      const z = yOrb * Math.cos(i);
      
      points.push(new THREE.Vector3(x, y, z));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x4A90E2,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const line = new THREE.Line(geom, mat);
    line.name = `orbit_line_${this.id}`;
    return line;
  }

  /**
   * Provides representative fallback colors for rendering.
   */
  private getPlanetColor(id: string): THREE.Color {
    switch (id) {
      case 'sun': return new THREE.Color('#FFF4EA');
      case 'mercury': return new THREE.Color('#888888');
      case 'venus': return new THREE.Color('#E3BB76');
      case 'earth': return new THREE.Color('#2A75D3');
      case 'moon': return new THREE.Color('#CCCCCC');
      case 'mars': return new THREE.Color('#C1440E');
      case 'jupiter': return new THREE.Color('#D8CA9D');
      case 'saturn': return new THREE.Color('#E2BF7D');
      case 'uranus': return new THREE.Color('#B7ECF1');
      case 'neptune': return new THREE.Color('#2974F8');
      default: return new THREE.Color('#FFFFFF');
    }
  }

  public dispose(): void {
    // Dispose geometry levels
    for (const level of this.bodyMesh.levels) {
      level.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    if (this.atmosphereMesh) {
      this.atmosphereMesh.geometry.dispose();
      if (Array.isArray(this.atmosphereMesh.material)) {
        this.atmosphereMesh.material.forEach((m) => m.dispose());
      } else {
        this.atmosphereMesh.material.dispose();
      }
    }

    if (this.orbitLine) {
      this.orbitLine.geometry.dispose();
      (this.orbitLine.material as THREE.Material).dispose();
    }
  }
}
