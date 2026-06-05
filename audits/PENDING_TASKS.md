# PENDING_TASKS.md — Orbital Insight
*Full Engineering Backlog — June 2026*

---

## 🔴 CRITICAL — Blocking Production Launch

### T-001: [COMPLETED] Wire Real Claude API into AI Guide Backend
**Description:** Replace the keyword-dictionary in `apps/api/src/routes/guide.ts` with a real streaming call to the Anthropic Claude API. Inject `SceneContext` (current planet, chapter, camera position) as the system prompt for context-aware narration.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/api/src/routes/guide.ts`, `packages/shared-types/index.ts`  
**Dependencies:** `ANTHROPIC_API_KEY` available in environment  
**Priority:** P0

### T-002: [COMPLETED] Create Planet Texture Asset Pipeline
**Description:** Acquire or generate Basis Universal (`.basis`) textures for all 10 celestial bodies. Implement `KTX2Loader` in the Three.js renderer. Add texture loading to `Planet.ts` constructor. Set up Cloudflare R2 bucket for CDN delivery.  
**Estimated Effort:** 5–7 days (including asset preparation)  
**Files Affected:** `apps/web/src/engine/bodies/Planet.ts`, `packages/3d-assets/`, `apps/web/vite.config.ts`, new `apps/web/src/engine/loaders/TextureLoader.ts`  
**Dependencies:** T-009 (CDN setup), Basis Universal textures from NASA/ESA public domain  
**Priority:** P0

### T-003: [COMPLETED] Fix Hardcoded localhost API URLs
**Description:** Replace `http://localhost:3000` in `AIGuide.ts` and `MissionsPanel.tsx` with `import.meta.env.VITE_API_URL` to support staging and production deployments.  
**Estimated Effort:** 2 hours  
**Files Affected:** `apps/web/src/spacecraft/AIGuide.ts` line ~20, `apps/web/src/ui/MissionsPanel.tsx` line ~35  
**Dependencies:** None  
**Priority:** P0

### T-004: [COMPLETED] Lock CORS to Production Domain
**Description:** Replace `origin: true` with an allowlist of production/staging domains. Add `NODE_ENV`-based switching.  
**Estimated Effort:** 1 hour  
**Files Affected:** `apps/api/src/server.ts`  
**Dependencies:** Production domain finalized  
**Priority:** P0

### T-005: [COMPLETED] Add Authentication to Guide Endpoint
**Description:** Integrate Clerk JWT verification as a Fastify preHandler hook. Require valid session token on `/api/guide`. Enforce per-user daily token budget stored in Redis.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/api/src/server.ts`, `apps/api/src/routes/guide.ts`, new `apps/api/src/middleware/auth.ts`  
**Dependencies:** T-012 (Clerk integration), T-013 (Redis setup)  
**Priority:** P0

### T-006: [COMPLETED] Add React ErrorBoundary to Engine and Panels
**Description:** Wrap `<ThreeCanvas>`, `<GuideChatPanel>`, and all lazy-loaded route panels with `<ErrorBoundary>` components that render graceful HUD fallbacks instead of unmounting the entire app.  
**Estimated Effort:** 1 day  
**Files Affected:** `apps/web/src/App.tsx`  
**Dependencies:** None  
**Priority:** P0

### T-007: [COMPLETED] Handle WebGL Context Loss
**Description:** Listen for `webglcontextlost` and `webglcontextrestored` events on the canvas. On loss, display a HUD overlay. On restore, reinitialize the renderer and reload assets.  
**Estimated Effort:** 1–2 days  
**Files Affected:** `apps/web/src/App.tsx` (ThreeCanvas component), `apps/web/src/engine/core/Renderer.ts`  
**Dependencies:** None  
**Priority:** P0

### T-008: [COMPLETED] Set Up GitHub Actions CI/CD Pipeline
**Description:** Create `.github/workflows/ci.yml` with jobs for lint, typecheck, build, and Lighthouse audit. Add `.github/workflows/deploy.yml` for Vercel preview deployments on PR and production deployment on `main` merge.  
**Estimated Effort:** 2–3 days  
**Files Affected:** New `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`  
**Dependencies:** None  
**Priority:** P0

---

## 🟠 HIGH PRIORITY — Major Feature or Architecture Gaps

### T-009: Implement Cloudflare R2 Asset CDN
**Description:** Build asset upload script for `packages/3d-assets/`. Configure Vite to reference assets via `VITE_CDN_BASE_URL`. Set up Cloudflare R2 bucket, access policies, and cache TTLs.  
**Estimated Effort:** 2–3 days  
**Files Affected:** New `scripts/upload-assets.ts`, `apps/web/vite.config.ts`, `.env.example`  
**Priority:** P1

### T-010: [COMPLETED] Configure Draco Loader and GLTF Pipeline
**Description:** Install and configure `DRACOLoader` and `KTX2Loader` from Three.js examples. Copy WASM binaries to `apps/web/public/draco/` and `apps/web/public/basis/`. Create an `AssetManager.ts` utility for caching loaded geometries and textures.  
**Estimated Effort:** 2 days  
**Files Affected:** `apps/web/src/engine/core/`, new `apps/web/src/engine/loaders/AssetManager.ts`, `apps/web/public/`  
**Priority:** P1

### T-011: [COMPLETED] Complete Constellation Data (88 IAU)
**Description:** Expand `packages/content/constellations.json` from 2 entries to all 88 IAU constellations with RA/Dec coordinates, connection lines, mythology, and key star names.  
**Estimated Effort:** 3–4 days (data wrangling + validation)  
**Files Affected:** `packages/content/constellations.json`  
**Priority:** P1

### T-012: [COMPLETED] Integrate Clerk Authentication
**Description:** Install `@clerk/react` in frontend; add `<ClerkProvider>` to App root; create login/logout UI in the navigation panel; wire Clerk JWT to API requests for authenticated endpoints.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/web/src/App.tsx`, `apps/web/src/ui/LeftNavigationPanel`, new `apps/web/src/ui/AccountButton.tsx`  
**Priority:** P1

