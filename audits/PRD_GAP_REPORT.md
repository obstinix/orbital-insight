# PRD_GAP_REPORT.md — Orbital Insight
*Source: `Orbital_Insight_PRD.docx` v1.0 (June 2026)*

---

## Feature Coverage Matrix

### Section 3.1 — Core 3D Universe Engine (P0 — Must Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Three.js / WebGL real-time renderer | ✅ | ✅ | 100% | `Renderer.ts` — WebGL 2.0 + ACES tone mapping + soft shadows |
| Procedural star field (100,000+ spectral stars) | ✅ | ✅ | 100% | `StarField.ts` — Harvard OBAFGKM classification, twinkling, 100k points |
| Volumetric nebula clouds (particle density shaders) | ✅ | ✅ | 90% | `nebula.vert/.frag` with FBM noise; not particle-system based (sphere geometry) |
| Physically Based Rendering (PBR) | ✅ | ⚠️ | 50% | `MeshStandardMaterial` on all planets but **zero texture maps loaded** |
| Dynamic camera (free-roam, orbit, cinematic) | ✅ | ✅ | 95% | `Camera.ts` — FREE_ROAM/ORBIT/CINEMATIC modes with GSAP transitions |
| Inertia-based movement | ✅ | ✅ | 100% | Camera controller damping implemented |
| Scripted camera path animations | ✅ | ⚠️ | 60% | `JourneyMode.ts` has GSAP timeline for deep space chapters; solar system chapters incomplete |
| Procedural space environment generation | ✅ | ✅ | 80% | Star field + Oort Cloud + nebula procedurally generated; galaxy arm variation missing |
| Adaptive LOD system (60fps) | ✅ | ✅ | 100% | 4-level LOD at distances 0/50/200/1000 in `Planet.ts` |

**Section 3.1 Completion: ~86%**

---

### Section 3.2 — Celestial Bodies & Interactivity (P0 — Must Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| 8 planets — accurate textures + atmosphere + rings | ✅ | ⚠️ | 40% | All 8 planets + Sun + Moon in JSON & rendered; **all textures missing** (`.basis` files not in repo) |
| Real orbital mechanics (Kepler + NASA ephemeris) | ✅ | ⚠️ | 75% | Keplerian equations implemented in `Planet.ts`; NASA JPL Horizons API **not connected** |
| Day-night terminator, cloud layers, surface detail | ✅ | ❌ | 10% | Atmosphere limb glow shader exists; no cloud layer, no terminator without textures |
| Earth's Moon + major Jovian/Saturnian moons | ✅ | ⚠️ | 50% | Moon in `moon.json` and rendered; Jupiter/Saturn moons referenced in `moons[]` array but not rendered |
| Sun with CME particle effects + solar flare | ✅ | ⚠️ | 50% | Sun rendered as glowing sphere; no CME particle system or solar flare animation |
| Clickable/hover celestial objects | ✅ | ✅ | 85% | `RayCaster.ts` fires `celestialBodySelected` events; `InfoPanel.tsx` displays data |
| Orbital data panel (radius, mass, period, distance, temp) | ✅ | ✅ | 85% | `InfoPanel.tsx` renders from `PlanetConfig`; temperature field missing from JSON schema |
| "Fun Facts" carousel | ✅ | ❌ | 0% | Not implemented — `InfoPanel.tsx` shows static data only |
| Link to deep-dive educational module | ✅ | ❌ | 0% | `facts.url` exists in JSON but no link rendered in `InfoPanel` |
| Black hole: lensing + accretion disk + Hawking radiation | ✅ | ✅ | 85% | `blackhole.vert/.frag` — relativistic Doppler beaming, accretion disk, lensing; Hawking radiation particles missing |

**Section 3.2 Completion: ~47%**

---

### Section 3.3 — AI Spacecraft Guide (P0 — Must Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Fully rigged 3D spacecraft with animation states | ✅ | ✅ | 90% | `SpacecraftController.ts` — programmatic mesh, IDLE/THRUSTING/WARPING/ORBITING states |
| AI-powered narration via Claude API + natural language | ✅ | ❌ | 5% | `AIGuide.ts` calls backend; backend (`guide.ts`) is a **hardcoded keyword dictionary**, not Claude API |
| Scripted cinematic guided tours | ✅ | ⚠️ | 50% | `JourneyMode.ts` handles deep space chapters; solar system tour scripting incomplete |
| Warp-jump sequences (motion blur, lens flare, hyperspace) | ✅ | ✅ | 95% | `warp.vert/.frag` shader + GSAP timeline in `SpacecraftController.ts` |
| Asteroid field navigation sequence | ✅ | ❌ | 0% | Not implemented |
| Planetary flyby mode | ✅ | ❌ | 0% | Not implemented |

**Section 3.3 Completion: ~40%**

---

