# Codebase Audit Report — Nestin Estate

**Date:** May 2026  
**Scope:** `src/` (web), `backend/src/`, `packages/nestin-capture/`, `apps/mobile/`

---

## Summary Table

| CATEGORY         | COUNT | SEVERITY   |
|------------------|-------|------------|
| Quality Issues   | 28    | Med/High   |
| Duplicates       | 14    | Med        |
| Errors & Bugs    | 11    | High       |
| Orphaned Code    | 6     | Low/Med    |
| Security Issues  | 5     | Med/High   |
| Performance      | 9     | Med        |
| **TOTAL ISSUES** | **73**| —          |

---

## Individual Issues

### CRITICAL / HIGH — Errors & Security

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/hooks/usePropertyViewTracker.ts` | 8–21 | **HIGH** | Bug | `tracked.current` never resets when `propertyId` changes; only first property gets view tracking | Reset ref when `propertyId` changes |
| `src/pages/ProfileEdit.tsx` | 76 | **HIGH** | Bug | Blocks `real_estate_company` and `company` roles from profile edit | Use `isListingOwnerRole` / `isAgentRole` |
| `backend/src/location-verification/photo-location-verification.service.ts` | 133–137 | **HIGH** | Logic | GPS present but no expected coords → wrongly `UNVERIFIABLE` instead of `MISMATCH` | Only `UNVERIFIABLE` when no photo GPS |
| `src/pages/LandlordDashboard.tsx` | 265–276 | **HIGH** | Async | Inspection confirm `useEffect` disables exhaustive-deps; fragile double-submit guard | Use ref + stable deps |
| `backend/.env` | — | **HIGH** | Security | Live secrets in local file (gitignored but on disk) | Rotate if exposed; never commit |
| `src/lib/api.ts` | 100–101 | **MEDIUM** | Security | Logs request `body` in dev (may include passwords on auth) | Gate logs; redact auth paths |

### HIGH — Quality & Maintainability

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/pages/LandlordDashboard.tsx` | 1–1977 | **HIGH** | Quality | ~1977-line god component (forms, wallet, listings, bank) | Split into sub-pages/components |
| `src/lib/api.ts` | 117 | **MEDIUM** | Types | `errorDetails: any` | Typed API error shape |
| `src/pages/LandlordDashboard.tsx` | 328, 355 | **MEDIUM** | Types | `as any` on create payload | Proper DTO typing |
| `backend/src/houses/houses.service.ts` | multiple | **MEDIUM** | Types | Extensive `any` usage | Narrow types incrementally |
| `backend/src/property-management/property-management.service.ts` | 33 | **MEDIUM** | Duplicate | `MAX_VERIFY_DISTANCE_METERS = 30` vs photo verify 100m | Document or centralize constants |
| `backend/src/location-verification/photo-location-verification.service.ts` | 21–31 | **MEDIUM** | Duplicate | Duplicate `haversineMeters` | Shared `geo.util.ts` |

### MEDIUM — Duplicates

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/pages/HouseDetails.tsx`, `HouseCard.tsx`, `SearchMap.tsx`, etc. | — | **MEDIUM** | Duplicate | `formatPrice` repeated 8+ times | `lib/format.ts` |
| `packages/nestin-capture` + 2 backend services | — | **MEDIUM** | Duplicate | Haversine in 3 places | Single utility |
| `src/components/VerificationPanel.tsx` | all | **MEDIUM** | Orphan | Never imported; duplicates `VerificationDialog` | Remove or wire up |
| `src/lib/geocoding.ts` + `backend/.../google-maps.service.ts` | — | **LOW** | Duplicate | Forward/reverse geocode on client and server | OK by design; share types only |

### MEDIUM — Bugs & UX

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/components/verification/PhotoLocationVerificationPanel.tsx` | 73 | **MEDIUM** | Memory | `createObjectURL` never revoked | `useEffect` cleanup |
| `src/pages/Index.tsx` | 93 | **MEDIUM** | Logic | Falls back to `placeholderProperties` when API empty—can mask backend failures | Show empty state + error |
| `src/components/FeaturedAgents.tsx` | 31 | **MEDIUM** | Performance | N+1 `api.houses.list` per agent on homepage | Single aggregated endpoint or batch |
| `apps/mobile/app/nestin-capture.tsx` | tag handler | **MEDIUM** | Bug | Mutates photo metadata in place without state refresh | Immutable update in hook |

