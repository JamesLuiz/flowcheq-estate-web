import { useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getGoogleMapsApiKey,
  GOOGLE_MAPS_LIBRARIES,
  GOOGLE_MAPS_LOADER_ID,
  parseGooglePlace,
  type ParsedPlaceAddress,
} from '@/lib/googleMaps';

type PlacesAddressPickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: ParsedPlaceAddress) => void;
  disabled?: boolean;
};

export function PlacesAddressPicker({
  id,
  value,
  onChange,
  onPlaceSelected,
  disabled,
}: PlacesAddressPickerProps) {
  const apiKey = getGoogleMapsApiKey();
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_LOADER_ID,
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  if (!apiKey) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Property address</Label>
        <Input
          id={id}
          placeholder="Enter full street address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          Add VITE_GOOGLE_MAPS_API_KEY to enable Google Places autocomplete for exact locations.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Property address</Label>
        <Input
          id={id}
          placeholder="Enter full street address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
        <p className="text-xs text-destructive">Could not load Google Maps. Enter address manually.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>Property address</Label>
        <Input id={id} placeholder="Loading Google Places…" disabled />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <MapPin className="h-3.5 w-3.5" />
        Search property address (Google Places)
      </Label>
      <Autocomplete
        onLoad={(autocomplete) => {
          autocompleteRef.current = autocomplete;
          autocomplete.setComponentRestrictions({ country: 'ng' });
          autocomplete.setFields([
            'place_id',
            'formatted_address',
            'address_components',
            'geometry',
          ]);
        }}
        onPlaceChanged={() => {
          const place = autocompleteRef.current?.getPlace();
          if (!place) return;
          const parsed = parseGooglePlace(place);
          if (parsed) {
            onChange(parsed.formattedAddress);
            onPlaceSelected(parsed);
          }
        }}
      >
        <Input
          id={id}
          placeholder="Start typing address — select from suggestions"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
      </Autocomplete>
      <p className="text-xs text-muted-foreground">
        Pick the exact property from Google suggestions. Coordinates are set automatically (optional to
        override below).
      </p>
    </div>
  );
}
