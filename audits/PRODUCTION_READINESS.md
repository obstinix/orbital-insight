# PRODUCTION_READINESS.md — Orbital Insight
*Assessment Date: June 2026*

---

## Verdict: NOT Production-Ready

The platform requires significant remediation before a staged production rollout. The core architectural foundations are excellent, but critical gaps in assets, integrations, security hardening, and observability block deployment.

---

## Security Audit

### Findings

**CORS Policy is Wide Open**
- File: `apps/api/src/server.ts` line ~26
- `origin: true` permits any domain to access the API
- **OWASP A05 — Security Misconfiguration**
- Fix: `origin: ['https://orbital-insight.com', 'https://staging.orbital-insight.com']`

**No Authentication on AI Guide Endpoint**
- File: `apps/api/src/routes/guide.ts`
- `/api/guide` is publicly accessible with zero authentication
- Claude API costs could be run up by any script without auth gating
- **OWASP A01 — Broken Access Control**
- Fix: Require Clerk session JWT; enforce per-user token budget

**No Environment Variable Validation**
- File: `apps/api/src/server.ts`
- Server boots successfully even if `ANTHROPIC_API_KEY`, `DATABASE_URL`, or `CLERK_SECRET_KEY` are absent
- Silent failures at runtime
- Fix: Add startup validation with `zod` or `envalid`

**Hardcoded localhost URLs**
- Files: `apps/web/src/spacecraft/AIGuide.ts`, `apps/web/src/ui/MissionsPanel.tsx`
- `http://localhost:3000` hardcoded; will fail in any deployed environment
- Fix: Use `import.meta.env.VITE_API_URL`

**CSP Disabled in Development, Not Configured for Production**
- File: `apps/api/src/server.ts` — `contentSecurityPolicy: process.env.NODE_ENV === 'production'`
- No CSP header configuration has been defined for production; the flag enables it but the policy object is absent — Helmet will apply a default CSP that may block Three.js shader WASM workers
- Fix: Define explicit CSP with `script-src`, `worker-src`, `img-src` for CDN assets

**No Rate Limiting on SSE Stream**
- File: `apps/api/src/routes/guide.ts`
- Global rate limit (100 req/min) exists but SSE streams hold connections open; a single attacker could exhaust server connections
- Fix: Limit concurrent SSE connections per IP; add per-session token budget enforcement

**No Input Sanitization on Guide Endpoint**
- File: `apps/api/src/routes/guide.ts` — TypeBox validates `message: Type.String()` (length-unbounded)
- Fix: Add `maxLength: 500` to TypeBox schema; sanitize for prompt injection once Claude API is wired in

### Security Score: **4 / 10**

Issues blocking production: CORS policy, missing auth on guide endpoint, CSP configuration, hardcoded URLs.

---

## Reliability Audit

### Findings

**No React Error Boundaries**
- If Three.js throws during rendering, the entire React tree unmounts with no recovery path
- Fix: Wrap `<ThreeCanvas>` and each lazy-loaded panel in `<ErrorBoundary>` with a fallback HUD

**No WebGL Context Loss Handling**
- `canvas.addEventListener('webglcontextlost')` is not handled
- On memory-pressured mobile devices, WebGL context loss is common
- Fix: Listen for `webglcontextlost`/`webglcontextrestored` events; reinitialize renderer on restore

**API Error Falls Through to User-Visible Error Text**
- File: `apps/web/src/ui/GuideChatPanel.tsx` — `onError` callback
- NOVA displays raw JavaScript error messages to users: `[COMMUNICATION ERROR]: System failed to link with guidance relay. [error.message]`
- Fix: Map error types to user-friendly HUD messages

**No Logging Beyond `console.log`**
- `apps/api/src/server.ts` uses `pino-pretty` for request logging — good
- No structured error logging, no correlation IDs, no log shipping

**Service Worker Cache is Minimal**
- Only `'/'` and `'/index.html'` cached
- App shell, fonts, and content JSON are not cached offline

### Reliability Score: **5 / 10**

---

## Performance Audit

### Findings

**No Texture Loading = Fast But Visually Incomplete**
- Current state loads fast because there are no textures. With 8K planet textures, the load time will increase significantly.
- Basis Universal progressive loading (as specified in PRD §4.1) must be implemented before adding textures.

