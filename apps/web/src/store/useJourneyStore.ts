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
    title: "Cradle of Humanity",
    subtitle: "Inner Solar System // Terrestrial Sector",
    focusId: "earth",
    scaleLabel: "384,400 km (Lunar Distance)",
    description: "Orbiting Earth, our blue sanctuary. Safely protected by the magnetosphere, we observe the Moon locked in tidally bound sync."
  },
  {
    id: 2,
    title: "Inner Sanctuaries",
    subtitle: "Mars & The Asteroid Gate",
    focusId: "mars",
    scaleLabel: "1.52 AU",
    description: "Venturing to Mars, the red frontier. Beyond lies the asteroid belt, a rocky graveyard dating to the solar system's birth."
  },
  {
    id: 3,
    title: "Sovereign of Storms",
    subtitle: "Gas Giant Sector // Jupiter Orbit",
    focusId: "jupiter",
    scaleLabel: "5.20 AU",
    description: "Approaching Jupiter, a planet larger than all others combined. Orbiting in severe magnetic radiation belts amidst 95 moons."
  },
  {
    id: 4,
    title: "Icy Sentinels",
    subtitle: "Ring Lord Saturn & Outer Giants",
    focusId: "saturn",
    scaleLabel: "9.58 AU",
    description: "Hovering near Saturn's pure water ice rings. Beyond lie Uranus and Neptune, cold methane-rich giants at the solar system's edge."
  },
  {
    id: 5,
    title: "Interstellar Dawn",
    subtitle: "The Heliosphere & Kuiper Belt",
    focusId: "kuiper",
    scaleLabel: "120 AU",
    description: "Crossing the heliopause where solar winds halt. Looking back, our Sun is a bright speck in a sea of freezing dust and Oort debris."
  },
  {
    id: 6,
    title: "Nearest Neighbors",
    subtitle: "Alpha Centauri Alpha & Proxima",
    focusId: "alphacentauri",
    scaleLabel: "4.3 Light Years",
    description: "Arriving at the nearest star system. A triple star configuration consisting of Alpha Centauri A, B, and the red dwarf Proxima."
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
  setCurrentChapterId: (id: number) => void;
  setIsTransitioning: (val: boolean) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  currentChapterId: 1,
  isTransitioning: false,
  setCurrentChapterId: (id) => set({ currentChapterId: id }),
  setIsTransitioning: (val) => set({ isTransitioning: val }),
}));
