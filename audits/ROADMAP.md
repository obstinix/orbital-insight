# ROADMAP.md — Orbital Insight
*Engineering Roadmap — June 2026 to Q1 2027*

---

## Current Status: Phase 0 Complete / Phase 1 In Progress
Version: 0.1.0-alpha | Team: ~2–3 engineers inferred

---

## Phase 1 — Launch Readiness
**Duration:** 6 weeks | **Target:** v0.5.0-beta | **Goal:** Deployable, safe, visually impressive MVP

The goal of this phase is to close the gap between the current alpha and something that can be shown to early users, press, and investors without embarrassment. This means fixing the critical security issues, wiring real AI, and getting planet textures loaded.

### Week 1–2: Security & Infrastructure
- **T-003** Fix hardcoded localhost URLs (2 hours)
- **T-004** Lock CORS to production domain (1 hour)
- **T-006** Add React ErrorBoundaries (1 day)
- **T-007** Handle WebGL context loss (1–2 days)
- **T-008** GitHub Actions CI/CD pipeline (2–3 days)
- **T-016** Integrate Sentry error tracking (1 day)
- **T-018** Environment variable startup validation (4 hours)

**Risk:** Low — all infrastructure work with no product dependencies.

### Week 3–4: AI Guide + Voice
- **T-001** Wire real Claude API into guide backend (3–4 days)
- **T-017** ElevenLabs TTS voice for NOVA (3–4 days)
- **T-005** Auth middleware on guide endpoint (3–4 days, can start without Clerk with IP limiting)

**Risk:** Medium — Claude API streaming integration requires careful error handling. TTS adds latency; needs buffering strategy.

**Expected Outcome:** NOVA can answer any astronomy question with context. The single biggest product differentiator is now real.

### Week 5–6: Visual Foundation
- **T-002** Planet texture asset pipeline (5–7 days)
- **T-009** Cloudflare R2 CDN setup (2–3 days)
- **T-010** Configure Draco + Basis loaders (2 days)
- **T-019** InfoPanel Fun Facts carousel (2–3 days)

**Risk:** High — acquiring, processing, and delivering 8K textures involves the most unknowns. Start with Earth and Mars first.

**Expected Outcome:** Solar system looks photorealistic. First-time visitor experience is visually stunning.

### Phase 1 Milestones
- [ ] NOVA answers real astronomical questions via Claude API
- [ ] NOVA speaks with ElevenLabs voice
- [ ] Earth and Mars have photorealistic textures
- [ ] All security issues resolved
- [ ] CI/CD pipeline running on every PR
- [ ] Sentry monitoring active
- [ ] First Lighthouse audit passing core web vitals

**Dependencies:** Cloudflare account, Anthropic API key, ElevenLabs API key, production domain
**Risk Assessment:** Timeline is aggressive for 2 engineers. Recommend parallel tracks: engineer A owns AI/backend; engineer B owns textures/CDN.

---

## Phase 2 — Stability & Content
**Duration:** 8 weeks | **Target:** v1.0.0-rc | **Goal:** Full PRD feature set at production quality

### Week 7–8: Authentication + Database
- **T-012** Integrate Clerk authentication (3–4 days)
- **T-013** Set up PostgreSQL + Redis (4–5 days)
- Account persistence migrated from localStorage to server

### Week 9–10: Content Completeness
- **T-011** Expand constellation catalog to 88 IAU (3–4 days)
- **T-014** NASA Exoplanet Archive integration 5,000+ (4–5 days)
- **T-022** Jupiter and Saturn moons rendered (3–4 days)
- **T-023** Sun CME particle effects (3–4 days)

### Week 11–12: Journey Mode
- **T-015** Journey Chapters 1–4 scripted sequences (6–8 days)
- Chapter 5–8 polish and narration beat refinement
- Discovery Card summary implementation

### Week 13–14: Testing + Performance
- **T-020** Write Vitest + Playwright test suite (5–7 days)
- **T-017** Bundle analysis and Three.js tree-shaking
- Lighthouse audit pass for all Core Web Vitals
- Cross-browser compatibility testing (Chrome, Firefox, Safari, Edge)

**Phase 2 Expected Outcomes:**
- All 8 Journey chapters fully scripted with cinematic sequences
- 88 constellations and 5,000+ exoplanets in the platform
- User accounts working with cross-device sync
- 80%+ test coverage on engine and store logic
- Production-ready Core Web Vitals

---

## Phase 3 — Feature Expansion
**Duration:** 6 weeks | **Target:** v1.1.0 | **Goal:** P1 features complete; platform is feature-complete vs. PRD

### Weeks 15–16
- **T-024** NASA JPL Horizons live ephemeris (3–4 days)
- **T-025** Lagrange point visualization (2 days)
- **T-034** Live launch data from RocketLaunch.live (1–2 days)

### Weeks 17–18
- **T-027** Expand achievement system to 50+ (2–3 days)
- **T-031** Leaderboard (3–4 days, requires Phase 2 auth)
- **T-033** Discovery Card social sharing with OG images

### Weeks 19–20
- **INT-1** Live sky event calendar with notifications
- **RET-1** Daily Cosmic Challenge
- **GRO-1** "Tonight's Sky" SEO entry point

