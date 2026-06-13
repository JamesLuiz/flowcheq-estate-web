# Flowcheq Estate — Web

Vite + React frontend for [Flowcheq Estate](https://estate.flowcheq.com).

This repo is **standalone**. The API and mobile app live in separate repositories:

| App | Local path (sibling) |
|-----|----------------------|
| **API (NestJS)** | `../flowcheq-backend` |
| **Mobile (Expo)** | `../flowcheq-mobile` |

## Setup

```bash
npm ci
cp .env.example .env   # if present
# Set VITE_API_URL to your backend, e.g. http://localhost:3000
npm run dev
```

## Build & deploy

```bash
VITE_API_URL=https://api.estate.flowcheq.com npm run build
# Serve dist/ with nginx (see Dockerfile + nginx.conf) or Vercel
```

See `DEPLOYMENT.md` for production notes (omit Docker Compose — backend is deployed separately).

## SEO

- Static meta + OG image: `index.html`, `public/og-image.jpg`
- Per-page titles/descriptions: `src/lib/seo.ts` (`useSeo` hook)
