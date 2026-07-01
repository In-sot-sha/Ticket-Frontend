import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

// Types
interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  location?: string;
}

interface EventMutationData {
  eventData: any;
  formData?: FormData;
}

interface QueryConfig {
  staleTime?: number;
  gcTime?: number;
}

/**
 * Fetch all events with optional filters
 * @param params - Filter parameters
 * @param config - Optional React Query config (staleTime, gcTime)
 */
export const useEvents = (params?: EventListParams, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => api.events.getAll(params).then(res => res.data.events),
    enabled: true,
    ...config,
  });
};

/**
 * Fetch a single event by ID (public endpoint)
 * @param id - Event ID
 * @param enabled - Whether query should run
 * @param config - Optional React Query config (staleTime, gcTime)
 */
export const useEventById = (id: number, enabled = true, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => api.events.getById(id).then(res => res.data),
    enabled: enabled && !!id,
    ...config,
  });
};

/**
 * Fetch a single event by identifier (slug or numeric ID).
 * Uses the unified backend endpoint that auto-detects the type.
 * This handles old events without slugs (falls back to ID lookup).
 */
export const useEventByIdentifier = (identifier: string, enabled = true, config?: QueryConfig) => {
  return useQuery({
    queryKey: ['event', identifier],
    queryFn: () => api.events.getByIdentifier(identifier).then(res => res.data),
    enabled: enabled && !!identifier,
    ...config,
  });
};

// Keep slug alias for backwards compat
export const useEventBySlug = useEventByIdentifier;

/**
 * Fetch a single event by ID (authenticated endpoint)
 */
export const useEventByIdAuth = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => api.events.getByIdAuth(id).then(res => res.data),
    enabled: enabled && !!id,
  });
};

/**
 * Fetch event categories
 */
export const useEventCategories = () => {
  return useQuery({
    queryKey: queryKeys.events.categories(),
    queryFn: () => api.events.getCategories().then(res => res.data),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour — categories rarely change
    gcTime: 1000 * 60 * 60 * 2, // Keep for 2 hours
  });
};

/**
 * Fetch organizer's events
 * @param params - Optional parameters (page, limit)
 * @param config - Optional React Query config (staleTime, gcTime) — defaults to FRESH (no cache)
 */
export const useOrganizerEvents = (params?: { page?: number; limit?: number }, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.events.organizerEvents(),
    queryFn: () => api.events.getOrganizerEvents(params).then(res => res.data.events),
    ...config,
  });
};

/**
 * Fetch organizer's event by ID
 * @param config - Optional React Query config (staleTime, gcTime) — defaults to FRESH (no cache)
 */
export const useOrganizerEventById = (id: number, enabled = true, config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.events.organizerEventDetail(id),
    queryFn: () => api.events.getOrganizerEventById(id).then(res => res.data),
    enabled: enabled && !!id,
    staleTime: 0, // No caching by default
    gcTime: 0, // Don't keep in cache
    ...config,
  });
};

/**
 * Fetch organizer analytics
 * @param config - Optional React Query config (staleTime, gcTime) — defaults to FRESH (no cache)
 */
export const useOrganizerAnalytics = (config?: QueryConfig) => {
  return useQuery({
    queryKey: queryKeys.events.analytics(),
    queryFn: () => api.events.getOrganizerAnalytics().then(res => res.data),
    staleTime: 0, // No caching by default
    gcTime: 0, // Don't keep in cache
    ...config,
  });
};

/**
 * Create event mutation
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventData, formData }: EventMutationData) => {
      if (formData) {
        return api.events.createWithImage(formData).then(res => res.data);
      }
      return api.events.create(eventData).then(res => res.data);
    },
    onSuccess: () => {
      // Invalidate the organizer events list and categories
      queryClient.invalidateQueries({ queryKey: queryKeys.events.organizerEvents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
};

/**
 * Update event mutation
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; eventData: any; formData?: FormData }) => {
      if (data.formData) {
        return api.events.updateWithImage(data.id, data.formData).then(res => res.data);
      }
      return api.events.update(data.id, data.eventData).then(res => res.data);
    },
    onSuccess: (data, variables) => {
      // Invalidate specific event detail (public and auth versions)
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.organizerEventDetail(variables.id) });
      // Invalidate all event lists (may affect search/filter results)
      queryClient.invalidateQueries({ queryKey: queryKeys.events.organizerEvents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
};

/**
 * Delete event mutation
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.events.delete(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.organizerEvents() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
};
