# Nestin Estate — Remaining Features: Detailed Architecture

> **Status**: This document maps every feature from the PRD roadmap (Section 8) that is **not yet implemented**, with full technical architecture for each. Use this as the engineering blueprint for Phases 2–5.

---

## Table of Contents

1. [Feature Gap Summary](#1-feature-gap-summary)
2. [Area-Based Rent Index](#2-area-based-rent-index)
3. [Per-Listing Price History & Time-on-Market](#3-per-listing-price-history--time-on-market)
4. [Fair Rent Recommendation AI](#4-fair-rent-recommendation-ai)
5. [Verified Landlord Track](#5-verified-landlord-track)
6. [Optional Flat-Fee Service Layer](#6-optional-flat-fee-service-layer)
7. [Transparency & Trust Features](#7-transparency--trust-features)
8. [Rollout & Geography Controls](#8-rollout--geography-controls)
9. [Monetization Extensions](#9-monetization-extensions)
10. [Cross-Cutting Concerns](#10-cross-cutting-concerns)
11. [Database Schema Additions](#11-database-schema-additions)
12. [API Endpoint Map](#12-api-endpoint-map)
13. [Implementation Phasing](#13-implementation-phasing)

---

## 1. Feature Gap Summary

| # | Feature Area | PRD Ref | Priority | Effort |
|---|---|---|---|---|
| 1 | Area Rent Index + Comparable Panel | §8.2 | P0 | L |
| 2 | Per-Listing Price History | §8.1 | P0 | M |
| 3 | Fair Rent AI Estimator | §8.3 | P0 | L |
| 4 | Verified Landlord Track | §8.4 | P1 | M |
| 5 | Background Checks Service | §8.5 | P1 | L |
| 6 | Digital Contract & E-Sign | §8.5 | P1 | L |
| 7 | Escrowed Rent & Deposit | §8.5 | P2 | L |
| 8 | On-Demand Property Inspections | §8.5 | P2 | M |
| 9 | Rent History Display per Unit | §8.6 | P1 | S |
| 10 | Landlord/Agent Review System | §8.6 | P1 | M |
| 11 | Listing Authenticity Score | §8.6 | P2 | M |
| 12 | Geographic Rollout Controls | §8.7 | P1 | S |
| 13 | Enhanced Featured Listings | §8.8 | P2 | M |
| 14 | Value-Added Services Catalog | §8.8 | P2 | M |

**Effort key**: S = 1–3 days, M = 1–2 weeks, L = 2–4 weeks

---

## 2. Area-Based Rent Index

### 2.1 Overview

Compute and display real-time rent averages, distribution bands, and trends per Abuja area. Surfaces directly in search, on property pages, and on public area dashboard pages.

### 2.2 Data Model

```typescript
// MongoDB Collection: area_rent_indices
{
  _id: ObjectId,
  area: string,               // e.g., "Gwarinpa", "Lugbe", "Jabi"
  state: string,              // e.g., "FCT"
  propertyType: enum,         // apartment | duplex | self-con | bungalow | terrace
  bedroomCount: number,       // 0 (self-con), 1, 2, 3, 4, 5+
  listingType: enum,          // rent | sale
  
  // Computed stats (refreshed by cron)
  sampleSize: number,
  p25: number,                // ₦ — 25th percentile
  median: number,             // ₦ — 50th percentile
  p75: number,                // ₦ — 75th percentile
  mean: number,               // ₦
  
  // Trend
  previousMedian: number,     // median 6 months ago
  trendPercent: number,       // % change (+ up, - down)
  
  computedAt: Date,
  dataWindowDays: number,     // e.g. 180 (rolling 6-month window)
}

// MongoDB Collection: area_metadata
{
  _id: ObjectId,
  slug: string,               // "gwarinpa"
  displayName: string,        // "Gwarinpa"
  coordinates: { lat, lng },  // centroid for map
  boundingBox: GeoJSON,       // polygon for filtering
  isActive: boolean,          // rollout gate (see §8)
  description: string,
}
```

### 2.3 Backend Architecture

#### Aggregation Pipeline (NestJS Cron Job)

```
CronJob (runs nightly, or on-demand via admin trigger)
  └─> PropertyService.computeAreaIndex()
        ├─ MongoDB $group aggregation:
        │    - Filter: status=active, listingType, bedroomCount, area
        │    - Compute: $percentile (MongoDB 7.0+) or manual quantile
        │    - Window: last N days (configurable, default 180)
        └─> Upsert AreaRentIndex documents
```

**NestJS modules to create:**

- `AreaIndexModule`
  - `AreaIndexService` — aggregation logic, caching
  - `AreaIndexController` — REST endpoints
  - `AreaIndexCron` — scheduled recomputation

#### Caching Strategy

```
Redis (or in-memory LRU for MVP):
  Key: area-index:{area}:{propertyType}:{bedrooms}:{listingType}
  TTL: 6 hours
  Invalidation: on new listing creation/edit in same area
```

### 2.4 API Endpoints

```
GET /api/areas                          → list all active areas with metadata
GET /api/areas/:slug                    → single area detail + all index buckets
GET /api/areas/:slug/index              → rent index for area (filterable)
  ?propertyType=apartment
  ?bedrooms=2
  ?listingType=rent
GET /api/areas/:slug/listings           → active listings in area (paginated)

POST /api/admin/areas/recompute         → admin trigger to recompute (auth: admin)
```

### 2.5 Frontend Architecture

#### New Pages/Components

```
/areas                          → Area explorer landing (grid of active areas)
/areas/:slug                    → Public area dashboard page

Components:
  AreaIndexCard                 → Displays median, P25/P75, trend arrow
  RentDistributionBar           → Visual band: P25 | median | P75 with labels
  AreaMiniMap                   → Small map with area boundary overlay
  AreaListingGrid               → Paginated listings filtered to area
  TrendBadge                    → "↑ 8% vs 6 months ago" badge
```

#### Integration Points (Existing Pages)

- **`SearchMap.tsx`**: Add "Area Averages" toggle layer on map showing heatmap or area labels.
- **`HouseDetails.tsx`**: Add `AreaContextPanel` below price — shows area median and whether this listing is above/at/below.
- **Search filters**: Add "Show area average" contextual tooltip when user sets a price filter.

### 2.6 Comparable Properties Panel

```typescript
// AreaIndexService.getComparables(propertyId: string): Property[]
// Logic:
//   1. Load target property (area, type, bedrooms, price)
//   2. Query: same area + type + bedrooms, status=active, exclude self
//   3. Sort by proximity to target price (nearest first)
//   4. Return top 5–10 with price, days on market, and thumbnail
```

**Frontend component: `ComparablePropertiesPanel`** (renders on `HouseDetails.tsx`)

```
┌────────────────────────────────────┐
│ Similar Properties in Gwarinpa     │
│ ─────────────────────────────────  │
│ [Photo] 3BR Apt  ₦1.1M  ↗ Similar │
│ [Photo] 3BR Apt  ₦1.3M  ↗ Pricier │
│ [Photo] 3BR Apt  ₦950K  ↘ Cheaper │
└────────────────────────────────────┘
```

---

## 3. Per-Listing Price History & Time-on-Market

### 3.1 Overview

Track every price change and status change on a property over its lifetime. Display as a timeline/chart on the property detail page.

### 3.2 Data Model

```typescript
// MongoDB Collection: property_price_history
{
  _id: ObjectId,
  propertyId: ObjectId,       // ref: properties
  agentId: ObjectId,          // ref: users
  event: enum,                // listed | price_changed | relisted | rented | sold | removed
  price: number,              // ₦ at this event
  previousPrice?: number,     // null for first listing
  note?: string,              // optional agent note e.g., "Price reduction"
  timestamp: Date,
  daysOnMarket?: number,      // computed: days since first listing event
}
```

**Mongoose hook** (on `Property` schema pre-save):

```typescript
// PropertySchema.pre('save') — auto-record price history
if (doc.isModified('price')) {
  await PriceHistoryService.record({
    propertyId: doc._id,
    event: doc.isNew ? 'listed' : 'price_changed',
    price: doc.price,
    previousPrice: doc.isNew ? undefined : original.price,
  });
}
```

### 3.3 Backend

**New service: `PriceHistoryService`**

```typescript
record(dto: CreateHistoryDto): Promise<PriceHistory>
getByProperty(propertyId: string): Promise<PriceHistory[]>
getDaysOnMarket(propertyId: string): Promise<number>
```

**Endpoints:**

```
GET /api/properties/:id/price-history   → full event log for a property
GET /api/properties/:id/days-on-market  → simple { days: number }
```

### 3.4 Frontend

**New component: `PriceHistoryChart`** (renders inside `HouseDetails.tsx`)

```
Technology: Recharts (already in React ecosystem)

Chart type: Step line chart (price on Y, date on X)
Events overlaid as icons:
  🟢 Listed
  🔵 Price Change
  🔴 Rented/Sold

Below chart:
  "Listed 47 days ago · Price reduced once (from ₦1.5M → ₦1.3M)"
```

---

## 4. Fair Rent Recommendation AI

### 4.1 Overview

ML/AI-powered rent estimator that shows landlords a "fair" rent range during listing creation and shows renters contextual pricing signals on property pages.

### 4.2 Architecture Options

**Option A — Rules-Based (MVP, no ML infra needed):**
Use the Area Rent Index P25/P75 bands + adjustments for:
- Floor area (sq.m per bedroom vs area average)
- Amenity set (parking, generator, water, gym)
- Recency of renovation
- Floor level

**Option B — Regression Model (Phase 2):**
Train a gradient-boosted regressor (XGBoost) on historical listing + transaction data. Host as a Python microservice (FastAPI) called from NestJS.

**Recommended: Start with Option A; migrate to B once 1,000+ data points accumulated.**

### 4.3 Option A — Rules Engine Architecture

```typescript
// FairRentService.estimate(input: RentEstimateInput): RentEstimate

interface RentEstimateInput {
  area: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  areaSqm?: number;
  amenities: string[];       // ['parking', 'generator', 'borehole', 'gym', 'security']
  condition: 'new' | 'renovated' | 'standard' | 'worn';
  listingType: 'rent' | 'sale';
}

interface RentEstimate {
  low: number;               // ₦ — P25-based floor
  mid: number;               // ₦ — recommended midpoint
  high: number;              // ₦ — P75-based ceiling
  confidenceLevel: 'high' | 'medium' | 'low';  // based on sample size
  sampleSize: number;
  signals: EstimateSignal[]; // list of adjustments applied with reasoning
}

// Adjustment factors (configurable in DB)
const ADJUSTMENTS = {
  amenities: { parking: 0.03, generator: 0.05, gym: 0.08 },
  condition: { new: 0.10, renovated: 0.05, worn: -0.10 },
};
```

### 4.4 Data Model

```typescript
// MongoDB Collection: rent_estimate_configs
// Admin-configurable adjustment weights
{
  _id: ObjectId,
  key: string,              // e.g., "amenity.generator"
  adjustmentFactor: number, // multiplier applied to base estimate
  updatedAt: Date,
}
```

### 4.5 API Endpoints

```
POST /api/estimates/rent
  Body: RentEstimateInput
  Response: RentEstimate

GET /api/estimates/rent
  ?area=Gwarinpa&propertyType=apartment&bedrooms=2&listingType=rent
  Response: RentEstimate (GET equivalent for sharing/deep-linking)
```

### 4.6 Frontend Integration

#### Listing Creation (`Dashboard.tsx`)

```
After price field input:
┌──────────────────────────────────────────┐
│ 💡 Fair Rent Estimate for this property  │
│ ₦900K – ₦1.1M  (based on 24 comparables)│
│ ████████████░░░  Your price: ₦1.4M       │
│ ⚠️ You're 27% above the recommended range│
│ [Adjust Price]  [Keep My Price]          │
└──────────────────────────────────────────┘
```

#### Property Detail (`HouseDetails.tsx`)

```
For renters:
┌──────────────────────────────────────────┐
│ Market Context                           │
│ Area average for 2BR in Gwarinpa: ₦1.1M │
│ This listing: ₦1.3M (+18% above average)│
└──────────────────────────────────────────┘
```

#### Owner Pricing Coach (Dashboard notification)

```
After 30+ days with no viewing requests:
"Your 3BR apartment in Gwarinpa has had no enquiries in 34 days.
 Listings in this range typically receive their first enquiry in 12 days.
 Consider reducing your price by 8–12% to match current demand."
```

**New NestJS cron job:** `StaleListingCoachCron` — runs weekly, queries listings with no viewings in N days, sends email/in-app notification.

---

## 5. Verified Landlord Track

### 5.1 Overview

A distinct onboarding and badging system for individual property owners (not agents). Creates trust signals visible on listings and profiles.

### 5.2 Data Model Changes

```typescript
// Extend User schema:
{
  accountType: enum,           // NEW: 'tenant' | 'agent' | 'landlord' | 'admin'
  landlordVerification: {
    status: enum,              // pending | verified | rejected
    submittedAt: Date,
    verifiedAt?: Date,
    rejectedReason?: string,
    documents: [               // C of O, allocation paper, utility bill
      { type: string, cloudinaryUrl: string, uploadedAt: Date }
    ],
    propertyCount: number,     // how many properties this landlord owns (self-declared)
  },
  isDirectLandlord: boolean,   // flag — shows "no agent" badge on listings
}

// Extend Property schema:
{
  ownerType: enum,             // 'agent' | 'landlord'
  isDirectListing: boolean,    // no third-party agent involved
  verifiedLandlordBadge: boolean,
}
```

### 5.3 Onboarding Flow (Frontend)

```
New route: /join/landlord

Step 1: Basic Info
  - Full name, phone, NIN (National ID Number)

Step 2: Ownership Docs
  - Upload: Certificate of Occupancy / Allocation Letter
  - Upload: Recent utility bill (address match)
  - Upload: Government-issued ID

Step 3: Property Count Declaration
  - "How many properties do you own?"

Step 4: Review & Submit → pending admin review

Step 5 (post-approval): Profile shows "Verified Landlord ✓" badge
```

### 5.4 Admin Verification UI

**New admin view section: `LandlordVerification`**

```
Table: Pending Landlord Verifications
Columns: Name | Submitted | Documents | NIN | Action

On row expand:
  - Document viewer (inline PDF/image)
  - Approve button → sets status=verified, sends confirmation email
  - Reject button (with reason field) → sends rejection email
```

### 5.5 Badge Display

- **Profile page**: "✓ Verified Landlord" green badge + "Individual Owner · No Agency Fees" sub-label.
- **Property card**: Small "🏠 Owner Direct" badge overlay.
- **Search filters**: New filter toggle — "Owner-direct listings only".

---

## 6. Optional Flat-Fee Service Layer

### 6.1 Background Checks Service

#### Architecture

```
Tenant purchases → Nestin collects flat fee (via Flutterwave)
                 → Integrates with 3rd-party provider (CRC Bureau or FirstCentral)
                 → OR manual process: ops team runs check, uploads report
                 → Report summary visible to landlord via dashboard
```

#### Data Model

```typescript
// MongoDB Collection: background_checks
{
  _id: ObjectId,
  tenantUserId: ObjectId,
  landlordUserId: ObjectId,
  propertyId: ObjectId,
  status: enum,           // ordered | in_progress | complete | failed
  fee: number,            // ₦ flat fee at time of order
  paymentRef: string,     // Flutterwave reference
  
  // Results (populated by ops or API)
  reportUrl?: string,     // Cloudinary PDF
  summary: {
    employmentVerified?: boolean,
    referenceScore?: number,
    creditFlag?: boolean,
    notes?: string,
  },
  
  orderedAt: Date,
  completedAt?: Date,
}
```

#### Endpoints

```
POST /api/services/background-check/order   → tenant initiates, creates payment
GET  /api/services/background-check/:id     → status check
GET  /api/landlord/background-checks        → landlord view of checks on their properties
POST /api/admin/background-checks/:id/upload-report → ops uploads completed report
```

---

### 6.2 Digital Contract & E-Sign

#### Architecture

```
Template Engine (NestJS):
  - Pre-built tenancy agreement template (Nigeria-law aligned)
  - Populated from: listing data + landlord profile + tenant profile

E-Sign:
  Option A (MVP): OTP-based "agree & sign" — tenant and landlord each confirm via email OTP
  Option B: Integrate with YouSign or DocuSign API

Storage:
  - Signed contract PDF → Cloudinary (private bucket)
  - Both parties receive email copy
```

#### Data Model

```typescript
// MongoDB Collection: contracts
{
  _id: ObjectId,
  propertyId: ObjectId,
  landlordId: ObjectId,
  tenantId: ObjectId,
  
  templateVersion: string,
  populatedData: object,     // merged template fields snapshot
  
  status: enum,              // draft | sent | landlord_signed | tenant_signed | fully_executed | cancelled
  
  landlordSignature: {
    signedAt?: Date,
    otpVerified: boolean,
    ipAddress?: string,
  },
  tenantSignature: {
    signedAt?: Date,
    otpVerified: boolean,
    ipAddress?: string,
  },
  
  contractPdfUrl?: string,   // generated after both sign
  fee: number,               // ₦ flat fee
  paymentRef: string,
  
  startDate: Date,
  endDate: Date,
  monthlyRent?: number,
  annualRent: number,
  cautionFee: number,
  serviceCharge?: number,
  
  createdAt: Date,
  executedAt?: Date,
}
```

#### Flow

```
1. Landlord initiates → selects tenant (from viewing/message thread)
2. System pre-fills contract from listing + profile data
3. Landlord reviews and edits terms → pays flat fee
4. Tenant receives email: "Review & Sign Your Tenancy Agreement"
5. Tenant reviews → signs (OTP confirm)
6. Landlord receives notification → countersigns (OTP confirm)
7. System generates PDF → stores in Cloudinary
8. Both parties receive signed PDF via email
```

---

### 6.3 Escrowed Rent & Deposit

#### Architecture

```
Flutterwave Split Payment / Virtual Account:
  Tenant pays → Flutterwave holds in platform sub-account
  Release condition: move-in confirmation OR N days after move-in + no dispute

Dispute window: 7 days from listed move-in date
  - Either party can raise dispute → ops review → manual resolution
  - Auto-release if no dispute in 7 days
```

#### Data Model

```typescript
// MongoDB Collection: escrow_transactions
{
  _id: ObjectId,
  contractId: ObjectId,
  propertyId: ObjectId,
  tenantId: ObjectId,
  landlordId: ObjectId,
  
  type: enum,              // rent | caution_fee | service_charge
  amount: number,          // ₦
  
  status: enum,            // held | release_pending | released | disputed | refunded
  
  flutterwaveRef: string,
  flutterwaveSubAccountId: string,
  
  moveInDate: Date,
  autoReleaseDate: Date,   // moveInDate + 7 days (configurable)
  
  releasedAt?: Date,
  disputeRaisedAt?: Date,
  disputeResolution?: string,
  
  createdAt: Date,
}
```

---

### 6.4 On-Demand Property Inspections

#### Architecture

```
Inspector Network:
  - Verified inspector accounts (new user role: 'inspector')
  - Inspector profile: service area, availability, rating

Booking Flow:
  Tenant or Landlord initiates booking → selects inspector → pays flat fee
  Inspector receives job → conducts inspection → uploads report (photos + notes)
  Report stored in Cloudinary → visible to both parties in property detail
```

#### Data Model

```typescript
// Extend User schema:
{ role: 'inspector', inspectorProfile: { serviceAreas, rating, completedJobs } }

// MongoDB Collection: inspection_bookings
{
  _id: ObjectId,
  propertyId: ObjectId,
  bookedBy: ObjectId,          // tenant or landlord
  inspectorId: ObjectId,
  status: enum,                // booked | confirmed | completed | cancelled
  scheduledDate: Date,
  fee: number,
  paymentRef: string,
  
  report?: {
    uploadedAt: Date,
    photos: string[],          // Cloudinary URLs
    notes: string,
    rating: number,            // inspector's condition rating (1–5)
    cloudinaryReportPdf?: string,
  },
}
```

---

## 7. Transparency & Trust Features

### 7.1 Rent History Display per Unit

**Goal**: Show previous rent amounts for a specific unit address over time — surfacing aggressive rent hikes.

```typescript
// PriceHistoryService.getUnitHistory(address: string): PriceHistory[]
// Match by normalized address string across multiple listing documents
// (Same physical unit may have been listed multiple times by same or different agents)

// Display on HouseDetails.tsx:
"Previous rent for this unit:
  2022 → ₦600,000/yr
  2023 → ₦800,000/yr  (+33%)
  2024 → ₦1,100,000/yr (+38%)"
```

**Note**: Address normalization is critical. Use a NestJS `AddressNormalizationService` that strips unit numbers and standardizes street abbreviations before matching.

---

### 7.2 Landlord/Agent Review System

#### Data Model

```typescript
// MongoDB Collection: reviews
{
  _id: ObjectId,
  reviewerId: ObjectId,     // tenant who submits
  subjectId: ObjectId,      // landlord or agent being reviewed
  propertyId: ObjectId,     // which property this review is for
  type: enum,               // 'landlord' | 'agent'
  
  ratings: {
    responsiveness: number,   // 1–5
    fairness: number,         // 1–5
    propertyCondition: number,// 1–5
    accuracy: number,         // 1–5 (listing vs reality)
  },
  overallRating: number,     // computed average
  
  comment: string,
  isVerified: boolean,       // reviewer had confirmed viewing/tenancy
  
  // Moderation
  status: enum,              // pending | approved | flagged | removed
  flagReason?: string,
  
  createdAt: Date,
}
```

#### Eligibility Gate

A tenant can only review a landlord/agent if they have a **completed viewing** or **executed contract** with them.

```typescript
// ReviewService.canReview(reviewerId, subjectId, propertyId): boolean
// Check: exists completed ViewingRequest OR executed Contract
```

#### Aggregate Score (cached)

```typescript
// UserService.getReviewSummary(userId: string): ReviewSummary
// { averageRating, totalReviews, breakdown: { responsiveness, fairness, ... } }
// Cache with 1-hour TTL; invalidate on new approved review
```

#### Frontend Integration

- **AgentProfile.tsx**: Add `ReviewScoreCard` + paginated `ReviewList`.
- **HouseDetails.tsx**: Show agent's aggregate score next to agent info.
- **Post-viewing**: After viewing is marked complete, prompt tenant with "Rate your experience" modal.

#### Admin Moderation

```
Admin panel → Reviews tab
  - Queue of pending reviews awaiting approval
  - Approve / Flag / Remove with notes
  - Flagged counter on agent profile for admin visibility
```

---

### 7.3 Listing Authenticity Score

**Composite score (0–100) displayed as a Trust Badge on each listing.**

#### Score Components

| Signal | Weight | Source |
|---|---|---|
| Agent/Landlord verification status | 30% | User.isVerified |
| Proof of ownership document submitted | 20% | Property.proofDoc |
| Photo quality & count (3+ tagged photos) | 15% | Property.photos |
| Agent review score | 15% | Reviews aggregate |
| Days since listing without disputes | 10% | PriceHistory + disputes |
| Contact info completeness | 10% | User profile |

#### Architecture

```typescript
// AuthenticityScoreService.compute(propertyId: string): AuthenticityScore
interface AuthenticityScore {
  score: number;           // 0–100
  tier: 'verified' | 'trusted' | 'basic' | 'unverified';
  breakdown: ScoreComponent[];
}

// Recomputed on:
//   - Listing edit
//   - Agent verification status change
//   - New review approved
//   - Dispute raised/resolved
// Stored on Property document: { authenticityScore, authenticityTier, scoreUpdatedAt }
```

#### Frontend

- Property card: colour-coded badge (green/yellow/orange/red) based on tier.
- HouseDetails: Expandable breakdown explaining each component.

---

## 8. Rollout & Geography Controls

### 8.1 Data Model

```typescript
// MongoDB Collection: area_rollout_config
{
  _id: ObjectId,
  area: string,
  slug: string,
  isActive: boolean,
  isIndexed: boolean,          // include in rent index
  allowNewListings: boolean,   // gate listing creation to active areas
  promotionActive: boolean,    // area-specific marketing campaign
  launchDate?: Date,
  notes: string,               // internal ops notes
}
```

### 8.2 Gating Logic

```typescript
// In PropertyService.createListing():
const areaConfig = await AreaRolloutService.getConfig(listing.area);
if (!areaConfig?.allowNewListings) {
  // Allow anyway but flag as "outside active coverage" for admin visibility
  // OR: soft-block and show "Coming soon to your area" message
}
```

### 8.3 Admin Panel Feature

```
Admin → Areas tab
  Table: area | active | indexed | listings count | avg rent | actions
  Actions: Toggle active | Toggle indexed | Edit metadata | Export landlord list
```

### 8.4 Bulk Landlord Onboarding Tool

```typescript
// Admin: POST /api/admin/areas/:slug/bulk-invite
// Body: CSV with { name, phone, email, propertyAddress }
// Creates User accounts with temporary passwords + sends onboarding email
// Used for field-level kiosk onboarding campaigns
```

---

## 9. Monetization Extensions

### 9.1 Enhanced Featured Listings

**New promotion slot types** (extend existing `PromotionSetup`):

| Slot | Description | Duration | Price (₦) |
|---|---|---|---|
| `homepage_hero` | Carousel on landing page | 7 days | TBD |
| `area_top` | Top of area search results | 14 days | TBD |
| `map_highlight` | Pin highlight on map | 7 days | TBD |
| `search_top` | Top of filtered search | 7 days | TBD |

**Data model addition:**

```typescript
// Extend existing Promotion schema:
{
  slotType: enum,              // 'standard_featured' | 'homepage_hero' | 'area_top' | 'map_highlight' | 'search_top'
  targetArea?: string,         // for 'area_top' slot
  impressions: number,         // tracking
  clicks: number,
}
```

**Frontend: `PromotionSetup.tsx` extension** — add slot selection step with pricing, reach estimates, and slot availability calendar.

---

### 9.2 Value-Added Services Catalog

**New route: `/services`** (public) and `/dashboard/services` (authenticated)

Services to surface:

| Service | Provider | Model |
|---|---|---|
| Background Check | Nestin (ops) or 3rd party | Flat fee, tenant pays |
| Digital Contract | Nestin (in-app) | Flat fee, landlord initiates |
| Escrow | Nestin (via Flutterwave) | % of transaction, capped |
| Property Inspection | Inspector network | Flat fee, either party |
| Moving Services | 3rd-party ad integration | Referral / CPC |
| Furniture Rental | 3rd-party ad integration | Referral / CPC |
| Cleaning Services | 3rd-party ad integration | Referral / CPC |

**3rd-party ads**:

```typescript
// MongoDB Collection: service_ads
{
  _id: ObjectId,
  category: enum,          // 'movers' | 'furniture' | 'cleaning'
  advertiserName: string,
  logoUrl: string,
  ctaUrl: string,
  targetArea?: string,
  isActive: boolean,
  impressions: number,
  clicks: number,
}

// Simple admin CRUD for managing ads
// Display: contextual placement on relevant pages (post-booking, post-signing)
```

---

## 10. Cross-Cutting Concerns

### 10.1 Notifications Architecture

All new features require a unified notification system:

```typescript
// NotificationService.send(dto: NotificationDto)
// Channels: email (SMTP, already exists) | in-app (new) | SMS (future)

// MongoDB Collection: notifications
{
  _id: ObjectId,
  userId: ObjectId,
  type: string,           // e.g., 'rent_coach_alert' | 'review_request' | 'contract_signed'
  title: string,
  body: string,
  data: object,           // deep-link context
  readAt?: Date,
  createdAt: Date,
}

// Frontend: NotificationBell component in nav (polling or WebSocket)
// GET /api/notifications?unread=true  → count badge
// GET /api/notifications               → paginated list
// PATCH /api/notifications/:id/read
```

### 10.2 Event Bus / Audit Log

For all financial and verification events, add an immutable audit log:

```typescript
// MongoDB Collection: audit_events (no updates, only inserts)
{
  _id: ObjectId,
  actorId: ObjectId,
  actorType: enum,       // 'user' | 'system' | 'admin'
  action: string,        // e.g., 'escrow.released' | 'contract.executed' | 'review.approved'
  targetType: string,
  targetId: ObjectId,
  metadata: object,
  ipAddress?: string,
  createdAt: Date,
}
```

### 10.3 File Handling Extension

Current: Cloudinary for photos and proof docs.

New uploads needed:

| Feature | File Types | Access Control |
|---|---|---|
| Background check reports | PDF | Landlord + ops only |
| Signed contracts | PDF | Both parties + admin |
| Inspection reports | PDF + JPEG | Both parties |
| Landlord verification docs | PDF/JPG/PNG | Admin only |

All sensitive documents should use **Cloudinary signed URLs** with short expiry (15 min), served via backend proxy endpoint.

```typescript
// GET /api/documents/:docId/signed-url
// Auth: Only parties with rights to the document
// Returns: { url: string, expiresAt: Date }
```

---

## 11. Database Schema Additions

### Summary of New Collections

| Collection | Purpose |
|---|---|
| `area_rent_indices` | Computed rent stats per area/type/bedroom |
| `area_metadata` | Area geo data and rollout config |
| `area_rollout_config` | Ops control over geographic rollout |
| `property_price_history` | All price and status events per listing |
| `rent_estimate_configs` | Admin-configurable AI adjustment weights |
| `background_checks` | Background check orders and results |
| `contracts` | Digital tenancy contracts |
| `escrow_transactions` | Escrowed payment records |
| `inspection_bookings` | Inspector booking and reports |
| `reviews` | Tenant reviews of landlords/agents |
| `notifications` | In-app notification feed |
| `audit_events` | Immutable audit log |
| `service_ads` | 3rd-party ad slots |

### Existing Schema Modifications

| Collection | New Fields |
|---|---|
| `users` | `accountType`, `landlordVerification`, `isDirectLandlord`, `inspectorProfile` |
| `properties` | `ownerType`, `isDirectListing`, `verifiedLandlordBadge`, `authenticityScore`, `authenticityTier`, `daysOnMarket` |
| `promotions` | `slotType`, `targetArea`, `impressions`, `clicks` |

---

## 12. API Endpoint Map

### New Endpoints by Module

```
Area Index
  GET  /api/areas
  GET  /api/areas/:slug
  GET  /api/areas/:slug/index
  GET  /api/areas/:slug/listings
  POST /api/admin/areas/recompute          [admin]

Price History
  GET  /api/properties/:id/price-history
  GET  /api/properties/:id/days-on-market

Fair Rent Estimator
  POST /api/estimates/rent
  GET  /api/estimates/rent

Landlord Verification
  POST /api/auth/landlord/register
  POST /api/auth/landlord/submit-docs
  GET  /api/admin/landlord-verifications   [admin]
  PATCH /api/admin/landlord-verifications/:id/approve  [admin]
  PATCH /api/admin/landlord-verifications/:id/reject   [admin]

Background Checks
  POST /api/services/background-check/order
  GET  /api/services/background-check/:id
  GET  /api/landlord/background-checks
  POST /api/admin/background-checks/:id/upload-report  [admin]

Contracts
  POST /api/contracts/initiate
  GET  /api/contracts/:id
  POST /api/contracts/:id/sign            [landlord or tenant]
  GET  /api/contracts/:id/download-url

Escrow
  POST /api/escrow/create
  POST /api/escrow/:id/confirm-move-in
  POST /api/escrow/:id/raise-dispute
  GET  /api/escrow/:id/status

Inspections
  GET  /api/inspectors
  POST /api/inspections/book
  GET  /api/inspections/:id
  POST /api/inspections/:id/upload-report [inspector]

Reviews
  POST /api/reviews
  GET  /api/reviews?subjectId=:id
  GET  /api/users/:id/review-summary
  GET  /api/admin/reviews/pending         [admin]
  PATCH /api/admin/reviews/:id/moderate   [admin]

Authenticity Score
  GET  /api/properties/:id/authenticity-score

Geography/Rollout
  GET  /api/admin/areas/rollout           [admin]
  PATCH /api/admin/areas/:slug/config     [admin]
  POST /api/admin/areas/:slug/bulk-invite [admin]

Notifications
  GET  /api/notifications
  PATCH /api/notifications/:id/read
  GET  /api/notifications/unread-count

Signed Document URLs
  GET  /api/documents/:docId/signed-url

Services Catalog
  GET  /api/services
  GET  /api/admin/service-ads             [admin]
  POST /api/admin/service-ads             [admin]
```

---

## 13. Implementation Phasing

### Phase 2 — Transparency Core (Weeks 1–6)

**Goal**: Give renters and landlords real market data and pricing intelligence.

1. **Area Rent Index** (weeks 1–3)
   - Build `AreaIndexModule` with aggregation cron
   - Create `/areas` and `/areas/:slug` pages
   - Integrate `AreaContextPanel` into `HouseDetails.tsx`

2. **Price History & Days on Market** (weeks 2–4)
   - Add Mongoose hook for automatic history recording
   - Build `PriceHistoryChart` component

3. **Fair Rent Estimator — Rules Engine** (weeks 4–6)
   - Build `FairRentService` using index data
   - Integrate into listing creation form and property detail page

4. **Comparable Properties Panel** (weeks 5–6)
   - Query logic in `AreaIndexService`
   - `ComparablePropertiesPanel` on property detail

---

### Phase 3 — Trust & Verification (Weeks 7–12)

**Goal**: Elevate platform trust with reviews, badges, and verified landlord differentiation.

1. **Verified Landlord Track** (weeks 7–9)
   - New onboarding flow + document upload
   - Admin verification queue
   - Badge display on profiles and listing cards

2. **Review System** (weeks 8–11)
   - `reviews` collection + service + controller
   - Post-viewing review prompt
   - AgentProfile integration
   - Admin moderation UI

3. **Listing Authenticity Score** (weeks 10–12)
   - `AuthenticityScoreService` + score storage
   - Badge on property cards and detail pages

4. **Geography Controls** (weeks 11–12)
   - `area_rollout_config` collection
   - Admin area management panel
   - Soft gating logic in listing creation

---

### Phase 4 — Services Layer (Weeks 13–20)

**Goal**: Monetise trust and reduce agent dependency with optional services.

1. **Background Checks** (weeks 13–15)
2. **Digital Contracts & E-Sign** (weeks 14–18)
3. **Escrowed Payments** (weeks 17–20)
4. **Property Inspections** (weeks 18–20)

---

### Phase 5 — Monetization & Growth (Weeks 21–26)

1. **Enhanced Featured Listing Slots** (weeks 21–22)
2. **Services Catalog Page** (weeks 22–23)
3. **3rd-party Ad Slots** (weeks 23–24)
4. **Fair Rent AI — ML Upgrade** (weeks 24–26, once data threshold reached)
5. **Bulk Landlord Onboarding Tool** (weeks 25–26)

---

*Document version: 1.0 — Generated from Nestin Estate PRD v1*
*Next review: After Phase 2 kickoff*