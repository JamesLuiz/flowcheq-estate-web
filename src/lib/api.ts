import type { FilterParams, House, Agent } from '@/types';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
};

const TOKEN_STORAGE_KEY = 'nestin_access_token';

let inMemoryToken: string | null =
  (typeof window !== 'undefined' && localStorage.getItem(TOKEN_STORAGE_KEY)) ||
  null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

export const getAuthToken = () => inMemoryToken;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  body?: unknown;
}

const buildUrl = (path: string, params?: RequestOptions['params']) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Ensure baseUrl is a valid absolute URL
  let validBaseUrl = baseUrl;
  try {
    new URL(baseUrl);
  } catch {
    // If baseUrl is not a valid URL, default to localhost
    validBaseUrl = 'http://localhost:3000';
  }
  
  const url = new URL(normalizedPath, validBaseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
};

async function request<T>(
  path: string,
  method: HttpMethod,
  options: RequestOptions = {},
): Promise<T> {
  const { params, skipAuth, headers, body, ...rest } = options;
  const url = buildUrl(path, params);
  const token = getAuthToken();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody?.message ??
        errorBody?.error ??
        Array.isArray(errorBody?.message)
          ? errorBody.message.join(', ')
          : errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    bio?: string;
  }) =>
    request<{ accessToken: string; user: Agent }>('/auth/register', 'POST', {
      body: payload,
      skipAuth: true,
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ accessToken: string; user: Agent }>('/auth/login', 'POST', {
      body: payload,
      skipAuth: true,
    }),
  logout: () => {
    setAuthToken(null);
    return Promise.resolve();
  },
  me: () => request<Agent | null>('/auth/me', 'GET'),
  forgotPassword: (payload: { email: string }) =>
    request<{ message: string }>('/auth/forgot-password', 'POST', {
      body: payload,
      skipAuth: true,
    }),
  resetPassword: (payload: { token: string; password: string }) =>
    request<{ message: string }>('/auth/reset-password', 'POST', {
      body: payload,
      skipAuth: true,
    }),
};

async function requestWithFiles<T>(
  path: string,
  method: HttpMethod,
  options: RequestOptions & { files?: File[] } = {},
): Promise<T> {
  const { params, skipAuth, headers, body, files, ...rest } = options;
  const url = buildUrl(path, params);
  const token = getAuthToken();

  const formData = new FormData();

  // Add files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('images', file);
    });
  }

  // Add other form fields
  if (body && typeof body === 'object') {
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== 'images') {
        if (key === 'coordinates' && typeof value === 'object') {
          // Handle coordinates object - send as separate lat/lng fields
          const coords = value as { lat: number; lng: number };
          if (coords.lat !== undefined && coords.lng !== undefined) {
            formData.append('lat', String(coords.lat));
            formData.append('lng', String(coords.lng));
          }
        } else if (typeof value === 'boolean') {
          formData.append(key, String(value));
        } else if (typeof value === 'object') {
          // For other objects, stringify them
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      // Don't set Content-Type for FormData, browser will set it with boundary
      ...(headers ?? {}),
    },
    body: formData,
    ...rest,
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody?.message ??
        errorBody?.error ??
        Array.isArray(errorBody?.message)
          ? errorBody.message.join(', ')
          : errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const housesApi = {
  list: (filters?: FilterParams & { featured?: boolean; lat?: number; lng?: number; radius?: number }) => {
    const params: Record<string, string | number> = {};
    
    // Only add non-undefined, non-null, non-empty values
    if (filters?.minPrice !== undefined && filters.minPrice !== null) params.minPrice = filters.minPrice;
    if (filters?.maxPrice !== undefined && filters.maxPrice !== null) params.maxPrice = filters.maxPrice;
    if (filters?.type) params.type = filters.type;
    if (filters?.location) params.location = filters.location;
    if (filters?.search) params.search = filters.search;
    if (filters?.featured !== undefined) params.featured = String(filters.featured);
    if (filters?.agentId) params.agentId = filters.agentId;
    if (filters?.lat !== undefined && filters.lat !== null) params.lat = filters.lat;
    if (filters?.lng !== undefined && filters.lng !== null) params.lng = filters.lng;
    if (filters?.radius !== undefined && filters.radius !== null) params.radius = filters.radius;
    
    return request<{ data: House[]; pagination: { total: number; limit: number; skip: number } }>(
      '/houses',
      'GET',
      { params },
    );
  },
  get: (id: string) => request<House>(`/houses/${id}`, 'GET'),
  create: (payload: Omit<Partial<House>, 'images'> & { images?: File[] | string[] }) => {
    const { images, ...restPayload } = payload;
    const files = images as File[] | undefined;
    
    if (files && files.length > 0) {
      return requestWithFiles<House>('/houses', 'POST', {
        body: restPayload,
        files,
      });
    }
    return request<House>('/houses', 'POST', { body: payload });
  },
  update: (id: string, payload: Partial<House>) =>
    request<House>(`/houses/${id}`, 'PUT', { body: payload }),
  delete: (id: string) => request<void>(`/houses/${id}`, 'DELETE'),
  trackView: (id: string) => request<{ success: boolean }>(`/houses/${id}/view`, 'POST'),
  trackWhatsAppClick: (id: string) =>
    request<{ success: boolean }>(`/houses/${id}/whatsapp-click`, 'POST'),
  getStats: () => request<{ totalListings: number; totalViews: number; inquiries: number }>('/houses/stats/me', 'GET'),
};

const agentsApi = {
  list: (params?: { limit?: number; verified?: boolean }) => {
    const queryParams: Record<string, string | number> = {};
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.verified !== undefined) queryParams.verified = String(params.verified);
    return request<{ data: Agent[] }>('/agents', 'GET', { params: queryParams });
  },
  get: (id: string) =>
    request<{ agent: Agent; listings: House[] }>(`/agents/${id}`, 'GET'),
  updateProfile: (payload: { name?: string; phone?: string; bio?: string; avatarUrl?: string }) =>
    request<Agent>('/agents/me', 'PATCH', { body: payload }),
  uploadAvatar: (file: File) => {
    return requestWithFiles<Agent>('/agents/me/avatar', 'POST', {
      files: [file],
      body: {},
    });
  },
};

const reviewsApi = {
  create: (agentId: string, payload: { rating: number; comment?: string }) =>
    request<{ id: string; rating: number; comment?: string; user?: any }>(
      `/reviews/agent/${agentId}`,
      'POST',
      { body: payload },
    ),
  getByAgent: (agentId: string) =>
    request<{ reviews: any[]; averageRating: number; totalReviews: number }>(
      `/reviews/agent/${agentId}`,
      'GET',
    ),
  update: (id: string, payload: { rating?: number; comment?: string }) =>
    request(`/reviews/${id}`, 'PUT', { body: payload }),
  delete: (id: string) => request(`/reviews/${id}`, 'DELETE'),
};

const alertsApi = {
  list: () => request<any[]>('/alerts', 'GET'),
  create: (payload: {
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    type?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => request('/alerts', 'POST', { body: payload }),
  delete: (id: string) => request(`/alerts/${id}`, 'DELETE'),
};

const adminApi = {
  getPendingVerifications: () => request<{ data: Agent[] }>('/admin/verifications/pending', 'GET'),
  updateVerificationStatus: (agentId: string, status: 'approved' | 'rejected') =>
    request<Agent>(`/admin/verifications/${agentId}`, 'PATCH', { body: { status } }),
};

export const api = {
  auth: authApi,
  houses: housesApi,
  agents: agentsApi,
  reviews: reviewsApi,
  alerts: alertsApi,
  admin: adminApi,
};

