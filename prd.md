## Nestin Estate – Product Requirements Document (PRD)

### 1. Vision & Problem Statement

**Vision**: Build a transparent, trusted, and efficient digital marketplace for residential property in Abuja (and, over time, wider Nigeria), enabling renters/buyers and property owners/agents to transact directly with minimal friction, clear pricing, and strong protections.

**Core problems today**:
- **Opaque pricing & artificial inflation**: Multiple agents list the same unit at different prices, inflate asking prices to increase commission, and add hidden/illegal fees.
- **Dependence on middlemen**: Landlords rely on agents for marketing, screening, and negotiation; tenants rely on them for discovery and coordination, even when they add little real value.
- **Low trust & fraud risk**: Fake listings, unverifiable ownership, and poor documentation make renters/buyers skeptical and cautious.
- **Operational friction**: Scheduling viewings, handling viewing fees, and tracking payments is manual and error‑prone for both sides.

Nestin Estate solves this by **restoring price transparency, direct negotiation, and supply visibility**, while providing digital tools that replace the useful parts of the “agent layer” without its inflation.

---

### 2. Target Users & Personas

- **Renters / Buyers (End Users)**
  - Young professionals and families searching for apartments, self‑cons, and duplexes in Abuja.
  - Pain: inflated prices, fake listings, wasted trips, and paying multiple agents.
  - Goal: discover real, accurately priced homes, compare options, and schedule viewings safely.

- **Landlords / Property Owners / Agents**
  - Individual owners and licensed agents managing one or multiple units.
  - Pain: fragmented marketing, unreliable leads, manual viewings, and cash handling.
  - Goal: list, promote, and manage properties; collect viewing fees; convert leads efficiently.

- **Administrators / Operations**
  - Internal ops for compliance, fraud prevention, and system health.
  - Goal: verify owners/agents, monitor transactions, and manage disputes/abuse.

---

### 3. High‑Level Product Goals

1. **Trusted supply**: Ensure that listed properties are real and owned/managed by verified parties.
2. **Transparent pricing**: Make it easy to compare prices and see realistic market benchmarks.
3. **Efficient discovery & comparison**: Powerful filtering, map search, and comparison tools.
4. **Operational tooling for owners/agents**: Manage listings, viewings, and payments in one place.
5. **Monetization without price inflation**: Earn from value‑added services, not percentage commissions on inflated rents.
6. **Mobile‑first reach**: Native iOS/Android apps for tenants and landlords, with a dedicated field‑verifier experience on mobile.

---

### 4. Current Scope – What Exists in the App Today

#### 4.1 Core Architecture

| Layer | Technology | Status |
|-------|------------|--------|
| **Web** | React (Vite) + TypeScript + Tailwind + shadcn/ui SPA | **Live** (MVP) |
| **Mobile** | React Native (Expo) + TypeScript | **Planned** — see §4.1.1 |
| **Backend** | NestJS + MongoDB (migrating to microservices gateway) | **Live** + expanding |

**Reference docs**: [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md) (feature inventory, web/mobile architecture, AI build prompt) · [`dev.md`](./dev.md) (screen specs) · [`roadmap.md`](./roadmap.md) (upcoming features) · [`backend/HouseMe_Backend_Technical.md`](./backend/HouseMe_Backend_Technical.md) (API modules)

#### 4.1.1 Mobile App (Planned)

The mobile apps are a **first‑class product surface**, not a responsive afterthought. Most Abuja renters and many landlords will discover and transact on mid‑range Android phones.

**Platforms**: iOS + Android via **Expo (React Native)**.

**Apps / modes**:

| App mode | Primary users | Must‑have capabilities |
|----------|---------------|------------------------|
| **Tenant app** | Renters / buyers | Search, map, saved properties, property detail, messaging, viewing schedule, RNPL flow, push notifications |
| **Landlord app** | Individual landlords & companies | Listing CRUD, KYC upload, enquiries, wallet/payouts, promotion purchase |
| **Field verifier app** | House Me field staff | Assignment queue, GPS check‑in (≤30 m), on‑site photos, condition report submit, earnings |

