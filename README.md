# Orbital Insight

> **⚠ This project is under active development.** The current version (`0.1.0-dev`) covers
> foundational engine scaffolding. Core features are in progress and subject to change.
> Not production-ready.

[![Status](https://img.shields.io/badge/status-in%20development-orange?style=flat-square)](https://github.com/obstinix/orbital-insight)
[![Version](https://img.shields.io/badge/version-0.1.0--dev-blue?style=flat-square)](https://github.com/obstinix/orbital-insight)
[![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-r165-black?style=flat-square&logo=threedotjs)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build)

Orbital Insight is a browser-based, real-time 3D astronomy visualization platform. It renders
the solar system, deep-sky objects, and the large-scale structure of the universe using WebGL 2.0
and WebGPU, grounded in open astronomical datasets from NASA JPL, the NASA Exoplanet Archive,
and related sources.

The platform is designed as an interactive educational tool: users can explore planetary orbital
mechanics, trace active mission trajectories, browse the confirmed exoplanet catalog, and query
an AI-powered contextual guide (via the Anthropic Claude API) for natural-language explanations
of any visible object.

The repository is a Turborepo monorepo. Primary languages are TypeScript (93.5%) and GLSL (4.4%).

---

## Table of Contents

- [Development Status](#development-status)
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Scripts](#development-scripts)
- [Performance Budgets](#performance-budgets)
- [Roadmap](#roadmap)
- [Data Sources](#data-sources)
- [Contributing](#contributing)
- [License](#license)

---

## Development Status

| Milestone | Status |
|---|---|
| Monorepo scaffold (Turborepo + npm workspaces) | ✅ Complete |
| Three.js rendering engine setup | 🔄 In Progress |
| Solar system — orbital mechanics | 🔄 In Progress |
| AI guide (Anthropic API integration) | 🔄 In Progress |
| Asset pipeline (Turborepo tasks: `assets:download`, `assets:process`) | 🔄 In Progress |
| Journey mode — 8 chapters | 📋 Planned |
| Exoplanet catalog viewer | 📋 Planned |
| Real-time mission tracker | 📋 Planned |
| Authentication + user profiles | 📋 Planned |
| CI performance budgets (Lighthouse) | 📋 Planned |

All active work is tracked in [GitHub Issues](https://github.com/obstinix/orbital-insight/issues).

---

## Overview

The platform consists of two applications inside a shared monorepo:

- **`apps/web`** — React 19 + Vite 6 frontend. The Three.js rendering engine runs in a WebGL
  canvas; React handles the HUD, data panels, and navigation UI overlaid on top.
- **`apps/api`** — Fastify-based Node.js 22 backend providing REST and WebSocket endpoints,
  NASA API proxy routes, and AI guide session management.

Planetary positions are computed from NASA JPL Horizons ephemeris data. Exoplanet records are
fetched from the NASA Exoplanet Archive API. The AI guide is contextually scoped to the current
scene — its responses reference the specific object, mission, or region in view.

The rendering pipeline is built on Three.js r165 with custom GLSL ES 3.0 shaders covering
atmospheric scattering, volumetric nebula clouds, and gravitational lensing. WebGPU is used where
available, with a transparent fallback to WebGL 2.0.

---

## Features

### Rendering Engine

- Star field with spectral-type classification (~100,000 stars)
- Physically-based rendering (PBR) for planetary surfaces, atmospheres, and ring systems
- Custom GLSL ES 3.0 shaders: atmospheric scattering, volumetric nebula, gravitational lensing
- Post-processing via Three.js `EffectComposer`: bloom, SSAO, lens flare, depth of field, film grain
- Adaptive level-of-detail (LOD) targeting stable 60 fps on mid-range GPU hardware
- WebGPU progressive enhancement; degrades gracefully to WebGL 2.0

### Solar System Simulation

- All eight planets with real surface textures (8K PBR maps), atmospheric shaders, moons, and ring geometry
- Orbital mechanics driven by NASA JPL Horizons ephemeris data
- Time controls: pause, advance, or rewind to any date
- Real-time overlays for active NASA, ESA, and commercial mission positions

### AI Contextual Guide

- Anthropic Claude API integration for natural-language object explanations
- Responses scoped to the object or region currently active in the scene
- Adjustable technical depth, from general interest to observatory-level detail
- Optional voice narration via ElevenLabs TTS API

### Journey Mode *(planned)*

A scripted 8-chapter sequence traversing spatial scales from Earth's surface to the observable
universe boundary, with each chapter tied to real scientific data.

| Chapter | Destination | Scale |
|---|---|---|
| 1 | Earth & Atmosphere | ~10,000 km |
| 2 | The Solar System | ~10 AU |
| 3 | The Sun & Heliosphere | ~120 AU |
| 4 | Nearby Stars | ~4 ly |
| 5 | The Milky Way | ~100,000 ly |
| 6 | Local Group | ~3 million ly |
| 7 | The Observable Universe | ~93 billion ly |
| 8 | The Cosmic Horizon | ∞ |

### Additional Modules *(planned)*

- **Constellation viewer** — all 88 IAU constellations, geolocation-aware night sky
- **Exoplanet catalog** — 5,000+ confirmed exoplanets from NASA Exoplanet Archive with comparative visualization
- **Mission tracker** — live trajectory visualization using SpaceTrack.org data
- **Black hole visualizer** — gravitational lensing shader, accretion disk, Hawking radiation particle system
- **Discovery log** — personal record of explored objects with shareable session cards

---

## Tech Stack

### Frontend — `apps/web`

| Concern | Technology | Notes |
|---|---|---|
| Framework | React 19 + TypeScript 5.5 | UI overlaid on WebGL canvas |
| Build tool | Vite 6 | Module federation, code splitting |
| 3D engine | Three.js r165 | Scene graph, materials, geometry |
| Graphics API | WebGL 2.0 / WebGPU | WebGPU used where available |
| Shaders | GLSL ES 3.0 | Atmospheres, volumetrics, lensing effects |
| Post-processing | Three.js EffectComposer | Bloom, SSAO, lens flare, film grain |
| Particle system | Custom GPU engine (transform feedback) | Up to 2M simultaneous particles |
| State | Zustand + React Query | Global app state + async data fetching |
| Animation | GSAP + Framer Motion | Scene timelines + UI micro-interactions |
| Audio | Howler.js + Web Audio API | Spatial ambient audio |
| 3D asset pipeline | Blender → GLTF 2.0 + Draco compression | Spacecraft, planet meshes, nebula geometry |

### Backend — `apps/api`

| Concern | Technology | Notes |
|---|---|---|
| Runtime | Node.js 22 | Current LTS |
| Framework | Fastify | REST + WebSocket endpoints |
| Database | PostgreSQL 16 | Primary data persistence |
| Cache | Redis 8 | NASA API response caching |
| ORM | Drizzle ORM | Schema definitions + migrations |
| AI integration | Anthropic Claude API | Contextual scene guide |
| Voice synthesis | ElevenLabs API | Optional narration layer |
| Authentication | Clerk | OAuth 2.0 + passwordless email |
| Asset delivery | Cloudflare R2 | 3D textures and model files |

### Monorepo Tooling

| Tool | Version | Purpose |
|---|---|---|
| Turborepo | 2.x | Task orchestration, incremental caching |
| npm workspaces | 10.9.x | Shared dependency management |
| Prettier | — | Consistent code formatting |
| GitHub Actions | — | CI: lint, typecheck, test |

---

## Repository Structure

```
orbital-insight/
├── apps/
│   ├── web/                          # React + Vite 6 frontend
│   │   └── src/
│   │       ├── engine/               # Three.js rendering engine
│   │       │   ├── core/             # Renderer, camera, scene graph
│   │       │   ├── bodies/           # Planet, star, nebula, black hole classes
│   │       │   ├── shaders/          # GLSL source files (.vert, .frag)
│   │       │   ├── particles/        # GPU particle system
│   │       │   └── fx/               # Post-processing pipeline
│   │       ├── spacecraft/           # Guide model + animation state machine
│   │       ├── modes/                # Journey, free-roam, constellation modules
│   │       ├── ui/                   # React HUD components (panels, overlays)
│   │       ├── audio/                # Howler.js audio engine
│   │       ├── hooks/                # Custom React hooks
│   │       ├── store/                # Zustand state slices
│   │       └── lib/                  # Shared utilities and type definitions
│   │
│   └── api/                          # Fastify backend
│       ├── routes/                   # REST + WebSocket route handlers
│       ├── services/                 # NASA API clients, AI guide, mission tracker
│       ├── db/                       # PostgreSQL schema + Drizzle migrations
│       └── cache/                    # Redis caching layer
│
├── packages/
│   ├── 3d-assets/                    # Blender source files + GLTF export pipeline
│   │   ├── spacecraft/               # Ship model (.blend) + exports
│   │   ├── planets/                  # Surface texture sets (8K PBR maps)
│   │   └── nebulae/                  # Volumetric nebula meshes
│   ├── content/                      # Scientific content (JSON + MDX)
│   │   ├── solar-system/             # Per-body factsheets
│   │   ├── journey-chapters/         # Journey mode narration scripts
│   │   └── exoplanets/               # Featured exoplanet profiles
│   └── shared-types/                 # TypeScript interfaces shared across apps
│
├── .env.example                      # Environment variable template
├── .prettierrc                       # Prettier config
├── package.json                      # Monorepo root (npm@10.9.0 workspaces)
├── turbo.json                        # Turborepo task pipeline
└── README.md
```

**Turborepo task pipeline** (`turbo.json`):

| Task | Behaviour |
|---|---|
| `build` | Cascading build; respects `^build` dependency order |
| `dev` | Persistent, cache-disabled watch mode |
| `test` | Runs after `^build` |
| `lint` / `typecheck` | Independent, no outputs cached |
| `assets:download` | Cached; outputs to `apps/web/public/textures/`, `stars/`, `constellations/` |
| `assets:process` | Depends on `assets:download`; cached |

---

## Getting Started

### Prerequisites

```
Node.js  >= 22.0.0
npm      >= 10.0.0
Git      >= 2.40.0
```

A dedicated GPU with WebGL 2.0 support is recommended. The engine detects capability at runtime
and activates a reduced-quality fallback on integrated or low-end hardware.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/obstinix/orbital-insight.git
cd orbital-insight

# 2. Install all workspace dependencies
npm install

# 3. Copy the environment variable template
cp .env.example .env.local

# 4. Fill in API keys (see Environment Variables section)
#    All keys are optional in --mock mode

# 5. Start development servers
npm run dev
```

Frontend: `http://localhost:5173`  
API server: `http://localhost:3000`

### Frontend-Only / Mock Mode

```bash
# Runs with static NASA data snapshots and a stubbed AI guide.
# No external API credentials required.
npm run dev:mock
```

Suitable for UI, engine, and shader development without service accounts.

---

## Environment Variables

Copy `.env.example` to `.env.local`. The file is gitignored; never commit live credentials.

```env
# ── NASA ───────────────────────────────────────────────────────────
NASA_API_KEY=                      # https://api.nasa.gov  (free tier available)
SPACETRACK_USER=
SPACETRACK_PASS=                   # https://spacetrack.org

# ── AI Guide ───────────────────────────────────────────────────────
ANTHROPIC_API_KEY=                 # https://console.anthropic.com

# ── Voice Synthesis (optional) ─────────────────────────────────────
ELEVENLABS_API_KEY=                # https://elevenlabs.io

# ── Authentication ─────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# ── Database ───────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/orbital_insight
REDIS_URL=redis://localhost:6379

# ── Asset Delivery ─────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
R2_BUCKET_NAME=orbital-insight-assets

# ── App ────────────────────────────────────────────────────────────
VITE_API_URL=http://localhost:3000
VITE_ENV=development               # development | staging | production
```

---

## Development Scripts

All scripts run from the repository root via Turborepo.

```bash
# Development
npm run dev              # Start all apps in watch mode
npm run dev:mock         # Frontend only, mocked external data

# Build
npm run build            # Production build (all apps, dependency-ordered)

# Quality
npm run test             # Unit tests (Vitest)
npm run lint             # ESLint across all packages
npm run typecheck        # TypeScript strict mode check (all packages)

# 3D Assets
npm run assets:download  # Fetch NASA textures + star catalogs into apps/web/public/
npm run assets:process   # Compress and prepare downloaded assets
```

---

## Performance Budgets

The following budgets are enforced in CI. Pull requests exceeding hard limits will fail.

| Metric | Target | Hard Limit |
|---|---|---|
| Initial JS bundle (gzip) | < 350 KB | 500 KB |
| Time to interactive (50 Mbps) | < 3.5 s | 4 s |
| Frame rate (reference GPU) | 60 fps | 45 fps |
| Lighthouse Performance | > 85 | 75 |
| Lighthouse Accessibility | > 95 | 90 |
| Largest Contentful Paint (LCP) | < 2.5 s | 3 s |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.15 |

---

## Roadmap

```
Phase 0  Foundation, engine scaffold, monorepo setup    [In Progress]
Phase 1  Core solar system simulation                   [Planned]
Phase 2  Journey mode (chapters 1–4) + AI guide         [Planned]
Phase 3  Journey mode (chapters 5–8) + object catalogs  [Planned]
Phase 4  Discovery log, mission tracker, user profiles  [Planned]
Phase 5  QA, accessibility audit, science content review[Planned]
Launch   Staged rollout                                 [Planned]
```

Post-launch backlog: WebXR / VR mode, React Native mobile app, educator dashboard with
classroom tools, localization (10+ languages), multiplayer exploration sessions,
procedural exoplanet surface generation, community content submissions.

---

## Data Sources

| Source | Data |
|---|---|
| [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Planetary ephemeris, orbital elements |
| [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu) | Confirmed exoplanet catalog (5,000+) |
| [NASA Open APIs](https://api.nasa.gov) | APOD, mission imagery, ancillary data |
| [SpaceTrack.org](https://spacetrack.org) | Active satellite and mission trajectories |
| [Open Notify](http://open-notify.org) | ISS real-time position |

All scientific content undergoes factual accuracy review before inclusion in the project.

---

## Contributing

Contributions are welcome across rendering, UI, scientific content, and accessibility.
Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before opening a pull request.

### Workflow

```bash
# 1. Fork the repository and create a feature branch
git checkout -b feat/your-feature-name

# 2. Make changes, write or update tests
npm run test
npm run typecheck
npm run lint

# 3. Open a pull request against main
#    CI will run lint, typecheck, and tests automatically
```

### Contribution Areas

| Area | Skills |
|---|---|
| 3D Engine | Three.js, GLSL, WebGL / WebGPU |
| UI Components | React 19, TypeScript, CSS |
| Scientific Content | Astronomy, MDX authoring |
| Backend / APIs | Node.js, Fastify, PostgreSQL, Redis |
| Accessibility | WCAG 2.1, ARIA, screen reader testing |
| Audio | Web Audio API, Howler.js |

Scientific content changes require a cited source and are reviewed for accuracy prior to merge.

---

## License

MIT License — Copyright (c) 2026 orbital-insight contributors.

See [`LICENSE`](./LICENSE) for the full text.

---

*Astronomical data courtesy of [NASA](https://nasa.gov), [ESA](https://esa.int),
[IAU](https://iau.org), and the
[NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu).*