**Bundle Analysis Not Configured**
- No `vite-bundle-analyzer` or `rollup-plugin-visualizer` configured
- Cannot verify PRD target of <500KB gzipped initial bundle
- Three.js alone (unoptimized) is ~800KB. Tree-shaking and selective imports are critical.

**Google Fonts Loaded Synchronously**
- File: `apps/web/index.html` — 3 Google Font families loaded in `<head>`
- Blocking render for Orbitron, DM Sans, JetBrains Mono on every load
- Fix: Add `font-display: swap`; preload critical Orbitron subset; self-host via Cloudflare R2

**No Asset Preloading Strategy**
- No `<link rel="preload">` for critical path assets
- No progressive loading skeleton for 3D engine initialization

**Render Loop Optimization**
- `App.tsx` render loop calls `useExoplanetStore.getState()` and `useConstellationStore.getState()` on every frame via direct store reads
- These are non-reactive reads in a hot path — acceptable but should be documented

**60fps Target Achievability**
- With current geometry (no textures), 60fps is very achievable
- Once textures and GLTF models are added, the LOD system will be essential. It is correctly implemented.

### Performance Score: **5 / 10**

(Score reflects current state without assets; achievable target is 8/10 with proper asset pipeline)

---

## Scalability Audit

### Findings

**Stateless Backend — Good Foundation**
- Fastify server has no in-memory state; each request is independent
- Ready for horizontal scaling behind a load balancer

**No Queue System for AI Guide**
- Once Claude API is integrated, each SSE connection holds an open stream
- Under high load, this could exhaust connections
- Fix: Implement a queue or rate-limit per-user concurrent sessions

**No Database = No Multi-User State**
- All user progress is localStorage (client-only)
- Leaderboards, social sharing, cross-device sync require database integration

**No CDN for 3D Assets**
- Cloudflare R2 credentials are in `.env.example` but no upload or delivery code exists
- 3D assets served from Vercel edge nodes would be expensive and slow
- Fix: Implement asset pipeline: Blender → Draco/Basis compress → R2 upload → CDN serve

### Scalability Score: **5 / 10**

---

## Code Quality Audit

### Findings

**Strengths:**
- TypeScript strict mode throughout — `tsconfig.json` has `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- Clean separation of concerns: engine, ui, spacecraft, stores, modes
- Zustand stores are well-scoped with single responsibility
- Custom GLSL shaders are properly structured with uniform typing (`shaders.d.ts`)
- No TODO/FIXME/HACK comments anywhere
- Consistent use of CSS custom properties for theming

**Weaknesses:**
- No test coverage
- No Storybook component catalog
- `App.tsx` is 400+ lines — could be split into `hooks/useEngineInit.ts` and smaller components
- `MissionsPanel.tsx` is 603 lines — largest file; could benefit from sub-component extraction

### Code Quality Score: **7 / 10**

---

## DevOps Audit

### Findings

- No CI/CD pipeline (no `.github/workflows/` directory)
- No Lighthouse CI automated budget enforcement
- No automated deploy to Vercel/AWS on merge
- No environment management (no staging environment configuration)
- No secret rotation strategy documented
- `turbo.json` correctly configures build pipeline dependencies — good foundation when CI is added

### DevOps Score: **2 / 10**

---

## Scores Summary

| Category | Score | Key Blocker |
|---|---|---|
| **Security** | 4 / 10 | CORS wildcard, unauthenticated guide endpoint, no CSP |
| **Performance** | 5 / 10 | No asset pipeline, no bundle analysis, blocking fonts |
| **Scalability** | 5 / 10 | No database, no CDN, no AI rate limiting |
| **Code Quality** | 7 / 10 | Zero tests, large components, no Storybook |
| **DevOps** | 2 / 10 | No CI/CD, no monitoring, no staging |
| **Production Readiness** | **3 / 10** | Cannot deploy today |

---

## Minimum Viable Production Checklist

Before any production deployment, the following must be completed:

- [ ] Lock CORS to production domain
- [ ] Authenticate `/api/guide` endpoint with Clerk JWT
- [ ] Replace `localhost:3000` with environment variable in frontend
- [ ] Configure production CSP headers
- [ ] Add React `ErrorBoundary` for engine and panels
- [ ] Handle WebGL context loss
- [ ] Set up basic Sentry error tracking
- [ ] Implement GitHub Actions CI with build + lint
- [ ] Add environment variable startup validation
- [ ] Configure Basis Universal texture loader and upload first planet textures
