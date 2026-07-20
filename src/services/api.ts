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
  timeout: 60000, // Increased from 10s to 60s for image uploads on slow networks
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
    if (config.method?.toLowerCase() === 'get' && (url.includes('/admin/') || url.includes('/support/') || url.includes('/staff/support'))) {
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
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Only auto-logout on 401 if it's NOT an auth endpoint.
    // Auth endpoints (login/register) legitimately return 401 for bad credentials
    const requestUrl: string = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/users/register') ||
      requestUrl.includes('/users/google-login') ||
      requestUrl.includes('/users/refresh-token') ||
      requestUrl.includes('/gate-pins/verify') ||
      requestUrl.includes('/tickets/validate');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const storedToken = localStorage.getItem('token');
          if (!storedToken) throw new Error('No stored token');

          // Create a new axios instance to avoid interceptor recursion
          const refreshClient = axios.create({
            baseURL: currentEndpoint,
            timeout: 10000,
          });

          const response = await refreshClient.post('/users/refresh-token', { token: storedToken });

          if (response.data?.accessToken) {
            const newToken = response.data.accessToken;
            localStorage.setItem('token', newToken);
            if (response.data.user) {
              localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            
            // Update default header for new requests
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            
            // Process queued requests with new token
            processQueue(undefined, newToken);
            isRefreshing = false;
            
            // Retry original request with new token
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              return apiClient.request(error.config);
            }
          } else {
            throw new Error('No access token in response');
          }
        } catch (refreshError) {
          console.error('[API] Token refresh failed:', refreshError);
          processQueue(refreshError, undefined);
          isRefreshing = false;
          
          // Logout on refresh failure
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return apiClient.request(error.config);
          }
        });
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
      email?: string | null;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    }) => apiRequest<{ token: string; user: any }> ('POST', '/users/register', userData),
    
    login: (credentials: {
      email?: string;
      identifier?: string;
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
      promoted?: string;
      organizationId?: number;
      date?: string;
      dateFrom?: string;
      dateTo?: string;
      upcoming?: string;
    }) => apiRequest<any>('GET', '/events', undefined, { params }),
    
    getById: (id: number) => apiRequest<any>('GET', `/events/get/${id}`),

    getBySlug: (slug: string) => apiRequest<any>('GET', `/events/get/${slug}`),

    // Unified: works with slug or numeric ID
    getByIdentifier: (identifier: string) => apiRequest<any>('GET', `/events/get/${identifier}`),

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

    getOrganizerEventById: (idOrSlug: string | number) =>
      apiRequest<any>('GET', `/events/organizer/${idOrSlug}`),

    getOrganizerAnalytics: () =>
      apiRequest<any>('GET', '/events/organizer/analytics'),
    
    getCategories: () => apiRequest<any[]>('GET', '/events/categories'),
  },

  // Ticket endpoints
  tickets: {
    getAll: (params?: { userId?: number; eventId?: number }) => {
      if (params?.eventId) {
        return apiRequest<any[]>('GET', `/tickets/event/${params.eventId}`);
      }
      return apiRequest<any[]>('GET', '/tickets/my-tickets');
    },
    
    getMyTickets: () => apiRequest<any[]>('GET', '/tickets/my-tickets'),
    
    getEventAttendance: (eventId: number) => apiRequest<any[]>('GET', `/tickets/event/${eventId}`),
    
    getAdminTickets: () => apiRequest<any[]>('GET', '/tickets/admin/all'),
    
    getById: (id: number) => apiRequest<any>('GET', `/tickets/${id}`),
    
    purchase: (ticketData: {
      eventId: number;
      ticketTypeId: number;
      quantity: number;
    }) => apiRequest<any>('POST', '/tickets/purchase', ticketData),

    checkEligibility: (data: {
      eventId: number;
      ticketTypeId: number;
      email?: string;
      phone?: string;
    }) =>
      apiRequest<{ owned: number; maxPerPerson: number; remaining: number }>(
        'POST',
        '/tickets/eligibility',
        data
      ),
    
    validate: (qrCode: string, eventId?: number) => 
      apiRequest<any>('POST', '/tickets/validate', { qrCode, eventId }),
  },

  // Vendor endpoints
  vendors: {
    register: (vendorData: {
      eventId: number;
      vendorTypeId?: number;
      vendorType?: string;
      paymentAmount?: number;
      paymentReference?: string;
      businessName: string;
      businessEmail: string;
      businessPhone?: string;
      description?: string;
      category?: string;
      staffCount?: string;
    }) => apiRequest<any>('POST', '/vendors/applications', vendorData),
    
    getMyProfile: () => apiRequest<any>('GET', '/vendors/profiles/me'),
    
    saveProfile: (vendorData: {
      businessName: string;
      description?: string;
      contactEmail: string;
      contactPhone?: string;
      website?: string;
      category?: string;
    }) => apiRequest<any>('POST', '/vendors/profiles', vendorData),
    
    getAll: () => apiRequest<any[]>('GET', '/user-roles/my-vendor-applications'), // User's applications
    
    updateStatus: (
      id: number,
      applicationStatus: 'APPROVED' | 'REJECTED',
      paymentStatus?: 'PENDING' | 'PAID' | 'FAILED',
      stallNumber?: string | null,
    ) =>
      apiRequest<any>('PUT', `/vendors/applications/${id}/status`, {
        applicationStatus,
        paymentStatus,
        stallNumber,
      }),
  },

  // Gate PIN endpoints
  gatePins: {
    list:   ()                        => apiRequest<any[]>('GET',    '/gate-pins'),
    create: (staffName: string)       => apiRequest<any>('POST',   '/gate-pins', { staffName }),
    delete: (id: number)              => apiRequest<any>('DELETE',  `/gate-pins/${id}`),
    verify: (pin: string)             => apiRequest<{ valid: boolean; staffName: string; organizationId: number }>('POST', '/gate-pins/verify', { pin }),
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
      pendingOpsRequests?: number;
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

    replyToSupportTicket: (
      id: number,
      data: { body: string; status?: string; needsMoreInfo?: boolean }
    ) => apiRequest<any>('POST', `/admin/support/tickets/${id}/replies`, data),

    updateSupportTicket: (
      id: number,
      data: { status?: string; priority?: string; notifyMessage?: string }
    ) => apiRequest<any>('PUT', `/admin/support/tickets/${id}`, data),

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

    getEvents: (params?: { search?: string }) =>
      apiRequest<any[]>('GET', '/admin/events', undefined, { params }),

    promoteEvent: (id: number, data: { isPromoted: boolean; promotedUntil?: string | null }) =>
      apiRequest<any>('PUT', `/admin/events/${id}/promote`, data),

    transferEvent: (id: number, organizationId: number) =>
      apiRequest<any>('POST', `/admin/events/${id}/transfer`, { organizationId }),

    getStaff: () => apiRequest<{ staff: any[] }>('GET', '/admin/staff'),

    createStaff: (data: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      password?: string;
      capabilities?: string[];
      active?: boolean;
      organizationIds?: number[];
      sendInvite?: boolean;
    }) => apiRequest<any>('POST', '/admin/staff', data),

    resendStaffInvite: (userId: number, data?: { resetPassword?: boolean }) =>
      apiRequest<any>('POST', `/admin/staff/${userId}/invite`, data || {}),

    upsertStaff: (
      userId: number,
      data: { isStaff?: boolean; capabilities?: string[]; active?: boolean }
    ) => apiRequest<any>('PUT', `/admin/staff/${userId}`, data),

    addStaffOrgCoverage: (
      userId: number,
      data: { organizationId: number; capabilitiesOverride?: string[] }
    ) => apiRequest<any>('POST', `/admin/staff/${userId}/org-coverage`, data),

    removeStaffOrgCoverage: (userId: number, organizationId: number) =>
      apiRequest<any>('DELETE', `/admin/staff/${userId}/org-coverage/${organizationId}`),

    getOpsProjects: (status?: string) =>
      apiRequest<{ projects: any[] }>('GET', '/admin/ops-projects', undefined, {
        params: status ? { status } : undefined,
      }),

    createOpsProject: (data: {
      title: string;
      organizationId?: number | null;
      eventId?: number | null;
      services?: string[];
      notes?: string;
      windowStart?: string | null;
      windowEnd?: string | null;
      status?: string;
    }) => apiRequest<any>('POST', '/admin/ops-projects', data),

    updateOpsProject: (
      id: number,
      data: {
        title?: string;
        organizationId?: number | null;
        eventId?: number | null;
        services?: string[];
        notes?: string;
        windowStart?: string | null;
        windowEnd?: string | null;
        status?: string;
      }
    ) => apiRequest<any>('PUT', `/admin/ops-projects/${id}`, data),

    assignOpsStaff: (
      projectId: number,
      data: { userId: number; capabilitiesOverride?: string[] }
    ) => apiRequest<any>('POST', `/admin/ops-projects/${projectId}/staff`, data),

    removeOpsStaff: (projectId: number, userId: number) =>
      apiRequest<any>('DELETE', `/admin/ops-projects/${projectId}/staff/${userId}`),

    updateOrganizationFee: (id: number, data: { serviceFeePercent?: number; absorbFee?: boolean }) =>
      apiRequest<any>('PUT', `/admin/host-applications/${id}/fee`, data),

    getPayouts: (status?: string) =>
      apiRequest<any[]>('GET', '/admin/payouts', undefined, { params: status ? { status } : undefined }),

    approvePayout: (id: number) =>
      apiRequest<any>('POST', `/admin/payouts/${id}/approve`),

    rejectPayout: (id: number) =>
      apiRequest<any>('POST', `/admin/payouts/${id}/reject`),
  },

  staff: {
    getHome: () =>
      apiRequest<{
        profile: { capabilities: string[]; active: boolean } | null;
        orgCoverage: Array<{
          organizationId: number;
          organizationName: string;
          gatePinCount?: number;
        }>;
        projects: any[];
        events: any[];
        todayGates?: any[];
      }>('GET', '/staff/home'),

    requestOps: (data: {
      title?: string;
      organizationId?: number;
      eventId?: number;
      services?: string[];
      notes?: string;
      windowStart?: string;
      windowEnd?: string;
    }) => apiRequest<any>('POST', '/staff/ops-request', data),

    getSupportTickets: (status?: string) =>
      apiRequest<any[]>('GET', '/staff/support/tickets', undefined, {
        params: status ? { status } : undefined,
      }),

    getSupportTicket: (id: number) =>
      apiRequest<any>('GET', `/staff/support/tickets/${id}`),

    replyToSupportTicket: (
      id: number,
      data: { body: string; status?: string; needsMoreInfo?: boolean }
    ) => apiRequest<any>('POST', `/staff/support/tickets/${id}/replies`, data),

    updateSupportTicket: (
      id: number,
      data: { status?: string; priority?: string; notifyMessage?: string }
    ) => apiRequest<any>('PUT', `/staff/support/tickets/${id}`, data),
  },

  // Finance and Payouts endpoints
  finance: {
    getBalance: () => apiRequest<{
      totalEarnings: number;
      totalPaidOut: number;
      totalPending: number;
      availableBalance: number;
      payouts: any[];
      bankSettings: {
        payoutBankName: string | null;
        payoutAccountNumber: string | null;
        payoutAccountName: string | null;
        payoutSchedule: string | null;
      };
    }>('GET', '/finance/balance'),
    
    requestPayout: (amount: number) => 
      apiRequest<any>('POST', '/finance/payout', { amount }),
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