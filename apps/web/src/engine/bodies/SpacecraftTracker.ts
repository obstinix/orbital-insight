import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

export class SpacecraftTracker {
  public group: THREE.Group;
  
  // ISS elements
  public issOrbitLine: THREE.Line;
  public issMesh: THREE.Group;
  
  // JWST elements
  public jwstOrbitLine: THREE.Line;
  public jwstMesh: THREE.Group;
  public communicationLine: THREE.Line;

  private earthGroup: THREE.Group;
  private earthBodyMesh: THREE.LOD;

  // Telemetry caching for smooth interpolation
  private targetIssPos = new THREE.Vector3();
  private currentIssPos = new THREE.Vector3();

  constructor(earthGroup: THREE.Group, earthBodyMesh: THREE.LOD, scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'spacecraft_tracker_group';
    scene.add(this.group);

    this.earthGroup = earthGroup;
    this.earthBodyMesh = earthBodyMesh;

    // 1. Create ISS Orbit Line
    const issOrbitGeom = new THREE.BufferGeometry();
    const issOrbitMat = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
    });
    this.issOrbitLine = new THREE.Line(issOrbitGeom, issOrbitMat);
    this.issOrbitLine.name = 'iss_orbit_line';
    
    // Attach ISS orbit line directly to earthGroup (moves with Earth but doesn't spin)
    this.earthGroup.add(this.issOrbitLine);

    // 2. Create ISS Mesh (Highly detailed programmatic representation)
    this.issMesh = new THREE.Group();
    this.issMesh.name = 'iss_model';

    // Central truss structure
    const trussGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
    trussGeom.rotateZ(Math.PI / 2); // align along X
    const trussMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const truss = new THREE.Mesh(trussGeom, trussMat);
    this.issMesh.add(truss);

    // Pressurized modules (cylinders in the center)
    const moduleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
    const centerModuleGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12);
    const centerModule = new THREE.Mesh(centerModuleGeom, moduleMat);
    this.issMesh.add(centerModule);

    const sideModuleGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.4, 8);
    sideModuleGeom.rotateX(Math.PI / 2);
    const sideModule = new THREE.Mesh(sideModuleGeom, moduleMat);
    sideModule.position.set(0, 0, 0.15);
    this.issMesh.add(sideModule);

    // Solar panels arrays (blue glow, glassmorphism feel)
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0055ff,
      emissive: 0x001144,
      metalness: 0.9,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const panelGeom = new THREE.BoxGeometry(0.4, 0.01, 0.8);

    // Add 4 solar arrays on the ends of the truss
    const positions = [-0.6, -0.3, 0.3, 0.6];
    positions.forEach((xOffset) => {
      const panelLeft = new THREE.Mesh(panelGeom, panelMat);
      panelLeft.position.set(xOffset, 0, 0.45);
      
      const panelRight = new THREE.Mesh(panelGeom, panelMat);
      panelRight.position.set(xOffset, 0, -0.45);

      this.issMesh.add(panelLeft);
      this.issMesh.add(panelRight);
    });

    // Add a glowing beacon
    const beaconGeom = new THREE.SphereGeometry(0.06, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const beacon = new THREE.Mesh(beaconGeom, beaconMat);
    beacon.position.set(0, 0.25, 0);
    this.issMesh.add(beacon);

    // Attach ISS mesh to earthGroup as well
    this.earthGroup.add(this.issMesh);

    // 3. Create JWST Halo Orbit Line (centered at Sun-Earth L2 Lagrange Point)
    const jwstOrbitGeom = new THREE.BufferGeometry();
    const jwstOrbitMat = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    this.jwstOrbitLine = new THREE.Line(jwstOrbitGeom, jwstOrbitMat);
    this.jwstOrbitLine.name = 'jwst_orbit_line';
    this.group.add(this.jwstOrbitLine);

    // 4. Create JWST Model (golden primary mirror hexagons and sunshield)
    this.jwstMesh = new THREE.Group();
    this.jwstMesh.name = 'jwst_model';

    // Sunshield (layered diamond shape)
    const shieldGeom = new THREE.BoxGeometry(0.8, 0.02, 1.4);
    shieldGeom.rotateY(Math.PI / 4); // diamond tilt
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.9, roughness: 0.1 });
    const shield = new THREE.Mesh(shieldGeom, shieldMat);
    this.jwstMesh.add(shield);

    // Primary Mirror (golden honeycomb shape)
    const mirrorGroup = new THREE.Group();
    const hexGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.02, 6);
    hexGeom.rotateX(Math.PI / 2); // face forward
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x554400,
      metalness: 1.0,
      roughness: 0.05,
    });

    // Hexagonal packing of 7 sub-mirrors
    const hexOffsets = [
      [0, 0],
      [0.15, 0],
      [-0.15, 0],
      [0.075, 0.13],
      [-0.075, 0.13],
      [0.075, -0.13],
      [-0.075, -0.13],
    ];
    hexOffsets.forEach(([hx, hy]) => {
      const subMirror = new THREE.Mesh(hexGeom, mirrorMat);
      subMirror.position.set(hx, hy + 0.2, 0.1);
      mirrorGroup.add(subMirror);
    });
    this.jwstMesh.add(mirrorGroup);

    // Secondary mirror support struts
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    const strutGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4);
    strutGeom.rotateX(Math.PI / 6);
    
    const strut1 = new THREE.Mesh(strutGeom, strutMat);
    strut1.position.set(0.08, 0.3, 0.25);
    const strut2 = new THREE.Mesh(strutGeom, strutMat);
    strut2.position.set(-0.08, 0.3, 0.25);
    
    this.jwstMesh.add(strut1);
    this.jwstMesh.add(strut2);

    this.group.add(this.jwstMesh);

    // 5. Create Earth-JWST communication laser line
    const commGeom = new THREE.BufferGeometry();
    const commMat = new THREE.LineDashedMaterial({
      color: 0x00ffaa,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.4,
    });
    this.communicationLine = new THREE.Line(commGeom, commMat);
    this.communicationLine.name = 'earth_jwst_comm_line';
    this.group.add(this.communicationLine);
  }

  /**
   * Updates coordinates, tracks spacecraft, and draws lines.
   */
  public update(elapsedSeconds: number): void {
    const { issTelemetry } = useMissionStore.getState();

    // ─── PART 1: UPDATE ISS ───────────────────────────────────────
    // Earth radius is 7.5. Scale altitude (420km) accordingly.
    // 6371km is 7.5 units, so 420km is approx 7.5 * (420 / 6371) = 0.49 units.
    // Total ISS radius is 7.5 + 0.49 = ~8.0 units.
    const issRadius = 8.0;

    const latRad = THREE.MathUtils.degToRad(issTelemetry.latitude);
    // Add earth body rotation to longitude to match the spinning texture
    const earthSpin = this.earthBodyMesh.rotation.y;
    const lonRad = THREE.MathUtils.degToRad(issTelemetry.longitude) + earthSpin;

    // Convert to spherical coords relative to Earth equator
    const rawPos = new THREE.Vector3(
      issRadius * Math.cos(latRad) * Math.sin(lonRad),
      issRadius * Math.sin(latRad),
      issRadius * Math.cos(latRad) * Math.cos(lonRad)
    );

    // Apply Earth's axial tilt (Z-axis tilt)
    const axialTiltRad = THREE.MathUtils.degToRad(23.44);
    rawPos.applyAxisAngle(new THREE.Vector3(0, 0, 1), axialTiltRad);

    this.targetIssPos.copy(rawPos);

    // Smoothly interpolate ISS position
    this.currentIssPos.lerp(this.targetIssPos, 0.1);
    this.issMesh.position.copy(this.currentIssPos);

    // Rotate ISS model to face its direction of motion
    // A simple approximation: tangent to the orbital sphere
    const tangent = new THREE.Vector3(-Math.sin(lonRad), 0, -Math.cos(lonRad));
    tangent.applyAxisAngle(new THREE.Vector3(0, 0, 1), axialTiltRad).normalize();
    this.issMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);

    // ─── PART 2: GENERATE ISS ORBIT LINE (Closed Loop) ────────────
    // We compute the 92-minute orbit trajectory based on the same Keplerian simulation
    // to draw a beautiful, solid orbit loop.
    const orbitPoints: THREE.Vector3[] = [];
    const totalPeriodSeconds = 5520;
    const segments = 128;

    for (let step = 0; step <= segments; step++) {
      // Step through one orbital period relative to the current timestamp
      const tOffset = (step / segments) * totalPeriodSeconds;
      const angle = ((elapsedSeconds + tOffset) / totalPeriodSeconds) * 2 * Math.PI;

      // Mathematical orbital model: 51.64 degree inclination
      const stepLat = Math.sin(angle) * 51.64;
      // In the non-spinning frame, the orbit path is a circle, so geodetic longitude
      // matches the orbital angle directly (if ignoring slow nodal precession).
      const stepLon = (angle * (180 / Math.PI)) % 360;

      const stepLatRad = THREE.MathUtils.degToRad(stepLat);
      const stepLonRad = THREE.MathUtils.degToRad(stepLon) + earthSpin; // sync with Earth's spin

      const pt = new THREE.Vector3(
        issRadius * Math.cos(stepLatRad) * Math.sin(stepLonRad),
        issRadius * Math.sin(stepLatRad),
        issRadius * Math.cos(stepLatRad) * Math.cos(stepLonRad)
      );
      pt.applyAxisAngle(new THREE.Vector3(0, 0, 1), axialTiltRad);
      orbitPoints.push(pt);
    }
    this.issOrbitLine.geometry.setFromPoints(orbitPoints);

    // ─── PART 3: UPDATE JWST ──────────────────────────────────────
    // JWST is at the Sun-Earth L2 Lagrange Point.
    // In our engine: Sun is at (0,0,0). Earth is at earthGroup.position.
    // L2 lies along the Sun-Earth line, approx 1.5M km (0.01 AU = 1.5 units) further.
    const earthPos = this.earthGroup.position.clone();
    const sunToEarthVec = earthPos.clone().normalize();
    
    // L2 point center coordinates
    const l2Distance = 2.0; // Slightly exaggerated for 3D visual clarity
    const l2Center = earthPos.clone().add(sunToEarthVec.multiplyScalar(l2Distance));

    // JWST resides in a halo orbit around L2.
    // Let's create an ellipse in the plane perpendicular to the Sun-Earth line.
    // Find two orthogonal basis vectors perpendicular to sunToEarthVec.
    let upVec = new THREE.Vector3(0, 1, 0);
    if (Math.abs(sunToEarthVec.dot(upVec)) > 0.9) {
      upVec.set(0, 0, 1);
    }
    const rightVec = new THREE.Vector3().crossVectors(sunToEarthVec, upVec).normalize();
    const trueUpVec = new THREE.Vector3().crossVectors(rightVec, sunToEarthVec).normalize();

    // Halo orbit dimensions
    const haloRadiusX = 0.6;
    const haloRadiusY = 0.4;
    const jwstPeriod = 15.0; // 15 seconds for visual cycle speed

    // Generate JWST Orbit Line points
    const jwstPoints: THREE.Vector3[] = [];
    const jwstSegments = 64;
    for (let step = 0; step <= jwstSegments; step++) {
      const theta = (step / jwstSegments) * 2 * Math.PI;
      const xOffset = Math.cos(theta) * haloRadiusX;
      const yOffset = Math.sin(theta) * haloRadiusY;

      const pt = l2Center.clone()
        .add(rightVec.clone().multiplyScalar(xOffset))
        .add(trueUpVec.clone().multiplyScalar(yOffset));
      jwstPoints.push(pt);
    }
    this.jwstOrbitLine.geometry.setFromPoints(jwstPoints);

    // Position the JWST Mesh on the halo orbit
    const jwstAngle = (elapsedSeconds / jwstPeriod) * 2 * Math.PI;
    const jwstX = Math.cos(jwstAngle) * haloRadiusX;
    const jwstY = Math.sin(jwstAngle) * haloRadiusY;
    const jwstPos = l2Center.clone()
      .add(rightVec.clone().multiplyScalar(jwstX))
      .add(trueUpVec.clone().multiplyScalar(jwstY));
    
    this.jwstMesh.position.copy(jwstPos);

    // Point JWST towards deep space (away from Earth/Sun) or lock rotation
    this.jwstMesh.lookAt(jwstPos.clone().add(sunToEarthVec));

    // ─── PART 4: UPDATE COMMUNICATION LASER ───────────────────────
    // Draw laser line between Earth surface and JWST
    const laserPoints = [
      earthPos.clone(), // Earth center
      jwstPos.clone()   // JWST position
    ];
    this.communicationLine.geometry.setFromPoints(laserPoints);

    // ─── PART 5: DYNAMIC HUD FILTERING VISIBILITY ─────────────────
    // Toggle active spacecraft visibilities
    const isMissionsRoute = window.location.hash.includes('/missions');
    
    this.issOrbitLine.visible = isMissionsRoute;
    this.issMesh.visible = isMissionsRoute;
    this.jwstOrbitLine.visible = isMissionsRoute;
    this.jwstMesh.visible = isMissionsRoute;
    this.communicationLine.visible = isMissionsRoute;
  }

  public dispose(): void {
    // Clean up ISS
    this.issOrbitLine.geometry.dispose();
    (this.issOrbitLine.material as THREE.Material).dispose();
    this.issMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });

    // Clean up JWST
    this.jwstOrbitLine.geometry.dispose();
    (this.jwstOrbitLine.material as THREE.Material).dispose();
    this.jwstMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });

    // Clean up Laser
    this.communicationLine.geometry.dispose();
    (this.communicationLine.material as THREE.Material).dispose();
  }
}