**Shared with web**:

- Same REST API and auth (JWT + refresh).
- Shared TypeScript types and API client (`packages/api-client`, `packages/types` in target monorepo).
- Deep links for payment callbacks: `nestin://viewings/payment/callback`, `nestin://promotions/callback`, `nestin://house/:id`.

**Mobile‑specific requirements**:

- Push notifications (FCM/APNs) for messages, viewing updates, KYC decisions, RNPL status.
- Secure token storage (`expo-secure-store`).
- Camera + gallery for listing and verification photos; compress before upload.
- Offline cache for saved properties and last search results.
- Flutterwave in‑app WebView or native checkout for promotions and legacy viewing fees.

**Phasing** (see `FRONTEND_ARCHITECTURE.md` §11): M1 shared packages → M2 tenant shell → M3 landlord parity → M4 field verifier.

#### 4.2 Backend integrations
- **Backend**: NestJS + MongoDB, with integrations for:
  - Authentication & user roles (tenant/user, agent/landlord, admin).
  - Payments via Flutterwave (including viewing fees and virtual accounts).
  - Media uploads via Cloudinary.
  - Email (SMTP) for notifications and verification.

#### 4.3 User Roles & Access
- **Unauthenticated users**
  - Can browse public property listings, search, and view property details.
- **Authenticated users (Renters/Buyers)**
  - Can save/favorite properties (via user dashboard), view details, schedule & pay for viewings (via viewing flow), and message agents/owners.
- **Agents / Landlords**
  - Access to `Agent Dashboard` to create and manage listings.
  - Access to `Agent Wallet` / bank settings and viewing management tools.
  - Can configure viewing fees and receive payments into a wallet/virtual account.
- **Admins**
  - Admin views (in `Admin.tsx` and backend) for managing users, properties, and settings.

---

### 5. Existing Feature Set (v1)

#### 5.1 Property Discovery & Browsing
- **Landing & search pages** (`Index.tsx`, `SearchMap.tsx`, `MapView.tsx`):
  - Browse list of properties with filters (location, property type, etc.).
  - Map search view for visual exploration of properties.
  - Property cards showing key details: title, price, type, bedrooms, bathrooms, area, and highlights.
- **Property details** (`HouseDetails.tsx`):
  - Full property page with description, photos, and metadata.
  - Integration with “schedule viewing” / “pay viewing fee” flows.

#### 5.2 Agent / Landlord Onboarding & Verification
- **Auth** (`Auth.tsx`, `CompanyAuth.tsx`, `ProfileEdit.tsx`):
  - Sign up/in for users and agents/companies.
  - Profile editing for personal and company/agency details.
- **Landlord verification** (`VerificationDialog` on `Dashboard.tsx`):
  - **Email verification** (link on register) before KYC upload.
  - **NIN** on profile at registration + **NIN document** upload + **selfie**.
  - Admin approval gates listing creation.
- **Agent verification**: NIN or driver's license + selfie (unchanged).
- **Property inspection fee**: **₦5,000** per listing via Flutterwave before **field verification** request (`PropertyInspectionActions` on dashboard cards).

#### 5.3 Listing Creation & Management (Agent Dashboard)

