import type { OwnershipDocType } from '@/lib/listing-requirements';

export const initialLandlordListingFormState = {
  title: '',
  description: '',
  price: '',
  location: '',
  streetAddress: '',
  city: '',
  state: 'FCT',
  postalCode: '',
  type: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  featured: false,
  coordinates: undefined as { lat: number; lng: number } | undefined,
  isShared: false,
  totalSlots: '',
  viewingFee: '',
  listingType: 'buy' as 'rent' | 'buy',
  isAirbnb: false,
  proofOfAddress: null as File | null,
  ownershipDocs: {} as Partial<Record<OwnershipDocType, File | null>>,
  taggedPhotos: [] as Array<{ file: File; tag: string; description: string }>,
};

export type LandlordListingFormState = typeof initialLandlordListingFormState;
