import * as THREE from 'three';
import { useConstellationStore, ConstellationListItem } from '../../store/useConstellationStore';

const CELESTIAL_RADIUS = 9500; // slightly inside Oort/starfield radius of 10000

export class ConstellationLines {
  public group: THREE.Group;
  private lineMat: THREE.LineBasicMaterial;
  private starGlows: THREE.Points | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'constellation_lines';

    this.lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    this.loadCatalog();
  }

  /**
   * Converts Right Ascension (degrees) and Declination (degrees) to 3D Cartesian Coordinates.
   */
  public static getCoordinates3D(ra: number, dec: number): THREE.Vector3 {
    const raRad = ra * (Math.PI / 180);
    const decRad = dec * (Math.PI / 180);

    const cosDec = Math.cos(decRad);
    const x = CELESTIAL_RADIUS * cosDec * Math.cos(raRad);
    const y = CELESTIAL_RADIUS * Math.sin(decRad);
    const z = CELESTIAL_RADIUS * cosDec * Math.sin(raRad);

    return new THREE.Vector3(x, y, z);
  }

  private async loadCatalog(): Promise<void> {
    try {
      // 1. Fetch Metadata for center coords and list matching
      const metaRes = await fetch('/constellations/metadata.json');
      if (!metaRes.ok) throw new Error(`HTTP ${metaRes.status} loading metadata`);
      const metaData = await metaRes.json();

      const listItems: ConstellationListItem[] = [];

      for (const feature of metaData.features) {
        const id = feature.id;
        const props = feature.properties;
        const coords = feature.geometry.coordinates; // [ra_deg, dec_deg]
        
        listItems.push({
          id,
          name: props.name,
          abbreviation: props.desig || id,
          mythology: props.mythology || `${props.name} (${props.desig || id}) is one of the 88 IAU recognized constellations.`,
          ra: coords[0],
          dec: coords[1],
        });
      }

      // Sort alphabetically
      listItems.sort((a, b) => a.name.localeCompare(b.name));

      // Push to Zustand store
      useConstellationStore.getState().setConstellationsList(listItems);
      console.log(`[ConstellationLines] Loaded ${listItems.length} constellations in store`);

      // 2. Fetch lines.json
      const linesRes = await fetch('/constellations/lines.json');
      if (!linesRes.ok) throw new Error(`HTTP ${linesRes.status} loading lines`);
      const linesData = await linesRes.json();

      const glowStarPositions: number[] = [];

      for (const feature of linesData.features) {
        const id = feature.id;
        const geom = feature.geometry;

        const points: THREE.Vector3[] = [];

        if (geom.type === 'MultiLineString') {
          for (const line of geom.coordinates) {
            for (let i = 0; i < line.length - 1; i++) {
              const p1 = ConstellationLines.getCoordinates3D(line[i][0], line[i][1]);
              const p2 = ConstellationLines.getCoordinates3D(line[i + 1][0], line[i + 1][1]);
              points.push(p1);
              points.push(p2);

              glowStarPositions.push(p1.x, p1.y, p1.z);
              glowStarPositions.push(p2.x, p2.y, p2.z);
            }
          }
        }

        if (points.length > 0) {
          const geom = new THREE.BufferGeometry().setFromPoints(points);
          const segment = new THREE.LineSegments(geom, this.lineMat);
          segment.name = `lines_${id}`;
          this.group.add(segment);
        }
      }

      // 3. Create glowing nodes overlay
      if (glowStarPositions.length > 0) {
        const nodeGeom = new THREE.BufferGeometry();
        nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(glowStarPositions, 3));

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
    } catch (error) {
      console.error('[ConstellationLines] Failed to load constellation assets:', error);
    }
  }

  public update(elapsedSeconds: number): void {
    if (this.starGlows) {
      const mat = this.starGlows.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = elapsedSeconds;
    }
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
      }
    });
    this.lineMat.dispose();
    if (this.starGlows) {
      this.starGlows.geometry.dispose();
      (this.starGlows.material as THREE.Material).dispose();
    }
  }
}