### Section 3.4 — Journey Through the Universe Mode (P0 — Must Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Chapter 1 — Earth atmospheric entry | ✅ | ❌ | 0% | `useJourneyStore.ts` defines chapters; no Earth-specific reverse entry sequence |
| Chapter 2 — Solar system orbital overview | ✅ | ⚠️ | 40% | Camera flies to solar system view; no planet-by-planet highlights or narration beats |
| Chapter 3 — Sun & Heliosphere (solar wind, Voyager) | ✅ | ⚠️ | 40% | Sun exists; Oort Cloud `oortCloudPoints` in `JourneyMode.ts` serves as heliosphere proxy |
| Chapter 4 — Nearby Stars (Alpha Centauri) | ✅ | ✅ | 75% | `alphaCentauriGroup` with two star meshes in `JourneyMode.ts` |
| Chapter 5 — Milky Way (spiral arms, Sgr A*) | ✅ | ✅ | 70% | `blackHoleGroup` + nebula in deep space mode |
| Chapter 6 — Local Group (Andromeda) | ✅ | ⚠️ | 30% | No Andromeda mesh; chapter destination exists in store |
| Chapter 7 — Observable Universe (cosmic web) | ✅ | ⚠️ | 20% | `cmbHorizonMesh` exists as glowing sphere; no filament/web structure |
| Chapter 8 — Cosmic Horizon + open questions | ✅ | ⚠️ | 20% | Chapter defined in store; no narrative content or visual specific to the concept |
| Chapter selector UI with cinematic thumbnails | ✅ | ✅ | 80% | `ChapterSelector.tsx` renders chapter cards; no thumbnail previews |
| Interactive pauses every 2–3 min for exploration | ✅ | ❌ | 0% | Journey runs as continuous warp sequence |
| Discovery Card summary + share prompt | ✅ | ❌ | 0% | Not implemented |

**Section 3.4 Completion: ~36%**

---

### Section 3.5 — Live Solar System Simulation (P1 — High Priority)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Real-time planetary positions via NASA JPL Horizons | ✅ | ❌ | 0% | Orbits computed locally using Keplerian approximation only |
| Time controls (pause, play, FF, rewind) | ✅ | ✅ | 100% | `TimeController.ts` + `TimeControls.tsx` — speed multiplier, pause, date display |
| Orbital path visualization + ecliptic plane toggle | ✅ | ✅ | 90% | Orbit lines rendered; ecliptic plane toggle not yet exposed in UI |
| Active NASA/ESA mission positions overlaid | ✅ | ⚠️ | 50% | ISS + JWST tracked via `SpacecraftTracker.ts`; no other missions |
| Lagrange point visualization | ✅ | ❌ | 0% | Not implemented |

**Section 3.5 Completion: ~48%**

---

### Section 3.6 — Interactive Constellation Mapping (P1 — High Priority)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| All 88 IAU constellations with toggle line overlays | ✅ | ⚠️ | 5% | `constellations.json` has **2 entries** (Ursa Major, Orion); code handles arbitrary count |
| Geolocation-aware night sky | ✅ | ✅ | 90% | Sidereal Time + LST calculation in `App.tsx` render loop; browser Geolocation API in `ConstellationPanel.tsx` |
| Click constellation for mythology + history + key stars | ✅ | ✅ | 80% | `ConstellationPanel.tsx` renders mythology text; `constellationData` in store |
| AR mode prototype (gyroscope) | ✅ | ❌ | 0% | Not implemented |

**Section 3.6 Completion: ~44%** (data gap is the primary blocker)

---

### Section 3.7 — Exoplanet Discovery Showcase (P1 — High Priority)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| 5,000+ exoplanet interactive catalog | ✅ | ⚠️ | 2% | `exoplanets.json` has **8 entries**; NASA Exoplanet Archive API not connected |
| Visualize host stars with rendered alien landscapes | ✅ | ✅ | 80% | `ExoplanetRenderer.ts` — 4 category shaders (habitable/ocean/lava/ice) |
| Habitable zone overlay (green/amber/red) | ✅ | ✅ | 85% | `habitabilityScore` field used in `ExoplanetPanel.tsx` for classification |
| Filter/sort by detection method, distance, size, habitability | ✅ | ✅ | 75% | `ExoplanetPanel.tsx` has filter UI; limited by 8-entry dataset |

**Section 3.7 Completion: ~60%** (code quality good; data missing)

---

### Section 3.8 — Real-Time Space Mission Tracker (P1 — High Priority)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Live tracking of NASA/ESA/SpaceX/ISRO/JAXA missions | ✅ | ⚠️ | 20% | ISS via Open Notify API + fallback; JWST simulated; all others absent |
| 3D trajectory visualization | ✅ | ✅ | 75% | `SpacecraftTracker.ts` — ISS orbit line + JWST L2 communication line |
| Upcoming launch calendar + countdown timers | ✅ | ✅ | 80% | `MissionsPanel.tsx` — countdown timers in `useMissionStore.ts` with static launch data |
| Historical mission archive (Apollo, Voyager, Cassini, JWST) | ✅ | ✅ | 70% | `useMissionStore.ts` `historicalMissions` array; static data, no "timeline storytelling" |

