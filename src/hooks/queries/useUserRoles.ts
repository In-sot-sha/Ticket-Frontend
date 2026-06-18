import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetch organizer profile
 */
export const useOrganizerProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.userRoles.organizerProfile(),
    queryFn: () => api.userRoles.getOrganizerProfile().then(res => res.data),
    enabled: enabled,
  });
};

/**
 * Become organizer mutation
 */
export const useBecomeOrganizer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      businessName: string;
      description: string;
      contactInfo: string;
      logo?: string;
      socials?: string;
    }) => api.userRoles.becomeOrganizer(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.userRoles.organizerProfile() });
    },
  });
};

/**
 * Become vendor mutation
 */
export const useBecomeVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.userRoles.becomeVendor().then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
};

/**
 * Update organizer profile mutation
 */
export const useUpdateOrganizerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => api.userRoles.updateOrganizerProfile(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userRoles.organizerProfile() });
    },
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
