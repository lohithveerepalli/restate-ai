# Contributing to Restate.ai

Thanks for helping build the Land Development Studio.

## Development

1. Fork / clone https://github.com/lohithveerepalli/restate-ai  
2. `npm install`  
3. `cp .env.example .env.local` and add any keys you have  
4. `npm run dev` → http://localhost:3000  

## Conventions

- TypeScript strict; prefer small focused components under `src/components`  
- Client-only for Cesium (`dynamic` + `ssr: false`)  
- Keep secrets server-side (`MESHY_API_KEY`, service role)  
- Match existing dark glass UI language  

## PRs

- Describe user-visible change and any env/setup impact  
- Ensure `npm run build` passes  
- Update `docs/MVP_STATUS.md` if you complete a checklist item  

## Questions

Open a GitHub issue on the repo.
