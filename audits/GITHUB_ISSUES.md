# GITHUB_ISSUES.md — Orbital Insight
*Ready-to-create issue drafts — June 2026*

---

## 🔴 BUG

---

### ISSUE-001: [RESOLVED] AI Guide Returns Hardcoded Responses Instead of Claude API

**Title:** `[BUG] AI Guide (NOVA) uses hardcoded keyword dictionary instead of Claude API`

**Problem:**
The `/api/guide` endpoint (`apps/api/src/routes/guide.ts`) is a keyword-matching dictionary with 10 planet × 4 topic combinations. It does not call the Anthropic Claude API despite `ANTHROPIC_API_KEY` being configured in `.env.example`.

**Current Behaviour:**
- Asking "What's the tallest mountain on Mars?" returns the generic Mars overview text
- Asking "Compare Venus and Earth atmospheres" returns the Venus atmosphere text
- Any question beyond 4 keyword patterns returns the `overview` fallback
- Responses are identical for all users every time

**Expected Behaviour:**
- NOVA responds to any natural language astronomy question using Claude API streaming
- Response is informed by current scene context (selected planet, journey chapter, camera position)
- Conversational memory is maintained within a session
- Response cites NASA/arXiv sources where appropriate (per PRD §6.3)

**Acceptance Criteria:**
- [ ] `ANTHROPIC_API_KEY` is read from environment and used
- [ ] `SceneContext` object is serialized into the system prompt
- [ ] Response streams via SSE (existing client-side SSE reader in `AIGuide.ts` already works)
- [ ] Per-session token budget enforced (configurable, default 4,000 tokens/session)
- [ ] Fallback to best-effort cached response if API unavailable

**Technical Notes:**
- Client SSE reader already implemented in `AIGuide.ts` — no frontend changes needed
- Anthropic SDK streaming: `anthropic.messages.stream()` → pipe to Fastify SSE reply
- Inject `SceneContext` type from `packages/shared-types/index.ts`

**Labels:** `bug` `p0` `ai-guide` `backend`
**Priority:** Critical
**Milestone:** Phase 1 — Launch Readiness
**Suggested Assignee Area:** Backend Engineer

---

### ISSUE-002: [RESOLVED] Hardcoded `localhost:3000` Breaks All Non-Local Deployments

**Title:** `[BUG] API base URL hardcoded to localhost:3000 in two frontend files`

**Problem:**
`apps/web/src/spacecraft/AIGuide.ts` (line ~20) and `apps/web/src/ui/MissionsPanel.tsx` (line ~35) both contain `fetch('http://localhost:3000/api/...')`.

**Current Behaviour:**
- Application works correctly in local development
- All API calls fail on Vercel preview, staging, and production deployments with network errors
- Error message shown to user: `[COMMUNICATION ERROR]: System failed to link with guidance relay. Failed to fetch.`

**Expected Behaviour:**
- API base URL reads from `import.meta.env.VITE_API_URL` environment variable
- Falls back gracefully to `/api` relative path (Vite proxy handles it in dev)

**Acceptance Criteria:**
- [ ] Both files replaced with `const API_BASE = import.meta.env.VITE_API_URL || '';`
- [ ] `VITE_API_URL` documented in `.env.example` with production value format

**Labels:** `bug` `p0` `frontend` `deployment`
**Priority:** Critical
**Milestone:** Phase 1 — Launch Readiness

---

### ISSUE-003: [RESOLVED] No Texture Files — All Planets Render as Flat Colored Spheres

**Title:** `[BUG] Planet texture assets missing — PlanetConfig references .basis files that don't exist`

**Problem:**
All 10 `packages/content/solar-system/*.json` files reference Basis Universal texture paths (e.g. `earth_diffuse_8k.basis`). `packages/3d-assets/` contains only a `package.json`. `Planet.ts` creates `MeshStandardMaterial` with a fallback color — there is no texture loading code.

**Current Behaviour:**
- Earth renders as a grey-blue sphere
- Mars renders as a red sphere
- Saturn renders as a yellow sphere with no surface detail
- No clouds, no normal maps, no specular highlights

**Expected Behaviour:**
- Photorealistic planet textures as described in PRD §3.2
- Progressive texture loading: low-res placeholder → high-res on demand

**Acceptance Criteria:**
- [ ] `KTX2Loader` configured in Vite + `AssetManager.ts` utility
- [ ] At minimum, Earth and Mars have diffuse + normal textures
- [ ] Textures served from Cloudflare R2 CDN
- [ ] 60fps maintained during texture streaming

**Labels:** `bug` `p0` `3d-engine` `assets`
**Priority:** Critical
**Milestone:** Phase 1 — Launch Readiness

---

## 🔒 SECURITY

---

### ISSUE-004: [RESOLVED] CORS Policy Allows All Origins

**Title:** `[SECURITY] API CORS policy set to origin:true — allows any domain`

**Problem:**
`apps/api/src/server.ts` configures `@fastify/cors` with `origin: true`.

**Current Behaviour:**
- Any website can make cross-origin requests to the Orbital Insight API
- Enables CSRF-style attacks and unauthorized API consumption

