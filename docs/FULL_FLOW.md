# Full user journey — Landing → Google → Studio

## Keys currently wired (local `.env.local`)

| Service | Status | Purpose |
|---------|--------|---------|
| **Google Maps** | ✅ Set | Photorealistic 3D Tiles |
| **Meshy** | ✅ Set + tested (`meshy-6`) | Real text-to-3D |
| **Supabase publishable key** | ✅ Set | Auth + DB client |
| **Supabase Project URL** | ⚠️ **Still needed from you** | Enables Google/email OAuth |

Without the Project URL, users can still:
1. Open the studio as guest  
2. Run the guided tour  
3. Select land  
4. Generate with **real Meshy AI** (3 free local gens)  
5. Adjust lighting / model  

## Ideal path (after you paste Project URL)

1. **Landing** http://localhost:3000  
2. Click **Sign up with Google**  
3. (First time) Connect Supabase URL if prompted → enable Google provider in dashboard  
4. Google OAuth → `/auth/callback` → `/studio?tour=1`  
5. Guided tour → pick acres → chip prompt → **Generate with AI**  
6. Wait for Meshy (1–3 min) → model on terrain  

## One-time Supabase checklist

1. Dashboard → your project → **Settings → API**  
2. Copy **Project URL** → paste in the in-app setup modal (or `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`)  
3. SQL Editor → run `supabase/schema.sql`  
4. **Auth → Providers → Google** → ON  
   - Create OAuth Client in Google Cloud (type: Web)  
   - Authorized redirect: `https://<project-ref>.supabase.co/auth/v1/callback`  
5. **Auth → URL configuration**  
   - Site URL: `http://localhost:3000`  
   - Redirect: `http://localhost:3000/auth/callback`  

## Google Maps note

Enable **Map Tiles API** (not only Geocoding) on the same key for Cesium Photorealistic 3D Tiles:

https://console.cloud.google.com/apis/library/tile.googleapis.com

## Security

API keys were shared in chat — rotate Meshy + Google + Supabase keys after demos if this chat is shared.