**Phase 3 Expected Outcomes:**
- Platform is fully feature-complete against PRD v1.0
- First growth experiments running (Tonight's Sky, Daily Challenge)
- Leaderboard social mechanics active

---

## Phase 4 — Cinematic Experience
**Duration:** 6 weeks | **Target:** v1.2.0 | **Goal:** Transform from impressive to unforgettable

Focus: Every upgrade in this phase is from `CINEMATIC_UPGRADE_PLAN.md`

### Weeks 21–22
- **VIS-1** Full planet texture set completed (all 10 bodies)
- **MOT-3** Cinematic boot sequence replaces CSS spinner
- **MOT-5** Warp sequence enhancement (lens distortion, star streaks, black flash)

### Weeks 23–24
- **IMM-4** Holographic Info Panel redesign
- **MOT-1** Framer Motion for all panel entrances
- **DAT-1** Animated orbital path with travel pulse dot
- **MOT-4** GSAP achievement unlock animation

### Weeks 25–26
- **VIS-2** Volumetric god rays from Sun
- **DAT-2** Black hole gravitational lensing on star field
- **AUD-1** Sampled orchestral audio layer
- **AUD-2** Interactive UI sound design

**Phase 4 Expected Outcomes:**
- Every reviewer says "this looks like a AAA game"
- Session duration >8 minutes (PRD KPI)
- Viral social sharing from "Record View" feature
- Press coverage from games/design/science media

---

## Phase 5 — AI Evolution
**Duration:** 6 weeks | **Target:** v1.3.0 | **Goal:** NOVA becomes the world's best astronomy AI guide

- **AI-2** Adaptive narration difficulty auto-calibration
- **AI-3** "Ask About What You See" visual context mode
- **AI-4** Mission briefing generator per chapter
- **INT-2** Personal exploration graph
- **INT-3** "This Week in Space" AI digest
- **COL-1** Multiplayer observation mode (alpha)

**Phase 5 Expected Outcomes:**
- NOVA is genuinely indistinguishable from a real expert guide
- Return visitor rate >45% (PRD KPI)
- Platform differentiates from all competitors on AI quality

---

## Phase 6 — Enterprise Scale
**Duration:** 8 weeks | **Target:** v2.0.0 | **Goal:** B2B revenue channels open

- **ENT-1** Orbital Insight for Schools SaaS tier
- **COL-2** Educator dashboard with classroom mode
- **ENT-2** Planetarium API white-label licensing program
- **ENT-3** Premium tier (Pro subscription) with Stripe
- WCAG 2.1 AA full compliance audit
- Scientific Advisory Board content review
- Localization infrastructure for Year 2 languages
- WebXR/VR prototype (**T-035**)

**Phase 6 Expected Outcomes:**
- First paying school district customers
- Pro tier generating MRR
- Platform architected for 500K MAU
- Press kit and launch campaign ready

---

## Summary Timeline

| Phase | Duration | End Date | Version | Focus |
|---|---|---|---|---|
| Phase 1 — Launch Readiness | 6 weeks | Aug 2026 | v0.5.0-beta | Security, AI, textures |
| Phase 2 — Stability | 8 weeks | Oct 2026 | v1.0.0-rc | Auth, content, tests |
| Phase 3 — Feature Expansion | 6 weeks | Nov 2026 | v1.1.0 | Full PRD coverage |
| Phase 4 — Cinematic | 6 weeks | Jan 2027 | v1.2.0 | Visual transformation |
| Phase 5 — AI Evolution | 6 weeks | Feb 2027 | v1.3.0 | World-class NOVA |
| Phase 6 — Enterprise Scale | 8 weeks | Apr 2027 | v2.0.0 | Revenue + scale |

**Total: ~40 weeks from today** — slightly longer than PRD's 36-week estimate, reflecting the gap between current alpha state and the full PRD vision.

---

## Cross-Phase Dependencies

```
Clerk Auth (T-012) ───────┬──→ Leaderboard (T-031)
                          ├──→ Discovery Share (T-033)
                          └──→ Educator Dashboard (COL-2)

PostgreSQL (T-013) ────────┬──→ Exoplanet API (T-014)
                           └──→ User Profiles persistence

Claude API (T-001) ────────┬──→ Adaptive Difficulty (AI-2)
                           ├──→ Mission Briefing (AI-4)
                           └──→ Multiplayer Guide (COL-1)

Planet Textures (T-002) ──→ Full Cinematic Experience (Phase 4)
```

---

## Key Risks

| Risk | Phase | Severity | Mitigation |
|---|---|---|---|
| Texture pipeline slips (art production bottleneck) | 1–4 | High | License NASA public domain imagery; use automated processing scripts |
| Claude API cost overruns at scale | 2+ | High | Per-user token budget; cached common Q&A; free tier limits |
| Team bandwidth (2 engineers vs. PRD's 8-person team) | All | High | Prioritize ruthlessly; defer P2 features; consider contractor for 3D art |
| WebGL performance with full texture set | 4 | Medium | LOD system already in place; Basis Universal progressive loading |
| School market sales cycle length | 6 | Medium | Start with direct teacher outreach; freemium school tier first |