### T-013: [COMPLETED] Set Up PostgreSQL + Redis
**Description:** Add `@fastify/postgres` or `drizzle-orm` ORM; create initial schema for users, achievements, and sessions; configure Redis client for session caching and rate limiting.  
**Estimated Effort:** 4–5 days  
**Files Affected:** `apps/api/src/server.ts`, new `apps/api/src/db/schema.ts`, `apps/api/src/db/client.ts`  
**Priority:** P1

### T-014: [COMPLETED] NASA Exoplanet Archive Integration (5,000+)
**Description:** Build a data fetch script that pulls from the NASA Exoplanet Archive TAP API. Process and store in PostgreSQL. Serve via `/api/exoplanets` endpoint with pagination, filtering, and sorting.  
**Estimated Effort:** 4–5 days  
**Files Affected:** New `scripts/seed-exoplanets.ts`, `apps/api/src/routes/exoplanets.ts`, `apps/web/src/store/useExoplanetStore.ts`  
**Priority:** P1

### T-015: [COMPLETED] Complete Journey Mode Chapters 1–4
**Description:** Implement scripted camera sequences, narration beat triggers, and interactive pause waypoints for Chapters 1 (Earth atmospheric entry), 2 (Solar system flyover), 3 (Sun/Heliosphere), and 4 (Alpha Centauri approach).  
**Estimated Effort:** 6–8 days  
**Files Affected:** `apps/web/src/modes/JourneyMode.ts`, `apps/web/src/store/useJourneyStore.ts`  
**Priority:** P1

### T-016: [COMPLETED] Integrate Sentry Error Tracking
**Description:** Install `@sentry/react` and `@sentry/node`. Initialize in frontend `main.tsx` and API `server.ts`. Add custom context for 3D engine state on error capture.  
**Estimated Effort:** 1 day  
**Files Affected:** `apps/web/src/main.tsx`, `apps/api/src/server.ts`  
**Priority:** P1

### T-017: [COMPLETED] Integrate ElevenLabs TTS for NOVA Voice
**Description:** Build a `/api/guide/voice` endpoint that sends guide text to ElevenLabs and streams audio back. Play via Howler.js in `GuideChatPanel.tsx`. Add mute toggle.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/api/src/routes/guide.ts`, `apps/web/src/ui/GuideChatPanel.tsx`, `apps/web/src/engine/audio/AudioEngine.ts`  
**Priority:** P1

### T-018: [COMPLETED] Add Environment Variable Startup Validation
**Description:** Use `zod` to define a schema of required env vars. Validate at server boot and fail fast with clear error messages.  
**Estimated Effort:** 4 hours  
**Files Affected:** `apps/api/src/server.ts`, new `apps/api/src/config/env.ts`  
**Priority:** P1

### T-019: [COMPLETED] InfoPanel — Fun Facts Carousel + Educational Links
**Description:** Implement the "Fun Facts carousel with rich multimedia" from PRD §3.2. Add rotating interesting facts for each planet sourced from `PlanetConfig.facts.url`. Render link to NASA deep-dive page.  
**Estimated Effort:** 2–3 days  
**Files Affected:** `apps/web/src/ui/InfoPanel.tsx`, `packages/content/solar-system/*.json`  
**Priority:** P1

### T-020: Write Test Suite Foundation
**Description:** Set up Vitest for unit tests. Create tests for `Planet.ts` orbital mechanics, `TimeController.ts`, `AudioEngine.ts` layer management, and Zustand store logic. Set up Playwright E2E for critical user flows.  
**Estimated Effort:** 5–7 days  
**Files Affected:** New `apps/web/src/**/*.test.ts`, `apps/api/src/**/*.test.ts`, `playwright.config.ts`  
**Priority:** P1

---

## 🟡 MEDIUM PRIORITY — Enhancements and Improvements

### T-021: [COMPLETED] GLTF Spacecraft Model from Blender
**Description:** Source or author a Blender spacecraft model. Export as GLTF 2.0 with Draco compression. Replace programmatic `createSpacecraftMesh()` geometry with loaded GLTF.  
**Estimated Effort:** 5–10 days (3D art work)  
**Files Affected:** `apps/web/src/spacecraft/SpacecraftController.ts`, `packages/3d-assets/`  
**Priority:** P2

### T-022: [COMPLETED] Jupiter and Saturn Moon Renderers
**Description:** Implement visual rendering for Europa, Ganymede, Callisto, Io, Titan, Enceladus as separate orbital bodies attached to their parent planet groups.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/web/src/engine/bodies/SolarSystem.ts`, `packages/content/solar-system/`  
**Priority:** P2