Implemented in `Dashboard.tsx`:
- **Listing creation flow**:
  - Required fields: title, rich‑text description (HTML), price, property type, bedrooms, bathrooms, area, address (street, city, state – default FCT/Abuja).
  - **Geocoding integration** (`geocodeAddress`): converts address to coordinates for map navigation and search.
  - **Tagged GPS photos** (required **5–6** per listing):
    - Room tags (bathroom, bedroom, kitchen, etc.); each photo must include GPS coordinates (Nestin Capture on mobile; web stamps coords from geocoded address until mobile ships).
  - **Ownership documents** (per listing type):
    - **Rent**: C of O + utility bill.
    - **Sale**: C of O + deed + governor's consent + land survey plan.
  - **Listing type**: For sale vs. for rent.
  - **Viewing fee configuration**:
    - Optional numeric viewing/tour fee per property (₦0 allowed).
    - Used in viewing scheduling + payment flows.
  - **Feature flag**:
    - Mark listing as “featured”; successful creation redirects to `PromotionSetup` to configure promotions.
  - **Airbnb / short‑let toggle**:
    - Mark a property as short‑term rental (Airbnb‑style) to differentiate inventory.
  - **Shared property (2‑to‑Tango)**:
    - Toggle for shared properties.
    - Configure `totalSlots` (2–10) to allow multi‑tenant sharing.
  - **Proof of address upload**:
    - Mandatory file (PDF/JPG/PNG, max 10MB).
    - Used for admin‑only verification; not exposed publicly.

- **Listing management**:
  - Edit listing: same fields as creation, with address re‑geocoding on change.
  - Delete listing with confirmation.
  - Stats per agent: `totalListings`, `totalViews` (estimated), `inquiries` (estimated).
  - Grid of `HouseCard` components with edit/delete overlay actions.

#### 5.4 Viewing Management & Payments
- **Viewing scheduling** (`ViewingManagement`, `ViewingPaymentCallback.tsx`):
  - Agents can see and manage viewing requests and schedules.
  - Viewing fees are paid by users and routed through Flutterwave to:
    - An internal wallet, and
    - A **virtual account** configured per agent (via backend integration).
- **Wallet & payouts** (`AgentWallet.tsx`, bank settings in `Dashboard.tsx`):
  - Agents configure bank account details (name, number, bank selection from Nigerian banks list).
  - Wallet balance display and navigation to wallet/withdrawal screens.
  - Flutterwave virtual account info (account number, bank name, status).
  - Agents can withdraw available wallet balance to a configured bank account.
  - **Transaction PIN & reset flows**:
    - PIN status check, PIN reset via email‑sent code.
    - Validation and security controls around reset code and PIN format.

#### 5.5 Communications & Agent Discovery
- **Messages / direct chat** (`Messages.tsx`):
  - In‑app messaging between users and agents/owners.
  - Used for negotiation, clarifications, and coordination around viewings.
- **Agent catalogue & profiles** (`AgentCatalogue.tsx`, `AgentsListing.tsx`, `AgentProfile.tsx`, `AgentGuide.tsx`):
  - Public discovery of agents/landlords and their listings.
  - Policy/education content for agents on how to use the platform effectively.

#### 5.6 Promotions & Growth
- **Featured listing promotions** (`PromotionSetup.tsx`, `PromotionCallback.tsx`):
  - After marking a listing as featured, agents can configure promotion packages (e.g., duration/placement).
  - Payments for promotions are handled via Flutterwave with callback handling.
- **User dashboard** (`UserDashboard.tsx`):
  - Central place for end‑users to see saved properties, viewings, and potentially recommendations.

#### 5.7 Admin & Operations
- **Admin views** (`Admin.tsx`, backend admin endpoints):
  - Manage users, verify agents, review properties and documents.
  - Adjust platform settings (e.g., viewing fee percentage default, limits, etc.).

---

### 6. Non‑Functional Requirements

- **Security & Compliance**
  - All sensitive operations authenticated and role‑gated.
  - PII and documents (proof of address, IDs) stored securely; only admins can access.
  - PIN and payment flows must follow PCI‑aligned best practices using Flutterwave.
  - Mobile: JWT in secure storage only; no tokens in logs or analytics payloads.
- **Performance**
  - **Web**: Initial load optimized via Vite and code‑splitting; map routes lazy‑loaded.
  - **Mobile**: 60 fps list scrolling; image placeholders; paginated API; compress uploads before Cloudinary.
  - Map and search interactions must feel responsive on mid‑range Nigerian smartphones (primary target: Android, 4G).
