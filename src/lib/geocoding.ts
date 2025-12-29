/**
 * Geocoding utility using Mapbox Geocoding API
 * Converts address strings to coordinates (lat, lng)
 */

interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/**
 * Geocode an address to get coordinates
 * @param address - The address string to geocode (can be full address or parts)
 * @param addressParts - Optional object with street, city, state, postalCode for more accurate geocoding
 * @returns Promise with coordinates or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  addressParts?: { street?: string; city?: string; state?: string; postalCode?: string }
): Promise<GeocodeResult | null> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.warn('Mapbox access token not found. Geocoding will be skipped.');
    return null;
  }

  // Build address string from parts if provided, otherwise use the address string
  let fullAddress = address;
  if (addressParts) {
    const parts: string[] = [];
    if (addressParts.street) parts.push(addressParts.street);
    if (addressParts.city) parts.push(addressParts.city);
    if (addressParts.state) parts.push(addressParts.state);
    if (addressParts.postalCode) parts.push(addressParts.postalCode);
    if (parts.length > 0) {
      fullAddress = parts.join(', ');
    }
  }

  if (!fullAddress || fullAddress.trim().length === 0) {
    return null;
  }

  try {
    // Use Mapbox Geocoding API
    // Focus on Nigeria (Abuja area) for better results
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      fullAddress
    )}.json?access_token=${accessToken}&country=NG&limit=1`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error('Geocoding API error:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center; // Mapbox returns [lng, lat]

      return {
        lat,
        lng,
        formattedAddress: feature.place_name,
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Batch geocode multiple addresses
 * @param addresses - Array of address strings
 * @returns Promise with array of geocode results
 */
export async function geocodeAddresses(
  addresses: string[],
): Promise<(GeocodeResult | null)[]> {
  const results = await Promise.all(
    addresses.map((address) => geocodeAddress(address)),
  );
  return results;
}

