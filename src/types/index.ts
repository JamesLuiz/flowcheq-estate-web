export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  role?: string;
  listings?: number;
  emailVerified?: boolean;
  verified?: boolean;
  verificationStatus?: string;
  verificationDate?: string;
  personaInquiryId?: string;
}

export interface House {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  images: string[];
  agentId: string;
  agent?: Agent;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  featured?: boolean;
  coordinates?: Coordinates;
  viewCount?: number;
  whatsappClicks?: number;
  createdAt?: string;
  updatedAt?: string;
  // Shared Property (2-to-Tango) fields
  isShared?: boolean;
  totalSlots?: number;
  availableSlots?: number;
  bookedByUsers?: string[];
  // Inspection fee
  viewingFee?: number;
  // Listing type
  listingType?: 'rent' | 'buy';
  // Airbnb listing
  isAirbnb?: boolean;
  proofOfAddress?: string;
  ownershipDocuments?: Array<{ type: string; url: string }>;
  inspectionFeePaid?: boolean;
  inspectionFeeAmount?: number;
  verificationStatus?: string;
  gpsVerifiedPhotos?: boolean;
  // Address verification status
  addressVerified?: boolean;
  // Tagged photos with room types
  taggedPhotos?: Array<{
    url: string;
    tag: string;
    description?: string;
    lat?: number;
    lng?: number;
    gpsVerified?: boolean;
  }>;
}

export interface FilterParams {
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  type?: string;
  search?: string;
  featured?: boolean;
  agentId?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  limit?: number;
  listingType?: 'rent' | 'buy';
  amenities?: string[];
}
