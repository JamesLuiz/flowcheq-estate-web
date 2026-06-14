export const GOOGLE_MAPS_LOADER_ID = 'google-map-script';
export const GOOGLE_MAPS_LIBRARIES: ('places')[] = ['places'];

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
}

export type ParsedPlaceAddress = {
  googlePlaceId: string;
  formattedAddress: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  coordinates?: { lat: number; lng: number };
};

export function parseGooglePlace(place: google.maps.places.PlaceResult): ParsedPlaceAddress | null {
  const placeId = place.place_id;
  const formattedAddress = place.formatted_address;
  if (!placeId || !formattedAddress) return null;

  const components = place.address_components ?? [];
  const pick = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name ?? '';

  const streetNumber = pick('street_number');
  const route = pick('route');
  const streetAddress =
    [streetNumber, route].filter(Boolean).join(' ').trim() ||
    formattedAddress.split(',')[0]?.trim() ||
    '';

  const loc = place.geometry?.location;
  const coordinates =
    loc != null
      ? { lat: loc.lat(), lng: loc.lng() }
      : undefined;

  return {
    googlePlaceId: placeId,
    formattedAddress,
    streetAddress,
    city: pick('locality', 'administrative_area_level_2', 'sublocality'),
    state: pick('administrative_area_level_1'),
    postalCode: pick('postal_code'),
    coordinates,
  };
}