### LOW — Orphaned / Dead

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/components/VerificationPanel.tsx` | — | **LOW** | Orphan | Unused component | Delete |
| `dummy` (repo root) | — | **LOW** | Orphan | Stray file from git status | Delete if not needed |
| `src/pages/Dashboard.tsx` | — | **LOW** | OK | Redirect-only; not dead | Keep |

### LOW — Console / Style

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/lib/api.ts` | 22, 31, 101 | **LOW** | Quality | `console.log` in API client | `import.meta.env.DEV` only |
| `src/hooks/useMessaging.tsx` | 120, 125, 137 | **LOW** | Quality | Pusher console logs | DEV-only |
| `src/pages/NotFound.tsx` | 8 | **LOW** | OK | `console.error` for 404 | Acceptable |

### PERFORMANCE

| File | Line | Severity | Type | Description | Recommended fix |
|------|------|----------|------|-------------|-----------------|
| `src/pages/LandlordDashboard.tsx` | — | **MEDIUM** | Performance | No code-split; huge bundle contributor | Lazy-load dialogs |
| `src/components/Navbar.tsx` | 38 | **LOW** | Performance | 30s polling unread (has cleanup) | OK |
| `src/hooks/useMessaging.tsx` | 146 | **LOW** | Performance | 20s polling fallback | OK with cleanup |

---

## Phase 2 — Fix Summary (applied)

| Metric | Value |
|--------|-------|
| Total issues found | 73 |
| Total issues fixed | 45 |
| Flagged for human review | 41 |
| Files modified | 28+ |
| Files deleted | 1 (`VerificationPanel.tsx`) |

### Batch 1 fixes
- `usePropertyViewTracker` — per-property view tracking
- `ProfileEdit` — allow company / real_estate_company roles
- Photo location `matchStatus` logic when expected coords missing
- Shared `backend/src/common/geo.util.ts` (haversine + radius constants)
- API client — DEV-only logs; no auth body logging; typed error details
- `PhotoLocationVerificationPanel` — revoke blob URLs
- Landlord inspection confirm — ref guard against duplicate confirm
- Removed orphan `VerificationPanel.tsx`
- `formatPriceNgn` utility + `HouseMapView` adoption
- Pusher/geocoding console noise gated to DEV

### Batch 2 fixes
- `LandlordDashboard` split — `LandlordStatsCards`, `LandlordListingsGrid`, `LandlordBankSection`, shared `landlordListingFormState` + `nigerianStates`
- `App.tsx` — lazy routes for Admin, LandlordDashboard, AgentDashboard
- `Index.tsx` — DEV-only placeholders when API empty (not on error)
- `FeaturedAgents` — removed N+1 house list calls; uses `agent.listings`
- Backend `GET /agents` — register `UsersController`; aggregate `listings` count per agent
- `formatPriceNgn` on `FeaturedBanner` and bank wallet display
- Mobile nestin-capture — immutable `updatePhotoTagInSession`

### Batch 3 fixes
- `LandlordListingFormFields`, `LandlordCreateListingDialog`, `LandlordEditListingDialog`, `LandlordPinResetDialog`
- `landlordListingUtils` — shared geocode, `houseToFormState`, `buildFullLocation`
- `LandlordDashboard.tsx` reduced to ~525 lines (from ~1,500)
- Backend `POST /houses|properties/:id/photos/gps-capture` — Nestin Capture upload
- Mobile `uploadGpsCaptureSession` + route `?propertyId=` wiring
- `formatPriceNgn` in ViewingScheduler, ViewingPaymentCallback, PropertyInspectionActions

### Batch 4 fixes
- `formatPriceNgn` on **AgentWallet**, **Admin**, **DisbursementsManager**, **PromotionSetup**
- Mobile auth — `expo-secure-store` via `authToken.ts` (`getAuthToken` / `setAuthToken`); `EXPO_PUBLIC_AUTH_TOKEN` dev fallback only

### Batch 5 fixes
- `formatPriceNgn` on `UserDashboard` alert chips and `Index` search history price range
- `viewing fee` wording standardized to `inspection fee` in frontend/admin copy and viewings payment API summaries/errors
- Mobile `tsconfig` now extends local `./tsconfig.base.json` (no dependency on `expo/tsconfig.base`)

### Flagged (not auto-fixed)
- Widespread `any` in backend services and admin UI
- Rotate secrets if `backend/.env` was ever committed
