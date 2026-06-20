// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isTokenExpired } from '../lib/tokenUtils';

let localEndpoint = import.meta.env.VITE_API_URL || "http://localhost:33333/api";
let productionEndpoint = "https://partystormapi.vercel.app/api";

let currentEndpoint =
  import.meta.env.MODE === "development" ? localEndpoint : productionEndpoint;
// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: currentEndpoint,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check if token is expired before sending request
      if (isTokenExpired(token)) {
        // Token expired — remove it and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
        return Promise.reject(new Error('Token expired'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    const url = config.url ?? '';
    // Cache-bust admin/support GETs (do not add Cache-Control header — triggers CORS preflight)
    if (config.method?.toLowerCase() === 'get' && (url.includes('/admin/') || url.includes('/support/'))) {
      config.params = { ...config.params, _t: Date.now() };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh attempts to avoid infinite loops
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Response interceptor to handle responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Only auto-logout on 401 if it's NOT an auth endpoint.
    // Auth endpoints (login/register) legitimately return 401 for bad credentials
    // — intercepting those would prevent the error from reaching the caller.
    const requestUrl: string = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/users/register') ||
      requestUrl.includes('/users/google-login') ||
      requestUrl.includes('/users/refresh-token') ||
      requestUrl.includes('/gate-pins/verify') ||  // public — wrong PIN returns 401
      requestUrl.includes('/tickets/validate');     // public — invalid ticket returns 400/404, never 401, but belt-and-braces

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Attempt token refresh — import dynamically to avoid circular dependency
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // Import AuthContext here to access attemptTokenRefresh
          const { useAuth } = await import('../context/AuthContext');
          // Note: This is called from an interceptor, not a component, so we can't use the hook directly
          // Instead, we'll call the refresh endpoint directly
          const storedToken = localStorage.getItem('token');
          if (storedToken) {
            const response = await axios.post(
              `${currentEndpoint}/users/refresh-token`,
              { token: storedToken }
            );
            
            if (response.data?.token) {
              // Update token in storage and headers
              localStorage.setItem('token', response.data.token);
              if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
              }
              
              // Retry the original request with new token
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${response.data.token}`;
                isRefreshing = false;
                return apiClient.request(error.config);
              }
            }
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          // Refresh failed — logout
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          isRefreshing = false;
        }
      }
    } else if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API request function
const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    const response = await apiClient.request<T>({
      method,
      url,
      data,
      ...config,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// API helper functions
export const api = {
  // Generic methods
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>('GET', url, undefined, config),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>('POST', url, data, config),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiRequest<T>('PUT', url, data, config),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiRequest<T>('DELETE', url, undefined, config),

  // Authentication endpoints
  auth: {
    register: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => apiRequest<{ token: string; user: any }> ('POST', '/users/register', userData),
    
    login: (credentials: {
      email: string;
      password: string;
    }) => apiRequest<{ token: string; user: any }>('POST', '/users/login', credentials),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optional: Call backend logout endpoint if needed
      return Promise.resolve();
    },
    
    getProfile: () => apiRequest<any>('GET', '/users/profile'),
    
    verify: () => apiRequest<any>('GET', '/users/profile'),
    
    updateProfile: (userData: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      avatar: string;
    }>) => apiRequest<any>('PUT', '/users/profile', userData),

    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiRequest<{ url: string; user: any }>('POST', '/users/profile/avatar', formData);
    },
  },

  // User role endpoints
  userRoles: {
    becomeOrganizer: (data: {
      businessName: string;
      description: string;
      contactInfo: string;
      logo?: string;
      socials?: string;
    }) => apiRequest<any>('POST', '/user-roles/become-organizer', data),

    uploadOrgLogo: (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      return apiRequest<{ url: string }>('POST', '/user-roles/upload-logo', formData);
    },
    
    becomeVendor: () => apiRequest<any>('POST', '/user-roles/become-vendor'),
    
    getOrganizerProfile: () => apiRequest<any>('GET', '/user-roles/organizer-profile'),
    
    updateOrganizerProfile: (data: {
      organizationId?: number;
      businessName: string;
      description: string;
      contactInfo: string;
      phone: string;
      logo?: string;
      socials?: string;
      payoutBankName?: string;
      payoutAccountNumber?: string;
      payoutAccountName?: string;
      payoutSchedule?: string;
      taxId?: string;
      vatNumber?: string;
      businessAddress?: string;
    }) => apiRequest<any>('PUT', '/user-roles/organizer-profile', data),
    
    getVendorApplications: () => apiRequest<any[]>('GET', '/user-roles/vendor-applications'),
    
    getMyVendorApplications: () => apiRequest<any[]>('GET', '/user-roles/my-vendor-applications'),
  },

  // Event endpoints
  events: {
    getAll: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      location?: string;
    }) => apiRequest<any>('GET', '/events', undefined, { params }),
    
    getById: (id: number) => apiRequest<any>('GET', `/events/get-event/${id}`),

    getByIdAuth: (id: number) => apiRequest<any>('GET', `/events/${id}`),
    
    create: (eventData: any) => apiRequest<any>('POST', '/events', eventData),
    
    createWithImage: (formData: FormData) => apiClient.post('/events', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    
    update: (id: number, eventData: any) => apiRequest<any>('PUT', `/events/${id}`, eventData),
    
    updateWithImage: (id: number, formData: FormData) => apiClient.put(`/events/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
    
    delete: (id: number) => apiRequest<any>('DELETE', `/events/delete/${id}`),

    getOrganizerEvents: (params?: { page?: number; limit?: number }) =>
      apiRequest<any>('GET', '/events/organizer', undefined, { params }),

    getOrganizerEventById: (id: number) =>
      apiRequest<any>('GET', `/events/organizer/${id}`),

    getOrganizerAnalytics: () =>
      apiRequest<any>('GET', '/events/organizer/analytics'),
    
    getCategories: () => apiRequest<any[]>('GET', '/events/categories'),
  },

  // Ticket endpoints
  tickets: {
    getAll: (params?: { userId?: number; eventId?: number }) => apiRequest<any[]>('GET', '/tickets', undefined, { params }),
    
    getById: (id: number) => apiRequest<any>('GET', `/tickets/${id}`),
    
    purchase: (ticketData: {
      eventId: number;
      ticketTypeId: number;
      quantity: number;
    }) => apiRequest<any>('POST', '/tickets/purchase', ticketData),
    
    validate: (qrCode: string) => apiRequest<any>('POST', '/tickets/validate', { qrCode }),
  },

  // Vendor endpoints
  vendors: {
    register: (vendorData: {
      eventId: number;
      vendorId: number;
      vendorTypeId?: number;
      vendorType?: string;
      paymentAmount?: number;
    }) => apiRequest<any>('POST', '/vendors/register', vendorData),
    
    create: (vendorData: {
      businessName: string;
      description: string;
      contactEmail: string;
      contactPhone: string;
      website?: string;
      category?: string;
    }) => apiRequest<any>('POST', '/vendors/profiles', vendorData),
    
    getAll: () => apiRequest<any[]>('GET', '/user-roles/my-vendor-applications'), // Changed to get user's vendor applications
    
    getById: (id: number) => apiRequest<any>('GET', `/vendors/${id}`),
    
    updateStatus: (id: number, statusData: {
      isApproved: boolean;
      isPaid?: boolean;
    }) => apiRequest<any>('PUT', `/vendors/${id}`, statusData),
    
    delete: (id: number) => apiRequest<any>('DELETE', `/vendors/${id}`),
  },

  // Gate PIN endpoints
  gatePins: {
    list:   ()                        => apiRequest<any[]>('GET',    '/gate-pins'),
    create: (staffName: string)       => apiRequest<any>('POST',   '/gate-pins', { staffName }),
    delete: (id: number)              => apiRequest<any>('DELETE',  `/gate-pins/${id}`),
    verify: (pin: string)             => apiRequest<{ valid: boolean; staffName: string }>('POST', '/gate-pins/verify', { pin }),
  },

  // Vendor type endpoints
  vendorTypes: {
    getAllForEvent: (eventId: number) => apiRequest<any[]>('GET', `/vendor-types/event/${eventId}`),
    
    create: (eventId: number, vendorTypeData: {
      name: string;
      fee?: number;
      maxVendors?: number;
    }) => apiRequest<any>('POST', `/vendor-types/event/${eventId}`, vendorTypeData),
    
    update: (id: number, vendorTypeData: {
      name?: string;
      fee?: number;
      maxVendors?: number;
    }) => apiRequest<any>('PUT', `/vendor-types/${id}`, vendorTypeData),
    
    delete: (id: number) => apiRequest<any>('DELETE', `/vendor-types/${id}`),
  },

  // System admin endpoints
  admin: {
    getStats: () => apiRequest<{
      totalUsers: number;
      pendingHosts: number;
      verifiedHosts: number;
      totalEvents: number;
      totalTickets: number;
      totalOrders?: number;
      totalGmv?: number;
      platformRevenue?: number;
      processingFees?: number;
      organizerPayouts?: number;
      openSupportTickets?: number;
      platformFeePercent?: number;
    }>('GET', '/admin/stats'),

    getTransactions: (params?: { status?: string; page?: number; limit?: number }) =>
      apiRequest<any>('GET', '/admin/transactions', undefined, { params }),

    getRevenue: () => apiRequest<any>('GET', '/admin/revenue'),

    getSupportTickets: (status?: string) =>
      apiRequest<any[]>('GET', '/admin/support/tickets', undefined, {
        params: status ? { status } : undefined,
      }),

    getSupportTicket: (id: number) =>
      apiRequest<any>('GET', `/admin/support/tickets/${id}`),

    replyToSupportTicket: (id: number, data: { body: string; status?: string }) =>
      apiRequest<any>('POST', `/admin/support/tickets/${id}/replies`, data),

    updateSupportTicket: (id: number, data: { status?: string; priority?: string }) =>
      apiRequest<any>('PUT', `/admin/support/tickets/${id}`, data),

    getHostApplications: (status?: 'pending' | 'verified' | 'rejected' | 'all') =>
      apiRequest<any[]>('GET', '/admin/host-applications', undefined, {
        params: status ? { status } : undefined,
      }),

    verifyHost: (id: number) =>
      apiRequest<any>('PUT', `/admin/host-applications/${id}/verify`),

    rejectHost: (id: number, reason: string) =>
      apiRequest<any>('PUT', `/admin/host-applications/${id}/reject`, { reason }),

    getUsers: (params?: { search?: string; role?: string }) =>
      apiRequest<any[]>('GET', '/admin/users', undefined, { params }),

    updateUserRole: (id: number, role: string) =>
      apiRequest<any>('PUT', `/admin/users/${id}/role`, { role }),
  },

  // User support endpoints
  support: {
    createTicket: (data: {
      subject: string;
      body: string;
      category?: string;
      contactEmail?: string;
      contactName?: string;
    }) => apiRequest<any>('POST', '/support/tickets', data),

    createContact: (data: {
      subject: string;
      body: string;
      category?: string;
      contactEmail: string;
      contactName: string;
    }) => apiRequest<any>('POST', '/support/contact', data),

    getMyTickets: () => apiRequest<any[]>('GET', '/support/tickets'),

    getTicket: (id: number) => apiRequest<any>('GET', `/support/tickets/${id}`),

    reply: (id: number, body: string) =>
      apiRequest<any>('POST', `/support/tickets/${id}/replies`, { body }),
  },
};

export default api;