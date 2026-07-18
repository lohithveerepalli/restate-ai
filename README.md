# Restate.ai — Land Development Studio

**Select real land on a high-definition 3D map. Let AI design the development.**

Restate.ai is a premium consumer web app where anyone can pick a parcel on photorealistic 3D Earth and instantly visualize large developments — theme parks, hospitals, data centers, residential communities, industrial parks, and more — placed and scaled on that terrain.

Built with **Next.js 15 (App Router)**, **CesiumJS + Google Photorealistic 3D Tiles**, **Meshy.ai** text-to-3D, **Supabase Auth**, **Turf.js**, **Tailwind CSS**, and **shadcn/ui**.

---

## Features

### First-time experience
- Premium landing page (no login required)
- **Try Demo** opens the studio with a guided 5-step tour
- Fly-to Texas Hill Country (scenic open land, strong 3D tile coverage)
- Live demo of polygon selection, sample AI placement, and lighting presets

### Interactive 3D map
- `Cesium.createGooglePhotorealistic3DTileset()` for HD terrain
- Location search (OpenStreetMap Nominatim)
- Polygon draw tool (click to place, double-click to close)
- Real-time **acreage** via Turf.js
- Quick presets: **5 / 10 / 25 / 50 acres**
- Clear / redraw selection
- Distance measurement tool

### AI generation (Meshy.ai)
- Prompt input with smart example chips + **Surprise Me**
- Server routes create Meshy tasks, poll completion, return GLB
- Model auto-placed at polygon **centroid**, **scaled to acreage**, **clamped to terrain**
- Interactive scale / rotation / height-offset controls
- Demo fallback (sample GLB) when Meshy or auth is unavailable

### Visualization
- Full Cesium camera (orbit, zoom, pan, fly-to)
- Time-of-day slider with sun + dynamic shadows
- Presets: Bird’s eye, Ground level, Golden hour, Dramatic sunset
- Layer toggles: model, shadows, wireframe, selection polygon

### Auth & monetization
- Supabase Auth: **Google**, **Apple**, **Email/Password**
- Profiles store generation counts and free balance (**3 free generations**)
- Limit modal: credit plans (UI) + **watch 30s ad** → +1 generation
- Generation history with one-click reload
- Share links via unique `share_id` (`/share/[id]`)

---

## Quick start

### 1. Clone & install

```bash
git clone https://github.com/lohithveerepalli/restate-ai.git
cd restate-ai
npm install
```

Cesium static assets are expected under `public/cesium` (copied from `node_modules/cesium/Build/Cesium`). If missing:

```bash
mkdir -p public/cesium && cp -R node_modules/cesium/Build/Cesium/* public/cesium/
```

### 2. Environment variables

