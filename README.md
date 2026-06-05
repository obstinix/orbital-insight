<div align="center">

<br/>

```
   ____       _     _ _        _   ___           _       _     _   
  / __ \     | |   (_) |      | | |_ _|         (_)     | |   | |  
 | |  | |_ __| |__  _| |_ __ _| |  | | _ __  ___ _  __ _| |__ | |_ 
 | |  | | '__| '_ \| | __/ _` | |  | || '_ \/ __| |/ _` | '_ \| __|
 | |__| | |  | |_) | | || (_| | | _| || | | \__ \ | (_| | | | | |_ 
  \____/|_|  |_.__/|_|\__\__,_|_||_____|_| |_|___/_|\__, |_| |_|\__|
                                                     __/ |         
                                                    |___/          
```

### *Where Science Meets the Stars*

> [!IMPORTANT]
> **Active Development**: This platform is currently in active Phase 1 prototyping and developmental stages. Features, interfaces, and mathematical simulation parameters are under constant refinement.

<br/>

[![Status](https://img.shields.io/badge/status-in%20development-4A90E2?style=for-the-badge&logo=rocket&logoColor=white)](/)
[![Version](https://img.shields.io/badge/version-0.1.0--alpha-7B2FBE?style=for-the-badge)](/)
[![License](https://img.shields.io/badge/license-MIT-00BCD4?style=for-the-badge)](LICENSE)
[![PRD](https://img.shields.io/badge/PRD-v1.0-F5A623?style=for-the-badge&logo=read-the-docs&logoColor=white)](docs/PRD.docx)

[![Three.js](https://img.shields.io/badge/Three.js-r165-black?style=flat-square&logo=threedotjs)](https://threejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![WebGL](https://img.shields.io/badge/WebGL-2.0%20%2F%20WebGPU-990000?style=flat-square&logo=webgl&logoColor=white)](/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

<br/>

> **Orbital Insight** is a premium, cinematic space-exploration web platform — a real-time 3D universe where visitors explore planets, nebulae, black holes, and galaxies through AAA game-quality visuals, interactive storytelling, and an AI-powered spacecraft guide.  
> Think **Interstellar** × **Starfield** × **science museum**, rendered entirely in your browser.

<br/>

---

</div>

## 🌌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots & Demo](#-screenshots--demo)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Development Guide](#-development-guide)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## 🚀 Overview

Orbital Insight transforms astronomy education into a living, breathing universe you can actually fly through. This is not a traditional website — it is an immersive 3D experience built with the same visual philosophy as a AAA video game, running natively in any modern browser.

A fully animated spacecraft serves as your guide, warping between destinations through cinematic jump sequences, asteroid fields, and planetary flybys. Every celestial object responds to interaction, revealing scientific data, orbital mechanics, and rich educational content — all grounded in real NASA datasets.

```
User enters → Warp jump sequence → Explore solar system → Click on Mars
        → Orbital data panel opens → AI guide narrates → Discovery unlocked 🏆
```

**The experience is designed to answer one question:**  
*What if learning about space felt like playing the best space game ever made?*

---

## ✨ Features

### 🌍 Core 3D Universe Engine
- **Real-time procedural universe** — 100,000+ spectral-classified stars, volumetric nebula clouds, galaxy arms
- **Physically Based Rendering (PBR)** — photorealistic planetary surfaces, atmospheres, and ring systems
- **Adaptive Level-of-Detail (LOD)** — stable 60 fps on mid-range hardware
- **WebGPU progressive enhancement** — falls back gracefully to WebGL 2.0

### 🪐 Interactive Solar System
- **Accurate orbital mechanics** powered by NASA JPL Horizons ephemeris data
- All 8 planets with real textures, atmosphere shaders, moons, and surface terrain
- **Time controls** — pause, fast-forward, rewind to any date in history or the future
- Live positions of active NASA / ESA / SpaceX missions overlaid in real time

### 🚀 AI Spacecraft Guide
- Fully rigged 3D ship with idle, thrust, warp, orbit, and landing animation states
- **Cinematic warp-jump sequences** — motion blur, hyperspace streaks, lens flare
- AI-powered narration via [Claude API](https://anthropic.com) — answers natural language questions about any visible object
- Adaptive commentary that scales from beginner-friendly to expert-level

### 🎬 Journey Through the Universe Mode
8-chapter scripted narrative experience scaling from Earth's surface to the observable universe:

| Chapter | Destination | Scale |
|---------|------------|-------|
| 1 | Earth & Atmosphere | ~10,000 km |
| 2 | The Solar System | ~10 AU |
| 3 | The Sun & Heliosphere | ~120 AU |
| 4 | Nearby Stars | ~4 light-years |
| 5 | The Milky Way | ~100,000 ly |
| 6 | Local Group | ~3 million ly |
| 7 | The Observable Universe | ~93 billion ly |
| 8 | The Cosmic Horizon | ∞ |

### 🔭 Additional Experiences
- **Interactive Constellation Mapping** — all 88 IAU constellations with geolocation-aware night sky
- **Exoplanet Discovery Showcase** — 5,000+ confirmed exoplanets from NASA's archive with alien landscape renders
- **Real-Time Mission Tracker** — live trajectory visualization for active space missions
- **Black Hole Visualizer** — gravitational lensing shader, accretion disk, Hawking radiation particles

### 🎵 Atmosphere & Audio
- Original orchestral soundtrack composed in a cinematic Hans Zimmer-inspired style
- Adaptive audio layers that evolve with your location in the universe
- Spatial audio for proximity-based ambient effects

### 🏆 Exploration Achievements
- 50+ hidden celestial discoveries and Easter eggs
- Personal mission log with shareable achievement cards
- Explorer leaderboard

---

## 📸 Screenshots & Demo

> 🚧 *Screenshots and live demo will be added after the alpha milestone. Star this repo to be notified.*

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         [ Live Demo coming in Phase 2 ]             │
│         [ Alpha: Q3 2026 ]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| 3D Rendering | [Three.js r165](https://threejs.org) + WebGL 2.0 / WebGPU | Universe, planets, effects |
| Shaders | GLSL ES 3.0 | Atmospheres, volumetrics, gravitational lensing |
| Post-Processing | Three.js EffectComposer | Bloom, lens flare, SSAO, film grain |
| Particles | Custom GPU engine (transform feedback) | Up to 2M particles |
| Framework | React 19 + TypeScript 5.5 | UI overlaid on canvas |
| State | Zustand + React Query | Global state + live API data |
| Animation | GSAP + Framer Motion | Cinematic timelines + UI transitions |
| Audio | Howler.js + Web Audio API | Spatial orchestral soundtrack |
| Build | Vite 6 | Module federation, code splitting |
| 3D Assets | Blender → GLTF 2.0 + Draco | Spacecraft, planets, nebulae |

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| API | Node.js 22 + Fastify | REST + WebSocket endpoints |
| Database | PostgreSQL 16 + Redis 8 | Data persistence + caching |
| AI Guide | [Claude API](https://anthropic.com) (claude-sonnet) | Natural language narration |
| TTS | ElevenLabs API | Spacecraft guide voice |
| Auth | Clerk | OAuth 2.0 + passwordless email |
| CDN | Cloudflare R2 | 3D asset delivery |

### Data Sources
| Source | Data |
|--------|------|
| [NASA JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | Planetary ephemeris, orbital mechanics |
| [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu) | 5,000+ confirmed exoplanets |
| [NASA Open APIs](https://api.nasa.gov) | APOD, mission data, imagery |
| [SpaceTrack.org](https://spacetrack.org) | Active satellite & mission tracking |
| [Open Notify](http://open-notify.org) | ISS real-time position |

---

## ⚡ Quick Start (zero credentials required)

```bash
# 1. Clone
git clone https://github.com/obstinix/orbital-insight.git
cd orbital-insight

# 2. Install
npm install

# 3. Create env file (no real keys needed)
cp .env.example .env.local
# .env.local is pre-configured for mock mode — no edits needed

# 4. Run
npm run dev
```

The app runs at **http://localhost:5173** (API backend at **http://localhost:3000**) with:
- 🌌 Full 3D solar system (Three.js, real planet textures from solarsystemscope.com)
- 🤖 AI guide using built-in canned responses (or Ollama if installed locally)
- 🔊 Text-to-speech via browser Web Speech API
- 💾 Achievements & mission log saved to localStorage
- 🌐 Planet data from NASA DEMO_KEY (no signup, 30 req/hour)

### Optional: enable real AI narration (still free)
```bash
# Install Ollama (free, local, open-source)
# Mac/Linux: curl -fsSL https://ollama.com/install.sh | sh
# Windows: download from https://ollama.com
ollama pull llama3.2   # ~2GB download
# That's it — the app auto-detects Ollama at localhost:11434
```

---

## 📁 Project Structure

```
orbital-insight/
├── 📁 apps/
│   ├── 📁 web/                     # React frontend (Vite)
│   │   ├── 📁 src/
│   │   │   ├── 📁 engine/          # Three.js universe engine
│   │   │   │   ├── 📁 core/        # Renderer, camera, scene graph
│   │   │   │   ├── 📁 bodies/      # Planet, star, nebula, blackhole classes
│   │   │   │   ├── 📁 shaders/     # GLSL shader files (.vert, .frag)
│   │   │   │   ├── 📁 particles/   # GPU particle system
│   │   │   │   └── 📁 fx/          # Post-processing effects
│   │   │   ├── 📁 spacecraft/      # AI guide ship model + animation FSM
│   │   │   ├── 📁 modes/           # Journey, FreRoam, Constellation, etc.
│   │   │   ├── 📁 ui/              # React HUD components (panels, badges)
│   │   │   ├── 📁 audio/           # Howler.js audio engine + soundtrack
│   │   │   ├── 📁 achievements/    # Discovery system + mission log
│   │   │   ├── 📁 hooks/           # Custom React hooks
│   │   │   ├── 📁 store/           # Zustand state slices
│   │   │   └── 📁 lib/             # Utility functions, type definitions
│   │   ├── 📁 public/
│   │   │   └── 📁 assets/          # Static textures, fonts, audio (CDN-mirrored)
│   │   └── 📄 index.html
│   │
│   └── 📁 api/                     # Fastify backend
│       ├── 📁 routes/              # REST route handlers
│       ├── 📁 services/            # NASA APIs, AI guide, mission tracker
│       ├── 📁 db/                  # PostgreSQL schema + migrations (Drizzle ORM)
│       └── 📁 cache/               # Redis caching layer
│
├── 📁 packages/
│   ├── 📁 3d-assets/               # Blender source files + export pipeline
│   │   ├── 📁 spacecraft/          # Ship .blend + GLTF exports
│   │   ├── 📁 planets/             # Planet texture sets (8K PBR maps)
│   │   └── 📁 nebulae/             # Volumetric nebula meshes
│   ├── 📁 content/                 # Scientific content (JSON + MDX)
│   │   ├── 📁 solar-system/        # Per-body factsheets
│   │   ├── 📁 journey-chapters/    # Journey mode narration scripts
│   │   └── 📁 exoplanets/          # Featured exoplanet profiles
│   ├── 📁 shared-types/            # TypeScript interfaces shared across apps
│   └── 📁 eslint-config/           # Shared ESLint config
│
├── 📁 docs/                        # Documentation
│   ├── 📄 PRD.docx                 # Product Requirements Document
│   ├── 📄 ARCHITECTURE.md          # System architecture deep-dive
│   ├── 📄 SHADER_GUIDE.md          # Writing custom GLSL shaders for this project
│   └── 📄 CONTENT_GUIDE.md         # How to add new celestial body content
│
├── 📁 .github/
│   ├── 📁 workflows/               # GitHub Actions (CI, Lighthouse, deploy)
│   └── 📁 ISSUE_TEMPLATE/          # Bug report + feature request templates
│
├── 📄 .env.example                 # Environment variable template
├── 📄 package.json                 # Monorepo root (npm workspaces)
├── 📄 turbo.json                   # Turborepo pipeline config
└── 📄 README.md                    # You are here 🌌
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# ── NASA APIs ─────────────────────────────────────────────────────
NASA_API_KEY=your_nasa_api_key              # https://api.nasa.gov
SPACETRACK_USER=your_spacetrack_email
SPACETRACK_PASS=your_spacetrack_password   # https://spacetrack.org

# ── AI Guide (Claude) ─────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...               # https://console.anthropic.com

# ── Text-to-Speech ────────────────────────────────────────────────
ELEVENLABS_API_KEY=your_elevenlabs_key     # https://elevenlabs.io

# ── Authentication (Clerk) ────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/orbital_insight
REDIS_URL=redis://localhost:6379

# ── CDN / Storage ─────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=your_cf_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_r2_key
CLOUDFLARE_R2_SECRET_KEY=your_r2_secret
R2_BUCKET_NAME=orbital-insight-assets

# ── App Config ────────────────────────────────────────────────────
VITE_API_URL=http://localhost:3000
VITE_ENV=development                       # development | staging | production
```

> **Never commit `.env.local` to version control.** It is gitignored by default.

---

## 💻 Development Guide

### Available Scripts

```bash
# Development
npm run dev              # Start frontend + backend in watch mode
npm run dev:mock         # Frontend only with mocked NASA data

# Building
npm run build            # Production build (all apps)
npm run build:web        # Frontend only
npm run build:api        # Backend only

# Testing
npm run test             # Run all unit tests (Vitest)
npm run test:e2e         # End-to-end tests (Playwright)
npm run test:coverage    # Coverage report

# Quality
npm run lint             # ESLint across all packages
npm run typecheck        # TypeScript strict check
npm run lighthouse       # Lighthouse CI audit

# 3D Assets
npm run assets:export    # Export all Blender files to GLTF
npm run assets:compress  # Apply Draco + Basis Universal compression
npm run assets:upload    # Upload compressed assets to Cloudflare R2
```

### Performance Budgets

These budgets are enforced in CI — PRs that exceed them will fail:

| Metric | Target | Hard Limit |
|--------|--------|-----------|
| Initial JS bundle | < 350 KB gzip | 500 KB |
| Initial load time | < 3.5 s (50 Mbps) | 4 s |
| Frame rate (RTX 2060) | 60 fps | 45 fps min |
| Lighthouse Performance | > 85 | 75 |
| Lighthouse Accessibility | > 95 | 90 |
| LCP | < 2.5 s | 3 s |
| CLS | < 0.1 | 0.15 |

### Writing Shaders

Custom GLSL shaders live in `apps/web/src/engine/shaders/`. See [`docs/SHADER_GUIDE.md`](docs/SHADER_GUIDE.md) for conventions. Key rules:

```glsl
// ✅ Always declare precision at the top of fragment shaders
precision highp float;

// ✅ Use the shared uniforms injected by the engine
uniform float uTime;
uniform vec2  uResolution;
uniform mat4  uProjectionMatrix;

// ❌ Never hard-code magic numbers — use named constants
// BAD:  float speed = 0.0174533;
// GOOD: const float DEG_TO_RAD = 3.14159265 / 180.0;
```

### Adding a New Celestial Body

1. Create a JSON factsheet in `packages/content/solar-system/` using the schema in [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md)
2. Add the Blender model to `packages/3d-assets/` and run `npm run assets:export`
3. Register the body in `apps/web/src/engine/bodies/registry.ts`
4. Add textures to R2: `npm run assets:upload`
5. Write a test in `apps/web/src/engine/bodies/__tests__/`

---

## 🗺 Roadmap

```
Phase 0  [Weeks 1–4]   ████████░░░░░░░░░░░░  Foundation & Engine Prototype
Phase 1  [Weeks 5–12]  ░░░░░░░░░░░░░░░░░░░░  Core 3D Solar System
Phase 2  [Weeks 13–20] ░░░░░░░░░░░░░░░░░░░░  Journey Mode Ch. 1–4 + AI Guide
Phase 3  [Weeks 21–26] ░░░░░░░░░░░░░░░░░░░░  Journey Mode Ch. 5–8 + Catalogs
Phase 4  [Weeks 27–30] ░░░░░░░░░░░░░░░░░░░░  Achievements + Special Events
Phase 5  [Weeks 31–34] ░░░░░░░░░░░░░░░░░░░░  QA, Accessibility, Science Review
Launch   [Weeks 35–36] ░░░░░░░░░░░░░░░░░░░░  Staged Rollout 🚀
```

**Post-Launch Backlog**
- [ ] WebXR / VR mode
- [ ] Mobile app (React Native)
- [ ] Educator dashboard with classroom tools
- [ ] Localization (10+ languages)
- [ ] Multiplayer exploration rooms
- [ ] Procedural exoplanet generator
- [ ] Community content submissions

Track all work in [GitHub Issues](../../issues) — we use the labels `p0-critical`, `p1-high`, `p2-nice-to-have`, `3d-engine`, `content`, `ai-guide`, and `performance`.

---

## 🤝 Contributing

We welcome contributions across engineering, 3D art, scientific content, and accessibility. Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

### Quick Contribution Flow

```bash
# 1. Fork the repo and create a feature branch
git checkout -b feat/your-feature-name

# 2. Make your changes and write/update tests
npm run test

# 3. Check performance budgets
npm run lighthouse

# 4. Open a PR against `main`
# → CI will run lint, typecheck, tests, and Lighthouse
# → A maintainer will review within 48 hours
```

### Contribution Areas

| Area | Skills Needed | Good First Issues |
|------|--------------|-------------------|
| 🎮 3D Engine | Three.js, GLSL, WebGL | [`label:3d-engine`](../../labels/3d-engine) |
| 🎨 UI Components | React, TypeScript, CSS | [`label:ui`](../../labels/ui) |
| 🔭 Scientific Content | Astronomy knowledge, MDX | [`label:content`](../../labels/content) |
| 🚀 Backend / APIs | Node.js, Fastify, SQL | [`label:backend`](../../labels/backend) |
| ♿ Accessibility | WCAG, ARIA, screen readers | [`label:a11y`](../../labels/a11y) |
| 🎵 Audio | Web Audio API, Howler.js | [`label:audio`](../../labels/audio) |

> **Scientific accuracy is a hard requirement.** All factual content changes require a source citation and will be reviewed by our science advisory board.

---

## 👩‍🚀 Team

| Role | Responsibility |
|------|---------------|
| Product Manager | Roadmap, stakeholder alignment, sprint planning |
| Frontend Engineers (×2) | React, Three.js, WebGL, performance |
| 3D / Graphics Engineer | GLSL shaders, render pipeline, Blender pipeline |
| Backend Engineer | API layer, NASA integrations, AI guide |
| UI/UX Designer | Design system, motion design, HUD |
| 3D Artist | Spacecraft, planet textures, nebula assets |
| Content & Science Lead | Scientific accuracy, curriculum, AI guide scripts |
| QA Engineer | Automated testing, cross-browser, accessibility |

*Plus scientific advisory board review from academic astronomers.*

---

## 📄 License

```
MIT License — Copyright (c) 2026 Orbital Insight

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

See [`LICENSE`](LICENSE) for the full text.

---

<div align="center">

<br/>

**Scientific data courtesy of [NASA](https://nasa.gov), [ESA](https://esa.int), [IAU](https://iau.org), and the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu).**

<br/>

*"The cosmos is within us. We are made of star-stuff."*  
— Carl Sagan

<br/>

[![Star this repo](https://img.shields.io/github/stars/your-org/orbital-insight?style=social)](../../stargazers)
[![Follow updates](https://img.shields.io/github/watchers/your-org/orbital-insight?style=social)](../../watchers)

<br/>

**[🌌 Back to top](#orbital-insight)**

</div>
