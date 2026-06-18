import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Fetch user profile (requires authentication)
 */
export const useUserProfile = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => api.auth.getProfile().then(res => res.data),
    enabled: enabled,
  });
};

/**
 * Verify authentication status
 */
export const useVerifyAuth = () => {
  return useQuery({
    queryKey: queryKeys.auth.verify(),
    queryFn: () => api.auth.verify().then(res => res.data),
  });
};

/**
 * Login mutation
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.auth.login(credentials).then(res => res.data),
    onSuccess: (data) => {
      // Store token and user info
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      // Invalidate auth queries to refetch with new token
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
};

/**
 * Register mutation
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => api.auth.register(userData).then(res => res.data),
    onSuccess: (data) => {
      // Store token and user info
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }
      // Invalidate auth queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
};

/**
 * Update profile mutation
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      avatar: string;
    }>) => api.auth.updateProfile(userData).then(res => res.data),
    onSuccess: (data) => {
      // Update localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      // Invalidate profile queries
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile() });
    },
  });
};

/**
 * Logout (clears cache and storage)
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear all cached data
      queryClient.clear();
    },
  });
};
