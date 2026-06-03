import { create } from 'zustand';

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  focusId: string;
  scaleLabel: string;
  description: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "Earth Atmospheric Entry",
    subtitle: "Inner Solar System // Terrestrial Sector",
    focusId: "earth",
    scaleLabel: "100 km (Thermosphere)",
    description: "Initiating spacecraft entry into Earth's upper atmosphere. Dynamic heat shielding engaged as we drop below orbital altitude."
  },
  {
    id: 2,
    title: "Solar System Flyover",
    subtitle: "Mars & Interplanetary Corridor",
    focusId: "mars",
    scaleLabel: "1.52 AU",
    description: "Engaging low-impulse cruise through the inner solar system, executing high-speed flybys of Mars and lunar waypoints."
  },
  {
    id: 3,
    title: "Sun & Heliosphere",
    subtitle: "Gas Giant Sector // Coronal Ingress",
    focusId: "sun",
    scaleLabel: "0.0046 AU (Solar Corona)",
    description: "Braving extreme solar radiation inside the Sun's outer corona, tracking magnetic loops and the solar wind origin."
  },
  {
    id: 4,
    title: "Alpha Centauri Approach",
    subtitle: "Interstellar Crossing Terminal",
    focusId: "alphacentauri",
    scaleLabel: "4.3 Light Years",
    description: "Decelerating from relativistic speed as we approach the Alpha Centauri trinary system, scanning for exoplanet signatures."
  },
  {
    id: 5,
    title: "Sovereign of Storms",
    subtitle: "Gas Giant Sector // Jupiter Orbit",
    focusId: "jupiter",
    scaleLabel: "5.20 AU",
    description: "Approaching Jupiter, a planet larger than all others combined. Orbiting in severe magnetic radiation belts amidst 95 moons."
  },
  {
    id: 6,
    title: "Icy Sentinels",
    subtitle: "Ring Lord Saturn & Outer Giants",
    focusId: "saturn",
    scaleLabel: "9.58 AU",
    description: "Hovering near Saturn's pure water ice rings. Beyond lie Uranus and Neptune, cold methane-rich giants at the solar system's edge."
  },
  {
    id: 7,
    title: "Milky Way Core",
    subtitle: "Sagittarius A* // Galactic Center",
    focusId: "sagittarius",
    scaleLabel: "26,600 Light Years",
    description: "Reaching the supermassive black hole Sagittarius A*. A four-million solar mass gravitational well spinning at relativistic speeds."
  },
  {
    id: 8,
    title: "Cosmic Horizon",
    subtitle: "Cosmic Microwave Background (CMB)",
    focusId: "cmb",
    scaleLabel: "46.5 Billion Light Years",
    description: "Reaching the edge of the observable universe. We scan the ancient CMB thermal imprint, left when the cosmos was 380,000 years old."
  }
];

interface JourneyState {
  currentChapterId: number;
  isTransitioning: boolean;
  isPaused: boolean;
  pausedMessage: string;
  setCurrentChapterId: (id: number) => void;
  setIsTransitioning: (val: boolean) => void;
  setIsPaused: (val: boolean) => void;
  setPausedMessage: (msg: string) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  currentChapterId: 1,
  isTransitioning: false,
  isPaused: false,
  pausedMessage: '',
  setCurrentChapterId: (id) => set({ currentChapterId: id }),
  setIsTransitioning: (val) => set({ isTransitioning: val }),
  setIsPaused: (val) => set({ isPaused: val }),
  setPausedMessage: (msg) => set({ pausedMessage: msg }),
}));
