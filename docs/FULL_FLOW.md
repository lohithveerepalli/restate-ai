# Full user journey — Landing → Auth → Studio

## Intended path

1. **Landing** — http://localhost:3000  
2. **Sign up with Google** (after Supabase Google provider enabled) **or** email **or** Open studio as guest  
3. **Studio** — tour (optional) → select land → Generate / Surprise  
4. **Interact** — lighting, camera, model transform, share  

## Guest path (works without Google OAuth)

1. **Open studio now** or `/studio?guest=1`  
2. Use **Hybrid/Streets** basemap + search/city chips to navigate  
3. **Quick parcel** or **Draw** land  
4. Prompt chip or **Surprise** → Meshy generation (3 free local gens)  

## Surprise path

http://localhost:3000/studio?surprise=1  

Auto-selects nearby land + random prompt and starts Meshy.

## Supabase project used in development

- Project ref: `zdnehrokhevyffbaixyv`  
- URL: `https://zdnehrokhevyffbaixyv.supabase.co`  

### Required dashboard steps

1. SQL → run `supabase/schema.sql`  
2. Auth → URL config: Site `http://localhost:3000`, redirect `http://localhost:3000/auth/callback`  
3. Auth → Providers → **Google** enable + OAuth Client ID/Secret  
   - Redirect URI: `https://zdnehrokhevyffbaixyv.supabase.co/auth/v1/callback`  

Error `Unsupported provider: provider is not enabled` means Google is still OFF in Supabase.

## Keys

Store only in `.env.local` (gitignored). Rotate if shared outside a secure channel.
