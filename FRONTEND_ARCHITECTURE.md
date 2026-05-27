# Nestin Estate — Frontend Architecture

> **Purpose**: Single source of truth for web and mobile client architecture, complete feature inventory, and an AI model prompt for building or extending the product. Pair with [`prd.md`](./prd.md), [`roadmap.md`](./roadmap.md), [`dev.md`](./dev.md), and [`backend/HouseMe_Backend_Technical.md`](./backend/HouseMe_Backend_Technical.md).

**Product names**: Nestin Estate (marketplace brand) · House Me (backend/platform codename)

**Last updated**: May 2026 · **v2.1** (inspection fee, landlord KYC, listing documents)

---

## Table of Contents

1. [Platform Strategy](#1-platform-strategy)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [GPS Camera Service (Nestin Capture)](#3-gps-camera-service-nestin-capture)
4. [Agent ↔ Landlord Property Management](#4-agent--landlord-property-management)
5. [Complete Feature Inventory](#5-complete-feature-inventory)
6. [Web Architecture (Current)](#6-web-architecture-current)
7. [Mobile Architecture (Planned)](#7-mobile-architecture-planned)
8. [Shared Client Layer](#8-shared-client-layer)
9. [Routing & Navigation](#9-routing--navigation)
10. [State, Auth & API](#10-state-auth--api)
11. [Design System](#11-design-system)
12. [Folder Structure](#12-folder-structure)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Implementation Phases](#14-implementation-phases)
15. [Model Prompt — Build & Extend the Frontend](#15-model-prompt--build--extend-the-frontend)

---

## 1. Platform Strategy

| Platform | Stack | Status | Primary users |
|----------|-------|--------|---------------|
| **Web** | React 18 + Vite + TypeScript + Tailwind + shadcn/ui | **Live** (needs role rewiring) | House hunters, landlords, agents, admin |
| **Mobile** | React Native (Expo) + TypeScript | **Planned** | All roles; **GPS Camera required** for listing photos |
| **API** | NestJS monolith → microservices gateway | **In migration** | All clients consume REST via gateway |

**Principles**

- **Four roles only** — Admin, House Hunter, Landlord/Real Estate Company, Agent. No other listing or management personas.
- **Listing is landlord-only** — property photos must come from the in-app **Nestin Capture** GPS camera (no gallery uploads).
- **Agents manage, never list** — agents operate a separate dashboard after a landlord accepts a management request.
- **One API contract** — web and mobile share types, API client, and validation (Zod).
- **Mobile-first UX** — discovery and Nestin Capture on native; web for admin, agent CRM, and house-hunter browse.
- **Offline-tolerant where it matters** — GPS photo sessions saved locally until upload; cached search on mobile.

**Recommended monorepo layout (target)**

```
nestin-estate/
├── apps/
│   ├── web/                 # Current Vite SPA (move from /src)
│   └── mobile/              # Expo app
├── packages/
│   ├── api-client/          # fetch wrappers, endpoints
│   ├── types/               # shared TS types + Zod schemas
│   ├── tokens/              # design tokens (colors, spacing)
│   ├── nestin-capture/      # GPS Camera SDK (shared web guard + mobile impl)
│   └── utils/               # geocoding helpers, formatters
├── backend/                 # NestJS
├── prd.md
└── FRONTEND_ARCHITECTURE.md
```

---

## 2. User Roles & Permissions

The platform has **exactly four roles**. Legacy code may still use `user`, `tenant`, or combined landlord/agent dashboards — migrate to this model.

### 2.1 Role matrix

| Role | `role` enum (target) | Can list properties? | Primary dashboard | Primary device |
|------|----------------------|--------------------|-----------------|----------------|
| **Admin** | `admin` | No (oversight only) | `/admin` | Web |
| **House Hunter** | `house_hunter` | No | `/user-dashboard` | Mobile + web |
| **Landlord** | `landlord` | **Yes** | `/landlord/dashboard` | Mobile (Nestin Capture) + web |
| **Real Estate Company** | `real_estate_company` | **Yes** | `/landlord/dashboard` | Mobile (Nestin Capture) + web |
| **Agent** | `agent` | **No** | `/agent/dashboard` | Mobile + web |

> **Rule**: Only `landlord` and `real_estate_company` may create or publish listings. Agents **never** call `POST /properties`.

### 2.2 Capability by role

| Capability | House Hunter | Landlord / Company | Agent | Admin |
|------------|:------------:|:------------------:|:-----:|:-----:|
| Browse & search properties | ✓ | ✓ | ✓ | ✓ |
| Save / compare properties | ✓ | — | — | — |
| Schedule viewings / enquire | ✓ | — | — | — |
| Create listing (metadata) | — | ✓ | — | — |
| Upload listing photos | — | ✓ (GPS Camera only) | — | — |
| Accept agent management requests | — | ✓ | — | — |
| Request to manage a property | — | — | ✓ | — |
| Promote managed properties | — | ✓ (own) | ✓ (managed) | — |
| Follow up property viewers | — | ✓ (own) | ✓ (managed) | — |
| Verify on-site location (lat/lng) | — | — | ✓ | — |
| Wallet / payouts | — | ✓ | Partial (commissions TBD) | — |
| KYC / verification review | — | — | — | ✓ |

### 2.3 Dashboard split (implemented)

| Route | Component | Notes |
|-------|-----------|-------|
| `/dashboard` | Redirect | Routes to role dashboard via `getDashboardPathForRole` |
| `/landlord/dashboard` | `LandlordDashboard` | Listings, KYC, `LandlordManagementInbox`, wallet |
| `/agent/dashboard` | `AgentDashboard` | Managed properties, leads, location verify |
| `/user-dashboard` | `/house-hunter/dashboard` | Saved, viewings, messages |
| `/wallet` on agent path | `/landlord/wallet` | Landlord/company payouts only |
| `AgentWallet.tsx` for agents | `/agent/earnings` (optional) | Agent commissions if applicable |

### 2.4 Auth registration tracks

| Track | Endpoint (target) | Role assigned |
|-------|-------------------|---------------|
| House Hunter | `POST /auth/register/house-hunter` | `house_hunter` |
| Individual Landlord | `POST /auth/register/landlord` | `landlord` |
| Real Estate Company | `POST /auth/register/company` | `real_estate_company` |
| Agent | `POST /auth/register/agent` | `agent` |
| Admin | Admin-provisioned only | `admin` |

### 2.5 Landlord verification, inspection fee & listing documents (v2.1)

**Landlord / company KYC (before any listing)**

| Step | Requirement |
|------|-------------|
| Email | Verified via link (`GET /auth/verify-email`) |
| NIN | Collected at registration; must exist on profile |
| Selfie | Uploaded with NIN document image in `VerificationDialog` |
| Admin | Approves → `verificationStatus: approved` |

**Per-listing media & ownership (create listing)**

| Listing type | GPS photos | Ownership documents |
|--------------|------------|-------------------|
| **Rent** | **5–6** tagged photos with lat/lng per shot | Certificate of Occupancy (C of O) + utility bill |
| **Sale** | **5–6** tagged photos with lat/lng | C of O + deed + governor's consent + land survey |

**Field inspection (after listing saved)**

| Step | Amount | API |
|------|--------|-----|
| Pay inspection fee | **₦5,000** (Flutterwave) | `POST /verification/inspection/pay` |
| Confirm redirect | — | `POST /verification/inspection/confirm` |
| Request field visit | — | `POST /verification/request` (requires fee paid) |

UI: `PropertyInspectionActions` on each card in `Dashboard.tsx`; callback URL `/dashboard?inspection=success&propertyId=…`.

---

## 3. GPS Camera Service (Nestin Capture)

**Nestin Capture** is the **only** allowed path for property listing photos. Gallery, file picker, and drag-and-drop uploads are **disabled** for listing media.

### 3.1 Why

- Binds each photo to **live GPS coordinates** and timestamp at shutter time.
- Prevents recycled/stock images and mislocated listings.
- Gives agents and admins auditable proof of where photos were taken.

### 3.2 Rules (non-negotiable)

| Rule | Detail |
|------|--------|
| No gallery upload | `expo-image-picker` / `<input type="file">` **not** used for listing photos |
| In-app camera only | Custom full-screen camera UI — rear camera default |
| Live location required | `expo-location` foreground, high accuracy; block capture if GPS unavailable |
| Session size | **5–6 photos** per listing (enforced on API; Nestin Capture target 6–7 on mobile) |
| Tag before upload | User tags each capture (room type) then submits batch |
| Local-first | Photos saved to app sandbox; upload only after review step |
| Stamped metadata | Each file: `{ lat, lng, accuracy, capturedAt, deviceId, tag }` |
| Who captures | **Landlord or Real Estate Company** during create/edit listing |
| Agent photos | Agents use **Location Verify** flow (§4.4), not listing photo upload |

### 3.3 Capture session flow (landlord mobile)

```
Listing create/edit → "Add photos (GPS Camera)"
  → Start Nestin Capture session
  → [Camera] Capture 1..7 (counter: "4 of 7")
       each shot: freeze frame + read GPS + write to session store
  → Review grid (retake per slot, cannot add from gallery)
  → Tag each: exterior | sitting_room | bedroom | kitchen | bathroom | toilet | compound | other
  → Confirm upload → POST batch to API (multipart + metadata JSON)
  → Session cleared on success
```

### 3.4 Technical architecture

```
packages/nestin-capture/
├── src/
│   ├── types.ts              # GpsCaptureSession, GpsPhoto, PhotoTag
│   ├── session-store.ts      # in-memory + AsyncStorage draft sessions
│   ├── validate-metadata.ts  # lat/lng bounds, max age, min photos
│   └── index.ts
│
apps/mobile/src/features/nestin-capture/
├── NestinCameraScreen.tsx    # full-screen camera
├── CaptureReviewGrid.tsx     # retake / tag UI
├── useGpsCaptureSession.ts   # session hook
└── upload-gps-photos.ts      # multipart upload

apps/web/
└── ListingPhotosGuard.tsx    # blocks non-GPS upload; links to "Continue on mobile"
```

**Dependencies (mobile)**

| Package | Purpose |
|---------|---------|
| `expo-camera` | Camera preview + capture |
| `expo-location` | Live lat/lng, accuracy |
| `expo-file-system` | Persist captures before upload |
| `expo-image-manipulator` | Compress (max 1920px, JPEG 0.85) |

**API (target)**

```
POST /properties/:id/photos/gps-capture
  multipart: files[]
  body meta: [{ tag, lat, lng, accuracy, capturedAt, sequence }]
  server: validate proximity to listing address/coordinates; reject if > 200m (configurable)
```

### 3.5 Web behavior

- Landlords **cannot** upload listing photos on web (show QR deep link or "Open in app" to continue Nestin Capture session).
- House hunters and public visitors only **view** GPS-verified photos (badge: "GPS-verified photos").

### 3.6 UI components

| Component | Platform | Purpose |
|-----------|----------|---------|
| `NestinCameraScreen` | Mobile | Live camera + GPS lock indicator |
| `GpsLockBadge` | Mobile | Green = GPS ready, red = wait for signal |
| `CaptureReviewGrid` | Mobile | 6–7 grid, retake, tag dropdown |
| `PhotoTagPicker` | Mobile | Enum tags per backend schema |
| `GpsVerifiedGallery` | Web + mobile | Read-only viewer with map pin per photo (optional) |
| `ListingPhotosGuard` | Web | Redirect / CTA to mobile capture |

---

## 4. Agent ↔ Landlord Property Management

Agents **do not own listings**. They obtain **management rights** per property through an approval workflow.

### 4.1 Management request lifecycle

```
Agent                          Landlord / Company
  │                                    │
  │  POST /management-requests         │
  │  { propertyId, message }           │
  ├──────────────────────────────────► │  Notification: "Agent X wants to manage"
  │                                    │
  │                                    │  PATCH accept | reject
  │  ◄────────────────────────────────┤
  │                                    │
  │  status: active                    │  Agent appears on listing as manager
  │  can: promote, leads, verify GPS   │  Landlord retains ownership + edit rights
```

**States**: `pending` → `accepted` | `rejected` | `revoked`

### 4.2 Agent dashboard (`/agent/dashboard`)

Separate from landlord dashboard. Sections:

| Section | Description |
|---------|-------------|
| **Managed properties** | Cards for each `accepted` property |
| **Pending requests** | Outgoing requests awaiting landlord |
| **Lead inbox** | House hunters who **viewed** or **enquired** on managed properties |
| **Promotions** | Buy/run featured slots **only** for managed listings |
| **Location verify** | On-site GPS check for a managed property (§4.4) |

### 4.3 Property view notifications (agent leads)

When a **house hunter** opens a property detail page (or enquires), the backend emits an event:

```
property.viewed { propertyId, viewerId (nullable), timestamp }
  → notify: assigned agent(s) + landlord
  → agent dashboard: "New viewer — 3BR Gwarinpa" → [Follow up]
```

**Agent follow-up actions**

- Open viewer profile (if authenticated) or anonymous session id
- Start message thread (pre-filled context: property title)
- Mark lead as contacted / interested / closed

**Frontend**

- `usePropertyViewTracker` — `POST /properties/:id/view` on detail mount (debounced)
- Agent: `LeadInbox.tsx` + push notification via FCM
- Realtime optional: Pusher channel `agent:{agentId}:leads`

### 4.4 Agent location verification (mobile)

Agents visit the property and confirm coordinates **from the app** (separate from landlord Nestin Capture):

```
Agent → Managed property → "Verify location"
  → GPS lock (must be within 30m of listing coordinates)
  → Optional: single wide-angle photo (GPS-stamped, not a gallery pick)
  → POST /properties/:id/location-verify { lat, lng, accuracy, capturedAt, notes? }
  → Landlord + admin see "Agent verified on-site ✓" on listing
```

| Field | Source |
|-------|--------|
| `lat`, `lng` | `expo-location` at submit |
| `verifiedBy` | `agent` user id |
| `distanceFromListing` | Server-computed metres |

### 4.5 Permissions summary

| Action | Landlord / Company | Agent (accepted) | House Hunter |
|--------|:------------------:|:----------------:|:------------:|
| Edit listing metadata | ✓ | — | — |
| Nestin Capture photos | ✓ | — | — |
| Promote listing | ✓ | ✓ | — |
| See viewer leads | ✓ | ✓ | — |
| Location verify | — | ✓ | — |
| Revoke agent access | ✓ | — | — |

### 4.6 Target API endpoints (frontend contract)

```
# Property management (agent ↔ landlord)
POST   /management-requests              { propertyId, message }     [agent]
GET    /management-requests/outgoing     [agent]
GET    /management-requests/incoming     [landlord]
PATCH  /management-requests/:id        { status: accepted|rejected|revoked }

# Leads (views & enquiries)
POST   /properties/:id/view              [public/house_hunter] → notifies agent + landlord
GET    /agent/leads                      [agent]
GET    /landlord/leads                   [landlord]
PATCH  /agent/leads/:id                  { status: contacted|interested|closed }

# Nestin Capture (landlord photos)
POST   /properties/:id/photos/gps-capture  multipart + GPS metadata  [landlord|company]

# Agent location verify
POST   /properties/:id/location-verify     { lat, lng, accuracy, capturedAt }  [agent]
```

---

## 5. Complete Feature Inventory

Features are grouped by domain. Status: **Shipped** (legacy web) · **Rewire** (exists but wrong role/flow) · **Planned** (new build).

### 5.1 Authentication & Identity

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Email/password login | All four roles | ✓ | Planned | Shipped |
| House hunter registration | Browse, save, enquire | ✓ | Planned | Rewire |
| Landlord registration | BVN/NIN, KYC | ✓ | Planned | Rewire |
| Real estate company registration | CAC, director docs | ✓ | Planned | Rewire |
| Agent registration | No listing rights | Partial | Planned | Rewire |
| Admin login | Ops panel | ✓ | — | Shipped |
| Forgot / reset password | Email reset | ✓ | Planned | Shipped |
| Profile edit | Per role | ✓ | Planned | Shipped |
| Role-based route guards | 4-role matrix (§2) | Partial | Planned | **Rewire** |
| Phone OTP verification | All non-admin roles | — | Planned | Planned |
| JWT refresh tokens | Rotate access token | Partial | Planned | Planned |
| Device push tokens | Leads, messages, KYC | — | Planned | Planned |
| Nestin ID (house hunter) | Verified hunter badge | — | Planned | Planned |

### 5.2 Property Discovery & Search (House Hunter)

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Home / landing browse | Featured + recent listings | ✓ | Planned | Shipped |
| List search with filters | Location, type, beds, price | ✓ | Planned | Shipped |
| Map search | `SearchMap`, `MapView` | ✓ | Planned | Shipped |
| Property detail page | GPS-verified gallery, landlord + managing agent | ✓ | Planned | Rewire |
| Property view tracking | Fires lead event for agent/landlord | — | Planned | **Planned** |
| Property comparison | Side-by-side compare | ✓ | Planned | Shipped |
| Shared properties (2-to-Tango) | Multi-tenant slots | ✓ | Planned | Shipped |
| Favorites / saved | House hunter dashboard | ✓ | Planned | Shipped |
| Search history | Local persisted searches | ✓ | Planned | Shipped |
| Advanced search API | verifiedOnly, RNPL, amenities | — | Planned | Planned |
| Map clusters (GeoJSON) | Performant map pins | Partial | Planned | Planned |
| Area rent index on search | Median rent in filters | — | Planned | Planned |

### 5.3 Listings (Landlord / Real Estate Company only)

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Landlord dashboard | Stats, listing grid, agent inbox | ✓ | Planned | **Rewire** |
| Create listing metadata | Title, price, address, amenities | ✓ | Planned | Shipped |
| **Nestin Capture photos** | 6–7 GPS-stamped photos, tagged | — | **Required** | **Planned** |
| ~~Gallery photo upload~~ | **Removed** — use Nestin Capture only | — | — | **Deprecated** |
| Edit / archive listing | Metadata edit; re-capture if photos change | Partial | Planned | Rewire |
| For rent / for sale / short-let | Listing types | ✓ | Planned | Shipped |
| Proof of ownership upload | PDF/JPG (non-photo docs only) | ✓ | Planned | Shipped |
| Geocoding on address | Lat/lng from address (agent can override via verify) | ✓ | Planned | Shipped |
| Landlord KYC | Account-level verification | Partial | Planned | Planned |
| Agent management inbox | Accept/reject agent requests | — | Planned | **Planned** |
| Fair rent estimator on create | Pricing coach | — | Planned | Planned |
| Featured flag | Redirect to promotion | ✓ | Planned | Shipped |

### 5.4 Agent Management & Leads

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| **Agent dashboard** | Separate from landlord | — | Planned | **Planned** |
| Request property management | Agent → landlord approval | — | Planned | **Planned** |
| Accept / reject / revoke | Landlord controls | — | Planned | **Planned** |
| Promote managed properties | `PromotionSetup` scoped to managed ids | Partial | Planned | Rewire |
| **Lead inbox** | Viewers + enquirers on managed listings | — | Planned | **Planned** |
| **Property view notifications** | Push + in-app when hunter views | — | Planned | **Planned** |
| Follow up house hunter | Message from lead card | Partial | Planned | Rewire |
| **Location verify** | Agent submits live lat/lng on-site | — | **Mobile** | **Planned** |
| Agent public profile | Catalogue, managed listings | ✓ | Planned | Rewire |
| Agent guide | Onboarding content | ✓ | — | Shipped |
| ~~Agent create listing~~ | **Removed** | — | — | **Deprecated** |

### 5.5 Viewings & Scheduling

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Schedule viewing | House hunter request flow | ✓ | Planned | Shipped |
| Viewing management | Landlord + managing agent | ✓ | Planned | Rewire |
| Viewing fee payment (legacy) | Flutterwave | ✓ | TBD | Shipped |
| Post-viewing review | Rate landlord/agent | Partial | Planned | Partial |

### 5.6 Payments, Wallet & Monetization

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Landlord wallet | Balance, virtual account | ✓ | Planned | Rewire |
| Bank account setup | Nigerian banks | ✓ | Planned | Shipped |
| Withdraw to bank | Landlord payout | ✓ | Planned | Shipped |
| Transaction PIN | Security for withdrawals | ✓ | Planned | Shipped |
| Featured promotions | Landlord **or** managing agent pays | ✓ | Planned | Rewire |
| Promotion callback | Flutterwave deep link | ✓ | Deep link | Shipped |
| Agent earnings (optional) | Commission on promotions/leads | — | Planned | Planned |
| Subscriptions | Landlord tiers | — | Planned | Planned |

### 5.7 Messaging

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| In-app messaging | House hunter ↔ landlord/agent | ✓ | Planned | Shipped |
| Lead-context threads | Pre-filled from property view | — | Planned | **Planned** |
| Real-time updates | Pusher | Partial | Planned | Partial |
| Push notifications | Messages + leads | — | Planned | Planned |

### 5.8 Trust, Transparency & Reviews

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| GPS-verified photo badge | On listing cards + detail | — | Planned | **Planned** |
| Agent on-site verify badge | After location verify | — | Planned | **Planned** |
| Landlord KYC badge | Verified owner/company | Partial | Planned | Rewire |
| Reviews | Post-viewing ratings | Partial | Planned | Partial |
| Price history / comparables | Market transparency | — | Planned | Planned |
| Listing authenticity score | Trust 0–100 | — | Planned | Planned |

### 5.9 Market Intelligence

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Area rent index | P25/median/P75 | — | Planned | Planned |
| Public area dashboards | `/areas/:slug` | — | Planned | Planned |
| Fair rent recommendation | Rules engine | — | Planned | Planned |

### 5.10 Financial & Legal

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| RNPL eligibility + apply | House hunter flow | — | Planned | Planned |
| Digital contracts + e-sign | Landlord ↔ house hunter | — | Planned | Planned |
| Background checks | Flat-fee service | — | Planned | Planned |

### 5.11 Admin & Operations

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Admin dashboard | Users, properties, agents | ✓ | — | Shipped |
| Agent verification queue | Approve agents (not listing rights) | ✓ | — | Rewire |
| Landlord KYC queue | Ownership docs | Partial | — | Planned |
| GPS photo audit | Review capture metadata | — | — | **Planned** |
| Management dispute tools | Revoke, reassign agents | — | — | Planned |
| Disbursements | Payout oversight | ✓ | — | Shipped |

### 5.12 General

| Feature | Description | Web | Mobile | Status |
|---------|-------------|-----|--------|--------|
| Splash screen | Brand intro | ✓ | Native | Shipped |
| Contact us | Support | ✓ | Planned | Shipped |
| Theme toggle | Light/dark | ✓ | System | Shipped |

---

## 6. Web Architecture (Current)

### 6.1 Stack

| Layer | Technology |
|-------|------------|
| Runtime | React 18 |
| Build | Vite 5 |
| Language | TypeScript 5 |
| Routing | React Router v6 |
| Server state | TanStack React Query v5 |
| Forms | react-hook-form + Zod |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix) |
| Maps | Mapbox GL + `@react-google-maps/api` |
| Charts | Recharts |
| Rich text | Quill / react-quill |
| Realtime | Pusher JS |
| Payments | Flutterwave (redirect + callback routes) |
| Theming | next-themes |

### 6.2 Application bootstrap

```
main.tsx
  └── App.tsx
        ├── QueryClientProvider
        ├── ThemeProvider
        ├── SplashScreen (first load)
        ├── AuthProvider (JWT in localStorage)
        └── BrowserRouter → Routes
```

### 6.3 Key modules

| Module | Path | Responsibility |
|--------|------|----------------|
| Pages | `src/pages/` | Route-level screens (25 pages) |
| Components | `src/components/` | Reusable UI + domain components |
| UI primitives | `src/components/ui/` | shadcn/ui design system |
| API | `src/lib/api.ts` | HTTP client, auth header, endpoints |
| Auth | `src/context/AuthContext.tsx` | Session, user, role |
| Hooks | `src/hooks/` | favorites, messaging, search history, mobile breakpoint |
| Types | `src/types/index.ts` | Domain TypeScript interfaces |
| Geocoding | `src/lib/geocoding.ts` | Address → coordinates |

### 6.4 Web routes

#### Public & house hunter

| Path | Page | Auth |
|------|------|------|
| `/` | Index (home/search) | Public |
| `/house/:id` | HouseDetails (+ view tracker) | Public |
| `/map`, `/search-map` | MapView, SearchMap | Public |
| `/compare` | PropertyComparison | Public |
| `/shared-properties` | SharedProperties | Public |
| `/agents`, `/agents/:id` | AgentsListing, AgentProfile | Public |
| `/agents/:id/catalogue` | AgentCatalogue (managed listings) | Public |
| `/agent-guide` | AgentGuide | Public |
| `/auth`, `/auth/company` | Auth, CompanyAuth | Public |
| `/forgot-password`, `/reset-password` | Password flows | Public |
| `/house-hunter/dashboard` | UserDashboard (rename) | `house_hunter` |
| `/profile/edit` | ProfileEdit | Authenticated |
| `/messages` | Messages | Authenticated |
| `/viewings/payment/callback` | Viewing payment | Authenticated |
| `/contact` | ContactUs | Public |

#### Landlord / real estate company

| Path | Page | Auth |
|------|------|------|
| `/landlord/dashboard` | Listing CRUD, agent request inbox | `landlord`, `real_estate_company` |
| `/landlord/wallet` | Wallet, bank, withdrawals | `landlord`, `real_estate_company` |
| `/landlord/promotions/setup` | Featured listings (own) | `landlord`, `real_estate_company` |
| `/promotions/callback` | Flutterwave return | Landlord |

> Listing photos: **`ListingPhotosGuard`** — no upload on web; deep link to mobile Nestin Capture.

#### Agent (separate dashboard — cannot create listings)

| Path | Page | Auth |
|------|------|------|
| `/agent/dashboard` | Managed properties, lead inbox | `agent` |
| `/agent/requests` | Outgoing management requests | `agent` |
| `/agent/leads` | Viewers + enquirers on managed listings | `agent` |
| `/agent/promotions/setup` | Promote **managed** properties only | `agent` |

> Location verify: **mobile-only** — `/agent/verify-location/:propertyId`

#### Admin

| Path | Page | Auth |
|------|------|------|
| `/admin` | Admin | `admin` |

#### Legacy routes (remove after rewiring)

| Legacy | Redirect to |
|--------|-------------|
| `/dashboard` | `/landlord/dashboard` or `/agent/dashboard` by role |
| `/wallet` | `/landlord/wallet` |
| `/user-dashboard` | `/house-hunter/dashboard` |

---

## 7. Mobile Architecture (Planned)

### 7.1 Recommended stack

| Choice | Rationale |
|--------|-----------|
| **Expo (React Native)** | Fast iteration, OTA updates, strong Android focus for Nigeria |
| **Expo Router** | File-based routing aligned with web mental model |
| **Same API client package** | One `packages/api-client` consumed by web + mobile |
| **NativeWind or Tamagui** | Tailwind-like styling parity with web |
| **expo-secure-store** | JWT storage (not AsyncStorage) |
| **`packages/nestin-capture`** | GPS Camera — **mandatory** for landlord listing photos |
| **expo-camera + expo-location** | Nestin Capture + agent location verify |
| **expo-notifications** | Push: leads, messages, management request updates |

> **Do not use** `expo-image-picker` with gallery for listing photos. Camera-only APIs.

### 7.2 Mobile navigation structure

```
(house-hunter-tabs)
├── Home          → search + featured
├── Map           → map clusters
├── Saved         → favorites
├── Messages      → threads
└── Profile       → Nestin ID, settings

(landlord-tabs)
├── Listings      → CRUD metadata; "Add photos" → Nestin Capture
├── Requests      → agent management inbox (accept/reject)
├── Wallet        → payouts
└── Profile       → KYC

(agent-tabs)  ← separate app shell after role login
├── Managed       → properties with accepted management
├── Leads         → viewers + enquirers (push on property view)
├── Promote       → featured slots for managed listings
└── Profile

(stack — shared)
├── nestin-capture/[listingId]     → 6–7 GPS photo session
├── agent/verify-location/[id]     → on-site lat/lng submit
├── agent/request-management/[id]  → request to manage
├── Property/[id]
├── Viewing/schedule
└── Auth/*
```

### 7.3 Mobile-specific requirements

- **Nestin Capture**: full-screen camera; block if GPS accuracy: accuracy threshold; persist session offline until upload.
- **Deep links**: `nestin://capture/:listingId`, `nestin://agent/leads`, `nestin://house/:id`
- **Lead push**: FCM when `property.viewed` on agent-managed listing.
- **Payments**: Flutterwave WebView for agent/landlord promotions.
- **No gallery** for property listing media anywhere in the app.

---

## 8. Shared Client Layer

Extract from current `src/lib/api.ts` and `src/types/` into `packages/`:

```typescript
// packages/api-client/src/client.ts
export function createApiClient(config: {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}) { /* fetch wrapper */ }

// packages/types/src/property.ts
export const PropertySchema = z.object({ /* ... */ });
export type Property = z.infer<typeof PropertySchema>;
```

**Rules**

- All API responses validated with Zod at the boundary.
- Money displayed in ₦ (naira); backend stores kobo where noted in backend doc.
- Dates: `date-fns` with `Africa/Lagos` timezone for viewing slots.
- Errors: map NestJS `{ statusCode, message }` to user-facing toasts.

---

## 9. Routing & Navigation

### 9.1 Web — protected routes

Use a `ProtectedRoute` wrapper checking `AuthContext`:

| Role | Allowed routes |
|------|----------------|
| `admin` | `/admin/*` |
| `house_hunter` | `/house-hunter/*`, `/messages`, public browse |
| `landlord`, `real_estate_company` | `/landlord/*`, public browse |
| `agent` | `/agent/*` only — **no** `/landlord/dashboard`, **no** `POST /properties` |

Redirect unauthenticated users to `/auth?redirect=...`.

### 9.2 Deep linking parity (web ↔ mobile)

| Flow | Web path | Mobile deep link |
|------|----------|------------------|
| Property | `/house/:id` | `nestin://house/:id` |
| Nestin Capture | QR / "Open app" | `nestin://capture/:listingId` |
| Agent leads | `/agent/leads` | `nestin://agent/leads` |
| Viewing payment | `/viewings/payment/callback` | `nestin://viewings/payment/callback` |
| Promotion | `/promotions/callback` | `nestin://promotions/callback` |
| Password reset | `/reset-password?token=` | `nestin://reset-password?token=` |

---

## 10. State, Auth & API

### 10.1 Auth flow

```
Login → POST /auth/login → { accessToken, refreshToken, user }
       → setAuthToken(accessToken) in SecureStore/localStorage
       → AuthContext provides user + role
API calls → Authorization: Bearer <token>
401 → attempt POST /auth/refresh → retry or logout
```

### 10.2 React Query conventions

```typescript
// Query keys
['properties', filters]
['property', id]
['landlord', 'dashboard']
['landlord', 'management-requests']
['agent', 'managed-properties']
['agent', 'leads']
['agent', 'management-requests']
['messages', threadId]
['nestin-capture', 'session', listingId]
['area-index', district]
```

// Defaults
staleTime: 60_000        // list pages
staleTime: 300_000       // area index / static config
retry: 1 on 4xx, 3 on 5xx/network
```

### 10.3 Environment variables

| Variable | Web (`VITE_`) | Mobile (`EXPO_PUBLIC_`) |
|----------|---------------|-------------------------|
| API URL | `VITE_API_URL` | `EXPO_PUBLIC_API_URL` |
| Google Maps | `VITE_GOOGLE_MAPS_API_KEY` | Same (Geocoding + Maps JS) |
| Backend geocoding | `GOOGLE_MAPS_API_KEY` | EXIF photo verify + reverse geocode |
| Pusher key | `VITE_PUSHER_KEY` | `EXPO_PUBLIC_PUSHER_KEY` |
| Flutterwave public key | `VITE_FLW_PUBLIC_KEY` | `EXPO_PUBLIC_FLW_PUBLIC_KEY` |

---

## 11. Design System

Canonical tokens live in [`dev.md`](./dev.md) §1. Summary:

| Token | Value | Usage |
|-------|-------|-------|
| Brand primary | `#1A3C34` | Nav, headers, trust |
| Accent | `#E8794A` | CTAs, highlights |
| Success | `#059669` | Verified badges |
| Warning | `#D97706` | Pending KYC |
| Danger | `#DC2626` | Errors, disputes |

**Typography**: Display font for prices and headings; system UI font for body (see `dev.md` for font stack).

**Components**: Prefer shadcn/ui on web; port patterns to mobile via NativeWind + custom primitives (`Button`, `Card`, `Badge`, `Sheet`).

**Trust badges**: “GPS-verified photos” · “Verified Landlord” · “Agent verified on-site”

---

## 12. Folder Structure

### 12.1 Current (web root — needs rewiring)

```
src/
├── App.tsx
├── pages/
│   ├── Dashboard.tsx              → split: LandlordDashboard / AgentDashboard
│   ├── AgentWallet.tsx            → LandlordWallet only
│   └── UserDashboard.tsx          → HouseHunterDashboard
├── components/
│   ├── VerificationDialog.tsx     → landlord KYC only (not agent listing gate)
│   ├── ListingPhotosGuard.tsx     → NEW: block gallery upload on web
│   ├── agent/
│   │   ├── LeadInbox.tsx          → NEW
│   │   ├── ManagementRequestForm.tsx
│   │   └── ManagedPropertyCard.tsx
│   └── landlord/
│       └── AgentRequestsInbox.tsx → NEW
├── features/nestin-capture/       → NEW (mobile-first; guard on web)
├── context/AuthContext.tsx        → 4-role enum
└── lib/api.ts
```

### 12.2 Target (monorepo)

See [§1 Platform Strategy](#1-platform-strategy).

---

## 13. Non-Functional Requirements

| Area | Web | Mobile |
|------|-----|--------|
| Performance | LCP < 2.5s on 4G; code-split map routes | List scroll 60fps; compress GPS photos before upload |
| Security | CSP; no secrets in client | SecureStore for tokens; **reject gallery picks** for listing photos |
| GPS integrity | N/A for capture | Block shutter if accuracy > 50m (configurable); stamp EXIF + JSON metadata |
| Accessibility | WCAG AA | 44px touch targets; camera permissions copy |
| Analytics | Funnel + property views | Same; agent lead attribution |

---

## 14. Implementation Phases

| Phase | Scope | Deliverable |
|-------|-------|-------------|
| **R0** | **Role rewiring** | Split dashboards; block agent listing; 4-role guards |
| **R1** | **Nestin Capture** | `packages/nestin-capture`; mobile 6–7 GPS photo session; web guard |
| **R2** | **Agent management** | Request/accept flow; agent dashboard; lead inbox + view tracking |
| **R3** | **Agent location verify** | Mobile on-site lat/lng submit; badges on listing |
| **M0** (done) | Web MVP (legacy) | Search, combined dashboard, wallet — **to be rewired** |
| **M1** | Shared packages | `api-client`, `types`, `nestin-capture` |
| **M2** | Mobile shell | House hunter browse + Nestin Capture for landlords |
| **M3** | Agent mobile | Leads, promote, location verify |
| **M4** | Transparency UI | Area index, price history, fair rent |
| **M5** | Monorepo | Move `src/` → `apps/web/` |

---

## 15. Model Prompt — Build & Extend the Frontend

Copy everything inside the block below into an AI coding session when implementing web or mobile features.

---

```markdown
# SYSTEM PROMPT — Nestin Estate Frontend Engineer

You are a senior frontend engineer building **Nestin Estate** (House Me) — a transparent residential property marketplace for Abuja, Nigeria. You implement features for **web** (React + Vite) and **mobile** (Expo/React Native) against an existing NestJS backend.

## Product context

- **Mission**: Trusted, GPS-verified listings; landlords list directly; agents **manage** (never list); house hunters discover and enquire with full price transparency.
- **Four roles ONLY**: `admin`, `house_hunter`, `landlord`, `real_estate_company`, `agent`.
- **Listing rule**: ONLY `landlord` and `real_estate_company` create listings. Agents **must not** call `POST /properties` or show listing creation UI.
- **Photo rule**: Property photos **only** via **Nestin Capture** (in-app GPS camera). **No gallery upload.** 6–7 photos, tagged, batch uploaded with lat/lng/timestamp.
- **Agent workflow**: Request management → landlord accepts → separate agent dashboard: promote, lead inbox (view notifications), on-site location verify.
- **Market**: Nigeria-first — ₦, Flutterwave, FCT/Abuja, mid-range Android.

## Architecture rules

1. Read: `FRONTEND_ARCHITECTURE.md` (§2 roles, §3 Nestin Capture, §4 agent management), `prd.md`, `dev.md`, backend doc.
2. **Web stack**: React 18, TS, Vite, React Router v6, TanStack Query, Tailwind, shadcn/ui, react-hook-form + Zod.
3. **Mobile stack**: Expo, Expo Router, `packages/nestin-capture`, expo-camera + expo-location (**no gallery** for listing photos).
4. **Separate dashboards**: `/landlord/dashboard` (listings, agent inbox, wallet) · `/agent/dashboard` (managed props, leads, promote) · `/house-hunter/dashboard`.
5. **Nestin Capture**: 6–7 GPS-stamped shots → tag → batch upload. Block shutter if GPS unavailable.
6. **View tracking**: `POST /properties/:id/view` on detail mount → agent + landlord lead notification.
7. **Agent location verify**: Mobile-only lat/lng within 30m of listing.
8. **Do not** invent endpoints — stub with `// TODO` and types if missing.
9. **Minimize scope** — no drive-by refactors.

## Design system (mandatory)

- Primary: `#1A3C34` · Accent: `#E8794A` · Success: `#059669` · Warning: `#D97706` · Danger: `#DC2626`
- Visual hierarchy on property UI: **price → location → type → metadata**
- Verification badges: green “Verified” for KYC landlords; “GPS-verified photos” on listings; “Agent verified on-site” after location check
- Use shadcn/ui components on web; do not introduce new UI libraries without justification

## Feature checklist (implement only what the task requests)

### House hunter
- [ ] Browse, search, map, compare, save
- [ ] Property detail (triggers view event for agent leads)
- [ ] Schedule viewing, message landlord/agent

### Landlord / real estate company
- [ ] Listing metadata CRUD (web + mobile)
- [ ] Nestin Capture photo session (mobile only — no gallery)
- [ ] Agent management inbox (accept/reject requests)
- [ ] Wallet, promotions on **own** listings
- [ ] ListingPhotosGuard on web

### Agent (never list)
- [ ] Request management on a property
- [ ] Agent dashboard (separate from landlord)
- [ ] Lead inbox + follow-up when house hunter views property
- [ ] Promote **managed** listings only
- [ ] Location verify on-site (mobile, lat/lng)

### Admin
- [ ] KYC queues, GPS photo audit, user/property management

## File conventions

- Pages: `src/pages/<Name>.tsx` (web) or `apps/mobile/app/<route>.tsx`
- Components: `src/components/<Domain>/<Component>.tsx`
- API hooks: `src/hooks/use<Feature>.ts` wrapping React Query
- Types: `src/types/` or `packages/types/`

## When implementing a screen

1. State the user role and entry route.
2. List API endpoints used (method + path).
3. Build loading, empty, and error states.
4. Gate actions by auth role and KYC/verification status.
5. Add deep link path for mobile if the flow involves external redirect (payments).
6. Run linter on touched files.

## Output format

For each task, deliver:
1. Brief plan (3–5 bullets)
2. Files created/modified
3. Code changes
4. Manual test steps (role, route, expected behavior)

Do not commit unless explicitly asked. Do not add tests unless requested or behavior is non-trivial.
```

---

*Document version: 2.0 — May 2026 (4-role model, agent management, Nestin Capture GPS Camera)*
