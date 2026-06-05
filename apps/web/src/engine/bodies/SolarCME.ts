import * as THREE from 'three';

interface CMEEruption {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  positions: Float32Array;
  velocities: Float32Array;
  tangents: Float32Array;
  rotations: Float32Array; // speed of rotation around normal
  initialPositions: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
  normal: THREE.Vector3;
  center: THREE.Vector3;
  elapsed: number;
  duration: number;
}

export class SolarCME {
  public group: THREE.Group;
  private eruptions: CMEEruption[] = [];
  private particleTexture: THREE.Texture;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'solar_cme_group';
    this.particleTexture = this.createParticleTexture();
  }

  /**
   * Generates a smooth radial gradient circular particle texture.
   */
  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.2, 'rgba(255, 200, 50, 0.8)');
      grad.addColorStop(0.5, 'rgba(255, 80, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Triggers a new CME eruption from a random point on the Sun's surface.
   */
  public trigger(): void {
    const PARTICLE_COUNT = 3000;
    const SUN_RADIUS = 15.0;
    const DURATION = 8.0; // 8 seconds duration

    // 1. Choose a random emission point on the sphere surface of radius 15
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2 * Math.PI;
    const phi = Math.acos(2 * v - 1);

    const normal = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta),
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi)
    ).normalize();

    const center = normal.clone().multiplyScalar(SUN_RADIUS);

    // 2. Initialize arrays
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const initialPositions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const tangents = new Float32Array(PARTICLE_COUNT * 3);
    const rotations = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const ages = new Float32Array(PARTICLE_COUNT);
    const lifetimes = new Float32Array(PARTICLE_COUNT);

    // Generate arbitrary orthogonal vector for tangent reference
    const helper = new THREE.Vector3(0, 1, 0);
    if (Math.abs(normal.y) > 0.99) {
      helper.set(1, 0, 0);
    }
    const tangentX = new THREE.Vector3().crossVectors(normal, helper).normalize();
    const tangentY = new THREE.Vector3().crossVectors(normal, tangentX).normalize();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Small jitter around emission center
      const jitterAngle = Math.random() * 2 * Math.PI;
      const jitterRadius = Math.random() * 1.5;
      const localX = Math.cos(jitterAngle) * jitterRadius;
      const localY = Math.sin(jitterAngle) * jitterRadius;

      const p = center.clone()
        .addScaledVector(tangentX, localX)
        .addScaledVector(tangentY, localY);

      positions[i3] = p.x;
      positions[i3 + 1] = p.y;
      positions[i3 + 2] = p.z;

      initialPositions[i3] = p.x;
      initialPositions[i3 + 1] = p.y;
      initialPositions[i3 + 2] = p.z;

      // Ejection physics: Cone dispersion around normal
      // Combine radial thrust with magnetic-loop tangential forces
      const spread = 0.45; // cone spread factor
      const speed = 12.0 + Math.random() * 24.0; // speed units/sec
      
      const coneVec = normal.clone()
        .addScaledVector(tangentX, (Math.random() - 0.5) * spread)
        .addScaledVector(tangentY, (Math.random() - 0.5) * spread)
        .normalize()
        .multiplyScalar(speed);

      velocities[i3] = coneVec.x;
      velocities[i3 + 1] = coneVec.y;
      velocities[i3 + 2] = coneVec.z;

      // Magnetic curl/tangent speed component
      const curler = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(velocities[i3], velocities[i3 + 1], velocities[i3 + 2])).normalize();
      const curlSpeed = 4.0 + Math.random() * 8.0;
      tangents[i3] = curler.x * curlSpeed;
      tangents[i3 + 1] = curler.y * curlSpeed;
      tangents[i3 + 2] = curler.z * curlSpeed;

      rotations[i] = (Math.random() - 0.5) * 2.0; // angular speed

      // HDR Gold-Orange colors (values > 1.0 for UnrealBloomPass response)
      const tColor = Math.random();
      colors[i3] = 4.0 + tColor * 2.0;    // Red boost
      colors[i3 + 1] = 1.2 + tColor * 1.5;  // Green boost
      colors[i3 + 2] = 0.1;               // Low Blue

      // Randomized individual particle parameters
      ages[i] = 0;
      lifetimes[i] = DURATION * (0.6 + Math.random() * 0.4); // 4.8 to 8 seconds
    }

    // 3. Create GPU objects
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: this.particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    points.name = `cme_eruption_${Date.now()}`;
    this.group.add(points);

    this.eruptions.push({
      points,
      geometry,
      material,
      positions,
      velocities,
      tangents,
      rotations,
      initialPositions,
      ages,
      lifetimes,
      normal,
      center,
      elapsed: 0,
      duration: DURATION,
    });
  }

  /**
   * Updates all active eruptions.
   * @param delta Frame time delta in seconds.
   */
  public update(delta: number): void {
    for (let eIdx = this.eruptions.length - 1; eIdx >= 0; eIdx--) {
      const er = this.eruptions[eIdx];
      er.elapsed += delta;

      if (er.elapsed >= er.duration) {
        // Cleanup expired eruption
        this.group.remove(er.points);
        er.geometry.dispose();
        er.material.dispose();
        this.eruptions.splice(eIdx, 1);
        continue;
      }

      const posAttr = er.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const count = posArray.length / 3;

      const progress = er.elapsed / er.duration;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        er.ages[i] += delta;

        const life = er.lifetimes[i];
        if (er.ages[i] >= life) {
          // Hide particle by shifting it inside Sun
          posArray[i3] = 0;
          posArray[i3 + 1] = 0;
          posArray[i3 + 2] = 0;
          continue;
        }

        // Kinetic motion model
        // Integrate radial velocity, magnetic loop curvature (spiral), and gravitational drag back to Sun
        const t = er.ages[i];

        // Magnetic loops: spiral motion around normal vector
        const angle = er.rotations[i] * t * 1.5;

        // Ejection offset along velocity vector
        const vx = er.velocities[i3] * t;
        const vy = er.velocities[i3 + 1] * t;
        const vz = er.velocities[i3 + 2] * t;

        // Tangent deflection simulating solar wind curvature
        const tx = er.tangents[i3] * t * Math.sin(angle);
        const ty = er.tangents[i3 + 1] * t * Math.sin(angle);
        const tz = er.tangents[i3 + 2] * t * Math.sin(angle);

        posArray[i3] = er.initialPositions[i3] + vx + tx;
        posArray[i3 + 1] = er.initialPositions[i3 + 1] + vy + ty;
        posArray[i3 + 2] = er.initialPositions[i3 + 2] + vz + tz;
      }
      posAttr.needsUpdate = true;

      // Smoothly fade out all particles towards the end
      er.material.opacity = Math.max(0, 0.9 * (1.0 - progress));
    }
  }

  public dispose(): void {
    for (const er of this.eruptions) {
      this.group.remove(er.points);
      er.geometry.dispose();
      er.material.dispose();
    }
    this.eruptions = [];
    this.particleTexture.dispose();
  }
}
