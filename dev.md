# Nestin Estate — Engineering Implementation Guide

> **Purpose**: This is the hands-on build guide. Every screen, component, API contract, and style token needed to start building today. Treat this as the source of truth alongside the codebase.

---

## Table of Contents

1. [Design System & Global Styles](#1-design-system--global-styles)
2. [Frontend — Page & Component Inventory](#2-frontend--page--component-inventory)
3. [Backend — API Contracts](#3-backend--api-contracts)
4. [Screen-by-Screen Build Specs](#4-screen-by-screen-build-specs)
   - [4.1 Landing Page](#41-landing-page)
   - [4.2 Search & Map View](#42-search--map-view)
   - [4.3 Property Detail Page](#43-property-detail-page)
   - [4.4 Agent / Landlord Dashboard](#44-agent--landlord-dashboard)
   - [4.5 Listing Creation Flow](#45-listing-creation-flow)
   - [4.6 Viewing Management](#46-viewing-management)
   - [4.7 Agent Wallet & Payouts](#47-agent-wallet--payouts)
   - [4.8 Area Dashboard Pages](#48-area-dashboard-pages)
   - [4.9 Verified Landlord Onboarding](#49-verified-landlord-onboarding)
   - [4.10 Services Catalog](#410-services-catalog)
   - [4.11 Contracts Flow](#411-contracts-flow)
   - [4.12 Admin Panel](#412-admin-panel)
   - [4.13 User Dashboard](#413-user-dashboard)
   - [4.14 Agent Profile & Catalogue](#414-agent-profile--catalogue)
5. [Shared Components Library](#5-shared-components-library)
6. [State Management & Data Fetching](#6-state-management--data-fetching)
7. [Environment & Config](#7-environment--config)

---

## 1. Design System & Global Styles

### 1.1 Design Direction

**Aesthetic**: Clean Nigerian-market authority — confident, modern, and trustworthy without being sterile. Think editorial real estate magazine meets West African warmth. Light-dominant with structured grids. Bold typography that commands attention. Earthy-warm accents to feel local and grounded.

**Principles**:
- Density where needed (search results), breathing room where trust matters (property detail, contract flows)
- Clear visual hierarchy: price > location > property type > metadata
- Mobile-first (mid-range Android is the primary device)
- Accessibility: WCAG AA contrast minimums

---

### 1.2 Color Tokens

```css
/* tailwind.config.js — extend colors */
/* Also set in :root for non-Tailwind usage */

:root {
  /* === PRIMARY BRAND === */
  --color-brand-primary:     #1A3C34;   /* Deep forest green — trust, authority */
  --color-brand-primary-mid: #2D6B5E;   /* Mid green — hover states, active */
  --color-brand-primary-light: #E8F5F1; /* Light tint — backgrounds, pills */

  /* === ACCENT === */
  --color-accent:            #E8794A;   /* Warm terracotta — CTAs, highlights */
  --color-accent-hover:      #D4613A;   /* Darker terracotta on hover */
  --color-accent-light:      #FDF0EA;   /* Accent tint — badges, alerts */

  /* === NEUTRALS === */
  --color-neutral-900:       #111827;   /* Near-black — headings */
  --color-neutral-700:       #374151;   /* Body text */
  --color-neutral-500:       #6B7280;   /* Secondary text, captions */
  --color-neutral-300:       #D1D5DB;   /* Borders, dividers */
  --color-neutral-100:       #F3F4F6;   /* Card backgrounds */
  --color-neutral-50:        #F9FAFB;   /* Page background */
  --color-white:             #FFFFFF;

  /* === SEMANTIC === */
  --color-success:           #059669;   /* Verified, confirmed */
  --color-success-light:     #ECFDF5;
  --color-warning:           #D97706;   /* Caution, pending */
  --color-warning-light:     #FFFBEB;
  --color-danger:            #DC2626;   /* Errors, disputes */
  --color-danger-light:      #FEF2F2;
  --color-info:              #2563EB;   /* Info states */
  --color-info-light:        #EFF6FF;

  /* === PRICE POSITIONING SIGNALS === */
  --color-price-below:       #059669;   /* Below market */
  --color-price-at:          #D97706;   /* At market */
  --color-price-above:       #DC2626;   /* Above market */

  /* === TRUST TIERS === */
  --color-trust-verified:    #059669;
  --color-trust-trusted:     #2563EB;
  --color-trust-basic:       #D97706;
  --color-trust-unverified:  #9CA3AF;
}
```

**Tailwind config extension:**

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary:  '#1A3C34',
          mid:      '#2D6B5E',
          light:    '#E8F5F1',
        },
        accent: {
          DEFAULT: '#E8794A',
          hover:   '#D4613A',
          light:   '#FDF0EA',
        },
        trust: {
          verified:   '#059669',
          trusted:    '#2563EB',
          basic:      '#D97706',
          unverified: '#9CA3AF',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],  // headings, prices, hero
        body:    ['DM Sans', 'system-ui', 'sans-serif'],    // all body text, UI
        mono:    ['JetBrains Mono', 'monospace'],           // prices in tables, codes
      },
      fontSize: {
        'display-2xl': ['4rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3rem',   { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-lg':  ['2.25rem',{ lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-md':  ['1.75rem',{ lineHeight: '1.25' }],
        'display-sm':  ['1.375rem',{ lineHeight: '1.3' }],
        'label-lg':    ['0.875rem',{ lineHeight: '1.4', letterSpacing: '0.06em', fontWeight: '600' }],
        'label-sm':    ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      borderRadius: {
        'card':  '12px',
        'pill':  '999px',
        'modal': '16px',
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.10)',
        'modal':   '0 20px 60px rgba(0,0,0,0.18)',
        'float':   '0 8px 24px rgba(26,60,52,0.16)',
      },
      spacing: {
        'section': '5rem',       // between page sections
        'card-p':  '1.5rem',     // card internal padding
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-in': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    }
  }
}
```

---

### 1.3 Typography Scale

```css
/* Google Fonts import — add to index.html */
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

/* Usage patterns */
.heading-hero    { font: 700 4rem/1.1 'Playfair Display'; letter-spacing: -0.02em; }
.heading-page    { font: 700 2.25rem/1.2 'Playfair Display'; letter-spacing: -0.01em; }
.heading-section { font: 600 1.75rem/1.25 'Playfair Display'; }
.heading-card    { font: 600 1.125rem/1.35 'DM Sans'; }
.body-lg         { font: 400 1rem/1.6 'DM Sans'; }
.body-sm         { font: 400 0.875rem/1.5 'DM Sans'; }
.label           { font: 600 0.75rem/1 'DM Sans'; letter-spacing: 0.08em; text-transform: uppercase; }
.price-display   { font: 700 1.5rem/1 'JetBrains Mono'; }
.price-lg        { font: 700 2rem/1 'JetBrains Mono'; }
```

---

### 1.4 Spacing & Layout Grid

```
Base unit: 4px (Tailwind default)
Content max-width: 1280px (max-w-screen-xl)
Container padding: 24px mobile, 48px tablet, 80px desktop

Page sections: 80px top/bottom (py-section)
Card grid: gap-6 (24px)
Form fields: gap-4 (16px) vertically, gap-6 in 2-col
```

---

### 1.5 Component Base Styles

```css
/* Global base — index.css */

* { box-sizing: border-box; }

body {
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--color-neutral-700);
  background: var(--color-neutral-50);
  -webkit-font-smoothing: antialiased;
}

/* Buttons */
.btn-primary {
  background: var(--color-accent);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font: 600 0.9375rem/1 'DM Sans';
  transition: all 0.18s cubic-bezier(0.25,0.46,0.45,0.94);
  border: none; cursor: pointer;
}
.btn-primary:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(232,121,74,0.3);
}
.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  background: transparent;
  color: var(--color-brand-primary);
  border: 1.5px solid var(--color-brand-primary);
  padding: 11px 24px;
  border-radius: 8px;
  font: 600 0.9375rem/1 'DM Sans';
  transition: all 0.18s ease;
}
.btn-secondary:hover {
  background: var(--color-brand-primary-light);
}

.btn-ghost {
  background: transparent;
  color: var(--color-neutral-700);
  padding: 11px 16px;
  border-radius: 8px;
  font: 500 0.875rem/1 'DM Sans';
  border: none; cursor: pointer;
}
.btn-ghost:hover { background: var(--color-neutral-100); }

/* Cards */
.card {
  background: var(--color-white);
  border-radius: 12px;
  box-shadow: var(--shadow-card, 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06));
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}

/* Form inputs */
.input-base {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--color-neutral-300);
  border-radius: 8px;
  font: 400 0.9375rem/1.4 'DM Sans';
  color: var(--color-neutral-900);
  background: var(--color-white);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}
.input-base:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(26,60,52,0.1);
}
.input-base::placeholder { color: var(--color-neutral-500); }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 999px; font: 600 0.6875rem/1 'DM Sans'; letter-spacing: 0.06em; text-transform: uppercase; }
.badge-verified   { background: var(--color-success-light); color: var(--color-success); }
.badge-pending    { background: var(--color-warning-light); color: var(--color-warning); }
.badge-danger     { background: var(--color-danger-light); color: var(--color-danger); }
.badge-brand      { background: var(--color-brand-primary-light); color: var(--color-brand-primary); }
.badge-accent     { background: var(--color-accent-light); color: var(--color-accent-hover); }
```

---

### 1.6 Icon Set

Use **Lucide React** (already in project) for all UI icons.

```tsx
// Standard icon sizes
<Icon size={16} />   // inline text icons, badges
<Icon size={20} />   // button icons, list items
<Icon size={24} />   // nav icons, card actions
<Icon size={32} />   // feature icons, empty states

// Key icons used across Nestin
import {
  Search, MapPin, Home, Building2, BedDouble, Bath, Maximize2,
  Star, CheckCircle, Shield, Eye, MessageCircle, Calendar,
  TrendingUp, TrendingDown, Minus, ArrowRight, ChevronDown,
  Upload, Download, FileText, Bell, Wallet, CreditCard,
  BarChart2, Map, List, Filter, X, Plus, Edit, Trash2,
  Lock, Unlock, AlertTriangle, Info, Clock, DollarSign
} from 'lucide-react';
```

---

## 2. Frontend — Page & Component Inventory

### 2.1 Route Map

```
/                               → Landing / Home
/search                         → Search results (list view)
/search/map                     → Map search view
/properties/:id                 → Property detail
/areas                          → Area explorer
/areas/:slug                    → Area dashboard
/agents                         → Agent catalogue
/agents/:id                     → Agent profile
/services                       → Services catalog
/auth                           → Auth (login / register)
/auth/landlord                  → Landlord-specific onboarding

/dashboard                      → Agent/Landlord dashboard
/dashboard/listings             → Manage listings
/dashboard/listings/new         → Create listing (multi-step)
/dashboard/listings/:id/edit    → Edit listing
/dashboard/viewings             → Viewing management
/dashboard/wallet               → Wallet & payouts
/dashboard/services             → Services ordered/managed
/dashboard/contracts            → Contract management
/dashboard/analytics            → Listing analytics

/user                           → Renter/buyer dashboard
/user/saved                     → Saved properties
/user/viewings                  → My viewings
/user/contracts                 → My contracts

/messages                       → Inbox
/messages/:conversationId       → Thread

/admin                          → Admin dashboard
/admin/properties               → Property management
/admin/users                    → User management
/admin/verifications            → Verification queue
/admin/reviews                  → Review moderation
/admin/areas                    → Area/rollout management
/admin/services                 → Services management
```

---

### 2.2 Component Tree

```
App
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── NavLinks
│   │   ├── SearchBar (mini)
│   │   ├── NotificationBell
│   │   └── UserMenu
│   ├── MobileNav
│   └── Footer
│
├── Pages
│   ├── Landing (Index.tsx)
│   │   ├── HeroSection
│   │   │   ├── HeroSearchBar
│   │   │   └── HeroStats (listings count, areas, agents)
│   │   ├── FeaturedListings
│   │   │   └── HouseCard (×n)
│   │   ├── AreaExplorerStrip
│   │   │   └── AreaCard (×n)
│   │   ├── HowItWorksSection
│   │   ├── TrustSignalsSection
│   │   └── ServicesTeaser
│   │
│   ├── Search (SearchMap.tsx)
│   │   ├── SearchFilters
│   │   │   ├── LocationFilter
│   │   │   ├── PriceRangeFilter
│   │   │   ├── PropertyTypeFilter
│   │   │   ├── BedroomFilter
│   │   │   ├── AmenitiesFilter
│   │   │   └── OwnerDirectToggle (NEW)
│   │   ├── SearchResultsHeader (count, sort, view toggle)
│   │   ├── ResultsList
│   │   │   └── HouseCard (×n)
│   │   ├── MapView (MapView.tsx)
│   │   │   ├── PropertyMapPin
│   │   │   └── PropertyMapPopup
│   │   └── AreaContextBanner (NEW)
│   │
│   ├── PropertyDetail (HouseDetails.tsx)
│   │   ├── PhotoGallery
│   │   ├── PropertyHeader
│   │   │   ├── PriceDisplay
│   │   │   ├── PricePositionBadge (NEW — below/at/above market)
│   │   │   └── AuthenticityBadge (NEW)
│   │   ├── PropertyMeta (beds/baths/sqm/type)
│   │   ├── PropertyDescription
│   │   ├── AmenitiesList
│   │   ├── AreaContextPanel (NEW)
│   │   │   ├── AreaRentIndexCard
│   │   │   └── PricePositionMeter
│   │   ├── PriceHistoryChart (NEW)
│   │   ├── ComparablePropertiesPanel (NEW)
│   │   ├── AgentContactCard
│   │   │   ├── AgentReviewScore (NEW)
│   │   │   ├── ViewingScheduleButton
│   │   │   └── MessageButton
│   │   └── ServicesUpsell (NEW — background check, inspection CTAs)
│   │
│   ├── AreaDashboard (NEW)
│   │   ├── AreaHeader
│   │   ├── AreaRentIndexGrid
│   │   │   └── RentIndexCard (per type+bedroom combo)
│   │   ├── AreaTrendChart (NEW)
│   │   ├── AreaListingGrid
│   │   └── AreaMapMini
│   │
│   ├── Dashboard (Dashboard.tsx) — Agent/Landlord
│   │   ├── DashboardSidebar
│   │   ├── DashboardHeader (stats strip)
│   │   ├── ListingGrid
│   │   │   └── ListingCard (with edit/delete/stats overlay)
│   │   ├── VerificationBanner
│   │   └── PricingCoachAlert (NEW)
│   │
│   ├── ListingCreation (NEW multi-step)
│   │   ├── StepIndicator
│   │   ├── Step1_BasicInfo
│   │   ├── Step2_Location
│   │   ├── Step3_Photos
│   │   ├── Step4_Pricing
│   │   │   └── FairRentEstimatePanel (NEW)
│   │   ├── Step5_ViewingFee
│   │   └── Step6_Review
│   │
│   └── Admin (Admin.tsx)
│       ├── AdminSidebar
│       ├── VerificationQueue (NEW)
│       ├── ReviewModerationQueue (NEW)
│       └── AreaManagementTable (NEW)
│
└── Shared Components (see §5)
```

---

## 3. Backend — API Contracts

> **Base URL**: `https://api.nestinestate.com/api`
> **Auth**: Bearer token (JWT) in `Authorization` header
> **Content-Type**: `application/json` unless noted

### 3.1 Auth Endpoints

```
POST /auth/register
  Body: { email, password, firstName, lastName, phone, role: 'tenant'|'agent'|'landlord' }
  Response: { user, accessToken, refreshToken }

POST /auth/login
  Body: { email, password }
  Response: { user, accessToken, refreshToken }

POST /auth/refresh
  Body: { refreshToken }
  Response: { accessToken, refreshToken }

POST /auth/verify-email
  Body: { token }

POST /auth/forgot-password
  Body: { email }

POST /auth/reset-password
  Body: { token, newPassword }

GET  /auth/me                          [auth]
  Response: { user (full profile) }

PATCH /auth/me                         [auth]
  Body: Partial<UserProfile>
```

---

### 3.2 Property Endpoints

```
GET /properties
  Query: {
    area?, city?, state?,
    propertyType?, listingType?,
    minPrice?, maxPrice?,
    bedrooms?, bathrooms?,
    isDirectListing?,          // owner-direct filter
    isFeatured?,
    isShortLet?,
    lat?, lng?, radiusKm?,     // geo search
    page?, limit?,             // pagination
    sortBy?: 'price_asc'|'price_desc'|'newest'|'days_on_market'
  }
  Response: {
    properties: Property[],
    total, page, limit, totalPages
  }

GET /properties/:id
  Response: Property (full detail with agent/landlord profile)

POST /properties                       [auth: agent|landlord]
  Body: CreatePropertyDto

PATCH /properties/:id                  [auth: owner]
  Body: Partial<CreatePropertyDto>

DELETE /properties/:id                 [auth: owner]

GET /properties/:id/price-history      [public]
  Response: PriceHistoryEvent[]

GET /properties/:id/days-on-market     [public]
  Response: { daysOnMarket: number, listedAt: Date }

GET /properties/:id/comparables        [public]
  Response: { comparables: Property[], areaMedian: number }

GET /properties/:id/authenticity-score [public]
  Response: { score: number, tier: string, breakdown: ScoreComponent[] }
```

**Property DTO (Create/Edit):**

```typescript
interface CreatePropertyDto {
  title: string;
  description: string;         // HTML rich text
  price: number;
  propertyType: 'apartment' | 'duplex' | 'self-con' | 'bungalow' | 'terrace' | 'mansion' | 'land';
  listingType: 'rent' | 'sale';
  bedrooms: number;
  bathrooms: number;
  toilets?: number;
  areaSqm?: number;
  address: {
    street: string;
    area: string;              // e.g., "Gwarinpa"
    city: string;
    state: string;             // default: "FCT"
  };
  amenities: string[];         // ['parking', 'generator', 'borehole', 'gym', 'security', 'pool', 'elevator']
  viewingFee?: number;
  isFeatured?: boolean;
  isShortLet?: boolean;
  isShared?: boolean;
  totalSlots?: number;
  isDirectListing?: boolean;   // owner-direct flag
  photos: {
    cloudinaryUrl: string;
    tag: 'bathroom'|'bedroom'|'kitchen'|'sitting_room'|'lobby'|'exterior'|'balcony'|'full_house'|'toilet'|'other';
    description?: string;
  }[];
  proofDocUrl: string;         // Cloudinary URL of proof of ownership/address
}
```

**Property Response Shape:**

```typescript
interface Property {
  _id: string;
  title: string;
  description: string;
  price: number;
  propertyType: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  toilets?: number;
  areaSqm?: number;
  address: Address;
  coordinates: { lat: number; lng: number };
  amenities: string[];
  viewingFee: number;
  isFeatured: boolean;
  isShortLet: boolean;
  isShared: boolean;
  totalSlots?: number;
  isDirectListing: boolean;
  photos: Photo[];
  
  // Computed / populated
  agent: AgentProfile;         // or landlord profile
  daysOnMarket: number;
  authenticityScore: number;
  authenticityTier: string;
  pricePosition?: 'below'|'at'|'above';  // vs area median
  areaMedian?: number;
  
  // Verification
  verifiedLandlordBadge: boolean;
  
  status: 'active'|'rented'|'sold'|'archived';
  createdAt: string;
  updatedAt: string;
}
```

---

### 3.3 Area Index Endpoints

```
GET /areas
  Response: {
    areas: AreaSummary[]  // name, slug, active listing count, avg rent
  }

GET /areas/:slug
  Response: {
    metadata: AreaMetadata,
    indices: AreaRentIndex[],    // all bedroom/type combinations
    activeListings: number,
    avgDaysOnMarket: number,
  }

GET /areas/:slug/index
  Query: { propertyType?, bedrooms?, listingType? }
  Response: AreaRentIndex

GET /areas/:slug/listings
  Query: { page?, limit?, sortBy? }
  Response: { properties: Property[], total }
```

**AreaRentIndex shape:**

```typescript
interface AreaRentIndex {
  area: string;
  propertyType: string;
  bedroomCount: number;
  listingType: string;
  sampleSize: number;
  p25: number;
  median: number;
  p75: number;
  mean: number;
  trendPercent: number;        // vs 6 months ago
  computedAt: string;
}
```

---

### 3.4 Rent Estimator Endpoints

```
POST /estimates/rent
  Body: {
    area: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    areaSqm?: number;
    amenities?: string[];
    condition?: 'new'|'renovated'|'standard'|'worn';
    listingType: 'rent'|'sale';
  }
  Response: {
    low: number;
    mid: number;
    high: number;
    confidenceLevel: 'high'|'medium'|'low';
    sampleSize: number;
    signals: { label: string; adjustment: string; impact: 'positive'|'negative'|'neutral' }[];
  }
```

---

### 3.5 Viewing Endpoints

```
GET  /viewings                          [auth: agent|landlord]
  Query: { status?, propertyId?, page? }
  Response: { viewings: Viewing[] }

POST /viewings/schedule                 [auth: tenant]
  Body: { propertyId, proposedDate, proposedTime, message? }
  Response: { viewing, paymentLink? }   // paymentLink if viewingFee > 0

GET  /viewings/:id                      [auth: parties involved]

PATCH /viewings/:id/confirm             [auth: agent|landlord]
  Body: { confirmedDate, confirmedTime }

PATCH /viewings/:id/complete            [auth: agent|landlord]

PATCH /viewings/:id/cancel              [auth: any party]
  Body: { reason? }

POST /viewings/payment-callback         [public — Flutterwave webhook]
```

---

### 3.6 Reviews Endpoints

```
POST /reviews                           [auth: tenant]
  Body: {
    subjectId: string;          // landlord or agent userId
    propertyId: string;
    ratings: {
      responsiveness: 1|2|3|4|5;
      fairness: 1|2|3|4|5;
      propertyCondition: 1|2|3|4|5;
      accuracy: 1|2|3|4|5;
    };
    comment: string;
  }
  Response: Review

GET /reviews
  Query: { subjectId, propertyId?, page?, limit? }
  Response: { reviews: Review[], total }

GET /users/:id/review-summary
  Response: {
    averageRating: number;
    totalReviews: number;
    breakdown: { responsiveness, fairness, propertyCondition, accuracy }
  }

POST /reviews/:id/flag                  [auth: any]
  Body: { reason: string }

GET  /admin/reviews/pending             [auth: admin]
PATCH /admin/reviews/:id/moderate       [auth: admin]
  Body: { action: 'approve'|'remove'; reason?: string }
```

---

### 3.7 Landlord Verification Endpoints

```
POST /landlord/verify/submit            [auth: landlord]
  Body: FormData {
    ninNumber: string;
    documents: File[];          // C of O, allocation paper, utility bill, ID
    propertyCount: number;
  }
  Response: { status: 'pending' }

GET /landlord/verify/status             [auth: landlord]
  Response: { status, submittedAt, verifiedAt?, rejectedReason? }

GET  /admin/verifications               [auth: admin]
  Query: { status?, page? }
  Response: { verifications: LandlordVerification[] }

PATCH /admin/verifications/:userId/approve  [auth: admin]
PATCH /admin/verifications/:userId/reject   [auth: admin]
  Body: { reason: string }
```

---

### 3.8 Wallet & Payout Endpoints

```
GET  /wallet                            [auth: agent|landlord]
  Response: { balance, pendingBalance, virtualAccount }

GET  /wallet/transactions               [auth: agent|landlord]
  Query: { page?, type? }
  Response: { transactions: WalletTransaction[] }

POST /wallet/withdraw                   [auth: agent|landlord]
  Body: { amount, pin }
  Response: { reference, status }

GET  /wallet/bank-settings              [auth: agent|landlord]
PATCH /wallet/bank-settings             [auth: agent|landlord]
  Body: { bankCode, accountNumber, accountName }

POST /wallet/pin/set                    [auth: agent|landlord]
  Body: { pin, confirmPin }

POST /wallet/pin/reset/initiate         [auth: agent|landlord]
POST /wallet/pin/reset/verify           [auth: agent|landlord]
  Body: { code, newPin }
```

---

### 3.9 Notifications Endpoints

```
GET  /notifications                     [auth]
  Query: { unread?, page? }
  Response: { notifications: Notification[], unreadCount }

PATCH /notifications/:id/read           [auth]
PATCH /notifications/read-all           [auth]
```

---

### 3.10 Contracts Endpoints

```
POST /contracts/initiate                [auth: agent|landlord]
  Body: {
    tenantId: string;
    propertyId: string;
    startDate: string;
    endDate: string;
    annualRent: number;
    cautionFee: number;
    serviceCharge?: number;
    paymentTerms?: string;
  }
  Response: { contract, paymentLink }   // agent pays contract flat fee

GET  /contracts/:id                     [auth: parties]
POST /contracts/:id/sign                [auth: landlord or tenant]
  Body: { otpCode: string }
GET  /contracts/:id/download-url        [auth: parties]
  Response: { url: string, expiresAt: string }

GET  /contracts                         [auth]
  Query: { role?: 'landlord'|'tenant' }
  Response: { contracts: Contract[] }
```

---

### 3.11 Background Checks Endpoints

```
POST /services/background-check/order  [auth: tenant]
  Body: { landlordId, propertyId }
  Response: { check, paymentLink }

GET  /services/background-check/:id    [auth: tenant or landlord]
GET  /landlord/background-checks       [auth: landlord]

POST /admin/background-checks/:id/upload-report  [auth: admin]
  Body: FormData { reportPdf: File, summary: object }
```

---

### 3.12 Messages Endpoints

```
GET  /conversations                     [auth]
  Response: { conversations: Conversation[] }

GET  /conversations/:id/messages        [auth: participant]
  Query: { before?, limit? }
  Response: { messages: Message[] }

POST /conversations                     [auth]
  Body: { recipientId, propertyId, initialMessage }
  Response: { conversation }

POST /conversations/:id/messages        [auth: participant]
  Body: { text, attachmentUrl? }
  Response: Message

PATCH /conversations/:id/read           [auth: participant]
```

---

## 4. Screen-by-Screen Build Specs

### 4.1 Landing Page

**Route**: `/`
**Component**: `Index.tsx`

#### Layout

```
[Navbar — sticky, transparent over hero → solid on scroll]

[HeroSection]
  Background: Full-width image (Abuja skyline or modern apartment) with 
              dark overlay gradient (bottom to top, 0.5 opacity)
  Content:
    Eyebrow: "Nigeria's Most Transparent Property Marketplace"
    H1: "Find Your Perfect Home in Abuja"
    Subheading: "Browse verified listings with real market pricing — no hidden fees, no inflated rents."
    [HeroSearchBar] — white pill, location input + property type + bedrooms + CTA button
    Trust strip: "12,400+ verified listings · 3,200+ landlords · Zero hidden fees"

[AreaExplorerStrip]
  Heading: "Browse by Area"
  Horizontal scroll (mobile) / 5-column grid (desktop) of AreaCards
  Each AreaCard: Area name, avg rent snippet, active listings count, thumbnail

[FeaturedListings]
  Heading: "Featured Properties"
  3-column card grid (desktop), 1-column (mobile)
  [HouseCard ×6]

[MarketInsightsBanner] — full-width brand-green background
  "Abuja's average 2BR rent is ₦1.1M/year. Is your search on track?"
  [Explore Market Data →]

[HowItWorksSection]
  3 steps: Browse verified listings → Schedule a viewing → Move in with confidence
  Icon + heading + description per step

[TrustSignalsSection]
  "Why Nestin?" — 4 trust pillars with icons:
    Verified Ownership · Real Market Prices · Direct Landlord Access · Protected Payments

[ServicesTeaser]
  Background check, Digital contract, Property inspection cards

[Footer]
```

#### Key Styling Notes

```css
/* Hero */
.hero-section {
  min-height: 85vh;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.2) 0%,
    rgba(0,0,0,0.55) 100%
  ), url('/hero-abuja.jpg') center/cover;
  display: flex; align-items: center;
}
.hero-search-bar {
  background: white;
  border-radius: 12px;
  padding: 8px;
  display: flex; gap: 0;
  box-shadow: 0 8px 40px rgba(0,0,0,0.25);
}
/* Area strip */
.area-card {
  aspect-ratio: 3/2;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
}
.area-card-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
}
```

---

### 4.2 Search & Map View

**Route**: `/search` and `/search/map`
**Component**: `SearchMap.tsx`

#### Layout

```
[Navbar — solid]

[Sticky Search Bar + Filters Row]
  Location input | Property type dropdown | Bedrooms | Price range | More filters ▾
  Right: View toggle (List | Map) | Sort dropdown | Results count

[Two-panel layout — desktop]
  Left 55%: Results list (scrollable)
    AreaContextBanner (if area filter active): "Avg 2BR in Gwarinpa: ₦1.1M"
    HouseCard grid (2-col on desktop left panel, 1-col mobile)
  Right 45%: Map (sticky, full height)
    PropertyMapPin (custom SVG pins, colour by price tier)
    PropertyMapPopup (mini card on pin click)

[Mobile]: Toggle between list and map via tab bar
```

#### HouseCard Design

```
┌────────────────────────────────┐
│ [Photo 16:9]                   │
│  [Featured badge]              │
│  [Owner Direct badge]          │
│  [Authenticity score ring]     │
├────────────────────────────────┤
│ ₦1,200,000/yr        [❤ Save] │
│ ▲ 9% above market             │  ← PricePositionBadge (red/orange/green)
│ 3 Bed · 2 Bath · Apartment    │
│ 📍 Gwarinpa, FCT              │
│ ⭐ 4.8 (12 reviews)  47 days  │
└────────────────────────────────┘
```

```css
.house-card { width: 100%; max-width: 420px; }
.house-card-photo { aspect-ratio: 16/9; object-fit: cover; border-radius: 12px 12px 0 0; }
.price-position-badge {
  font: 600 0.75rem/1 'DM Sans';
  padding: 2px 8px;
  border-radius: 4px;
}
.price-position-badge.above { color: #DC2626; background: #FEF2F2; }
.price-position-badge.at    { color: #D97706; background: #FFFBEB; }
.price-position-badge.below { color: #059669; background: #ECFDF5; }
```

---

### 4.3 Property Detail Page

**Route**: `/properties/:id`
**Component**: `HouseDetails.tsx`

#### Layout Structure

```
[Photo Gallery — full width, 2/3 main + 2 side thumbnails grid]

[Two-column layout below gallery — desktop]
  LEFT (65%): Property info
    [PropertyHeader]
      H1: Property title
      Price (JetBrains Mono, large)
      [PricePositionBadge] — "15% above area average"
      [AuthenticityBadge] — "Verified · Trust Score 87"
    
    [PropertyMeta strip]
      Beds | Baths | Sqm | Type | Listed N days ago
    
    [Description — rich text]
    
    [AmenitiesList — pill grid]
    
    ─────── NEW SECTIONS ───────
    
    [AreaContextPanel]
      Heading: "Market Context · Gwarinpa"
      AreaRentIndexCard: "Avg 2BR apartment: ₦1.1M – ₦1.4M/yr"
      PricePositionMeter: horizontal bar with listing price marker
    
    [PriceHistoryChart]
      Heading: "Price History"
      Recharts step-line, events annotated
      "Listed 47 days ago · Reduced once from ₦1.5M → ₦1.3M"
    
    [ComparablePropertiesPanel]
      Heading: "Similar Properties Nearby"
      Horizontal scroll of mini HouseCards (3–5)
    
    [ReviewsSection — if agent has reviews]
      AgentReviewSummary (stars + breakdown)
    
  RIGHT (35%): Sticky contact card
    [AgentContactCard]
      Agent photo, name, verified badge
      Review score: ⭐ 4.7 (23 reviews)
      Phone (click to reveal)
      [Message Agent] btn
      [Schedule Viewing] btn (opens modal, pays viewing fee)
    
    [ServicesUpsell]
      "Protect yourself:"
      · Request background check
      · Get a property inspection
      · Use digital contract
```

---

### 4.4 Agent / Landlord Dashboard

**Route**: `/dashboard`
**Component**: `Dashboard.tsx`

#### Layout

```
[Sidebar — desktop] / [Bottom tab bar — mobile]
  Links: Listings | Viewings | Wallet | Messages | Analytics | Settings

[Main content area]
  
  [Stats Strip — top]
    Active Listings | Total Views | Pending Viewings | Wallet Balance
    Each stat in a white card with subtle icon

  [Verification Banner — if not verified]
    ⚠️ "Complete verification to publish listings" [Verify Now →]

  [PricingCoachAlert — NEW, if stale listings]
    💡 "2 of your listings have had no enquiries in 30+ days. 
        Consider adjusting pricing." [View Suggestions →]
  
  [Listings Grid]
    Each ListingCard:
      Photo | Title | Price | Status | Days on Market
      Hover: Edit | Delete | View Analytics buttons
      [PricePositionBadge] on each card

  [Empty state — no listings]
    Illustration + "Add your first property" CTA
```

---

### 4.5 Listing Creation Flow

**Route**: `/dashboard/listings/new`

#### Multi-Step UI

```
[StepIndicator: 1 Basic · 2 Location · 3 Photos · 4 Pricing · 5 Viewing · 6 Review]

STEP 1 — Basic Info
  Title (text input)
  Property Type (pill selector — visual, not dropdown)
  Listing Type: [For Rent] [For Sale]
  Bedrooms (stepper: 0–10+)
  Bathrooms (stepper: 0–8+)
  Total Sqm (number input, optional)
  Short-let toggle
  Owner-direct toggle (with explanation tooltip)

STEP 2 — Location
  Street Address (text)
  Area / District (searchable dropdown — Nestin area list)
  City (auto: Abuja)
  State (auto: FCT)
  [Map preview — geocoded pin shown after address entry]

STEP 3 — Photos
  Drag-and-drop upload zone
  Min 3, Max 8 photos
  Tag selector per photo (pill select: Bedroom | Kitchen | Bathroom | etc.)
  Photo description (optional, per photo)
  Photo reorder (drag)

STEP 4 — Pricing
  Annual Rent or Sale Price (₦ input, formatted with commas)
  
  ───── NEW ─────
  [FairRentEstimatePanel — fetches from /estimates/rent]
    Loading skeleton → then:
    "Based on 24 similar listings in Gwarinpa:"
    Low ₦900K ←──────●──────→ High ₦1.4M  (your price marker)
    [Confidence badge: High / Medium / Low]
    Signals list: "+5% generator bonus · +3% parking"
    
    If price > P75: ⚠️ Warning nudge (soft, not blocking)
    If price < P25: 💡 Opportunity note
  
  Description (rich text editor — Quill or Tiptap)
  Amenities (checkbox grid with icons)
  
  Proof of Ownership upload (PDF/JPG/PNG, max 10MB)
  "This is for admin verification only — not shown publicly"

STEP 5 — Viewing Fee
  Toggle: "Charge a viewing fee?"
  Fee amount input (₦, 0 allowed)
  Explanation: "Viewing fees are held until the viewing is complete."
  
  Featured listing toggle
  Shared property toggle (+ slot count)

STEP 6 — Review & Publish
  Summary of all entered data
  Edit links per section
  [Publish Listing] button → POST /properties
```

#### FairRentEstimatePanel Styling

```css
.fair-rent-panel {
  background: var(--color-brand-primary-light);
  border: 1.5px solid #B7D9D1;
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 16px;
}
.rent-range-bar {
  height: 8px;
  background: linear-gradient(to right, #ECFDF5, #FFFBEB, #FEF2F2);
  border-radius: 4px;
  position: relative;
  margin: 16px 0;
}
.rent-range-marker {
  width: 16px; height: 16px;
  background: var(--color-neutral-900);
  border: 2.5px solid white;
  border-radius: 50%;
  position: absolute;
  top: 50%; transform: translate(-50%, -50%);
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}
.price-warning-nudge {
  display: flex; gap: 10px; align-items: flex-start;
  background: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  margin-top: 12px;
}
```

---

### 4.6 Viewing Management

**Route**: `/dashboard/viewings`

#### Layout

```
[Tabs: Pending | Confirmed | Completed | Cancelled]

[Viewing Table / Cards]
  Each row/card:
    Tenant name | Property | Proposed date | Fee paid | Status
    Actions: Confirm → opens date picker | Complete | Cancel
  
  [Empty state per tab]

[Viewing Detail Modal — on row click]
  Tenant info (name, phone — visible after fee paid)
  Property: thumbnail + title
  Fee status: Paid ✓ | Unpaid
  Date/time picker (to confirm)
  Notes field
  [Confirm] [Decline]
```

---

### 4.7 Agent Wallet & Payouts

**Route**: `/dashboard/wallet`

#### Layout

```
[Balance Card — brand green background]
  Available Balance: ₦245,000
  Pending: ₦18,000
  Virtual Account: 0123456789 · Wema Bank
  [Withdraw] button

[Bank Settings Card]
  Bank name | Account number | Account name
  [Edit Bank Details]

[Transaction History]
  Filter: All | Viewing Fees | Withdrawals | Promotions
  Table: Date | Description | Amount | Status
  
  Empty state: "No transactions yet"

[PIN Management — collapsible section]
  Set PIN / Reset PIN flows
```

---

### 4.8 Area Dashboard Pages

**Route**: `/areas/:slug`
**Component**: `AreaDashboard.tsx` — NEW

#### Layout

```
[Area Hero]
  Breadcrumb: Home > Areas > Gwarinpa
  H1: "Gwarinpa, Abuja"
  Subheading: "X active listings · Updated today"
  [AreaMapMini — small map with bounding box]

[Rent Index Grid]
  Heading: "Current Rent Benchmarks"
  Filter pills: [All Types] [Apartment] [Duplex] [Self-con]
  
  Grid of RentIndexCards per bedroom count:
  ┌─────────────────────────────┐
  │ 2 Bedroom Apartment        │
  │ ₦1.1M median / year        │
  │ ₦900K ────────── ₦1.4M     │  ← P25 to P75 bar
  │ ↑ 8% vs 6 months ago       │
  │ Based on 34 listings        │
  └─────────────────────────────┘

[Trend Chart]
  Line chart: median rent over past 12 months
  Per bedroom filter

[Active Listings in this Area]
  Same search result card grid + pagination

[Compare Areas CTA]
  "See how Gwarinpa compares" → links to /areas
```

---

### 4.9 Verified Landlord Onboarding

**Route**: `/auth/landlord`

#### Multi-Step Layout

```
[Clean centered layout, 640px max, white card]
[Progress: Step 1 of 4]

STEP 1 — Your Details
  Full name | NIN | Phone | Email

STEP 2 — Ownership Documents
  Upload zones (each with drag-and-drop):
    1. Certificate of Occupancy or Allocation Letter *
    2. Recent Utility Bill (proof of address) *
    3. Government-issued ID *
  File format note: PDF, JPG, PNG · Max 10MB each
  
  Security note: "These documents are reviewed only by Nestin's verification team."

STEP 3 — Property Declaration
  "How many properties do you own?"
  Stepper: 1 / 2 / 3 / 4 / 5+
  
  "Are you the sole owner or do you have co-owners?"
  Radio: Sole owner | Co-owner

STEP 4 — Submit
  Summary list of uploaded docs (filenames with ✓)
  [Submit for Verification]
  
  Post-submit state:
    ✅ "Application Submitted"
    "We'll review your documents within 1–2 business days.
     You'll receive an email when approved."
```

---

### 4.10 Services Catalog

**Route**: `/services`

#### Layout

```
[Page Header]
  "Optional Services · Flat Fees · No Surprises"

[Services Grid — 2 col desktop, 1 col mobile]

  [BackgroundCheckCard]
    Icon: Shield
    Title: Tenant Background Check
    Price: ₦15,000
    Description: Employment verification, references, credit check summary
    "For Landlords" badge
    [Order Now] btn

  [ContractCard]
    Icon: FileText
    Title: Digital Tenancy Contract
    Price: ₦5,000
    Description: Nigeria-law aligned template, both parties e-sign
    [Generate Contract] btn

  [EscrowCard]
    Icon: Lock
    Title: Protected Rent Payment
    Price: "1.5% of transaction"
    Description: Rent held securely until you confirm move-in
    [Learn More] btn

  [InspectionCard]
    Icon: Search
    Title: Property Inspection
    Price: ₦25,000
    Description: Certified inspector, photo report, condition rating
    [Book Inspector] btn

[Third-party Services — lighter styling]
  Heading: "Partners"
  Movers | Furniture Rental | Cleaning Services
  Each: Logo + short description + [Get a Quote] link
```

---

### 4.11 Contracts Flow

**Route**: `/dashboard/contracts` and `/contracts/:id`

#### Contract List

```
[Tabs: Active | Awaiting Signature | Completed | Cancelled]

Table columns:
  Tenant name | Property | Start date | Rent | Status | Actions

Actions per row:
  View | Send reminder | Download PDF
```

#### Contract Detail View

```
[Contract Preview — formatted document view]
  Watermark: "DRAFT" (before fully signed) | "EXECUTED" (after)

[Signature Status Panel — right side sticky]
  Landlord: ✓ Signed on [date] / ⏳ Awaiting signature
  Tenant:   ⏳ Link sent · 2 days ago / ✓ Signed on [date]
  
  [Sign Now] button — triggers OTP email → OTP modal → confirmation
  [Send Reminder] button
  [Download PDF] — only available after both signed
```

---

### 4.12 Admin Panel

**Route**: `/admin`

#### Layout

```
[Sidebar: Dashboard | Properties | Users | Verifications | Reviews | Areas | Services | Settings]

[Verification Queue — /admin/verifications]
  Filter: Pending | Approved | Rejected
  
  Table:
    Name | NIN | Submitted | Docs | Action
  
  Row expand:
    Inline document viewer (PDF/image)
    NIN display
    Notes field
    [Approve ✓] [Reject ✗ with reason]

[Review Moderation — /admin/reviews]
  Pending approval queue
  Each: Reviewer | Subject | Rating | Comment | Property
  [Approve] [Remove] [Flag]

[Area Management — /admin/areas]
  Table: Area | Active | Indexed | Listings | Avg Rent | Toggle | Edit
  [Bulk Invite button — CSV upload for landlord onboarding]
  
[Properties — /admin/properties]
  All properties with status
  Flag / Remove / Edit
  Filter: Flagged | Unverified | Featured | Stale (60+ days)
```

---

### 4.13 User Dashboard (Renter/Buyer)

**Route**: `/user`

#### Layout

```
[Tabs: Saved Properties | My Viewings | My Contracts | Background Checks]

[Saved Properties]
  HouseCard grid of saved/favorited properties
  Empty: "You haven't saved any properties yet" + [Browse Listings]

[My Viewings]
  Table: Property | Date | Status | Fee | Actions
  Status pill: Pending | Confirmed | Complete | Cancelled
  [Rate this landlord] prompt after complete

[My Contracts]
  Table: Property | Landlord | Start | End | Status | Download
  [Sign Now] if awaiting tenant signature

[Background Checks]
  Table: Property | Landlord | Ordered | Status | Result
```

---

### 4.14 Agent Profile & Catalogue

**Route**: `/agents` and `/agents/:id`

#### Agent Profile Page

```
[Profile Header]
  Avatar | Name | [Verified Agent ✓] or [Verified Landlord ✓] badge
  Member since | Response rate | Active listings count

[Review Score Card — NEW]
  ⭐ 4.7 / 5.0
  Based on 23 reviews
  Progress bars per dimension:
    Responsiveness: ████████░░ 4.8
    Fairness:        ███████░░░ 4.5
    Property Accuracy: ████████░ 4.6
    Condition:       █████████░ 4.9

[Active Listings Grid]
  HouseCard ×n

[Reviews List — NEW]
  Each review: Reviewer initials | Star rating | Date | Comment | Property
  Paginated

[Report Agent button — small, ghost, at bottom]
```

---

## 5. Shared Components Library

### 5.1 PriceDisplay

```tsx
interface PriceDisplayProps {
  amount: number;
  listingType: 'rent' | 'sale';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPerYear?: boolean;
}
// Renders: ₦1,200,000/yr  in JetBrains Mono
// Formats with Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })
```

### 5.2 PricePositionBadge

```tsx
interface PricePositionBadgeProps {
  position: 'below' | 'at' | 'above';
  percentDiff: number;   // e.g. 15 for "15% above"
}
// Renders: ↑ 15% above market | ≈ At market | ↓ 8% below market
// Color: danger for above | warning for at | success for below
```

### 5.3 AuthenticityBadge

```tsx
interface AuthenticityBadgeProps {
  score: number;
  tier: 'verified' | 'trusted' | 'basic' | 'unverified';
  expandable?: boolean;    // shows breakdown on click
}
// Renders: coloured shield icon + tier label
// Expandable: opens popover with score breakdown
```

### 5.4 AreaRentIndexCard

```tsx
interface AreaRentIndexCardProps {
  area: string;
  propertyType: string;
  bedrooms: number;
  p25: number;
  median: number;
  p75: number;
  trendPercent: number;
  sampleSize: number;
}
// Renders: median price large + P25–P75 gradient bar + trend badge
```

### 5.5 ReviewScoreCard

```tsx
interface ReviewScoreCardProps {
  averageRating: number;
  totalReviews: number;
  breakdown: {
    responsiveness: number;
    fairness: number;
    propertyCondition: number;
    accuracy: number;
  };
  compact?: boolean;   // compact = just stars + count (for property cards)
}
```

### 5.6 StepIndicator

```tsx
interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (step: number) => void; // only for completed steps
}
// Renders: horizontal step bar with completed/current/future states
```

### 5.7 NotificationBell

```tsx
// Polls GET /notifications/unread-count every 60s
// Badge: red dot with count if unreadCount > 0
// Click: opens notification drawer (slide-in from right)
```

### 5.8 UploadZone

```tsx
interface UploadZoneProps {
  accept: string;           // e.g. 'image/*,application/pdf'
  maxSizeMB: number;
  onUpload: (cloudinaryUrl: string) => void;
  label?: string;
  description?: string;
  currentUrl?: string;      // shows preview if already uploaded
}
// Drag-and-drop zone → uploads to Cloudinary via backend proxy
// Shows progress bar during upload
// Shows thumbnail/filename after success
```

### 5.9 ConfirmDialog

```tsx
interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;    // default: "Confirm"
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}
// Modal with accessible focus trap
// Danger variant: red confirm button
```

### 5.10 LoadingSkeleton

```tsx
// Standard skeleton variants matching Nestin card shapes:
<HouseCardSkeleton />
<RentIndexCardSkeleton />
<ReviewCardSkeleton />
<StatCardSkeleton />
// All use CSS animation: pulse (opacity 0.5 → 1, 1.5s infinite)
```

---

## 6. State Management & Data Fetching

### 6.1 React Query Setup

```tsx
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5 min — area index, estimates
      retry: 2,
      refetchOnWindowFocus: false,
    }
  }
});

// Stale time overrides per query:
//   Notifications: 60 seconds
//   Properties list: 2 minutes
//   Area rent index: 30 minutes
//   User profile: Infinity (invalidate on mutation)
```

### 6.2 Query Keys Convention

```typescript
export const queryKeys = {
  properties: {
    all: ['properties'],
    list: (filters: object) => ['properties', 'list', filters],
    detail: (id: string) => ['properties', id],
    priceHistory: (id: string) => ['properties', id, 'price-history'],
    comparables: (id: string) => ['properties', id, 'comparables'],
    authenticityScore: (id: string) => ['properties', id, 'authenticity'],
  },
  areas: {
    all: ['areas'],
    detail: (slug: string) => ['areas', slug],
    index: (slug: string, filters: object) => ['areas', slug, 'index', filters],
  },
  estimates: {
    rent: (params: object) => ['estimates', 'rent', params],
  },
  reviews: {
    bySubject: (subjectId: string) => ['reviews', subjectId],
    summary: (userId: string) => ['reviews', 'summary', userId],
  },
  notifications: {
    all: ['notifications'],
    unreadCount: ['notifications', 'unread-count'],
  },
  wallet: {
    balance: ['wallet', 'balance'],
    transactions: (filters: object) => ['wallet', 'transactions', filters],
  },
  viewings: {
    all: (filters: object) => ['viewings', filters],
  },
  contracts: {
    all: (role: string) => ['contracts', role],
    detail: (id: string) => ['contracts', id],
  },
};
```

### 6.3 Auth State (Zustand)

```typescript
// src/stores/authStore.ts
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAgent: () => boolean;
  isLandlord: () => boolean;
  isAdmin: () => boolean;
  isVerified: () => boolean;
}
```

### 6.4 API Client

```typescript
// src/lib/apiClient.ts
// Axios instance with:
//   - Base URL from env
//   - Auth header interceptor (reads from authStore)
//   - 401 interceptor → refreshes token → retries once → clears auth

// All API calls go through typed service files:
// src/services/propertyService.ts
// src/services/areaService.ts
// src/services/reviewService.ts
// src/services/walletService.ts
// src/services/contractService.ts
// etc.
```

---

## 7. Environment & Config

### 7.1 Frontend `.env`

```env
VITE_API_BASE_URL=https://api.nestinestate.com/api
VITE_CLOUDINARY_CLOUD_NAME=nestinestate
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx
VITE_GOOGLE_MAPS_API_KEY=AIzaSy_xxxxx
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx       # optional
VITE_POSTHOG_KEY=phc_xxxxx                           # optional analytics
```

### 7.2 Backend `.env`

```env
# App
NODE_ENV=production
PORT=3000
APP_URL=https://api.nestinestate.com

# Database
MONGODB_URI=mongodb+srv://...

# Auth
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
SMTP_FROM=no-reply@nestinestate.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=nestinestate
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Flutterwave
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=xxxxx
FLUTTERWAVE_WEBHOOK_HASH=xxxxx

# Google Maps (geocoding)
GOOGLE_MAPS_API_KEY=AIzaSy_xxxxx

# Redis (for caching — optional MVP)
REDIS_URL=redis://localhost:6379

# Admin
ADMIN_EMAILS=admin@nestinestate.com
```

### 7.3 NestJS Module Structure (New Modules)

```
src/
├── modules/
│   ├── auth/            (existing)
│   ├── users/           (existing)
│   ├── properties/      (existing — extend with price-history, comparables)
│   ├── viewings/        (existing)
│   ├── payments/        (existing)
│   ├── messages/        (existing)
│   ├── admin/           (existing)
│   │
│   ├── area-index/      (NEW)
│   │   ├── area-index.module.ts
│   │   ├── area-index.service.ts
│   │   ├── area-index.controller.ts
│   │   ├── area-index.cron.ts
│   │   └── schemas/area-rent-index.schema.ts
│   │
│   ├── estimates/       (NEW)
│   │   ├── estimates.module.ts
│   │   ├── estimates.service.ts
│   │   └── estimates.controller.ts
│   │
│   ├── reviews/         (NEW)
│   │   ├── reviews.module.ts
│   │   ├── reviews.service.ts
│   │   ├── reviews.controller.ts
│   │   └── schemas/review.schema.ts
│   │
│   ├── contracts/       (NEW)
│   │   ├── contracts.module.ts
│   │   ├── contracts.service.ts
│   │   ├── contracts.controller.ts
│   │   └── schemas/contract.schema.ts
│   │
│   ├── escrow/          (NEW)
│   │   ├── escrow.module.ts
│   │   ├── escrow.service.ts
│   │   └── schemas/escrow-transaction.schema.ts
│   │
│   ├── background-checks/ (NEW)
│   │   ├── background-checks.module.ts
│   │   ├── background-checks.service.ts
│   │   └── schemas/background-check.schema.ts
│   │
│   ├── inspections/     (NEW)
│   │   ├── inspections.module.ts
│   │   ├── inspections.service.ts
│   │   └── schemas/inspection-booking.schema.ts
│   │
│   ├── notifications/   (NEW)
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── notifications.controller.ts
│   │   └── schemas/notification.schema.ts
│   │
│   └── price-history/   (NEW — or fold into properties module)
│       ├── price-history.service.ts
│       └── schemas/price-history.schema.ts
│
├── common/
│   ├── guards/          (JwtAuthGuard, RolesGuard)
│   ├── decorators/      (CurrentUser, Roles)
│   ├── filters/         (GlobalExceptionFilter)
│   ├── interceptors/    (LoggingInterceptor, TransformInterceptor)
│   └── pipes/           (ValidationPipe config)
│
└── main.ts
```

---

*Engineering Guide v1.0 — Nestin Estate*
*Pair this document with the Architecture MD for full system context.*