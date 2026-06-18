/**
 * Centralized cache key factory for React Query
 * Ensures consistency and prevents key duplication
 */
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    profile: () => [...queryKeys.auth.all, 'profile'] as const,
    verify: () => [...queryKeys.auth.all, 'verify'] as const,
  },

  // Events
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: { page?: number; limit?: number; search?: string; category?: string; location?: string }) =>
      [...queryKeys.events.lists(), filters] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.events.details(), id] as const,
    categories: () => [...queryKeys.events.all, 'categories'] as const,
    organizerEvents: () => [...queryKeys.events.all, 'organizer'] as const,
    organizerEventDetail: (id: number) => [...queryKeys.events.organizerEvents(), 'detail', id] as const,
    analytics: () => [...queryKeys.events.organizerEvents(), 'analytics'] as const,
  },

  // Tickets
  tickets: {
    all: ['tickets'] as const,
    lists: () => [...queryKeys.tickets.all, 'list'] as const,
    list: (filters?: { userId?: number; eventId?: number }) =>
      [...queryKeys.tickets.lists(), filters] as const,
    details: () => [...queryKeys.tickets.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.tickets.details(), id] as const,
  },

  // Vendors
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: () => [...queryKeys.vendors.lists()] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.vendors.details(), id] as const,
    applications: () => [...queryKeys.vendors.all, 'applications'] as const,
    myApplications: () => [...queryKeys.vendors.applications(), 'my'] as const,
  },

  // Vendor Types
  vendorTypes: {
    all: ['vendor-types'] as const,
    lists: () => [...queryKeys.vendorTypes.all, 'list'] as const,
    listForEvent: (eventId: number) =>
      [...queryKeys.vendorTypes.lists(), 'event', eventId] as const,
  },

  // Gate Pins
  gatePins: {
    all: ['gate-pins'] as const,
    lists: () => [...queryKeys.gatePins.all, 'list'] as const,
  },

  // User Roles
  userRoles: {
    all: ['user-roles'] as const,
    organizerProfile: () => [...queryKeys.userRoles.all, 'organizer-profile'] as const,
    vendorApplications: () => [...queryKeys.userRoles.all, 'vendor-applications'] as const,
    myVendorApplications: () => [...queryKeys.userRoles.all, 'my-vendor-applications'] as const,
  },

  // System admin
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    hostApplications: (status?: string) =>
      [...queryKeys.admin.all, 'host-applications', status ?? 'pending'] as const,
    users: (filters?: { search?: string; role?: string }) =>
      [...queryKeys.admin.all, 'users', filters] as const,
    transactions: (filters?: { status?: string; page?: number }) =>
      [...queryKeys.admin.all, 'transactions', filters] as const,
    revenue: () => [...queryKeys.admin.all, 'revenue'] as const,
    supportTickets: (status?: string) =>
      [...queryKeys.admin.all, 'support-tickets', status ?? 'all'] as const,
    supportTicket: (id: number) =>
      [...queryKeys.admin.all, 'support-ticket', id] as const,
  },

  support: {
    all: ['support'] as const,
    myTickets: () => [...queryKeys.support.all, 'my-tickets'] as const,
    ticket: (id: number) => [...queryKeys.support.all, 'ticket', id] as const,
  },
};