- **Reliability**
  - Viewing payments, promotions, and wallet updates must be idempotent and robust to payment callback retries.
  - Mobile deep links must handle cold‑start and background return from Flutterwave.
- **Observability**
  - Logging and error handling around payments, virtual accounts, and geocoding.
  - Client analytics (web + mobile) for funnel: search → detail → enquire → viewing → contract/RNPL.

---

### 7. Abuja‑Specific Anti‑Inflation Strategy (Concept Layer)

This product explicitly targets **Abuja’s inflated housing market** by:
- **Reducing dependence on traditional agents as price‑setters**, while retaining useful services.
- **Pushing transparency**: clear listing data, realistic pricing signals, and visibility into area‑level norms.
- **Enabling direct negotiation** between renters/buyers and verified owners/agents in‑app.

Core principles:
- **No mandatory percentage commission** on rent/sale price.
- **Optional, flat‑fee services** (background checks, contracts, inspections) instead of forced agent fees.
- **Data‑driven pricing** via historical and aggregate data, not opaque agent “gut feel.”

---

### 8. Proposed Future Features (Not Yet Implemented)

The following features derive from the strategy above and the provided concept; they are **not currently present** in the codebase and should be treated as roadmap items.

#### 8.1 Property Price History & Market Transparency
- **Per‑property price history timeline**
  - Show historical rent/sale prices for the unit (listings, renewals, and reductions).
  - Display time‑on‑market (days listed before rented/sold).
  - Visualize in a compact chart on the property detail page.
- **Comparable properties panel**
  - Surface 3–10 similar listings (same area, type, bedrooms) with their prices.
  - Highlight whether the current listing is **below**, **at**, or **above** local norms.

#### 8.2 Area‑Based Rent Index (Abuja‑First)
- **Area rent index**
  - Compute and display: e.g., “Average 2‑bedroom rent in Gwarinpa: ₦1.2M/year.”
  - Provide distribution bands (P25, median, P75) and trend vs last 6–12 months.
  - Integrate into search filters and property pages for instant context.
- **Public area dashboards**
  - Public pages for high‑demand areas (Gwarinpa, Lugbe, Jabi, etc.) showing:
    - Average rent by bedroom count and property type.
    - Supply overview (number of active listings, days on market).
    - Quick links to current listings.

#### 8.3 “Fair Rent Recommendation” AI
- **Fair rent estimator**
  - Input: location, property type, bedrooms, bathrooms, condition, amenities.
  - Output: recommended fair rent range (e.g., ₦1.0M–₦1.3M) with confidence score.
  - Shown to:
    - Landlords/agents during listing creation/edit (“You’re 20% above the recommended range”).
    - Renters on the property page (“This listing is 15% above area average”).
- **Owner pricing coach**
  - Suggest price adjustments over time (e.g., “After 30 days with no engagement, drop 5–10%”).

#### 8.4 Landlord‑First Direct Marketplace Mode
- **Verified landlord‑only onboarding track**
  - Clear “I am an individual landlord” flow distinct from traditional agent flow.
  - Ownership verification via C of O/allocation paper and utility bills, recorded at account level (not only per listing).
  - “Verified Landlord” badge on listings and profiles.
- **Owner‑to‑tenant direct negotiation emphasis**
  - Make **in‑app chat** the default for negotiation and agreements.
  - Optional “no third‑party agent” badge/flag on applicable listings.

#### 8.5 Optional Flat‑Fee Service Layer (Replacing Agent Extras)
- **Background checks service**
  - Tenants can purchase a background check (employment, references, credit bureau where available).
  - Results summarized and shared with the landlord through the platform.
- **Digital contract generation & e‑sign**
  - Structured tenancy templates adapted for Nigeria (rent, service charges, maintenance, renewals).
  - Auto‑fill from listing + user profiles; both sides review and e‑sign.
- **Escrowed rent & deposit handling**
  - First rent and caution fee stored in platform escrow (via Flutterwave).
  - Funds automatically released to landlord after move‑in confirmation or after defined time + no dispute.
