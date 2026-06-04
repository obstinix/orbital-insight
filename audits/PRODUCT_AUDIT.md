# PRODUCT_AUDIT.md — Orbital Insight
*Audit Date: June 2026 | Auditor: Senior Staff Engineer / Technical Co-founder Review*

---

## Project Vision

**Orbital Insight** is a premium, cinematic space-exploration web platform fusing AAA game-quality 3D interactivity with rigorous astronomy education. The vision: "What if learning about space felt like playing the best space game ever made?" — a browser-native experience combining *Interstellar*, *Starfield*, and a world-class science museum.

**Target Users:**
- Primary: Students aged 13–28, PC/desktop, interested in space, science, gaming
- Secondary: Educators, science communicators, planetarium professionals
- Tertiary: Casual documentary fans and space culture enthusiasts

**Core Value Proposition:** Browser-native, narrative-driven, AI-guided, accessible, and educational — a combination no competitor currently offers.

**Key Success Metrics (PRD):**
- 500,000 MAU within 12 months
- >8 min average session duration
- >45% return visitor rate within 30 days
- 60 fps on mid-range hardware, <4s initial load
- WCAG 2.1 AA compliant

---

## Current State

The repository is at **v0.1.0-alpha**, built on a Turborepo monorepo with two apps (`apps/web`, `apps/api`) and three packages (`packages/content`, `packages/shared-types`, `packages/3d-assets`).

**What exists today:**
The team has built a genuinely impressive foundation. The 3D engine, shader pipeline, UI component layer, content data, and Zustand state graph are all present and architecturally sound. Many P0 PRD features are scaffolded or partially functional. The codebase is clean TypeScript throughout with no dead code or obvious quality shortcuts.

**What is critically missing:**
- No real Claude API integration — the AI Guide is a hardcoded keyword-matching dictionary (`apps/api/src/routes/guide.ts` lines 1–70)
- No texture or 3D asset files — all planet textures referenced in JSON data (`earth_diffuse_8k.basis`, etc.) have zero corresponding files in `packages/3d-assets`
- No authentication (Clerk not integrated)
- No database (PostgreSQL/Redis not connected)
- No test suite (both `package.json` test scripts echo "No tests yet in Phase 0")
- No CI/CD pipeline (no `.github/workflows/` directory)
- ElevenLabs TTS not integrated
- NASA JPL Horizons live API not connected (orbital mechanics are simulated locally)

---

## Implementation Status

| Area | Status | Evidence |
|------|--------|----------|
| Monorepo / Turborepo setup | ✅ Complete | `turbo.json`, `package.json` workspaces |
| React 19 + TypeScript frontend | ✅ Complete | `apps/web/src/` |
| Three.js r165 renderer | ✅ Complete | `apps/web/src/engine/core/Renderer.ts` |
| Post-processing pipeline (Bloom, Vignette, Chromatic Aberration) | ✅ Complete | `Renderer.ts` — UnrealBloomPass, custom ShaderPass |
| 100,000 spectral-classified star field | ✅ Complete | `StarField.ts` — Harvard classification implemented |
| LOD system (4-level) | ✅ Complete | `Planet.ts` — LOD levels at 0/50/200/1000 |
| Atmosphere shader (Rayleigh limb glow) | ✅ Complete | `atmosphere.vert/.frag` |
| Ring systems (Saturn, Uranus) | ✅ Complete | `Planet.ts` lines 150–175 |
| Keplerian orbital mechanics | ✅ Complete | `Planet.ts` — `update()` method |
| Time controls (pause/play/fast-forward/rewind) | ✅ Complete | `TimeController.ts`, `TimeControls.tsx` |
| Black hole shader (gravitational lensing, accretion disk) | ✅ Complete | `blackhole.vert/.frag` with Doppler beaming |
| Nebula volumetric shader | ✅ Complete | `nebula.vert/.frag` |
| Warp jump sequence shader | ✅ Complete | `warp.vert/.frag`, `SpacecraftController.ts` |
| AI spacecraft guide (NOVA) chat panel | ⚠️ Partial | UI complete (`GuideChatPanel.tsx`); backend is hardcoded facts, NOT Claude API |
| Journey Mode (8 chapters) | ⚠️ Partial | `JourneyMode.ts` has deep space visuals for Ch.5–8; Ch.1–4 (solar system) logic is incomplete |
| Constellation mapper (88 IAU) | ⚠️ Partial | Data in `constellations.json` (only 2 entries visible); `ConstellationLines.ts` parses and renders; geolocation works |
| Exoplanet showcase | ⚠️ Partial | Shader renderer exists (`ExoplanetRenderer.ts`); `ExoplanetPanel.tsx` uses local JSON (only ~8 entries, not 5,000+) |
| Mission tracker | ⚠️ Partial | ISS live telemetry via Open Notify API works with fallback; JWST simulated; no SpaceX/JAXA/ISRO missions |
| Special visual events (meteor/supernova/comet/eclipse) | ⚠️ Partial | `SpecialEvents.ts` — all 4 effects scaffolded but trigger logic incomplete |
| Achievement system | ✅ Complete | 13 achievements with XP, badges, persist via Zustand |
| Landing hero cinematic sequence | ✅ Complete | `LandingHero.tsx` — letter-by-letter reveal, phases, audio unlock |
| Procedural audio engine | ✅ Complete | `AudioEngine.ts` — 3 layers (ambient, proximity, engine) via Web Audio API |
| Service Worker / offline mode | ⚠️ Partial | `sw.js` exists with cache-first strategy; cache list is minimal (only `/`, `/index.html`) |
| Keyboard shortcuts | ✅ Complete | `useKeyboardShortcuts.ts` — number keys 1–6, `?` help panel |
| Design system / tokens | ✅ Complete | `tokens.css` — full color palette, motion curves, z-index layers |
| Planet texture files (`.basis` assets) | ❌ Missing | Referenced in all 10 JSON files; `packages/3d-assets/` is empty |
| Authentication (Clerk) | ❌ Missing | Not integrated; `useAccountStore.ts` is local-only localStorage |
| Database (PostgreSQL + Redis) | ❌ Missing | `DATABASE_URL`/`REDIS_URL` in `.env.example` but never consumed |
| Real Claude API for AI Guide | ❌ Missing | `ANTHROPIC_API_KEY` in `.env.example`; `guide.ts` uses dictionary matching only |
| ElevenLabs TTS | ❌ Missing | `ELEVENLABS_API_KEY` in `.env.example`; no TTS calls anywhere |
| NASA JPL Horizons live API | ❌ Missing | Orbits computed locally; no Horizons API calls |
| CI/CD pipeline | ❌ Missing | No `.github/workflows/` directory |
| Test suite (Vitest/Playwright) | ❌ Missing | Both `package.json` test scripts are placeholder echoes |
| Datadog / Sentry monitoring | ❌ Missing | No monitoring SDK integrated |
| Cloudflare R2 CDN | ❌ Missing | Credentials in `.env.example`; no upload or fetch logic |

