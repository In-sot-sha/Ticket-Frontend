import { QueryClient } from '@tanstack/react-query';

/**
 * Query Client configuration for React Query
 * Optimized for caching, stale time, and performance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data in cache for 5 minutes before marking as stale
      staleTime: 5 * 60 * 1000,
      
      // Keep unused data in cache for 10 minutes before garbage collection
      gcTime: 10 * 60 * 1000,
      
      // Automatically refetch stale data when window regains focus
      refetchOnWindowFocus: true,
      
      // Don't retry failed requests on mount
      refetchOnMount: false,
      
      // Don't refetch on network reconnect to reduce API calls
      refetchOnReconnect: false,
      
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