### T-023: Sun CME Particle Effects
**Description:** Implement GPU particle system for coronal mass ejection bursts and solar wind particles streaming from the Sun's surface.  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/web/src/engine/bodies/SolarSystem.ts`, new `apps/web/src/engine/shaders/solar_wind.*`  
**Priority:** P2

### T-024: NASA JPL Horizons Live Ephemeris
**Description:** Integrate JPL Horizons API for precise real-time planetary positions. Cache with 1-hour TTL on the backend. Replace local Keplerian approximation as an optional "high-accuracy mode."  
**Estimated Effort:** 3–4 days  
**Files Affected:** `apps/api/src/routes/ephemeris.ts` (new), `apps/web/src/store/usePlanetStore.ts`  
**Priority:** P2

### T-025: [COMPLETED] Lagrange Point Visualization
**Description:** Render L1, L2, L3, L4, L5 Lagrange points for Earth-Sun and Earth-Moon systems as toggleable markers in the solar system view.  
**Estimated Effort:** 2 days  
**Files Affected:** `apps/web/src/engine/bodies/SolarSystem.ts`, new `apps/web/src/engine/bodies/LagrangePoints.ts`  
**Priority:** P2

### T-026: Mobile 2D Fallback Renderer
**Description:** Implement `isMobile` detection at startup. For devices without WebGL 2.0 or on mobile, render a simplified 2D canvas or SVG solar system view as the PRD §4.5 specifies.  
**Estimated Effort:** 4–5 days  
**Files Affected:** `apps/web/src/App.tsx`, new `apps/web/src/engine/FallbackRenderer.tsx`  
**Priority:** P2

### T-027: Expand Achievement System to 50+
**Description:** Design and implement 37+ additional achievements: first warp, each planet visited, specific query to NOVA, time warp to future date, etc.  
**Estimated Effort:** 2–3 days  
**Files Affected:** `apps/web/src/store/useAchievementStore.ts`, `App.tsx` achievement trigger hooks  
**Priority:** P2

### T-028: [COMPLETED] Replace `window.confirm()` with Custom Modal
**Description:** Replace the native browser confirm dialog in `AchievementsPanel.tsx` with a custom modal matching the glassmorphism HUD design system.  
**Estimated Effort:** 4 hours  
**Files Affected:** `apps/web/src/ui/AchievementsPanel.tsx`, new `apps/web/src/ui/ConfirmModal.tsx`  
**Priority:** P2

### T-029: [COMPLETED] Service Worker — Comprehensive Asset Caching
**Description:** Expand `ASSETS_TO_CACHE` in `sw.js` to include fonts, content JSON, and core 3D assets. Implement stale-while-revalidate strategy for API responses.  
**Estimated Effort:** 1 day  
**Files Affected:** `apps/web/public/sw.js`  
**Priority:** P2

---

## 🟢 LOW PRIORITY — Nice to Have

### T-030: AR Mode (Device Gyroscope Overlay)
**Description:** Prototype gyroscope-based AR constellation viewing for mobile/tablet per PRD §3.6.  
**Estimated Effort:** 5–7 days  
**Priority:** P3

### T-031: Leaderboard (Top Explorers)
**Description:** Backend leaderboard endpoint ranking users by discovery count and XP. Frontend panel within AchievementsPanel.  
**Estimated Effort:** 3–4 days (requires T-012, T-013)  
**Priority:** P3

### T-032: APOD (Astronomy Picture of the Day) Widget
**Description:** Fetch NASA APOD API and display as a rotating "Living Universe" feature in the main HUD or a dedicated panel.  
**Estimated Effort:** 1–2 days  
**Priority:** P3

### T-033: Discovery Card Share Flow
**Description:** Generate a real shareable URL for completed journey chapters and achievements. Implement OG meta image generation for social sharing.  
**Estimated Effort:** 3–4 days (requires T-012, T-013)  
**Priority:** P3

### T-034: Real Upcoming Launch Data (RocketLaunch.live API)
**Description:** Replace static launch array in `useMissionStore.ts` with live data from RocketLaunch.live or The Space Devs API.  
**Estimated Effort:** 1–2 days  
**Priority:** P3

### T-035: WebXR/VR Mode Prototype
**Description:** Implement WebXR session for VR headset users (PRD post-v1 roadmap item).  
**Estimated Effort:** 10–15 days  
**Priority:** P4
