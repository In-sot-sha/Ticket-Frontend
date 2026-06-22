import { QueryClient } from '@tanstack/react-query';

/**
 * Query Client configuration for React Query
 * Default: Fresh data (staleTime: 0) for organizer pages
 * Pages with caching: HomePage, EventDetailPage, EventsPage, GuestDashboard
 * Pages without caching: OrganizerEventPage, EventsDashboard, Dashboard
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: Mark data as stale immediately (0ms) - forces fresh fetch on mount
      // Override this in specific pages that need caching
      staleTime: 0,
      
      // Keep unused data in cache for 5 minutes before garbage collection
      gcTime: 5 * 60 * 1000,
      
      // Automatically refetch stale data when window regains focus
      refetchOnWindowFocus: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
      
      // Refetch on network reconnect
      refetchOnReconnect: true,
      
      // Retry failed requests up to 2 times with exponential backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Keep mutation cache for 5 minutes
      gcTime: 5 * 60 * 1000,
    },
  },
});

/**
 * Cache configurations for specific pages
 * Use these when calling useQuery/useInfiniteQuery to enable caching
 */
export const CACHE_CONFIGS = {
  // Public pages with caching (5 min)
  HOMEPAGE_EVENTS: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Event detail pages with caching (3 min)
  EVENT_DETAIL: {
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Events list page with caching (3 min)
  EVENTS_LIST: {
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Guest tickets with caching (5 min)
  GUEST_TICKETS: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  
  // Organizer pages: NO caching (always fresh)
  ORGANIZER_FRESH: {
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  },
};
