import { Smartphone, Camera } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { GPS_PHOTO_MAX, GPS_PHOTO_MIN } from '@/lib/listing-requirements';

/** Web may use file picker + geocoded GPS until Nestin Capture mobile ships */
const ALLOW_WEB_FALLBACK = import.meta.env.DEV || import.meta.env.VITE_ALLOW_WEB_LISTING_PHOTOS === 'true';

interface ListingPhotosGuardProps {
  photoCount: number;
  children: React.ReactNode;
}

/**
 * Production web: blocks gallery upload; directs landlords to Nestin Capture on mobile.
 * Dev / VITE_ALLOW_WEB_LISTING_PHOTOS: renders children (file picker + geocoded GPS).
 */
export function ListingPhotosGuard({ photoCount, children }: ListingPhotosGuardProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Label className="text-base font-medium">
            GPS property photos ({GPS_PHOTO_MIN}–{GPS_PHOTO_MAX} required)
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Listing photos must be taken in-app with live GPS (Nestin Capture). Gallery uploads are not allowed in production.
          </p>
        </div>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <Smartphone className="h-4 w-4" />
        <AlertTitle className="text-sm">Use Nestin Capture on mobile</AlertTitle>
        <AlertDescription className="text-xs">
          Open the Nestin Estate app → create listing → Nestin Capture. Each shot is stamped with lat/lng at shutter time.
          {ALLOW_WEB_FALLBACK && (
            <span className="block mt-2 text-amber-700 dark:text-amber-400">
              Development mode: web file picker enabled below (coordinates from property address).
            </span>
          )}
        </AlertDescription>
      </Alert>

      {ALLOW_WEB_FALLBACK ? (
        children
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p className="mb-2">Continue on the Nestin Estate mobile app to add {GPS_PHOTO_MIN}–{GPS_PHOTO_MAX} GPS-verified photos.</p>
          <p className="text-xs">Current session: {photoCount} photo(s) — complete capture on mobile, then refresh.</p>
        </div>
      )}
    </div>
  );
}
