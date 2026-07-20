# Restate.ai — Land Development Studio

<p align="center">
  <strong>Select real land on a high-definition 3D map.<br/>Let AI design the development.</strong>
</p>

<p align="center">
  <a href="https://github.com/lohithveerepalli/restate-ai"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-restate--ai-181717?logo=github" /></a>
  <a href="docs/MVP_STATUS.md"><img alt="MVP" src="https://img.shields.io/badge/MVP-complete%20(demo--ready)-22c55e" /></a>
  <a href="#license"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue" /></a>
</p>

**Restate.ai** is a premium consumer web app for land development visualization. Pick a parcel on a labeled 3D Earth map and generate theme parks, hospitals, data centers, communities, and more with AI — placed and scaled on that terrain.

| | |
|---|---|
| **Repository** | https://github.com/lohithveerepalli/restate-ai |
| **Status** | MVP complete · demo-ready (see [docs/MVP_STATUS.md](./docs/MVP_STATUS.md)) |
| **Local** | `npm run dev` → http://localhost:3000 |

---

## Highlights

- **Landing + FTUE** — premium first impression, Try Demo, 5-step guided tour  
- **Cesium studio** — orbit/zoom/pan, city search, city chips, zoom/compass/home  
- **Labeled basemaps** — Hybrid (satellite + place/road labels), Streets, Satellite  
- **Land tools** — draw polygon (Finish / Undo / click start to close), 5–50 ac presets, measure  
- **Meshy AI** — text-to-3D preview (`meshy-6`), poll, place GLB at centroid, scale to acres  
- **Surprise Me** — random site + prompt + auto-generate (`/studio?surprise=1`)  
- **Visualization** — time-of-day, shadows, wireframe, camera presets, model transform  
- **Auth & limits** — Supabase email/Google/Apple UI, 3 free gens, ad +1, history & share  

---

## Quick start

```bash
git clone https://github.com/lohithveerepalli/restate-ai.git
cd restate-ai
npm install
cp .env.example .env.local
# Fill keys (Google Map Tiles, Meshy, Supabase URL + publishable key)
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Landing |
| http://localhost:3000/studio | Studio |
| http://localhost:3000/studio?tour=1 | Guided tour |
| http://localhost:3000/studio?surprise=1 | Auto surprise generation |

Cesium assets: `npm run copy-cesium` if `public/cesium` is missing (also runs on `postinstall`).

---

## Environment variables

See [`.env.example`](./.env.example).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Photorealistic 3D Tiles (enable **Map Tiles API** + billing) |
| `MESHY_API_KEY` | Text-to-3D (server only) |
| `NEXT_PUBLIC_SUPABASE_URL` | e.g. `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable or anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server RPC / credits |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` for OAuth + share |
| `NEXT_PUBLIC_DEMO_MODE` | `true` forces demo GLB instead of Meshy |

**Never commit `.env.local`.** Rotate keys if they were exposed.

---

## Setup guides

1. **Google 3D tiles** — [Map Tiles API](https://console.cloud.google.com/apis/library/tile.googleapis.com)  
2. **Meshy** — [meshy.ai](https://www.meshy.ai/) API key  
3. **Supabase** — create project → run [`supabase/schema.sql`](./supabase/schema.sql) → Auth providers  
4. **Google sign-in** — Auth → Providers → Google ON + OAuth Web Client; redirect:  
   `https://<project-ref>.supabase.co/auth/v1/callback`  
   Site URL: `http://localhost:3000` · App redirect: `http://localhost:3000/auth/callback`  

More detail: [docs/FULL_FLOW.md](./docs/FULL_FLOW.md) · Demo script: [docs/DEMO.md](./docs/DEMO.md)

---

## AI generation & placement

1. Close a land polygon (or acre preset).  
2. Turf computes **acres** + **centroid**.  
3. `POST /api/generate` → Meshy preview task (or demo GLB).  
4. Client polls `GET /api/generate/status`.  
5. Cesium entity at centroid: `CLAMP_TO_GROUND`, scale ≈ `√(acres × 4046.86) / 50`.  
6. User adjusts scale / heading / height; camera flies to model.  

---

## Project structure

```
src/app/           # App Router pages + API routes
src/components/    # Landing, studio, auth, UI
src/lib/           # Cesium helpers, geo, Meshy, Supabase
src/stores/        # Zustand studio state
supabase/          # SQL schema
docs/              # Demo script, MVP status, full flow
public/cesium/     # Cesium static assets
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run copy-cesium` | Copy Cesium to `public/cesium` |

---

## Limitations & roadmap

**Limitations:** Stripe not connected; Google OAuth/Map Tiles depend on dashboard config; Meshy preview (not full refine); share/history need schema + auth.

**Roadmap:** Stripe · production deploy · textured Meshy refine · multi-building campuses · zoning overlays · on-globe gizmos · mobile draw UX · export video/screenshots  

Full checklist: [docs/MVP_STATUS.md](./docs/MVP_STATUS.md)

---

## Credits

CesiumJS · Google Photorealistic 3D Tiles · Meshy.ai · Supabase · Turf.js · Next.js · shadcn/ui · Tailwind · Esri/Carto basemap tiles · [Khronos glTF samples](https://github.com/KhronosGroup/glTF-Sample-Models)

**Maintainer:** [lohithveerepalli](https://github.com/lohithveerepalli)

## License

MIT