**Section 3.8 Completion: ~61%**

---

### Section 3.9 — Ambient Audio & Soundscape (P1 — High Priority)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Original orchestral soundtrack (Hans Zimmer-inspired) | ✅ | ⚠️ | 40% | `AudioEngine.ts` generates procedural oscillator audio; **no actual orchestral audio files** |
| Adaptive audio layers by location | ✅ | ✅ | 85% | Proximity hum intensity varies with nearest planet mass + distance |
| Spatial audio for particle effects | ✅ | ✅ | 75% | Web Audio API `PannerNode` spatial positioning implemented |
| User volume controls with ambient/music mix slider | ✅ | ✅ | 90% | `AudioControls.tsx` — master/ambient/music/engine sliders |

**Section 3.9 Completion: ~73%** (procedural audio covers the feature; commissioned soundtrack is a separate production gap)

---

### Section 3.10 — Special Visual Events (P2 — Nice to Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| Procedural meteor shower (calendar-triggered) | ✅ | ✅ | 80% | `SpecialEvents.ts` — 25 meteor lines with lifecycle; calendar-date trigger in `useEventStore` |
| Supernova event simulation | ✅ | ✅ | 80% | Core mesh, glow sprite, expanding particle system implemented |
| Solar eclipse simulation | ✅ | ✅ | 75% | Earth-Moon alignment detection + corona glow in `SpecialEvents.ts` |
| Comet fly-through sequences | ✅ | ✅ | 75% | `cometGroup` with core, ion tail, and dust tail meshes |

**Section 3.10 Completion: ~78%**

---

### Section 3.11 — Exploration Achievement System (P2 — Nice to Have)

| Feature | In PRD | Implemented | Completion % | Notes |
|---------|--------|-------------|--------------|-------|
| 50+ hidden celestial discoveries | ✅ | ⚠️ | 26% | 13 achievements defined in `useAchievementStore.ts`; PRD targets 50+ |
| Achievement badges on "mission log" profile page | ✅ | ✅ | 90% | `AchievementsPanel.tsx` — badges, XP, rank progression, profile edit |
| Shareable achievement cards with social export | ✅ | ⚠️ | 40% | Modal UI exists; "copy link" is simulated (no real URL generated) |
| Leaderboard | ✅ | ❌ | 0% | Not implemented; requires backend auth + database |

**Section 3.11 Completion: ~64%**

---

## Summary by Section

| Section | PRD Priority | Completion % |
|---------|-------------|-------------|
| 3.1 Core 3D Universe Engine | P0 | **86%** |
| 3.2 Celestial Bodies & Interactivity | P0 | **47%** |
| 3.3 AI Spacecraft Guide | P0 | **40%** |
| 3.4 Journey Through Universe | P0 | **36%** |
| 3.5 Live Solar System Simulation | P1 | **48%** |
| 3.6 Constellation Mapping | P1 | **44%** |
| 3.7 Exoplanet Showcase | P1 | **60%** |
| 3.8 Mission Tracker | P1 | **61%** |
| 3.9 Audio & Soundscape | P1 | **73%** |
| 3.10 Special Visual Events | P2 | **78%** |
| 3.11 Achievement System | P2 | **64%** |
| **Weighted Average** | — | **~56%** |

---

## Partially Completed Modules

- **AI Guide** — UI is production-quality; backend is a dictionary. The gap is entirely in `apps/api/src/routes/guide.ts`.
- **Journey Mode chapters 1–4** — Visual destinations exist in the solar system; scripted cinematic sequences (narration beats, interactive pauses, discovery cards) are absent.
- **Constellation catalog** — Architecture is complete; dataset has 2 of 88 constellations.
- **Exoplanet catalog** — Architecture is complete; dataset has 8 of 5,000+ exoplanets.
- **Service Worker** — Registered and functional; cache list covers only index.html (not 3D assets, fonts, or API responses).

## Unfinished User Flows

- **Flow A (First-Time Visitor):** Landing hero ✅ → free-roam ✅ → click planet ✅ → Info panel ✅ → **Fun Facts carousel** ❌ → **AI narration** (hardcoded only)
- **Flow B (Guided Journey):** Chapter selector ✅ → warp jump ✅ → narration beats ❌ → interactive pauses ❌ → Discovery Card ❌

## Missing Edge Cases

- No handling for WebGL context loss (`webglcontextlost` event)
- No graceful degradation path for unsupported browsers
- No mobile/tablet 2D fallback renderer (PRD §4.5 specifies this)
- No network offline state handling beyond basic Service Worker
- No per-session rate limiting for AI Guide queries
