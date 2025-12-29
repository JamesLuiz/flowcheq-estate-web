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
}
