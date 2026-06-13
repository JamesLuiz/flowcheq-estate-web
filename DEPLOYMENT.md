# House me — Deployment Guide

Full-stack deployment for the **web frontend**, **NestJS backend**, **MongoDB**, and **Expo mobile app**.

---

## Architecture

| Component | Path | Runtime | Default port |
|-----------|------|---------|--------------|
| Web (Vite + React) | repo root | Node build → nginx | 8080 |
| API (NestJS) | `backend/` | Node 20 | 3000 |
| Database | MongoDB 7 | — | 27017 |
| Mobile | `apps/mobile/` | Expo Go / EAS | — |

---

## Quick start — Docker Compose (recommended for VPS)

### Prerequisites

- Docker & Docker Compose
- Copy env vars (see below)

### Steps

```bash
# From repo root
cp backend/.env.example backend/.env   # if present, or create .env
# Edit .env with JWT_SECRET, SMTP, Cloudinary, etc.

docker compose up -d --build
```

Services:

- **Frontend:** http://localhost:8080  
- **API:** http://localhost:3000  
- **API health:** http://localhost:3000/health  
- **Swagger:** http://localhost:3000/api  

Set in `.env` or shell before `docker compose up`:

```env
JWT_SECRET=your-long-random-secret
CLIENT_ORIGIN=http://localhost:8080
VITE_API_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
YOVERIFY_API_KEY=...
ADMIN_EMAIL=ops@yourdomain.com
```

### Production notes

1. Put **nginx** or **Caddy** in front with TLS (Let's Encrypt).
2. Point `CLIENT_ORIGIN` and `VITE_API_URL` to your public URLs.
3. Use **MongoDB Atlas** instead of the bundled container for production.
4. Never commit `.env` files.

---

## Manual deployment (without Docker)

### Backend

```bash
cd backend
npm ci
npm run build
npm run start:prod
```

Required env: `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, SMTP, Cloudinary.

### Frontend

```bash
# repo root
npm ci
VITE_API_URL=https://api.yourdomain.com npm run build
# Serve dist/ with nginx, Vercel, or Hostinger static hosting
```

`vercel.json` at root supports SPA rewrites for Vercel.

### MongoDB

Local: `mongodb://127.0.0.1:27017/nestin_estate`  
Atlas: set `MONGO_URI` to your connection string.

---

## Mobile app (`apps/mobile/`)

See **[apps/mobile/DEPLOYMENT.md](./apps/mobile/DEPLOYMENT.md)** for Expo Go, LAN testing, and EAS builds.

Key env:

```env
EXPO_PUBLIC_API_URL=https://api.yourdomain.com
```

Agents must sign in (JWT in secure store) to load managed properties on the home screen.

---

## New platform features (env)

| Feature | Env vars |
|---------|----------|
| Partner lead emails | `SMTP_*`, `ADMIN_EMAIL` |
| Youverify account KYC | `YOVERIFY_API_KEY`, `YOVERIFY_BASE_URL`, `YOVERIFY_WEBHOOK_SECRET` |
| Lawyer panel | Seed a user with role `lawyer` (see below) |

### Seed a lawyer account

```bash
cd backend
# Use seed-admin pattern or register via API and set role in MongoDB:
# db.users.updateOne({ email: "lawyer@firm.com" }, { $set: { role: "lawyer" } })
```

Lawyers log in at `/auth` → redirected to `/lawyer/dashboard`.

### Public marketing form

- **URL:** `/partners`  
- **Admin leads:** `/admin` → Partner leads tab  
- Contact via **email** (SMTP) or **WhatsApp** (wa.me deep link)

### Listing verification flow

1. Landlord creates listing → `pending_verification`  
2. Agent captures GPS photos (mobile)  
3. Lawyer reviews C of O → enters certificate details → `verified`  
4. Only **verified** listings appear on the public browse API  

---

## Realtime: Socket.IO + notification gateway

The app ships a unified **Socket.IO gateway** (`backend/src/realtime/`) and a persistent
**notification service** (`backend/src/notifications/`). They power the bell icon, toast
alerts, and live chat delivery across web and mobile.

### How it works

- The gateway attaches to the **same HTTP server/port** as the REST API (default `3000`).
  No separate process or port is required.
- Each socket authenticates with the **same JWT** used for REST and joins a private room
  `user:{userId}`.
- Any backend module emits to a user via `RealtimeService.emitToUser(userId, event, payload)`.
- Notifications are stored in MongoDB **and** pushed live, so they survive reloads.

### Events emitted to clients

| Event | Trigger |
|-------|---------|
| `notification:new` | Property view, management request/response, new message |
| `chat:message` | A message is sent to the user (in addition to Pusher) |
| `chat:typing` | The other party is typing |
| `realtime:ready` | Emitted on successful authenticated connect |

### Backend env

```env
JWT_SECRET=your-long-random-secret   # MUST match REST; used to verify socket handshakes
CLIENT_ORIGIN=https://app.yourdomain.com
```

The gateway CORS origins live in `backend/src/realtime/realtime.gateway.ts`. Add your
production web origin there alongside the existing localhost entries.

### Reverse-proxy: allow WebSocket upgrades

Socket.IO needs the `Upgrade`/`Connection` headers forwarded. Example **nginx**:

```nginx
location /socket.io/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

**Caddy** handles WebSocket upgrades automatically with a plain `reverse_proxy`.

### Frontend env

The web client (`src/context/NotificationContext.tsx`) reuses `VITE_API_URL` to open the
socket — no extra config needed:

```env
VITE_API_URL=https://api.yourdomain.com
```

The provider falls back to polling (`/notifications` every 30s) if the socket can't connect,
so notifications still work behind restrictive proxies.

### Smoke test

1. Log in on two browsers (e.g. a landlord and a tenant).
2. As the tenant, open a verified listing → the landlord/agents get a `New property view`
   bell notification in real time.
3. Send a message → recipient sees a toast + bell badge instantly.

---

## Telegram bot

Separate Python service: `backend/bot/` — deploy via Render using `render.yaml`.

---

## Checklist before go-live

- [ ] Rotate `JWT_SECRET` and all API keys  
- [ ] `CLIENT_ORIGIN` matches production web URL  
- [ ] CORS in `backend/src/main.ts` includes production origin  
- [ ] SMTP tested (partner lead + lawyer approval emails)  
- [ ] Cloudinary uploads working  
- [ ] Youverify webhook URL registered (if using live KYC)  
- [ ] MongoDB backups enabled  
- [ ] Mobile `EXPO_PUBLIC_API_URL` points to public API (not localhost)  
- [ ] Reverse proxy forwards WebSocket upgrades on `/socket.io/`  
- [ ] Production web origin added to gateway CORS in `realtime.gateway.ts`
