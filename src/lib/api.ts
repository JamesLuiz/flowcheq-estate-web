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
  list: (filters?: FilterParams & { featured?: boolean; lat?: number; lng?: number; radius?: number; shared?: boolean; listingType?: 'rent' | 'buy' }) => {
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
    if (filters?.shared !== undefined) params.shared = String(filters.shared);
    if (filters?.listingType) params.listingType = filters.listingType;
    
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
  listShared: (filters?: { minPrice?: number; maxPrice?: number; location?: string }) => {
    return api.houses.list({
      shared: true,
      minPrice: filters?.minPrice,
      maxPrice: filters?.maxPrice,
      location: filters?.location,
    });
  },
  bookSlot: (id: string) => request<{ success: boolean; message: string; availableSlots: number }>(`/houses/${id}/slots/book`, 'POST'),
  cancelSlot: (id: string) => request<{ success: boolean; message: string; availableSlots: number }>(`/houses/${id}/slots/cancel`, 'POST'),
  getCoTenants: (id: string) => request<{ coTenants: Agent[] }>(`/houses/${id}/slots/co-tenants`, 'GET'),
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
  getBankAccount: () => request<{ bankAccount: { bankName: string; accountNumber: string; accountName: string; bankCode: string } | null; walletBalance: number }>('/agents/me/bank-account', 'GET'),
  updateBankAccount: (bankAccount: { bankName: string; accountNumber: string; accountName: string; bankCode: string }) =>
    request<Agent>('/agents/me/bank-account', 'PATCH', { body: { bankAccount } }),
  withdrawFunds: (amount: number) =>
    request<{ success: boolean; transferId: string; reference: string; status: string; amount: number; message: string }>(
      '/agents/me/withdraw',
      'POST',
      { body: { amount } },
    ),
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

const verificationsApi = {
  upload: (documentType: 'nin' | 'driver_license', document: File, selfie: File) => {
    const formData = new FormData();
    formData.append('document', document);
    formData.append('selfie', selfie);
    formData.append('documentType', documentType);
    
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    return fetch(`${baseUrl}/verifications/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }
      return res.json();
    });
  },
  getMyVerification: () => request<{
    id: string;
    documentType: string;
    documentUrl: string;
    status: string;
    rejectionReason?: string;
    adminMessage?: string;
    createdAt: string;
    updatedAt: string;
  } | null>('/verifications/me', 'GET'),
};

const adminApi = {
  getPendingVerifications: () => request<{ data: Agent[] }>('/admin/verifications/pending', 'GET'),
  updateVerificationStatus: (agentId: string, status: 'approved' | 'rejected') =>
    request<Agent>(`/admin/verifications/${agentId}`, 'PATCH', { body: { status } }),
  getAllVerifications: (status?: string) => {
    const params = status ? { status } : {};
    return request<any[]>('/verifications/admin/all', 'GET', { params });
  },
  getVerificationById: (id: string) => request<any>(`/verifications/admin/${id}`, 'GET'),
  reviewVerification: (id: string, payload: {
    status: 'approved' | 'rejected';
    rejectionReason?: string;
    adminMessage?: string;
  }) => request<any>(`/verifications/admin/${id}/review`, 'POST', { body: payload }),
  deleteVerification: (id: string) => request<{ success: boolean }>(`/verifications/admin/${id}`, 'DELETE'),
  // Promotions admin endpoints
  getAllPromotions: (status?: string) => {
    const params = status ? { status } : {};
    return request<any[]>('/admin/promotions', 'GET', { params });
  },
  activatePromotion: (id: string) => request<any>(`/admin/promotions/${id}/activate`, 'PATCH'),
  cancelPromotion: (id: string) => request<any>(`/admin/promotions/${id}`, 'DELETE'),
  sendVerificationReminder: (agentId: string) => 
    request<{ success: boolean; message: string }>(`/admin/send-verification-reminder/${agentId}`, 'POST'),
  // Viewing fees management
  getAllViewingFees: () => request<any[]>('/admin/viewing-fees', 'GET'),
  getPlatformFeePercentage: () => request<{ platformFeePercentage: number }>('/admin/viewing-fees/platform-fee-percentage', 'GET'),
  updatePlatformFeePercentage: (percentage: number) =>
    request<{ success: boolean; platformFeePercentage: number; message: string }>('/admin/viewing-fees/platform-fee-percentage', 'PATCH', {
      body: { platformFeePercentage: percentage },
    }),
  // Unverified agents
  getUnverifiedAgents: () => request<{ data: Agent[] }>('/admin/agents/unverified', 'GET'),
  sendBulkEmailToUnverifiedAgents: (message?: string) =>
    request<{ success: boolean; message: string; successCount: number; failCount: number; total: number }>(
      '/admin/agents/unverified/bulk-email',
      'POST',
      { body: { message } },
    ),
  // Agent management
  getAllAgents: (status?: string) => {
    const params = status ? { status } : {};
    return request<{ data: Agent[] }>('/admin/agents', 'GET', { params });
  },
  suspendAgent: (agentId: string, reason?: string, suspendedUntil?: string) =>
    request<Agent>(`/admin/agents/${agentId}/suspend`, 'PATCH', {
      body: { reason, suspendedUntil },
    }),
  banAgent: (agentId: string, reason?: string) =>
    request<Agent>(`/admin/agents/${agentId}/ban`, 'PATCH', {
      body: { reason },
    }),
  activateAgent: (agentId: string, reason?: string) =>
    request<Agent>(`/admin/agents/${agentId}/activate`, 'PATCH', {
      body: { reason },
    }),
  deleteAgent: (agentId: string, reason?: string) =>
    request<{ success: boolean; message: string }>(`/admin/agents/${agentId}`, 'DELETE', {
      body: { reason },
    }),
  delistAgentProperties: (agentId: string, reason?: string) =>
    request<{ success: boolean; message: string }>(`/admin/agents/${agentId}/delist-properties`, 'POST', {
      body: { reason },
    }),
  // Property management
  getAllProperties: (flagged?: boolean) => {
    const params = flagged !== undefined ? { flagged: String(flagged) } : {};
    return request<{ data: House[] }>('/admin/properties', 'GET', { params });
  },
  flagProperty: (propertyId: string, reason?: string) =>
    request<House>(`/admin/properties/${propertyId}/flag`, 'PATCH', {
      body: { reason },
    }),
  unflagProperty: (propertyId: string) =>
    request<House>(`/admin/properties/${propertyId}/unflag`, 'PATCH'),
  deleteProperty: (propertyId: string) =>
    request<{ success: boolean; message: string }>(`/admin/properties/${propertyId}`, 'DELETE'),
};

const promotionsApi = {
  getActive: () => request<any[]>('/promotions/active', 'GET'),
  getAll: (status?: string) => {
    const params = status ? { status } : {};
    return request<any[]>('/promotions', 'GET', { params });
  },
  get: (id: string) => request<any>(`/promotions/${id}`, 'GET'),
  initializePayment: (payload: {
    houseId: string;
    days: number;
    email: string;
    name: string;
    phone?: string;
  }) => request<{ link: string; tx_ref: string }>('/promotions/initialize-payment', 'POST', { body: payload }),
  verifyPayment: (payload: {
    transactionId: string;
    houseId: string;
    days: number;
    startDate: string;
    bannerImage: string;
  }) => request<{ success: boolean; promotion: any }>('/promotions/verify-payment', 'POST', { body: payload }),
  create: (formData: FormData) => {
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    return fetch(`${baseUrl}/promotions`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create promotion');
      }
      return res.json();
    });
  },
  trackClick: (id: string) => request<{ success: boolean }>(`/promotions/${id}/click`, 'POST'),
  cancel: (id: string) => request<any>(`/promotions/${id}`, 'DELETE'),
};

const viewingsApi = {
  schedule: (data: {
    houseId: string;
    agentId: string;
    scheduledDate: string;
    scheduledTime: string;
    notes?: string;
    name?: string;
    email?: string;
    phone?: string;
  }) => request<any>('/viewings/schedule', 'POST', { body: data }),
  getMyViewings: () => request<any[]>('/viewings/my', 'GET'),
  getAllViewings: () => request<any[]>('/viewings/admin/all', 'GET'),
  updateStatus: (id: string, status: string) =>
    request<any>(`/viewings/${id}/status`, 'PATCH', { body: { status } }),
  uploadReceipt: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('receipt', file);
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    return fetch(`${baseUrl}/viewings/${id}/receipt`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload receipt');
      }
      return res.json();
    });
  },
};

const messagesApi = {
  send: (data: { receiverId: string; content: string; houseId?: string; conversationType?: 'tenant-agent' | 'co-tenant' }) =>
    request<any>('/messages', 'POST', { body: data }),
  getConversations: () => request<any[]>('/messages/conversations', 'GET'),
  getMessages: (partnerId: string, houseId?: string) => {
    const params: Record<string, string> = {};
    if (houseId) params.houseId = houseId;
    return request<any[]>(`/messages/conversation/${partnerId}`, 'GET', { params });
  },
  getUnreadCount: () => request<{ unreadCount: number }>('/messages/unread-count', 'GET'),
  markAsRead: (partnerId: string) => request<{ success: boolean }>(`/messages/mark-read/${partnerId}`, 'POST'),
};

export const api = {
  auth: authApi,
  houses: housesApi,
  agents: agentsApi,
  reviews: reviewsApi,
  alerts: alertsApi,
  verifications: verificationsApi,
  admin: adminApi,
  promotions: promotionsApi,
  viewings: viewingsApi,
  messages: messagesApi,
};

