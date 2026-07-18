# Restate.ai — Land Development Studio

<p align="center">
  <strong>Select real land on a high-definition 3D map.<br/>Let AI design the development.</strong>
</p>

<p align="center">
  <a href="https://github.com/lohithveerepalli/restate-ai"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-restate--ai-181717?logo=github" /></a>
  <a href="#mvp-status"><img alt="MVP" src="https://img.shields.io/badge/MVP-demo--ready-22c55e" /></a>
  <a href="#tech-stack"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" /></a>
  <a href="#tech-stack"><img alt="Cesium" src="https://img.shields.io/badge/CesiumJS-3D-6b46c1" /></a>
  <a href="#license"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
</p>

**Restate.ai** is a premium consumer web app for land development visualization. Anyone can pick a parcel on photorealistic 3D Earth and instantly visualize large developments — theme parks, hospitals, data centers, residential communities, industrial parks, campuses — placed and scaled on real terrain.

| | |
|---|---|
| **Repo** | https://github.com/lohithveerepalli/restate-ai |
| **Local demo** | http://localhost:3000 |
| **Studio** | http://localhost:3000/studio?tour=1 |
| **Status** | MVP complete for demos · API keys unlock full fidelity |

---

## Table of contents

1. [Demo in 60 seconds](#demo-in-60-seconds)
2. [MVP status](#mvp-status)
3. [What you need to see (demo checklist)](#what-you-need-to-see-demo-checklist)
4. [Features](#features)
5. [Tech stack](#tech-stack)
6. [Quick start](#quick-start)
7. [Environment variables](#environment-variables)
8. [Google Photorealistic 3D Tiles](#google-photorealistic-3d-tiles)
9. [Meshy.ai text-to-3D](#meshyai-text-to-3d)
10. [Supabase Auth & database](#supabase-auth--database)
11. [AI generation & model placement](#ai-generation--model-placement)
12. [Project structure](#project-structure)
13. [Scripts](#scripts)
14. [Current limitations](#current-limitations)
15. [Roadmap](#roadmap)
16. [Troubleshooting](#troubleshooting)
17. [Credits & license](#credits--license)

---

## Demo in 60 seconds

```bash
git clone https://github.com/lohithveerepalli/restate-ai.git
cd restate-ai
npm install
cp .env.example .env.local   # optional keys — demo works without them
npm run dev
```

Open:

- **Landing:** http://localhost:3000  
- **Studio + guided tour:** http://localhost:3000/studio?tour=1  

**Without API keys** you still get: landing, tour, 3D globe (OSM/Ion basemap), draw tools, acre presets, demo model placement, lighting, and UI.

**With keys** you unlock: Google Photorealistic 3D Tiles, real Meshy generations, auth, history, share links, and generation limits.

More walkthrough detail: [`docs/DEMO.md`](./docs/DEMO.md) · Progress tracker: [`docs/MVP_STATUS.md`](./docs/MVP_STATUS.md)

---

## MVP status

| Area | Status | Notes |
|------|--------|--------|
| Landing / first impression | ✅ Done | Premium FTUE, Try Demo CTA |
| Guided tour (5 steps) | ✅ Done | Fly-to, polygon, sample model, lighting |
| Cesium 3D map | ✅ Done | Google tiles when key present; OSM fallback |
| Location search | ✅ Done | Nominatim geocode proxy |
| Polygon draw + acreage | ✅ Done | Turf.js acres; 5/10/25/50 presets |
| Meshy AI generation | ✅ Done | Create + poll; demo GLB fallback |
| Model place / scale / rotate | ✅ Done | Centroid, clamp-to-ground, sliders |
| Time-of-day + camera presets | ✅ Done | Golden hour, sunset, bird’s eye, ground |
| Supabase auth (Google/Apple/email) | ✅ Wired | Needs project + OAuth config |
| Generation limits (3 free) | ✅ Done | SQL RPC + limit modal |
| Watch ad (+1 gen) | ✅ Done | 30s countdown UI |
| Buy credits | 🟡 UI only | Plans shown; Stripe not connected |
| History + reload | ✅ Done | Requires Supabase + login |
| Share links | ✅ Done | `/share/[id]` when row exists in DB |
| Production deploy | ⬜ Not yet | Vercel + secrets next |

**Overall:** **Demo-ready MVP.** Core studio experience is complete. Full production fidelity needs Google + Meshy + Supabase keys and optional Stripe.

---

## What you need to see (demo checklist)

Use this when walking stakeholders or investors through the product.

### A. First impression (no login)

1. Open http://localhost:3000 — landing should feel premium (gradient, product mock, CTAs).
2. Click **Try Demo** → studio loads with guided tour.
3. Step through the tour: real camera motion, parcel highlight, sample 3D model, golden hour / sunset.

### B. Map & land tools

4. Search a place (e.g. “Austin, TX”) and fly there.
5. Click **25 ac** (or Draw land → click corners → double-click to close).
6. Confirm live **acreage badge** updates.
7. Use **Measure distance** (two clicks on the map).

### C. AI development flow

8. Pick a chip (Theme Park, Hospital, Data Center…) or type a prompt.
9. Click **Generate with AI** (demo model if no Meshy key; real GLB with key).
10. Watch progress UI → model appears on the parcel → camera flies in.
11. Adjust **Scale / Rotation / Height** on the right panel.
12. Scrub **Time of day**; try **Golden hour** and **Dramatic sunset**.
13. Toggle layers: model, shadows, wireframe, selection polygon.
14. Click **Surprise Me** for random prompt + nearby parcel.

### D. Auth, limits, share (with Supabase)

15. Sign up / Sign in (Google, Apple, or email).
16. After 3 generations, confirm limit modal (plans + watch ad).
17. Complete 30s ad → claim **+1 generation**.
18. Open **History** → reload a past generation.
19. **Share generation** → open `/share/[id]` in a private window.

### E. What still looks incomplete without keys

| Missing key | What you’ll notice |
|-------------|-------------------|
| No Google Tiles key | Globe uses OSM/flat imagery, not photorealistic 3D cities/terrain |
| No Meshy key | Sample building GLB instead of prompt-specific geometry |
| No Supabase | Auth modal explains config; no saved history / real credit tracking |
| No Stripe | “Buy credits” shows “coming soon” toast |

---

## Features

### First-time experience
- Premium landing (browse without login)
- **Try Demo** + interactive **5-step guided tour**
- Default camera: **Texas Hill Country** (scenic open land, strong 3D tile coverage)

### Interactive 3D map
- `Cesium.createGooglePhotorealistic3DTileset()`
- Location search bar
- Polygon drawing (click points, double-click close)
- Real-time area in **acres** (Turf.js)
- Presets: **5 / 10 / 25 / 50 acres**
- Edit/clear selection + distance measure tool

### AI land development
- Prompt input, example chips, **Surprise Me**
- Meshy.ai text-to-3D (preview mode) with polling
- Place GLB at centroid, scale to acreage, clamp to terrain
- Live scale / heading / height-offset controls

### Visualization
- Orbit, zoom, pan, fly-to
- Time-of-day sun + dynamic shadows
- Camera presets: Bird’s eye, Ground, Golden hour, Dramatic sunset
- Layer toggles: model, shadows, wireframe, selection

### Auth & monetization
- Supabase: **Google**, **Apple**, **Email/Password**
- **3 free generations** per user; credits balance on profile
- Limit modal: credit plans (UI) + **watch 30s ad** → +1 gen
- History panel + unique **share links**

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| 3D / geo | CesiumJS, Turf.js |
| Auth & DB | Supabase (Auth + Postgres + RLS) |
| AI 3D | Meshy.ai OpenAPI v2 text-to-3D |
| State | Zustand |
| Search | OpenStreetMap Nominatim (via `/api/geocode`) |

---

## Quick start

### Requirements
- Node.js 20+ recommended
- npm 10+

### Install & run

```bash
git clone https://github.com/lohithveerepalli/restate-ai.git
cd restate-ai
npm install
cp .env.example .env.local
npm run dev
```

Cesium assets live in `public/cesium` (auto-copied on `postinstall`). If missing:

```bash
npm run copy-cesium
```

### Production build

```bash
npm run build
npm start
```

---

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Required for | Description |
|----------|--------------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Photorealistic 3D | Map Tiles API key |
| `MESHY_API_KEY` | Real AI models | Meshy server-side key (**never** expose to client) |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth / history | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth / history | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Credits RPC | Service role (server only) |
| `NEXT_PUBLIC_SITE_URL` | OAuth / share | e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_DEMO_MODE` | Forced demo GLB | Set `true` to skip Meshy even if keyed |

Minimal demo `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=true
```

---

## Google Photorealistic 3D Tiles

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select project  
2. Enable **Map Tiles API**  
3. Create an API key; restrict to Map Tiles API (+ HTTP referrers in prod)  
4. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`  

The studio sets `Cesium.GoogleMaps.defaultApiKey` and calls `createGooglePhotorealistic3DTileset()`. Without a key, the globe still loads with OSM/Ion-style imagery so UI work continues.

---

## Meshy.ai text-to-3D

1. Account + API key at [meshy.ai](https://www.meshy.ai/)  
2. Set `MESHY_API_KEY` in `.env.local`  
3. Flow: `POST /api/generate` → Meshy preview task → client polls `GET /api/generate/status` → GLB URL  

Without Meshy, the API returns a **demo sample GLB** so placement and camera fly-to still impress in demos.

---

## Supabase Auth & database

1. Create a project at [supabase.com](https://supabase.com/)  
2. SQL Editor → run entire [`supabase/schema.sql`](./supabase/schema.sql)  
3. Auth → enable **Email**, **Google**, **Apple**  
4. URL config:
   - Site URL: `http://localhost:3000`
   - Redirect: `http://localhost:3000/auth/callback`
5. Paste URL, anon key, and service role into `.env.local`

### Google OAuth
- Google Cloud OAuth client  
- Authorized redirect: `https://<project-ref>.supabase.co/auth/v1/callback`  
- Client ID/secret → Supabase Google provider  

### Apple OAuth
- Apple Developer Services ID + Sign in with Apple  
- Return URL = Supabase auth callback  
- Key (`.p8`), Team ID, Key ID, Services ID → Supabase Apple provider  

Schema includes: `profiles`, `generations`, `credit_events`, `consume_generation`, `grant_ad_reward`, RLS policies.

---

## AI generation & model placement

```
User closes polygon
    → Turf: area (acres) + centroid
    → POST /api/generate (consume free gen / credit if logged in)
    → Meshy create task  OR  demo GLB
    → Poll until SUCCEEDED
    → Cesium Entity at centroid
         scale ≈ sqrt(acres * 4046.86) / 50
         heightReference: CLAMP_TO_GROUND
         heading / heightOffset user-adjustable
    → Camera flyTo model
```

This is intentionally simple for MVP; future work can fit real Meshy bounding boxes and multi-building layouts.

---

## Project structure

```
restate-ai/
├── docs/
│   ├── DEMO.md              # Stakeholder demo script
│   └── MVP_STATUS.md        # Progress + remaining work
├── public/cesium/           # Cesium Workers / Assets / Widgets
├── scripts/copy-cesium.js   # postinstall asset copy
├── supabase/schema.sql      # Profiles, generations, RPC, RLS
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing
│   │   ├── studio/page.tsx          # Main studio
│   │   ├── share/[id]/page.tsx      # Public share
│   │   ├── auth/callback/           # OAuth exchange
│   │   └── api/
│   │       ├── generate/            # Start + status
│   │       ├── generations/         # History
│   │       ├── credits/ad/          # Ad reward
│   │       └── geocode/             # Place search
│   ├── components/
│   │   ├── landing/                 # Marketing FTUE
│   │   ├── studio/                  # Cesium + panels + tour
│   │   ├── auth/                    # Auth modal
│   │   └── providers/               # Supabase auth
│   ├── lib/                         # geo, meshy, supabase, cesium helpers
│   ├── stores/studio-store.ts
│   └── types/
└── README.md
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run copy-cesium` | Re-copy Cesium static assets to `public/cesium` |

---

## Current limitations

- **Stripe** not connected — credit purchase is UI-only  
- Meshy **preview** models (not full refine/texture pipeline)  
- Photorealistic tiles need a billed GCP project; coverage varies by region  
- Share + history require Supabase and completed rows  
- Apple Sign In needs Apple Developer Program  
- Model transforms use **sliders**, not full 3D gizmos  
- Nominatim geocoding is rate-limited (fine for MVP demos)  

---

## Roadmap

- [ ] Stripe checkout for credit packs  
- [ ] Meshy refine / textured PBR models  
- [ ] Multi-building campus layouts from structured AI output  
- [ ] Zoning / flood / slope overlays  
- [ ] Collaborative sessions + comments  
- [ ] Export glTF, screenshots, fly-through video  
- [ ] Mobile-optimized touch drawing  
- [ ] On-globe transform gizmos  
- [ ] Production deploy (Vercel) + custom domain  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank or broken 3D canvas | Run `npm run copy-cesium`; hard-refresh; check browser WebGL |
| No photorealistic tiles | Set Google key; enable Map Tiles API; check billing/restrictions |
| Generate always demo model | Set `MESHY_API_KEY`; ensure `NEXT_PUBLIC_DEMO_MODE` is not `true` |
| Auth does nothing | Configure Supabase env vars + providers + redirect URLs |
| `LIMIT_REACHED` immediately | Reset `free_generations_remaining` on `profiles` in Supabase, or watch ad |
| Cesium assets 404 | Confirm `/cesium/Workers` is served; re-run postinstall |

---

## Credits & license

- **CesiumJS** — 3D geospatial engine  
- **Google Photorealistic 3D Tiles** — real-world 3D basemap  
- **Meshy.ai** — text-to-3D  
- **Supabase** — auth & Postgres  
- **Turf.js** — geospatial math  
- **Next.js / Vercel**, **shadcn/ui**, **Tailwind CSS**  
- Demo GLB: [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)

**License:** MIT  

**Author / maintainer:** [lohithveerepalli](https://github.com/lohithveerepalli)

---

<p align="center">
  Built as the Restate.ai <strong>Land Development Studio</strong> MVP.<br/>
  <a href="https://github.com/lohithveerepalli/restate-ai">Star the repo</a> · <a href="./docs/DEMO.md">Run the demo</a> · <a href="./docs/MVP_STATUS.md">Track progress</a>
</p>