**Acceptance Criteria:**
- [ ] CORS origin restricted to production domain + staging subdomain
- [ ] `NODE_ENV`-based allowlist (include `localhost:5173` in dev only)
- [ ] Preflight OPTIONS requests handled correctly

**Labels:** `security` `p0` `backend`
**Priority:** Critical

---

### ISSUE-005: [RESOLVED] AI Guide Endpoint Has No Authentication

**Title:** `[SECURITY] /api/guide endpoint is unauthenticated — unlimited free Claude API access`

**Problem:**
`/api/guide` is a public POST endpoint with no auth. Once Claude API is wired in (ISSUE-001), any bot can call it indefinitely, creating unbounded API costs.

**Acceptance Criteria:**
- [ ] Clerk JWT preHandler validates session token
- [ ] Unauthenticated requests return `401 Unauthorized`
- [ ] Per-user daily token budget tracked in Redis
- [ ] Admin override endpoint for budget configuration

**Labels:** `security` `p0` `backend` `ai-guide`
**Priority:** Critical

---

## ✨ FEATURE

---

### ISSUE-006: [RESOLVED] ElevenLabs TTS Voice for NOVA Spacecraft Guide

**Title:** `[FEATURE] Integrate ElevenLabs TTS to give NOVA an audible voice`

**Problem:**
The PRD (§4.3, §3.3) specifies a voiced spacecraft guide using ElevenLabs TTS. Currently, NOVA is text-only.

**Expected Behaviour:**
- NOVA's responses are spoken aloud via ElevenLabs streaming TTS
- Voice plays through Howler.js spatial audio
- User can toggle voice on/off independently of other audio
- Voice tone reflects state (excited near a discovery, measured during narration)

**Acceptance Criteria:**
- [ ] `/api/guide/voice` streams ElevenLabs audio for each guide response
- [ ] Voice playback controlled by `useAudioStore` voice toggle
- [ ] Graceful fallback to text-only if ElevenLabs API unavailable

**Labels:** `feature` `p1` `ai-guide` `audio`
**Milestone:** Phase 2

---

### ISSUE-007: [RESOLVED] Expand Constellation Dataset to All 88 IAU Constellations

**Title:** `[FEATURE] Add all 88 IAU constellations to constellation catalog`

**Problem:**
`packages/content/constellations.json` contains only 2 constellations (Ursa Major, Orion). The PRD requires all 88.

**Acceptance Criteria:**
- [ ] All 88 IAU constellations present with RA/Dec star positions
- [ ] Connection lines for each constellation
- [ ] Mythology + abbreviation + key star names for all
- [ ] Data validated against IAU catalog

**Labels:** `feature` `p1` `content` `constellation`
**Milestone:** Phase 2

---

### ISSUE-008: [RESOLVED] Expand Exoplanet Catalog to 5,000+ from NASA Archive

**Title:** `[FEATURE] Integrate NASA Exoplanet Archive API for full 5,000+ catalog`

**Problem:**
`packages/content/exoplanets.json` has 8 hand-crafted entries. The PRD requires 5,000+ from NASA's Exoplanet Archive.

**Acceptance Criteria:**
- [ ] Data ingestion script fetches from NASA Exoplanet Archive TAP API
- [ ] Stored in PostgreSQL with indexed fields (distance, mass, radius, method, habitability)
- [ ] `/api/exoplanets` endpoint with pagination + filter/sort
- [ ] Frontend store updated to use API rather than local JSON

**Labels:** `feature` `p1` `content` `exoplanets` `backend`
**Milestone:** Phase 2

---

### ISSUE-009: [RESOLVED] Journey Mode — Scripted Cinematic Sequences for Chapters 1–4

**Title:** `[FEATURE] Implement scripted camera sequences and narration beats for Journey chapters 1–4`

**Problem:**
Journey Chapters 1 (Earth), 2 (Solar System), 3 (Sun/Heliosphere), and 4 (Nearby Stars) warp to destinations but have no scripted cinematic sequences, narration triggers, or interactive pauses.

