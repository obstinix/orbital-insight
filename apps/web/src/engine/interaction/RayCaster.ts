import * as THREE from 'three';
import gsap from 'gsap';
import { Planet } from '../bodies/Planet';

export class RayCaster {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private canvas: HTMLCanvasElement;
  private planets: Planet[];

  private hoveredPlanet: Planet | null = null;
  private tooltipElement: HTMLDivElement | null = null;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    canvas: HTMLCanvasElement,
    planets: Planet[]
  ) {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.camera = camera;
    this.scene = scene;
    this.canvas = canvas;
    this.planets = planets;

    // Create a floating tooltip element
    this.createTooltip();

    // Hook listeners
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onClick);
  }

  private createTooltip(): void {
    if (typeof document === 'undefined') return;

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.style.position = 'fixed';
    this.tooltipElement.style.pointerEvents = 'none';
    this.tooltipElement.style.padding = '4px 8px';
    this.tooltipElement.style.background = 'rgba(5, 8, 16, 0.85)';
    this.tooltipElement.style.border = '1px solid rgba(0, 188, 212, 0.4)';
    this.tooltipElement.style.borderRadius = '4px';
    this.tooltipElement.style.color = '#E8F0FF';
    this.tooltipElement.style.fontFamily = 'var(--font-display)';
    this.tooltipElement.style.fontSize = '0.75rem';
    this.tooltipElement.style.textTransform = 'uppercase';
    this.tooltipElement.style.letterSpacing = '1px';
    this.tooltipElement.style.boxShadow = '0 0 10px rgba(0, 188, 212, 0.2)';
    this.tooltipElement.style.display = 'none';
    this.tooltipElement.style.zIndex = 'var(--z-overlay)';
    
    document.body.appendChild(this.tooltipElement);
  }

  // Throttle raycasting to once every 16ms (60hz)
  private lastMoveTime = 0;
  private onMouseMove = (event: MouseEvent): void => {
    const now = performance.now();
    
    // Position tooltip instantly
    if (this.tooltipElement && this.tooltipElement.style.display !== 'none') {
      this.tooltipElement.style.left = `${event.clientX + 15}px`;
      this.tooltipElement.style.top = `${event.clientY + 15}px`;
    }

    if (now - this.lastMoveTime < 16) return;
    this.lastMoveTime = now;

    // Calculate NDC coordinates
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Intersect planet groups (contain bodyMesh + atmosphere)
    const intersectableObjects: THREE.Object3D[] = [];
    this.planets.forEach((p) => {
      // Intersect the LOD levels directly
      p.bodyMesh.levels.forEach((lvl) => {
        intersectableObjects.push(lvl.object);
      });
    });

    const intersects = this.raycaster.intersectObjects(intersectableObjects, true);

    if (intersects.length > 0) {
      // Find matching Planet by resolving parent names or userDatas
      let matchingPlanet: Planet | null = null;
      let currentObj: THREE.Object3D | null = intersects[0].object;

      while (currentObj && currentObj !== this.scene) {
        if (currentObj.name.startsWith('planet_group_')) {
          const id = currentObj.name.replace('planet_group_', '');
          matchingPlanet = this.planets.find((p) => p.id === id) || null;
          break;
        }
        currentObj = currentObj.parent;
      }

      if (matchingPlanet) {
        if (this.hoveredPlanet !== matchingPlanet) {
          // Hover Enter
          this.resetHover();
          this.hoveredPlanet = matchingPlanet;

          // Scale up via GSAP
          gsap.to(this.hoveredPlanet.group.scale, {
            x: 1.06,
            y: 1.06,
            z: 1.06,
            duration: 0.2,
            overwrite: 'auto',
          });

          // Show tooltip
          if (this.tooltipElement) {
            this.tooltipElement.innerText = this.hoveredPlanet.name;
            this.tooltipElement.style.display = 'block';
            this.tooltipElement.style.left = `${event.clientX + 15}px`;
            this.tooltipElement.style.top = `${event.clientY + 15}px`;
          }
        }
      } else {
        this.resetHover();
      }
    } else {
      this.resetHover();
    }
  };

  private resetHover(): void {
    if (this.hoveredPlanet) {
      // Scale back to normal
      gsap.to(this.hoveredPlanet.group.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.2,
        overwrite: 'auto',
      });
      this.hoveredPlanet = null;
    }
    if (this.tooltipElement) {
      this.tooltipElement.style.display = 'none';
    }
  }

  private onClick = (): void => {
    if (this.hoveredPlanet && typeof window !== 'undefined') {
      // Dispatch custom selection event
      window.dispatchEvent(
        new CustomEvent('celestialBodySelected', {
          detail: { planetId: this.hoveredPlanet.id },
        })
      );
      
      console.log(`[Interaction] Selected celestial body: ${this.hoveredPlanet.name}`);
    }
  };

  public dispose(): void {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }
  }
}