Copy the example file and fill in keys:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Map Tiles API / Photorealistic 3D Tiles |
| `MESHY_API_KEY` | Meshy.ai text-to-3D (server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side credit + generation writes |
| `NEXT_PUBLIC_SITE_URL` | e.g. `http://localhost:3000` for OAuth + share links |
| `NEXT_PUBLIC_DEMO_MODE` | Optional `true` to force demo models |

### 3. Google Photorealistic 3D Tiles

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Map Tiles API**
3. Create an API key restricted to Map Tiles API (and HTTP referrers in production)
4. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Without this key the app still loads a globe with OSM/Ion imagery so you can develop UI and tools.

### 4. Meshy.ai

1. Create an account at [meshy.ai](https://www.meshy.ai/)
2. Generate an API key
3. Set `MESHY_API_KEY` in `.env.local`

If Meshy is not configured, generation falls back to a sample GLB so the placement pipeline remains demoable.

### 5. Supabase (Auth + database)

1. Create a project at [supabase.com](https://supabase.com/)
2. **SQL Editor** → run `supabase/schema.sql`
3. **Authentication → Providers**
   - Enable **Email**
   - Enable **Google** (OAuth client ID/secret from Google Cloud)
   - Enable **Apple** (Services ID, key, team ID from Apple Developer)
4. **Authentication → URL configuration**
   - Site URL: `http://localhost:3000` (or your production domain)
   - Redirect URLs: `http://localhost:3000/auth/callback`
5. Copy Project URL + anon key + service role key into `.env.local`

#### Google OAuth (Supabase)

1. Google Cloud → APIs & Services → Credentials → OAuth 2.0 Client
2. Authorized redirect URI: Supabase callback  
   `https://<project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID/Secret into Supabase Google provider settings

#### Apple OAuth (Supabase)

1. Apple Developer → Identifiers → Services ID
2. Configure Sign in with Apple + return URL to Supabase callback
3. Create a key, download `.p8`, enter Team ID / Key ID / Services ID in Supabase

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve production build
```

---

## AI generation & model placement

### Flow

1. User closes a land polygon (or uses an acre preset).
2. Turf computes **area (acres)** and **centroid**.
3. `POST /api/generate` validates input, optionally **consumes** a free generation/credit via `consume_generation`, and:
   - **Meshy mode:** `POST https://api.meshy.ai/openapi/v2/text-to-3d` (preview)
   - **Demo mode:** immediate sample GLB
4. Client polls `GET /api/generate/status?taskId=…` until `SUCCEEDED`.
5. GLB URL is set on a Cesium `Entity` at the centroid with:
   - `heightReference: CLAMP_TO_GROUND`
   - `scale ≈ sideLength(acres) / referenceModelWidth`
   - `orientation` from heading (user-adjustable)
6. Camera flies to the model; user can scale/rotate/offset in real time.

### Scaling heuristic

```ts
sideMeters = sqrt(acres * 4046.8564224)
scale = sideMeters / referenceWidthMeters  // default reference ~50 m
```

This is intentionally simple for MVP; production systems can use Meshy metadata or bounding-box fitting.

---

## Project structure

```
src/
  app/
    page.tsx                 # Landing
    studio/page.tsx          # Main studio
    share/[id]/page.tsx      # Public share view
    auth/callback/route.ts   # OAuth code exchange
    api/generate/            # Start + poll Meshy
    api/generations/         # History CRUD
    api/credits/ad/          # Watch-ad reward
    api/geocode/             # Location search
  components/
    landing/                 # Marketing FTUE
    studio/                  # Cesium viewer, panels, tour
    auth/                    # Auth modal
    providers/               # Supabase auth provider
  lib/
    cesium/                  # Time & terrain helpers
    supabase/                # Browser + server clients
    geo.ts                   # Turf acreage / squares
    meshy.ts                 # Meshy API wrapper
  stores/studio-store.ts     # Zustand studio state
supabase/schema.sql          # Profiles, generations, RPC
public/cesium/               # Cesium Workers / Assets / Widgets
```

---

## Current limitations

- Credit **purchase** UI is present; Stripe checkout is not wired (use ad reward or set credits in Supabase).
- Meshy **preview** models are used (faster/cheaper); refine + texture pass can be added.
- Google 3D Tiles require a valid billing-enabled GCP project; coverage varies by region.
- Share page needs Supabase + completed generation rows.
- Apple Sign In requires Apple Developer Program enrollment.
- Model “gizmos” are slider-based (not full drag handles on the globe).
- OSM geocoding is rate-limited; production apps may prefer Google Places / Mapbox.

---

## Roadmap

- [ ] Stripe credits + invoices
- [ ] Meshy refine / textured PBR models
- [ ] Multi-building campus layouts from structured JSON
- [ ] Zoning / flood / slope overlay layers
- [ ] Collaborative sessions + comments
- [ ] Export glTF, screenshots, and short fly-through video
- [ ] Mobile-optimized touch drawing
- [ ] On-globe transform gizmos

---

## Credits

- **CesiumJS** — 3D geospatial engine  
- **Google Photorealistic 3D Tiles** — real-world 3D basemap  
- **Meshy.ai** — text-to-3D generation  
- **Supabase** — auth & Postgres  
- **Turf.js** — geospatial math  
- **Next.js / Vercel** — app framework  
- **shadcn/ui + Tailwind** — UI system  
- Sample demo GLB from [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)

---

## License

MIT — built as an MVP demonstration of the Restate.ai Land Development Studio.
