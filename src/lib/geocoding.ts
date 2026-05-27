/**
 * Geocoding via Google Geocoding API (replaces Mapbox).
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
  city?: string;
  state?: string;
  country?: string;
}

function getApiKey(): string | undefined {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
}

function parseGoogleResult(result: {
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  address_components?: Array<{ long_name: string; types: string[] }>;
}): GeocodeResult | null {
  const loc = result.geometry?.location;
  if (!loc) return null;
  const components = result.address_components ?? [];
  const pick = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)))?.long_name;

  return {
    lat: loc.lat,
    lng: loc.lng,
    formattedAddress: result.formatted_address,
    city: pick('locality', 'administrative_area_level_2'),
    state: pick('administrative_area_level_1'),
    country: pick('country'),
  };
}

export async function geocodeAddress(
  address: string,
  addressParts?: { street?: string; city?: string; state?: string; postalCode?: string },
): Promise<GeocodeResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY not set. Geocoding skipped.');
    }
    return null;
  }

  let fullAddress = address;
  if (addressParts) {
    const parts: string[] = [];
    if (addressParts.street) parts.push(addressParts.street);
    if (addressParts.city) parts.push(addressParts.city);
    if (addressParts.state) parts.push(addressParts.state);
    if (addressParts.postalCode) parts.push(addressParts.postalCode);
    if (parts.length > 0) fullAddress = parts.join(', ');
  }

  if (!fullAddress?.trim()) return null;

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', fullAddress);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('region', 'ng');

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    return parseGoogleResult(data.results[0]);
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    return parseGoogleResult(data.results[0]);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return null;
  }
}

export function googleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function streetViewLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

export function directionsLink(destLat: number, destLng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`;
}

export async function geocodeAddresses(
  addresses: string[],
): Promise<(GeocodeResult | null)[]> {
  return Promise.all(addresses.map((address) => geocodeAddress(address)));
}
