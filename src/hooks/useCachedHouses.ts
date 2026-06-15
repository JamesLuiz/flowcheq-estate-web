import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { FilterParams, House } from '@/types';
import { api } from '@/lib/api';
import {
  getPublicHousesCacheKey,
  isHousesCacheStale,
  preloadHouseImages,
  readHousesCache,
  writeHousesCache,
  LISTINGS_STALE_MS,
} from '@/lib/listingCache';

type HousesListResult = {
  data: House[];
  pagination: { total: number; limit: number; skip: number };
};

export function useCachedHouses(filters: FilterParams = {}, options?: { enabled?: boolean }) {
  const cacheKey = getPublicHousesCacheKey(filters);
  const cached = readHousesCache(cacheKey);
  const hasCachedData = Boolean(cached?.data?.length);

  const query = useQuery({
    queryKey: ['houses', cacheKey],
    queryFn: async (): Promise<HousesListResult> => {
      const result = await api.houses.list(filters);
      writeHousesCache(cacheKey, {
        data: result.data,
        pagination: result.pagination,
      });
      preloadHouseImages(result.data);
      return result;
    },
    enabled: options?.enabled ?? true,
    initialData: cached
      ? {
          data: cached.data,
          pagination: cached.pagination ?? {
            total: cached.data.length,
            limit: cached.data.length,
            skip: 0,
          },
        }
      : undefined,
    staleTime: LISTINGS_STALE_MS,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: !hasCachedData,
  });

  const { refetch } = query;

  // Silent background refresh when cache exists but is stale
  useEffect(() => {
    if (options?.enabled === false) return;
    if (!hasCachedData) return;
    if (!isHousesCacheStale(cacheKey)) return;

    void refetch();
  }, [cacheKey, hasCachedData, options?.enabled, refetch]);

  return {
    ...query,
    houses: query.data?.data ?? [],
    /** True only when there is no cached catalog to show yet */
    isInitialLoad: !hasCachedData && query.isLoading,
    hasCachedData,
  };
}
