// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
let localEndpoint = import.meta.env.VITE_API_URL || "http://localhost:33333/api";
let productionEndpoint = "https://eventify-api.onrender.com/api";

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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Only auto-logout on 401 if it's NOT an auth endpoint.
    // Auth endpoints (login/register) legitimately return 401 for bad credentials
    // — intercepting those would prevent the error from reaching the caller.
    const requestUrl: string = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/users/register') ||
      requestUrl.includes('/users/google-login');

    if (error.response?.status === 401 && !isAuthEndpoint) {
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
  },

  // User role endpoints
  userRoles: {
    becomeOrganizer: (data: {
      businessName: string;
      description: string;
      contactInfo: string;
    }) => apiRequest<any>('POST', '/user-roles/become-organizer', data),
    
    becomeVendor: () => apiRequest<any>('POST', '/user-roles/become-vendor'),
    
    getOrganizerProfile: () => apiRequest<any>('GET', '/user-roles/organizer-profile'),
    
    updateOrganizerProfile: (data: {
      businessName: string;
      description: string;
      contactInfo: string;
      phone: string;
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
};

export default api;