- **On‑demand property inspections**
  - Tenants/landlords can book third‑party inspectors for a fixed fee.
  - Inspectors upload photo/video reports into the app as trusted documentation.

#### 8.6 Transparency & Trust Features
- **Rent history display for a unit**
  - Show previous rent amounts and durations (where known) so tenants can see if a landlord is hiking excessively.
- **Landlord/agent review system**
  - Tenants can rate and review landlords/agents based on responsiveness, fairness, and property condition.
  - Aggregate scores displayed on profiles and property pages, with moderation tools in admin panel.
- **Listing authenticity scores**
  - Combine verification status, documentation completeness, occurrence of disputes, and community feedback into a visible “Trust score.”

#### 8.7 Rollout & Geography Controls
- **Phase‑based geographic rollout**
  - Internal configuration for “active” areas (start with Gwarinpa/Lugbe/Jabi).
  - Ability to run area‑specific promotions and onboarding campaigns for landlords.
- **Localized growth tooling**
  - Tools for ops to bulk onboard landlords in a given area (e.g., import sheets, kiosk onboarding).

#### 8.8 Monetization Extensions (Non‑Inflationary)
- **Enhanced featured listings**
  - More granular promotion options (homepage hero slot, area top‑of‑list, map highlight).
  - Bundled packages (e.g., 3 featured listings + AI pricing report).
- **Value‑added services catalog**
  - Flat fees for: background checks, digital contracts, escrow, inspections.
  - Third‑party ads: movers, furniture, cleaning services.

---

### 9. MVP vs. Roadmap

#### 9.1 Web MVP (implemented)

- Auth, roles, and verification.
- Property search, map view, property details, comparison, shared properties.
- Agent/landlord dashboard: listing creation/editing, tagged photos, short‑let toggle, viewing fee configuration.
- Viewing management & payments, wallet, and withdrawals (via Flutterwave and virtual accounts).
- Messaging, agent catalogue, promotions, basic admin tooling.

#### 9.2 Mobile MVP (planned — Phase M2–M4)

**Tenant (M2)** — Auth, home/search, property detail, saved properties, push-ready shell.

**Landlord (M3)** — Listing CRUD, enquiries, wallet, promotions, KYC upload.

**Field verifier (M4)** — Assignments, GPS check‑in, photo capture, condition report.

**Not in mobile v1** (web or later mobile): full admin panel, bulk onboarding, advanced analytics dashboards.

#### 9.3 Backend expansion (in progress)

Aligned with `HouseMe_Backend_Technical.md`:

- Role migration: `tenant`, `landlord`, `real_estate_company`, `field_verifier`, `admin`.
- Field verification pipeline, area rent index, RNPL, legal documents, subscriptions.
- Microservices: gateway, auth, property, financial, legal, comms, analytics, marketplace.

#### 9.4 Product roadmap (high priority)

1. **Mobile apps** — Expo tenant + landlord shells, then field verifier.
2. **Area‑based rent index + comparable property panel**.
3. **Per‑listing price history + time‑on‑market visibility**.
4. **Fair rent recommendation for owners and renters.**
5. **Verified landlord track with badges and direct‑only marketplace positioning.**
6. **RNPL eligibility and application UI** (tenant mobile-first).
7. **Optional service layer**: background checks, digital contracts, escrow, inspections.

These roadmap items extend Nestin Estate into a **full Abuja‑first, anti‑inflation housing marketplace** across **web and native mobile**, aligned with the strategic concept above.

---

### 10. Related Documents

| Document | Purpose |
|----------|---------|
| [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md) | Web + mobile architecture, full feature list, AI model prompt |
| [`dev.md`](./dev.md) | Design tokens, screen-by-screen build specs |
| [`roadmap.md`](./roadmap.md) | Technical architecture for PRD §8 features |
| [`backend/HouseMe_Backend_Technical.md`](./backend/HouseMe_Backend_Technical.md) | Backend modules and API contracts |