**Acceptance Criteria:**
- [ ] Chapter 1: Atmospheric entry reverse sequence (zooming out from Earth's surface)
- [ ] Chapter 2: Planet-by-planet camera arc with info highlights
- [ ] Chapter 3: Solar wind particle effect + Voyager position marker
- [ ] Chapter 4: Alpha Centauri binary approach sequence
- [ ] Each chapter has 2–3 interactive pause waypoints (NOVA comment + user can click explore)
- [ ] Discovery Card summary at chapter end

**Labels:** `feature` `p0` `journey-mode` `3d-engine`
**Milestone:** Phase 2

---

### ISSUE-010: [RESOLVED] Implement Clerk Authentication + User Profiles

**Title:** `[FEATURE] Integrate Clerk for OAuth user accounts and cross-device persistence`

**Problem:**
User progress (achievements, XP, rank) is currently stored in browser localStorage only. No cross-device sync, leaderboards, or social sharing.

**Acceptance Criteria:**
- [ ] Clerk `<SignIn>` / `<SignOut>` in left navigation panel
- [ ] JWT passed to API for authenticated routes
- [ ] User profile synced to PostgreSQL on first sign-in
- [ ] Achievements and XP synced to server on unlock
- [ ] Graceful anonymous mode for users who decline to sign in

**Labels:** `feature` `p1` `auth` `backend`
**Milestone:** Phase 2

---

### ISSUE-011: [RESOLVED] CI/CD Pipeline with GitHub Actions

**Title:** `[DEVOPS] Create GitHub Actions CI pipeline for lint, typecheck, build, and preview deploy`

**Problem:**
There is no `.github/` directory. No automated quality gates exist.

**Acceptance Criteria:**
- [ ] `ci.yml`: Run on every PR — lint, typecheck, build for both `apps/web` and `apps/api`
- [ ] `deploy.yml`: Vercel preview on PR open; production deploy on `main` merge
- [ ] Lighthouse CI audit job with performance budget enforcement
- [ ] Required status checks configured on `main` branch protection

**Labels:** `devops` `p0`
**Milestone:** Phase 1 — Launch Readiness

---

### ISSUE-012: [RESOLVED] Add Sentry Error Tracking to Frontend and API

**Title:** `[DEVOPS] Integrate Sentry for error tracking and session context`

**Acceptance Criteria:**
- [ ] `@sentry/react` initialized in `apps/web/src/main.tsx`
- [ ] `@sentry/node` initialized in `apps/api/src/server.ts`
- [ ] WebGL context errors tagged with engine state breadcrumbs
- [ ] Source maps uploaded to Sentry on production build
- [ ] Alert rule: >5 new errors/minute triggers Slack notification

**Labels:** `devops` `p1` `monitoring`
**Milestone:** Phase 1

---

## 🔧 REFACTOR

---

### ISSUE-013: [RESOLVED] Extract Engine Initialization Logic from App.tsx

**Title:** `[REFACTOR] Extract ThreeCanvas initialization into useEngineInit hook`

**Problem:**
`apps/web/src/App.tsx` is 400+ lines. The `ThreeCanvas` component's `useEffect` initializes 12+ engine systems inline.

**Acceptance Criteria:**
- [ ] New `apps/web/src/hooks/useEngineInit.ts` extracts engine setup
- [ ] `ThreeCanvas` component reduced to <50 lines
- [ ] No behavioral changes

**Labels:** `refactor` `p2`
**Milestone:** Phase 2

---

### ISSUE-014: [RESOLVED] Split MissionsPanel.tsx (603 lines) into Sub-Components

**Title:** `[REFACTOR] Extract TelemetryTab, LaunchesTab, TimelineTab from MissionsPanel`

**Acceptance Criteria:**
- [ ] `MissionsPanel.tsx` reduced to <100 lines (tab routing only)
- [ ] Three sub-components extracted with clean props interfaces
- [ ] Existing functionality preserved

**Labels:** `refactor` `p2`

---

## 📖 DOCUMENTATION

---

### ISSUE-015: [RESOLVED] Add Contributing Guide and Local Development README

**Title:** `[DOCS] Create CONTRIBUTING.md and expand README with full local setup guide`

**Acceptance Criteria:**
- [ ] `CONTRIBUTING.md` with branch naming, commit convention, PR checklist
- [ ] README "Getting Started" tested end-to-end on a clean machine
- [ ] Architecture diagram embedded in README
- [ ] Environment variable guide with all required and optional keys

**Labels:** `documentation` `p2`

---

### ISSUE-016: [RESOLVED] Document GLSL Shader Architecture

**Title:** `[DOCS] Add shader documentation for all 7 custom GLSL programs`

**Acceptance Criteria:**
- [ ] Each `.vert`/`.frag` pair has a header comment block explaining uniforms, inputs, and visual effect
- [ ] `apps/web/src/engine/shaders/README.md` with shader dependency graph

**Labels:** `documentation` `p3`

---

## ⚡ PERFORMANCE

---

### ISSUE-017: Audit and Reduce Three.js Bundle Size

**Title:** `[PERFORMANCE] Configure tree-shaking for Three.js to reduce initial bundle below 500KB`

**Problem:**
The full Three.js import (`import * as THREE from 'three'`) includes all geometry, material, and loader code. The PRD budget is <500KB gzipped initial bundle.

**Acceptance Criteria:**
- [ ] `vite-bundle-analyzer` added to dev dependencies
- [ ] Three.js imports changed to named imports where possible
- [ ] Initial bundle verified <500KB gzipped

**Labels:** `performance` `p1`
**Milestone:** Phase 4 — Performance Audit

---

### ISSUE-018: Self-Host Google Fonts to Eliminate Render-Blocking

**Title:** `[PERFORMANCE] Self-host Orbitron, DM Sans, JetBrains Mono fonts via Cloudflare R2`

**Problem:**
`apps/web/index.html` loads 3 font families from Google Fonts as render-blocking resources.

**Acceptance Criteria:**
- [ ] Fonts downloaded and stored in Cloudflare R2
- [ ] CSS `@font-face` declarations replace Google Fonts link
- [ ] `font-display: swap` applied to all faces
- [ ] Orbitron critical subset (Latin + numbers) preloaded

**Labels:** `performance` `p2`
