export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface NearestBody {
  id: string;
  distanceAU: number;
  angle: number;
}

export type ExplorationMode = 'FREE_ROAM' | 'JOURNEY' | 'CONSTELLATION' | 'EXOPLANET' | 'MISSIONS';

export interface SceneContext {
  location: string;
  nearestBody: NearestBody | null;
  cameraPosition: Vector3Like;
  activeMode: ExplorationMode;
  simulatedDate: string;
  userDiscoveries: string[];
  journeyChapter: number | null;
}

export interface AtmosphereConfig {
  radius_scale: number;
  rayleigh: number[];
  density: number;
}

export interface PlanetFacts {
  source: string;
  url: string;
  fun_facts?: string[];
}

export interface PlanetConfig {
  id: string;
  name: string;
  radius_km: number;
  mass_kg: number;
  orbital_period_days: number;
  rotation_period_hours: number;
  axial_tilt_deg: number;
  semi_major_axis_au: number;
  eccentricity: number;
  inclination_deg: number;
  textures?: {
    diffuse?: string;
    normal?: string;
    specular?: string;
    night?: string;
    clouds?: string;
    emissive?: string;
  };
  atmosphere?: AtmosphereConfig;
  ring?: {
    inner_radius_scale: number;
    outer_radius_scale: number;
    texture?: string;
  };
  moons: string[];
  facts: PlanetFacts;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
