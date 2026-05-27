import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

/**
 * Records a property view for agent/landlord lead notifications (debounced).
 */
export function usePropertyViewTracker(propertyId: string | undefined, enabled = true) {
  const trackedId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !propertyId) return;
    if (trackedId.current === propertyId) return;

    const timer = setTimeout(() => {
      api.houses
        .trackView(propertyId)
        .then(() => {
          trackedId.current = propertyId;
        })
        .catch(() => {
          /* allow retry on navigation */
        });
    }, 800);

    return () => clearTimeout(timer);
  }, [propertyId, enabled]);
}
