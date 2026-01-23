import type { FilterParams, House, Agent } from '@/types';

/**
 * Get the API base URL for making requests
 * 
 * Development Mode Behavior:
 * - When running `npm run dev`, automatically uses http://localhost:3000
 * - This ensures local development always connects to local backend
 * 
 * To override (e.g., test against production):
 * - Create .env.local file with: VITE_API_URL=https://your-api.com
 * 
 * Production:
 * - Set VITE_API_URL in your deployment platform's environment variables
 */
const getApiBaseUrl = () => {
  // In development mode, always use localhost unless explicitly overridden
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // If in development and no explicit API URL is set, use localhost:3000
  if (isDevelopment && !import.meta.env.VITE_API_URL) {
    console.log('🔧 Development mode: Using http://localhost:3000 for API');
    return 'http://localhost:3000';
  }
  
  // Use environment variable if set
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    const url = envUrl.replace(/\/$/, '');
    if (isDevelopment) {
      console.log(`🔧 Using custom API URL: ${url}`);
    }
    return url;
  }
  
  // Default fallback to localhost:3000
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

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log(`[API] ${method} ${url}`, { body, skipAuth });
  }

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
    let errorDetails: any = null;
    try {
      const errorBody = await response.json();
      errorDetails = errorBody;
      // Handle validation errors (NestJS ValidationPipe format)
      if (Array.isArray(errorBody?.message)) {
        errorMessage = errorBody.message.map((err: any) => {
          if (typeof err === 'string') return err;
          if (err?.constraints) {
            return Object.values(err.constraints).join(', ');
          }
          return err?.property ? `${err.property}: ${Object.values(err.constraints || {}).join(', ')}` : String(err);
        }).join('; ');
      } else {
      errorMessage =
        errorBody?.message ??
        errorBody?.error ??
          errorMessage;
      }
      
      // Debug logging in development
      if (import.meta.env.DEV) {
        console.error(`[API Error] ${method} ${url}`, {
          status: response.status,
          statusText: response.statusText,
          errorDetails,
          errorBody,
          requestBody: body,
        });
        
        // If it's a validation error, log the details
        if (errorBody?.message && Array.isArray(errorBody.message)) {
          console.error('Validation errors:', errorBody.message);
        }
      }
    } catch {
      // ignore
    }
    const error = new Error(errorMessage);
    (error as any).details = errorDetails;
    throw error;
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
  registerCompany: async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    bio?: string;
    companyDetails: {
      companyName: string;
      cacNumber: string;
      businessEmail: string;
      businessPhone: string;
      address: string;
      city: string;
      state: string;
      website?: string;
      yearEstablished?: number;
      companySize?: string;
    };
    cacDocument: File;
  }) => {
    const { cacDocument, ...restPayload } = payload;
    
    const formData = new FormData();
    formData.append('cacDocument', cacDocument);
    formData.append('data', JSON.stringify(restPayload));
    
    const url = `${getApiBaseUrl()}/auth/register-company`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorBody = await response.json();
        if (Array.isArray(errorBody?.message)) {
          errorMessage = errorBody.message.join(', ');
        } else if (typeof errorBody?.message === 'string') {
          errorMessage = errorBody.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }
    
    return (await response.json()) as { message: string };
  },
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
  options: RequestOptions & { files?: File[]; proofOfAddressFile?: File; taggedPhotos?: File[]; taggedPhotoTags?: string[]; taggedPhotoDescriptions?: string[] } = {},
): Promise<T> {
  const { params, skipAuth, headers, body, files, proofOfAddressFile, taggedPhotos, taggedPhotoTags, taggedPhotoDescriptions, ...rest } = options;
  const url = buildUrl(path, params);
  const token = getAuthToken();

  const formData = new FormData();

  // Add image files if provided
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('images', file);
    });
  }

  // Add proof of address file if provided
  if (proofOfAddressFile) {
    formData.append('proofOfAddress', proofOfAddressFile);
  }

  // Add tagged photos if provided
  if (taggedPhotos && taggedPhotos.length > 0) {
    taggedPhotos.forEach((file) => {
      formData.append('taggedPhotos', file);
    });
    // Add tags and descriptions as JSON arrays
    if (taggedPhotoTags) {
      formData.append('taggedPhotoTags', JSON.stringify(taggedPhotoTags));
    }
    if (taggedPhotoDescriptions) {
      formData.append('taggedPhotoDescriptions', JSON.stringify(taggedPhotoDescriptions));
    }
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
    // Attempt to parse JSON; fallback to plain text for clearer errors
    try {
      const rawText = await response.text();
      try {
        const errorBody = JSON.parse(rawText);
        if (Array.isArray(errorBody?.message)) {
          errorMessage = errorBody.message.join(', ');
        } else if (typeof errorBody?.message === 'string') {
          errorMessage = errorBody.message;
        } else if (typeof errorBody?.error === 'string') {
          errorMessage = errorBody.error;
        } else if (rawText) {
          errorMessage = rawText;
        }
      } catch {
        if (rawText) {
          errorMessage = rawText;
        }
      }
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
  create: (payload: Omit<Partial<House>, 'images'> & { 
    images?: File[] | string[]; 
    proofOfAddress?: File | null;
    taggedPhotos?: Array<{ file?: File; url?: string; tag: string; description?: string }>;
  }) => {
    const { images, proofOfAddress, taggedPhotos, ...restPayload } = payload;
    const files = images as File[] | undefined;
    const proofFile = proofOfAddress as File | undefined;
    
    // Extract tagged photo files, tags, and descriptions (only include items with file property)
    const photosWithFiles = taggedPhotos?.filter(p => 'file' in p && (p as any).file) ?? [];
    const taggedPhotoFiles = photosWithFiles.map(p => (p as any).file as File);
    const taggedPhotoTags = photosWithFiles.map(p => p.tag);
    const taggedPhotoDescriptions = photosWithFiles.map(p => p.description);
    
    const shouldUseMultipart =
      (files && files.length > 0) ||
      !!proofFile ||
      (taggedPhotoFiles && taggedPhotoFiles.length > 0);

    if (shouldUseMultipart) {
      return requestWithFiles<House>('/houses', 'POST', {
        body: restPayload,
        files,
        proofOfAddressFile: proofFile,
        taggedPhotos: taggedPhotoFiles,
        taggedPhotoTags,
        taggedPhotoDescriptions,
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
  getBankAccount: () => request<{ 
    bankAccount: { bankName: string; accountNumber: string; accountName: string; bankCode: string } | null; 
    walletBalance: number;
    virtualAccount?: {
      accountNumber?: string;
      accountName?: string;
      bankName?: string;
      bankCode?: string;
      status?: string;
    } | null;
  }>('/agents/me/bank-account', 'GET'),
  updateBankAccount: (bankAccount: { bankName: string; accountNumber: string; accountName: string; bankCode: string }) =>
    request<Agent>('/agents/me/bank-account', 'PATCH', { body: { bankAccount } }),
  withdraw: (amount: number, transactionPin: string, otp: string) => {
    // Ensure amount is a number and transactionPin/otp are strings
    const payload = {
      amount: typeof amount === 'string' ? parseFloat(amount) : Number(amount),
      transactionPin: String(transactionPin),
      otp: String(otp).toUpperCase(),
    };
    
    // Validate before sending
    if (isNaN(payload.amount) || payload.amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!payload.transactionPin || payload.transactionPin.length !== 6) {
      throw new Error('Transaction PIN must be 6 digits');
    }
    if (!payload.otp || payload.otp.length !== 6) {
      throw new Error('OTP must be 6 characters');
    }
    
    return request<{ success: boolean; transferId: string; reference: string; status: string; amount: number; message: string }>(
      '/agents/me/withdraw',
      'POST',
      { body: payload },
    );
  },
  requestWithdrawalOtp: () => request<{ success: boolean; message: string; expiresAt: string }>('/agents/me/withdraw/request-otp', 'POST'),
  getEarnings: () => request<{ earnings: any[]; stats: { totalEarnings: number; totalGross: number; totalPlatformFees: number; transactionCount: number } }>('/agents/me/earnings', 'GET'),
  getWithdrawals: () => request<{ withdrawals: any[] }>('/agents/me/withdrawals', 'GET'),
  setTransactionPin: (pin: string) => request<{ success: boolean; message: string }>('/agents/me/transaction-pin', 'POST', { body: { pin } }),
  getTransactionPinStatus: () => request<{ hasPin: boolean }>('/agents/me/transaction-pin/status', 'GET'),
  requestTransactionPinReset: () => request<{ success: boolean; message: string }>('/agents/me/transaction-pin/request-reset', 'POST'),
  resetTransactionPin: (code: string, newPin: string) => request<{ success: boolean; message: string }>('/agents/me/transaction-pin/reset', 'POST', { body: { code, newPin } }),
  fundWallet: (amount: number) => request<{ success: boolean; paymentLink: string; txRef: string }>('/agents/me/fund-wallet', 'POST', { body: { amount } }),
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
  // Admin dashboard stats
  getStats: () => request<{
    totalAgents: number;
    verifiedAgents: number;
    totalPromotionRevenue: number;
    totalViewingPlatformRevenue: number;
    totalPlatformRevenue: number;
  }>('/admin/stats', 'GET'),
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
  verifyPropertyAddress: (propertyId: string) =>
    request<House>(`/admin/properties/${propertyId}/verify-address`, 'PATCH'),
  // Disbursements
  getPendingDisbursements: () => request<{
    data: Array<{
      agent: Agent;
      pendingAmount: number;
      totalEarnings: number;
      recentEarnings: Array<{ id: string; amount: number; type: string; description: string; createdAt: string }>;
      hasBankAccount: boolean;
      bankAccount: { bankName: string; accountNumber: string; accountName: string } | null;
      reason: string;
    }>;
    totalPending: number;
    count: number;
  }>('/admin/disbursements/pending', 'GET'),
  processDisbursement: (agentId: string, amount: number, reason?: string) =>
    request<{ success: boolean; message: string; withdrawalId: string; agent: Agent; amount: number }>(
      `/admin/disbursements/process/${agentId}`,
      'POST',
      { body: { amount, reason } },
    ),
  processBulkDisbursements: (disbursements: { agentId: string; amount: number }[], reason?: string) =>
    request<{ ok: boolean; message: string; successCount: number; failed: number; errors: string[] }>(
      '/admin/disbursements/process-bulk',
      'POST',
      { body: { disbursements, reason } },
    ),
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
    userId?: string;
  }) => request<any>('/viewings/schedule', 'POST', { body: data }),
  getMyViewings: () => request<any[]>('/viewings/my', 'GET'),
  getUserViewings: () => request<any[]>('/viewings/user', 'GET'),
  getAllViewings: () => request<any[]>('/viewings/admin/all', 'GET'),
  updateStatus: (id: string, status: string, newDate?: string, newTime?: string) =>
    request<any>(`/viewings/${id}/status`, 'PATCH', { body: { status, newDate, newTime } }),
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
  initializePayment: (id: string) => 
    request<{ success: boolean; paymentLink: string; transactionId: string }>(`/viewings/${id}/payment/initialize`, 'POST'),
  verifyPayment: (txRef: string) =>
    request<any>('/viewings/payment/verify', 'POST', { body: { tx_ref: txRef } }),
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

