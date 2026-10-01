import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { queryKeys } from '../lib/queryKeys';

export function parseCapabilities(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean) as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean) as string[];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export function useStaffAccess() {
  const { user } = useAuth();
  const isStaffUser = Boolean(user?.isStaff || user?.role === 'ADMIN');

  const { data: homeData, isLoading } = useQuery({
    queryKey: queryKeys.staff.home(),
    queryFn: async () => {
      const res = await api.staff.getHome();
      return res.data;
    },
    enabled: isStaffUser,
    staleTime: 60 * 1000,
  });

  const isAdmin = user?.role === 'ADMIN';

  const capabilities = useMemo(() => {
    if (isAdmin) {
      return ['SCAN', 'WALK_IN_SALE', 'CHECK_IN', 'GATE_MANAGE', 'SUPPORT'];
    }
    const fromHome = homeData?.profile?.capabilities;
    if (fromHome) return parseCapabilities(fromHome);
    const fromUser = user?.staffProfile?.capabilities;
    if (fromUser) return parseCapabilities(fromUser);
    return [];
  }, [isAdmin, homeData?.profile?.capabilities, user?.staffProfile?.capabilities]);

  const canScan =
    isAdmin ||
    capabilities.includes('SCAN') ||
    capabilities.includes('CHECK_IN') ||
    capabilities.includes('GATE_MANAGE');

  const canWalkIn =
    isAdmin ||
    capabilities.includes('WALK_IN_SALE') ||
    capabilities.includes('GATE_MANAGE');

  const canSupport = isAdmin || capabilities.includes('SUPPORT');

  const canManageGate = isAdmin || capabilities.includes('GATE_MANAGE');

  return {
    isAdmin,
    isStaff: isStaffUser,
    capabilities,
    canScan,
    canWalkIn,
    canSupport,
    canManageGate,
    todayGates: homeData?.todayGates || [],
    events: homeData?.events || [],
    isLoading,
  };
}
