# Restate.ai — Live Demo Script

Use this when demoing on **http://localhost:3000**.

**Time:** ~5–8 minutes  
**Best setup:** Chrome or Edge, large screen, mouse recommended  
**Optional keys:** Google Tiles + Meshy make the “wow” much stronger  

---

## Before you start

```bash
cd restate-ai
npm install
npm run dev
```

Confirm:

- Landing loads: http://localhost:3000  
- Studio loads: http://localhost:3000/studio?tour=1  

If Cesium is blank: `npm run copy-cesium` and hard-refresh.

---

## Script

### 1. Hook (30s) — Landing

> “Restate is a Land Development Studio. Anyone can pick real land on a 3D map and have AI design a full development on that parcel.”

- Point out the hero: *Select land. Generate the future.*  
- Mention use cases chips: theme parks, hospitals, data centers, industrial.  
- Click **Try Demo**.

### 2. Guided tour (90s)

Walk through all five steps without skipping:

1. **Fly over real land** — orbit with left-drag, zoom scroll  
2. **Select a parcel** — 25-acre selection appears  
3. **Generate with AI** — sample / AI model drops on land  
4. **Shape the light** — golden hour  
5. **You’re ready** — sunset finish  

> “First-time users get this magic path before we ask for anything hard.”

Click **Start creating**.

### 3. Land tools (60s)

- Search **“Fredericksburg, TX”** or **“Austin, TX”**  
- Click **10 ac** or **25 ac**  
- Show acreage badge  
- Optional: **Draw land** — three corners + double-click close  
- Optional: **Measure** two points  

### 4. AI generation (90s)

- Click **Theme Park** or **Modern Hospital** chip  
- Hit **Generate with AI**  
- Call out progress bar / Meshy (or demo model)  
- When placed: orbit around the model  
- Move **Scale**, **Rotation**, **Height offset**  
- Hit **Surprise Me** once for variety  

### 5. Cinematic controls (45s)

- Scrub **Time of day** sunrise → noon → evening  
- **Bird’s eye** then **Ground** then **Dramatic sunset**  
- Toggle **Wireframe** and **Shadows**  

### 6. Product loop close (45s)

> “Three free generations when signed in. History reloads any past site. Share link for stakeholders.”

If Supabase is configured:

- Sign in  
- Open History  
- Share link → open in new tab  

If not:

> “Auth and billing are wired to Supabase; demo mode works fully for map + placement without accounts.”

### 7. Ask / next steps

- Collect feedback on: first impression, land selection UX, generation quality  
- Note missing keys if tiles/models are fallback-quality  
- Offer roadmap: Stripe, refine models, multi-building campuses, deploy  

---

## Demo modes cheat sheet

| Mode | How | What audience sees |
|------|-----|-------------------|
| **Zero-config demo** | No env keys | Globe + tools + sample model |
| **Visual max** | Google Tiles key | Photorealistic Earth |
| **AI max** | + Meshy key | Prompt-specific 3D |
| **Full product** | + Supabase | Auth, 3 free gens, history, share |

---

## Common live issues

| Symptom | Fix on the fly |
|---------|----------------|
| Tour already completed | Click **?** help button top-right to restart |
| Model not visible | Zoom out / Bird’s eye; increase scale slider |
| Generate disabled feel | Ensure polygon is closed (use acre preset) |
| Auth error | Skip auth; continue in demo mode |

---

## One-liner for decks

> Restate.ai turns any parcel on Earth into an interactive AI land-development studio in minutes — photorealistic 3D, not slides.
