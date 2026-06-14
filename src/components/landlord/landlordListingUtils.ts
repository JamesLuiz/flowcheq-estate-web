import { geocodeAddress } from '@/lib/geocoding';
import { NIGERIAN_STATES } from '@/data/nigerianStates';
import { House } from '@/types';
import {
  initialLandlordListingFormState,
  type LandlordListingFormState,
} from './landlordListingFormState';

export type ResolvedListingLocation = {
  coordinates?: { lat: number; lng: number };
  fullLocation: string;
  googlePlaceId?: string;
  formattedAddress?: string;
  coordinatesSource?: 'places' | 'geocode' | 'agent_gps';
};

export function buildFullLocation(formState: LandlordListingFormState): string {
  if (formState.formattedAddress) {
    return formState.formattedAddress;
  }
  const locationParts: string[] = [];
  if (formState.streetAddress) locationParts.push(formState.streetAddress);
  if (formState.city) locationParts.push(formState.city);
  if (formState.state) locationParts.push(formState.state);
  return locationParts.length > 0 ? locationParts.join(', ') : formState.location;
}

function parseManualCoordinates(formState: LandlordListingFormState): { lat: number; lng: number } | undefined {
  const lat = formState.manualLat.trim() ? Number(formState.manualLat) : NaN;
  const lng = formState.manualLng.trim() ? Number(formState.manualLng) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }
  return undefined;
}

export function houseToFormState(house: House): LandlordListingFormState {
  const locationParts = house.location?.split(',') || [];
  let extractedState = 'FCT';
  if (locationParts.length > 0) {
    const lastPart = locationParts[locationParts.length - 1]?.trim() || '';
    const matchedState = NIGERIAN_STATES.find(
      (state) =>
        lastPart.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(lastPart.toLowerCase()),
    );
    if (matchedState) extractedState = matchedState;
  }

  const extended = house as House & {
    googlePlaceId?: string;
    formattedAddress?: string;
    coordinatesSource?: 'places' | 'geocode' | 'agent_gps';
  };

  return {
    ...initialLandlordListingFormState,
    title: house.title,
    description: house.description,
    price: String(house.price),
    location: house.location,
    streetAddress: locationParts[0]?.trim() || '',
    city: locationParts[1]?.trim() || '',
    state: extractedState,
    postalCode: '',
    googlePlaceId: extended.googlePlaceId ?? '',
    formattedAddress: extended.formattedAddress ?? house.location ?? '',
    coordinatesSource: extended.coordinatesSource,
    manualLat: house.coordinates?.lat != null ? String(house.coordinates.lat) : '',
    manualLng: house.coordinates?.lng != null ? String(house.coordinates.lng) : '',
    type: house.type,
    bedrooms: String(house.bedrooms || ''),
    bathrooms: String(house.bathrooms || ''),
    area: String(house.area || ''),
    featured: house.featured || false,
    coordinates: house.coordinates,
    isShared: (house as House & { isShared?: boolean }).isShared || false,
    totalSlots: String((house as House & { totalSlots?: number }).totalSlots || ''),
    viewingFee: String((house as House & { viewingFee?: number }).viewingFee || ''),
    listingType: ((house as House & { listingType?: 'rent' | 'buy' }).listingType || 'buy') as
      | 'rent'
      | 'buy',
  };
}

export async function geocodeListingLocation(
  formState: LandlordListingFormState,
  onGeocodingFailed?: () => void,
): Promise<ResolvedListingLocation> {
  const fullLocation = buildFullLocation(formState);
  const manualCoords = parseManualCoordinates(formState);
  let coordinates = manualCoords ?? formState.coordinates;
  let coordinatesSource = formState.coordinatesSource;

  const hasAddress =
    formState.googlePlaceId ||
    formState.formattedAddress ||
    formState.streetAddress ||
    formState.city ||
    formState.state ||
    formState.location;

  if (!hasAddress) {
    return {
      coordinates,
      fullLocation,
      googlePlaceId: formState.googlePlaceId || undefined,
      formattedAddress: formState.formattedAddress || undefined,
      coordinatesSource,
    };
  }

  if (formState.googlePlaceId && coordinates && !manualCoords) {
    return {
      coordinates,
      fullLocation,
      googlePlaceId: formState.googlePlaceId,
      formattedAddress: formState.formattedAddress || fullLocation,
      coordinatesSource: coordinatesSource ?? 'places',
    };
  }

  if (manualCoords) {
    return {
      coordinates: manualCoords,
      fullLocation,
      googlePlaceId: formState.googlePlaceId || undefined,
      formattedAddress: formState.formattedAddress || fullLocation,
      coordinatesSource: formState.googlePlaceId ? 'places' : coordinatesSource,
    };
  }

  try {
    const geocodeResult = await geocodeAddress(fullLocation, {
      street: formState.streetAddress,
      city: formState.city,
      state: formState.state,
      postalCode: formState.postalCode,
    });
    if (geocodeResult) {
      coordinates = { lat: geocodeResult.lat, lng: geocodeResult.lng };
      coordinatesSource = formState.googlePlaceId ? 'places' : 'geocode';
    } else {
      onGeocodingFailed?.();
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    onGeocodingFailed?.();
  }

  return {
    coordinates,
    fullLocation,
    googlePlaceId: formState.googlePlaceId || undefined,
    formattedAddress: formState.formattedAddress || undefined,
    coordinatesSource,
  };
}
