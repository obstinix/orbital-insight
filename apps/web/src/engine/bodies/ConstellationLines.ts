import * as THREE from 'three';
import constellationsData from '../../../../../packages/content/constellations.json';

const CELESTIAL_RADIUS = 9500; // slightly inside Oort/starfield radius of 10000

export interface ConstellationStar {
  name: string;
  ra: number;  // hours
  dec: number; // degrees
  position3D: THREE.Vector3;
}

export interface Constellation {
  id: string;
  name: string;
  abbreviation: string;
  mythology: string;
  stars: Record<string, ConstellationStar>;
  connections: [string, string][];
}

export class ConstellationLines {
  public group: THREE.Group;
  public constellations: Constellation[] = [];
  private lineSegments: THREE.LineSegments[] = [];
  private starGlows: THREE.Points | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'constellation_lines';

    this.parseCatalog();
    this.buildLinesAndNodes();
  }

  /**
   * Converts Right Ascension and Declination to 3D Cartesian Coordinates.
   */
  public static getCoordinates3D(ra: number, dec: number): THREE.Vector3 {
    // 1 hour RA = 15 degrees
    const raRad = ra * 15 * (Math.PI / 180);
    const decRad = dec * (Math.PI / 180);

    const x = CELESTIAL_RADIUS * Math.cos(decRad) * Math.cos(raRad);
    const y = CELESTIAL_RADIUS * Math.sin(decRad);
    const z = CELESTIAL_RADIUS * Math.cos(decRad) * Math.sin(raRad);

    return new THREE.Vector3(x, y, z);
  }

  private parseCatalog(): void {
    // Cast and load data
    const rawData = constellationsData as unknown as Array<{
      id: string;
      name: string;
      abbreviation: string;
      mythology: string;
      stars: Record<string, { name: string; ra: number; dec: number }>;
      connections: [string, string][];
    }>;
    
    this.constellations = rawData.map((c) => {
      const parsedStars: Record<string, ConstellationStar> = {};
      
      for (const [key, star] of Object.entries(c.stars)) {
        const s = star as { name: string; ra: number; dec: number };
        parsedStars[key] = {
          name: s.name,
          ra: s.ra,
          dec: s.dec,
          position3D: ConstellationLines.getCoordinates3D(s.ra, s.dec),
        };
      }

      return {
        id: c.id,
        name: c.name,
        abbreviation: c.abbreviation,
        mythology: c.mythology,
        stars: parsedStars,
        connections: c.connections as [string, string][],
      };
    });
  }

  private buildLinesAndNodes(): void {
    // Sleek cyan line material
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const glowStarPositions: number[] = [];

    for (const constellation of this.constellations) {
      const points: THREE.Vector3[] = [];

      for (const [startKey, endKey] of constellation.connections) {
        const startStar = constellation.stars[startKey];
        const endStar = constellation.stars[endKey];

        if (startStar && endStar) {
          points.push(startStar.position3D);
          points.push(endStar.position3D);
        }
      }

      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const segment = new THREE.LineSegments(geom, lineMat);
      
      // Store reference
      this.lineSegments.push(segment);
      this.group.add(segment);

      // Collect star positions for glowing node overlay
      for (const star of Object.values(constellation.stars)) {
        glowStarPositions.push(star.position3D.x, star.position3D.y, star.position3D.z);
      }
    }

    // Create glowing points for constellation star nodes
    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(glowStarPositions, 3));

    // Custom shader material for star node halo pulse
    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        varying float vGlow;
        void main() {
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPos;
          
          // Slow pulsing halo
          vGlow = sin(uTime * 2.5 + position.x) * 0.35 + 0.65;
          gl_PointSize = 22.0 * (150.0 / -mvPos.z) * vGlow;
        }
      `,
      fragmentShader: `
        varying float vGlow;
        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          float dist = length(coord);
          if (dist > 0.5) discard;
          
          float intensity = 1.0 - smoothstep(0.1, 0.5, dist);
          gl_FragColor = vec4(0.0, 0.94, 1.0, intensity * vGlow * 0.7);
        }
      `,
    });

    this.starGlows = new THREE.Points(nodeGeom, nodeMat);
    this.group.add(this.starGlows);
  }

  public update(elapsedSeconds: number): void {
    if (this.starGlows) {
      const mat = this.starGlows.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = elapsedSeconds;
    }
  }

  public dispose(): void {
    this.lineSegments.forEach((segment) => {
      segment.geometry.dispose();
    });
    if (this.starGlows) {
      this.starGlows.geometry.dispose();
      (this.starGlows.material as THREE.Material).dispose();
    }
  }
}
