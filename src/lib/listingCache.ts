import type { FilterParams, House } from '@/types';

const STORAGE_PREFIX = 'flowcheq_listings_v1';
const PROMOTIONS_KEY = `${STORAGE_PREFIX}:promotions`;
const DEFAULT_CATALOG_KEY = 'catalog:default';

/** How long cached listings stay fresh before a silent background refresh */
export const LISTINGS_STALE_MS = 30 * 60 * 1000; // 30 minutes

/** Promotions refresh less often — banner images are cached by the browser after first load */
export const PROMOTIONS_STALE_MS = 20 * 60 * 1000; // 20 minutes

interface HousesCachePayload {
  data: House[];
  pagination?: { total: number; limit: number; skip: number };
  fetchedAt: number;
}

interface PromotionsCachePayload {
  data: unknown[];
  fetchedAt: number;
}

function hasBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function stableFilterKey(filters: FilterParams = {}): string {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    return DEFAULT_CATALOG_KEY;
  }

  return entries.map(([key, value]) => `${key}=${String(value)}`).join('&');
}

/** Ignore geo-only params on the homepage so location sort does not bust the cache. */
export function getPublicHousesCacheKey(filters: FilterParams = {}): string {
  const { lat, lng, radius, ...rest } = filters;
  const hasUserFilters = Object.entries(rest).some(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );

  if (!hasUserFilters) {
    return DEFAULT_CATALOG_KEY;
  }

  return stableFilterKey(rest);
}

function housesStorageKey(cacheKey: string): string {
  return `${STORAGE_PREFIX}:houses:${cacheKey}`;
}

export function readHousesCache(cacheKey: string): HousesCachePayload | null {
  if (!hasBrowserStorage()) return null;

  try {
    const raw = localStorage.getItem(housesStorageKey(cacheKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HousesCachePayload;
    if (!Array.isArray(parsed.data) || typeof parsed.fetchedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeHousesCache(
  cacheKey: string,
  payload: Omit<HousesCachePayload, 'fetchedAt'>,
): void {
  if (!hasBrowserStorage()) return;

  try {
    const entry: HousesCachePayload = { ...payload, fetchedAt: Date.now() };
    localStorage.setItem(housesStorageKey(cacheKey), JSON.stringify(entry));
  } catch {
    // Quota exceeded or private mode — ignore
  }
}

export function isHousesCacheStale(
  cacheKey: string,
  maxAgeMs: number = LISTINGS_STALE_MS,
): boolean {
  const cached = readHousesCache(cacheKey);
  if (!cached) return true;
  return Date.now() - cached.fetchedAt > maxAgeMs;
}

export function readPromotionsCache(): PromotionsCachePayload | null {
  if (!hasBrowserStorage()) return null;

  try {
    const raw = localStorage.getItem(PROMOTIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PromotionsCachePayload;
    if (!Array.isArray(parsed.data) || typeof parsed.fetchedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePromotionsCache(data: unknown[]): void {
  if (!hasBrowserStorage()) return;

  try {
    const entry: PromotionsCachePayload = { data, fetchedAt: Date.now() };
    localStorage.setItem(PROMOTIONS_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function isPromotionsCacheStale(maxAgeMs: number = PROMOTIONS_STALE_MS): boolean {
  const cached = readPromotionsCache();
  if (!cached) return true;
  return Date.now() - cached.fetchedAt > maxAgeMs;
}

/** Warm the browser image cache after the first catalog fetch. */
export function preloadHouseImages(houses: House[], limit = 24): void {
  if (typeof window === 'undefined') return;

  houses.slice(0, limit).forEach((house) => {
    const src = house.images?.[0];
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
}
