# TECHNICAL_DEBT.md — Orbital Insight
*Source: Full repository scan — June 2026*

---

## Overview

**Good news:** The codebase has zero TODO/FIXME/HACK/WIP comments. TypeScript strict mode is enforced everywhere. No dead code, no duplicate logic. This is unusually clean for an early-stage project.

**The real debt** is structural: incomplete integrations, placeholder implementations disguised as real features, and missing infrastructure layers.

---

## Category 1: Hardcoded Placeholder Implementations

### 1.1 — AI Guide is a Dictionary, Not Claude API
**File:** `apps/api/src/routes/guide.ts` — entire file  
**Debt:** `PLANET_FACTS` is a static `Record<string, {...}>` dictionary with 10 planets × 4 topics. The `guide.ts` route does keyword matching on `message.toLowerCase()` and returns one of 4 canned responses. The `ANTHROPIC_API_KEY` in `.env.example` is never read anywhere in the codebase.  
**Impact:** Core PRD feature (§3.3) is non-functional. Users asking "What's the largest volcano on Mars?" get the generic atmosphere response.  
**Fix:** Replace with streaming Anthropic SDK call, inject `SceneContext` as system prompt.

### 1.2 — ISS API Hardcodes `http://localhost:3000`
**File:** `apps/web/src/ui/MissionsPanel.tsx` line ~35, `apps/web/src/spacecraft/AIGuide.ts` line ~20  
**Debt:** Both files hardcode `http://localhost:3000` as the API base URL. Vite dev proxy (`vite.config.ts`) proxies `/api` correctly in dev, but the hardcoded full URL bypasses this and will fail in any non-local environment.  
**Fix:** Use `import.meta.env.VITE_API_URL` + relative `/api` prefix.

### 1.3 — Share Achievement is Simulated
**File:** `apps/web/src/ui/AchievementsPanel.tsx` — `handleShareLog()`  
**Debt:** The share function sets a `shareSuccess` flag after a `setTimeout` but copies nothing to clipboard and generates no real shareable URL. No backend user identity exists to generate a link.  
**Fix:** Requires user auth + backend link generation endpoint.

### 1.4 — Launch Calendar Uses Static Future Dates
**File:** `apps/web/src/store/useMissionStore.ts`  
**Debt:** Launch dates are hardcoded static strings. No SpaceX, NASA, or SpaceDevilAgency API is consulted.  
**Fix:** Integrate RocketLaunch.live API or NASA OTIS for real upcoming launch data.

---

## Category 2: Missing Asset Pipeline

### 2.1 — Zero 3D Texture Assets
**Directory:** `packages/3d-assets/` — `package.json` only, no asset files  
**Debt:** All 10 planet JSON files reference `.basis` texture paths (e.g. `earth_diffuse_8k.basis`, `saturn_rings.basis`). These files don't exist anywhere in the repo. The `PlanetConfig.textures` TypeScript interface is defined but the `Planet.ts` constructor creates `MeshStandardMaterial` with only a fallback color — texture loading code is entirely absent.  
**Impact:** All planets render as flat-colored spheres. This is the #1 visual gap from the PRD.

### 2.2 — No Draco/Basis Loader Configured
**File:** `apps/web/vite.config.ts`  
**Debt:** The PRD specifies GLTF 2.0 with Draco compression and Basis Universal textures (§4.1). No `DRACOLoader` or `KTX2Loader` is imported or configured anywhere in the engine.  
**Fix:** Install `three/examples/jsm/loaders/DRACOLoader` and `KTX2Loader`; configure Draco WASM path via Vite's `public/` folder.

### 2.3 — No GLTF Spacecraft Model
**File:** `apps/web/src/spacecraft/SpacecraftController.ts` — `createSpacecraftMesh()`  
**Debt:** The spacecraft is built from `ConeGeometry`, `CylinderGeometry`, and `BoxGeometry` primitives. PRD §3.3 specifies "fully rigged 3D spacecraft" authored in Blender as GLTF 2.0.  
**Fix:** Create or source GLTF spacecraft asset; load via `GLTFLoader`; replace programmatic mesh.

---

## Category 3: Infrastructure Gaps

