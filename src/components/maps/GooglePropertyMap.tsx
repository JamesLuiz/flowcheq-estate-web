import { useCallback, useMemo, useState } from 'react';
import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';
import { Loader2, Navigation, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  id?: string;
  /** photo | expected | property */
  variant?: 'photo' | 'expected' | 'property';
  house?: unknown;
}

interface GooglePropertyMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  enableDirections?: boolean;
  directionsDestination?: { lat: number; lng: number };
  /** Default satellite for property / inspection identification */
  defaultMapType?: 'satellite' | 'roadmap' | 'hybrid';
  distanceMeters?: number | null;
  resolvedAddressLabel?: string;
}

const mapContainerStyle = { width: '100%', height: '100%' };

const markerIcon = (variant: MapMarker['variant']) => {
  const urls: Record<string, string> = {
    photo: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
    expected: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
    property: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  };
  return urls[variant ?? 'property'] ?? urls.property;
};

export function GooglePropertyMap({
  latitude,
  longitude,
  zoom = 14,
  markers = [],
  onMarkerClick,
  className = 'h-[250px] md:h-[500px]',
  enableDirections = false,
  directionsDestination,
  defaultMapType = 'satellite',
  distanceMeters,
  resolvedAddressLabel,
}: GooglePropertyMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const [mapType, setMapType] = useState<'satellite' | 'roadmap' | 'hybrid'>(defaultMapType);
  const [activeMarker, setActiveMarker] = useState<MapMarker | null>(null);

  const center = useMemo(
    () => ({ lat: latitude, lng: longitude }),
    [latitude, longitude],
  );

  const allMarkers = useMemo(() => {
    if (markers.length > 0) return markers;
    return [{ lat: latitude, lng: longitude, variant: 'property' as const }];
  }, [markers, latitude, longitude]);

  const boundsCenter = useMemo(() => {
    if (allMarkers.length <= 1) return center;
    const lats = allMarkers.map((m) => m.lat);
    const lngs = allMarkers.map((m) => m.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [allMarkers, center]);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (allMarkers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      allMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds, 80);
    }
  }, [allMarkers]);

  if (!apiKey) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-muted/30 ${className}`}>
        <p className="text-sm text-muted-foreground px-4 text-center">
          Set <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to show Google Maps.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const dest = directionsDestination ?? { lat: latitude, lng: longitude };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {(resolvedAddressLabel || distanceMeters != null) && (
        <div className="absolute top-3 left-3 right-14 z-10 bg-background/95 backdrop-blur-sm rounded-md px-3 py-2 text-xs shadow border max-w-md">
          {resolvedAddressLabel && <p className="font-medium truncate">{resolvedAddressLabel}</p>}
          {distanceMeters != null && (
            <p className="text-muted-foreground">
              Distance from expected: <strong>{distanceMeters}m</strong>
            </p>
          )}
        </div>
      )}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="bg-background/90"
          onClick={() =>
            setMapType((t) => (t === 'satellite' ? 'roadmap' : 'satellite'))
          }
        >
          <Satellite className="h-4 w-4 mr-1" />
          {mapType === 'satellite' ? 'Map' : 'Satellite'}
        </Button>
        {enableDirections && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-background/90"
            asChild
          >
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="h-4 w-4 mr-1" />
              Directions
            </a>
          </Button>
        )}
      </div>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={boundsCenter}
        zoom={zoom}
        onLoad={onLoad}
        mapTypeId={mapType}
        options={{
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {allMarkers.map((marker, idx) => (
          <Marker
            key={marker.id ?? `${marker.lat}-${marker.lng}-${idx}`}
            position={{ lat: marker.lat, lng: marker.lng }}
            icon={{ url: markerIcon(marker.variant) }}
            onClick={() => {
              setActiveMarker(marker);
              onMarkerClick?.(marker);
            }}
          />
        ))}
        {activeMarker?.label && (
          <InfoWindow
            position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
            onCloseClick={() => setActiveMarker(null)}
          >
            <div className="text-sm max-w-[200px]">
              <p className="font-semibold">{activeMarker.label}</p>
              <a
                className="text-primary text-xs underline"
                href={`https://www.google.com/maps?q=${activeMarker.lat},${activeMarker.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Google Maps
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

/** Backward-compatible alias used by SearchMap / HouseMapView */
export const Map = GooglePropertyMap;
