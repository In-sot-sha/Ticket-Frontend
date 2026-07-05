import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetch vendor types for an event
 */
export const useVendorTypes = (eventId: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.vendorTypes.listForEvent(eventId),
    queryFn: () => api.vendorTypes.getAllForEvent(eventId).then(res => res.data),
    enabled: enabled && !!eventId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Fetch all vendors (user's vendor applications)
 */
export const useVendors = () => {
  return useQuery({
    queryKey: queryKeys.vendors.list(),
    queryFn: () => api.vendors.getAll().then(res => res.data),
  });
};

/**
 * Fetch a single vendor
 */
export const useMyVendorProfile = () => {
  return useQuery({
    queryKey: ['myVendorProfile'],
    queryFn: () => api.vendors.getMyProfile().then(res => res.data),
  });
};

/**
 * Fetch vendor applications
 */
export const useVendorApplications = () => {
  return useQuery({
    queryKey: queryKeys.userRoles.vendorApplications(),
    queryFn: () => api.userRoles.getVendorApplications().then(res => res.data),
  });
};

/**
 * Fetch my vendor applications
 */
export const useMyVendorApplications = () => {
  return useQuery({
    queryKey: queryKeys.userRoles.myVendorApplications(),
    queryFn: () => api.userRoles.getMyVendorApplications().then(res => res.data),
  });
};

/**
 * Register vendor for event
 */
export const useRegisterVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => api.vendors.register(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list() });
    },
  });
};

/**
 * Save/update vendor profile card
 */
export const useSaveVendorProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      businessName: string;
      description?: string;
      contactEmail: string;
      contactPhone?: string;
      website?: string;
      category?: string;
    }) => api.vendors.saveProfile(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVendorProfile'] });
    },
  });
};

/**
 * Update vendor status
 */
export const useUpdateVendorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: number;
      applicationStatus: 'APPROVED' | 'REJECTED';
      paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
    }) => api.vendors.updateStatus(data.id, data.applicationStatus, data.paymentStatus).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.vendors.list() });
    },
  });
};

/**
 * Create vendor type
 */
export const useCreateVendorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      eventId: number;
      vendorTypeData: { name: string; fee?: number; maxVendors?: number };
    }) => api.vendorTypes.create(data.eventId, data.vendorTypeData).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendorTypes.listForEvent(variables.eventId),
      });
    },
  });
};

/**
 * Update vendor type
 */
export const useUpdateVendorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: number;
      eventId: number;
      vendorTypeData: { name?: string; fee?: number; maxVendors?: number };
    }) => api.vendorTypes.update(data.id, data.vendorTypeData).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.vendorTypes.listForEvent(variables.eventId),
      });
    },
  });
};

/**
 * Delete vendor type
 */
export const useDeleteVendorType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.vendorTypes.delete(id).then(res => res.data),
    onSuccess: () => {
      // Invalidate all vendor types queries
      queryClient.invalidateQueries({ queryKey: queryKeys.vendorTypes.all });
    },
  });
};