### 3.1 — No Test Suite
**Files:** `apps/web/package.json` test script: `echo 'No tests yet in Phase 0'`; `apps/api/package.json` identical  
**Debt:** Zero unit tests, zero integration tests, zero E2E tests. PRD §4.4 specifies Vitest, Playwright, Storybook, and Lighthouse CI.

### 3.2 — No CI/CD Pipeline
**Finding:** No `.github/` directory exists in the repository.  
**Debt:** No automated builds, no automated test runs, no Lighthouse audit, no deployment pipeline. All deployments are manual.

### 3.3 — No Database Connection
**Files:** `apps/api/src/server.ts` — no database client imported; `.env.example` has `DATABASE_URL` and `REDIS_URL`  
**Debt:** PostgreSQL and Redis are specified in PRD §4.3 and `.env.example` but zero database calls exist anywhere. All state is client-side localStorage.

### 3.4 — No Monitoring or Error Tracking
**Finding:** No Datadog, Sentry, or LogRocket SDK anywhere in the codebase.  
**Debt:** The platform has no observability. If something breaks in production, there is no alert, no breadcrumb, no session replay.

### 3.5 — Service Worker Caches Only Two URLs
**File:** `apps/web/public/sw.js` — `ASSETS_TO_CACHE` array  
**Debt:** Only `'/'` and `'/index.html'` are pre-cached. The PRD §4.5 specifies "Service Worker caches core assets; offline mode preserves last-visited state." No 3D assets, fonts, or API responses are cached offline.

---

## Category 4: Security Debt

### 4.1 — CORS Allows All Origins
**File:** `apps/api/src/server.ts` line ~26: `origin: true`  
**Debt:** Any domain can make cross-origin requests to the API. Must be locked to the production frontend domain before launch.

### 4.2 — No API Key Validation Middleware
**File:** `apps/api/src/routes/guide.ts`  
**Debt:** The `/api/guide` endpoint has no authentication check. Any caller can invoke it indefinitely. Token cost from Claude API (once integrated) could be unbounded.  
**Fix:** Require session token (Clerk JWT) on guarded routes; enforce per-session token budget.

### 4.3 — `process.env` Not Validated at Startup
**File:** `apps/api/src/server.ts`  
**Debt:** No `zod` or `envalid` schema validates required environment variables at boot. If `ANTHROPIC_API_KEY` is missing, the server will start successfully and fail silently at the first API call.

---

## Category 5: Code Quality Observations (Minor)

### 5.1 — `constellations.json` Only Has 2 Entries
**File:** `packages/content/constellations.json`  
**Finding:** Only `ursa_major` and `orion` present. The PRD requires 88. The code handles arbitrary count correctly — this is a content debt, not a code debt.

### 5.2 — `exoplanets.json` Only Has 8 Entries
**File:** `packages/content/exoplanets.json`  
**Finding:** 8 hand-crafted entries present. PRD requires 5,000+ from NASA Exoplanet Archive. Content debt.

### 5.3 — `packages/3d-assets/package.json` Is Empty
**File:** `packages/3d-assets/package.json`  
**Finding:** Contains only `{ "name": "@orbital-insight/3d-assets", "version": "0.1.0" }`. No asset files, no loader scripts. The package is a placeholder.

### 5.4 — `window.confirm()` for Dangerous Reset Action
**File:** `apps/web/src/ui/AchievementsPanel.tsx` line ~48  
**Finding:** Achievement reset uses native browser `window.confirm()`. This is inconsistent with the custom HUD design language and inaccessible.  
**Fix:** Replace with a custom modal dialog matching the glassmorphism panel design system.

---

## Technical Debt Summary

| Category | Count | Severity |
|---|---|---|
| Hardcoded placeholders | 4 | 🔴 Critical |
| Missing asset pipeline | 3 | 🔴 Critical |
| Infrastructure gaps | 5 | 🔴 Critical |
| Security debt | 3 | 🟠 High |
| Code quality (minor) | 4 | 🟡 Medium |

**Total tracked items: 19**

**Estimated remediation effort:** 14–20 engineering weeks for a single full-stack engineer, or 6–8 weeks for a team of 3 working in parallel.
