import * as THREE from 'three';

export class LagrangePoints {
  public group: THREE.Group;
  
  private earthGroup: THREE.Group;
  private moonGroup: THREE.Group;

  private esMarkers: THREE.Mesh[] = [];
  private emMarkers: THREE.Mesh[] = [];
  private markerGeom: THREE.BufferGeometry;
  private esMat: THREE.Material;
  private emMat: THREE.Material;

  constructor(earthGroup: THREE.Group, moonGroup: THREE.Group) {
    this.group = new THREE.Group();
    this.group.name = 'lagrange_points_group';
    
    this.earthGroup = earthGroup;
    this.moonGroup = moonGroup;

    // Small double-pyramid octahedron for sci-fi look
    this.markerGeom = new THREE.OctahedronGeometry(0.35, 0);

    // Neon green for Earth-Sun
    this.esMat = new THREE.MeshBasicMaterial({
      color: 0x39ff14,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    // Orchid purple for Earth-Moon
    this.emMat = new THREE.MeshBasicMaterial({
      color: 0xda70d6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });

    // Create 5 markers for Earth-Sun
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(this.markerGeom, this.esMat);
      mesh.name = `ES_L${i + 1}`;
      this.group.add(mesh);
      this.esMarkers.push(mesh);
    }

    // Create 5 markers for Earth-Moon
    for (let i = 0; i < 5; i++) {
      const mesh = new THREE.Mesh(this.markerGeom, this.emMat);
      mesh.name = `EM_L${i + 1}`;
      // Earth-Moon markers move with Earth group, so we can attach them to earthGroup
      this.earthGroup.add(mesh);
      this.emMarkers.push(mesh);
    }
  }

  public update(elapsedSeconds: number): void {
    // 1. Earth-Sun Lagrange points
    // Primary = Sun (0, 0, 0)
    // Secondary = Earth (this.earthGroup.position)
    const earthPos = this.earthGroup.position.clone();
    const esDist = earthPos.length();
    if (esDist > 0) {
      const esDir = earthPos.clone().normalize();
      const esNormal = new THREE.Vector3(0, 1, 0);
      const esPerp = new THREE.Vector3().crossVectors(esNormal, esDir).normalize();

      // Earth visual radius is ~3 units. Space L1 and L2 to avoid overlap.
      const l1_offset = esDist - 12.0;
      const l2_offset = esDist + 12.0;

      // L1: Between Sun and Earth
      this.esMarkers[0].position.copy(esDir).multiplyScalar(l1_offset);
      // L2: Behind Earth
      this.esMarkers[1].position.copy(esDir).multiplyScalar(l2_offset);
      // L3: Opposite side of Sun
      this.esMarkers[2].position.copy(esDir).multiplyScalar(-esDist);
      // L4: 60 deg ahead in orbit
      const l4Pos = esDir.clone().multiplyScalar(0.5).add(esPerp.clone().multiplyScalar(Math.sqrt(3) / 2)).multiplyScalar(esDist);
      this.esMarkers[3].position.copy(l4Pos);
      // L5: 60 deg behind in orbit
      const l5Pos = esDir.clone().multiplyScalar(0.5).add(esPerp.clone().multiplyScalar(-Math.sqrt(3) / 2)).multiplyScalar(esDist);
      this.esMarkers[4].position.copy(l5Pos);
    }

    // 2. Earth-Moon Lagrange points (local coordinates relative to Earth center)
    // Primary = Earth (0, 0, 0) in earthGroup local frame
    // Secondary = Moon (this.moonGroup.position relative to earthGroup)
    const moonPos = this.moonGroup.position.clone().sub(this.earthGroup.position);
    const emDist = moonPos.length();
    if (emDist > 0) {
      const emDir = moonPos.clone().normalize();
      const emNormal = new THREE.Vector3(0, 1, 0);
      const emPerp = new THREE.Vector3().crossVectors(emNormal, emDir).normalize();

      // Moon visual radius is smaller. L1/L2 offset: ~2.2 units
      const l1_offset = emDist - 2.2;
      const l2_offset = emDist + 2.2;

      // L1: Between Earth and Moon
      this.emMarkers[0].position.copy(emDir).multiplyScalar(l1_offset);
      // L2: Behind Moon
      this.emMarkers[1].position.copy(emDir).multiplyScalar(l2_offset);
      // L3: Opposite side of Earth
      this.emMarkers[2].position.copy(emDir).multiplyScalar(-emDist);
      // L4: 60 deg ahead
      const l4Pos = emDir.clone().multiplyScalar(0.5).add(emPerp.clone().multiplyScalar(Math.sqrt(3) / 2)).multiplyScalar(emDist);
      this.emMarkers[3].position.copy(l4Pos);
      // L5: 60 deg behind
      const l5Pos = emDir.clone().multiplyScalar(0.5).add(emPerp.clone().multiplyScalar(-Math.sqrt(3) / 2)).multiplyScalar(emDist);
      this.emMarkers[4].position.copy(l5Pos);
    }

    // Add subtle spin to markers for high-tech aesthetic
    const rotSpeed = elapsedSeconds * 1.5;
    this.esMarkers.forEach((m) => {
      m.rotation.x = rotSpeed;
      m.rotation.y = rotSpeed;
    });
    this.emMarkers.forEach((m) => {
      m.rotation.x = rotSpeed;
      m.rotation.y = rotSpeed;
    });
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
    this.emMarkers.forEach((m) => {
      m.visible = visible;
    });
  }

  public dispose(): void {
    this.markerGeom.dispose();
    this.esMat.dispose();
    this.emMat.dispose();
    
    // Remove markers from parent groups
    this.emMarkers.forEach((m) => {
      if (m.parent) m.parent.remove(m);
    });
  }
}
