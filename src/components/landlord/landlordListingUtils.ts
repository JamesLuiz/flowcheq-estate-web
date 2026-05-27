import { geocodeAddress } from '@/lib/geocoding';
import { NIGERIAN_STATES } from '@/data/nigerianStates';
import { House } from '@/types';
import {
  initialLandlordListingFormState,
  type LandlordListingFormState,
} from './landlordListingFormState';

export function buildFullLocation(formState: LandlordListingFormState): string {
  const locationParts: string[] = [];
  if (formState.streetAddress) locationParts.push(formState.streetAddress);
  if (formState.city) locationParts.push(formState.city);
  if (formState.state) locationParts.push(formState.state);
  return locationParts.length > 0 ? locationParts.join(', ') : formState.location;
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
): Promise<{ coordinates?: { lat: number; lng: number }; fullLocation: string }> {
  const fullLocation = buildFullLocation(formState);
  let coordinates = formState.coordinates;

  const hasAddress =
    formState.streetAddress ||
    formState.city ||
    formState.state ||
    formState.location;

  if (!hasAddress) {
    return { coordinates, fullLocation };
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
    } else {
      onGeocodingFailed?.();
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    onGeocodingFailed?.();
  }

  return { coordinates, fullLocation };
}
