# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Deploy to Vercel

### 1) Project config

This project includes `vercel.json` with:

- build command: `npm run build`
- output directory: `dist`
- SPA rewrite: all routes -> `/index.html` (needed for React Router)

### 2) Deploy from Vercel Dashboard

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Go to Vercel: https://vercel.com/new
3. Import your repository.
4. Vercel should auto-detect Vite; keep defaults or verify:
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Click **Deploy**.

### 3) Deploy from CLI (optional)

```bash
npm i -g vercel
vercel
vercel --prod
```

### 4) Environment variables (if needed)

If you add API keys/secrets later, set them in:

- Vercel Project -> Settings -> Environment Variables

Then redeploy.

## SafeSpeak admin integration notes

- The admin sidebar is aligned to the SafeSpeak scope groups: dashboard, security/compliance, platform intelligence, analytics/intelligence, crisis/safety, content/education, user/operations, and basic content management.
- Live backend-connected admin surfaces currently include dashboard summary, users, create admin, taxonomies, service destinations, privacy requests, analytics, knowledge sources, resource/content/media management where supported by the backend.
- Several admin routes remain intentional placeholders when the backend does not yet expose a matching endpoint. These modules should not be treated as production-complete.
- `npm run build` passes. `npm run lint` currently fails because of a large pre-existing repo-wide lint backlog outside this task’s changes.