---

## Feature Coverage %

| PRD Priority | Features Defined | Fully Implemented | Partially Implemented | Not Started |
|---|---|---|---|---|
| P0 (Must Have) | 9 feature groups | 4 | 4 | 1 |
| P1 (High Priority) | 7 feature groups | 0 | 5 | 2 |
| P2 (Nice to Have) | 2 feature groups | 0 | 1 | 1 |

**Overall Feature Coverage: ~38%** (P0 partial completeness: ~60%; P1: ~35%; P2: ~20%)

**PRD Alignment: ~42%** — Strong architectural alignment, deep implementation gaps.

---

## Missing Capabilities

1. **All 3D planet textures** — The most visually critical gap. Every planet uses `MeshStandardMaterial` with a fallback color. Basis Universal `.basis` files are referenced but absent.
2. **Real AI narration** — NOVA is currently a keyword-matching chatbot, not a Claude-powered assistant. The `ANTHROPIC_API_KEY` is configured but never used.
3. **Voice output (ElevenLabs TTS)** — Silent NOVA defeats the "spacecraft guide" narrative experience.
4. **User accounts** — No auth; progress is localStorage only. Leaderboards and social sharing are cosmetic.
5. **5,000+ exoplanet catalog** — Only 8 exoplanets in `exoplanets.json`. NASA Exoplanet Archive integration is absent.
6. **88 constellation catalog** — Only 2 entries (`ursa_major`, `orion`) in `constellations.json`.
7. **Live NASA data** — JPL Horizons, APOD, SpaceTrack.org not connected.
8. **Journey Mode chapters 1–4** — The solar system chapter logic in `JourneyMode.ts` defers to the global solar system scene rather than the scripted cinematic sequences described in the PRD.
9. **Scientific content panels** — `InfoPanel.tsx` exists but no rich "Fun Facts carousel" or deep-dive educational module links.
10. **AR mode, VR/WebXR** — Not started.

---

## Technical Risks

- **Asset delivery pipeline** — No CDN, no asset pipeline, no Draco/Basis loader configured. Planet textures are the #1 visual blocker.
- **API hardcoding** — `AIGuide.ts` hardcodes `http://localhost:3000`. In production this will break immediately.
- **CORS wildcard** — `server.ts` sets `origin: true` (allow all). Must be locked down before production.
- **No error boundaries** — The React tree has no `ErrorBoundary`. A WebGL context loss or API failure can crash the entire app.
- **No environment separation** — `VITE_ENV` token exists but no conditional logic differentiates dev/staging/production behaviors.

## Business Risks

- **Time to visual WOW** — Without textures, the first-time visitor experience is procedurally colored spheres rather than photorealistic planets. This risks immediate abandonment.
- **AI guide is broken for production** — Hardcoded responses violate the core PRD narrative experience and will be immediately noticed by any sophisticated user.
- **No analytics** — Zero instrumentation means the team cannot measure session length, funnel drop-off, or achievement completion — all PRD KPIs.
- **Scope vs. timeline** — The PRD estimates 36 weeks for a team of 8. The current state looks like Phase 0–early Phase 1 output from a smaller team. Timeline risk is high.
