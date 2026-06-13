# Flowcheq Estate — Web deployment

Deploy the **Vite + React** frontend only.

| Related repo | Purpose |
|--------------|---------|
| `flowcheq-backend` | NestJS API, MongoDB, Socket.IO |
| `flowcheq-mobile` | Expo app (Flowcheq Capture) |

---

## Environment

```env
VITE_API_URL=https://api.estate.flowcheq.com
```

The web app talks to the API over HTTP/WebSocket only — no backend code in this repo.

---

## Local development

```bash
npm ci
VITE_API_URL=http://localhost:3000 npm run dev
```

---

## Production build

```bash
VITE_API_URL=https://api.estate.flowcheq.com npm run build
# Output: dist/
```

Serve with **Vercel** (`vercel.json` included), **nginx** (`nginx.conf` + `Dockerfile`), or any static host.

---

## Docker (web only)

```bash
docker build -t flowcheq-web .
docker run -p 8080:80 -e VITE_API_URL=https://api.estate.flowcheq.com flowcheq-web
```

---

## SEO & social sharing

- Meta tags + OG/Twitter cards: `index.html`
- Share image: `public/og-image.jpg` (1200×628)
- Per-page SEO: `src/lib/seo.ts`
- `public/sitemap.xml`, `public/robots.txt`
- Canonical site: `https://estate.flowcheq.com`

---

## Checklist

- [ ] `VITE_API_URL` points to production API  
- [ ] API `CLIENT_ORIGIN` includes `https://estate.flowcheq.com`  
- [ ] TLS on web + API domains  
- [ ] OG image loads at `https://estate.flowcheq.com/og-image.jpg`

For API, mobile, Socket.IO, and MongoDB setup see **`flowcheq-backend`** and **`flowcheq-mobile`**.
