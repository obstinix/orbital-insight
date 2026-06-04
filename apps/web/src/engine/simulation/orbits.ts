import * as THREE from 'three';
import { HelioVector, Body, MakeTime, GeoVector } from 'astronomy-engine';
import { PlanetConfig } from '@orbital-insight/shared-types';

const AU_TO_UNITS = 150;
const BASE_DATE_MS = new Date('2026-01-01T00:00:00Z').getTime();

const BODY_MAP: Record<string, Body> = {
  mercury: Body.Mercury,
  venus: Body.Venus,
  earth: Body.Earth,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  moon: Body.Moon,
};

/**
 * Returns the visually scaled semi-major axis for moons to avoid overlapping with parents.
 */
export function getOrbitSemiMajorAxis(id: string, semiMajorAxisAu: number): number {
  const a = semiMajorAxisAu * AU_TO_UNITS;
  switch (id) {
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
 * Solves Kepler's equation for a body using its static elements (used for other moons).
 */
export function solveKeplerOrbit(config: PlanetConfig, simulatedDate: Date): THREE.Vector3 {
  const a = getOrbitSemiMajorAxis(config.id, config.semi_major_axis_au);
  const e = config.eccentricity;
  const i = THREE.MathUtils.degToRad(config.inclination_deg);
  const T = config.orbital_period_days;

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
 * Resolves the 3D position of a celestial body at a given date using astronomy-engine.
 */
export function getPlanetOrbitPosition(config: PlanetConfig, date: Date): THREE.Vector3 {
  if (config.id === 'sun') {
    return new THREE.Vector3(0, 0, 0);
  }

  if (config.id in BODY_MAP) {
    const time = MakeTime(date);
    if (config.id === 'moon') {
      const moonGeo = GeoVector(Body.Moon, time);
      const dir = new THREE.Vector3(moonGeo.x, moonGeo.y, moonGeo.z).normalize();
      const aVisual = getOrbitSemiMajorAxis(config.id, config.semi_major_axis_au);
      return dir.multiplyScalar(aVisual);
    } else {
      const helio = HelioVector(BODY_MAP[config.id], time);
      return new THREE.Vector3(helio.x * AU_TO_UNITS, helio.y * AU_TO_UNITS, helio.z * AU_TO_UNITS);
    }
  }

  // Fallback to custom Keplerian solver for outer moons
  return solveKeplerOrbit(config, date);
}
