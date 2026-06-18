import { useMutation, useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';

/** Admin/support data should always feel live — no long stale cache. */
const liveQueryOptions = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
};

async function refreshAdminQueries(queryClient: QueryClient) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.admin.all,
    refetchType: 'all',
  });
}

function patchAllHostApplicationLists(
  queryClient: QueryClient,
  updater: (list: any[]) => any[]
) {
  (['pending', 'verified', 'rejected', 'all'] as const).forEach((status) => {
    queryClient.setQueryData(
      queryKeys.admin.hostApplications(status),
      (old: any[] | undefined) => (Array.isArray(old) ? updater(old) : old)
    );
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: async () => {
      const res = await api.admin.getStats();
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useHostApplications(status: 'pending' | 'verified' | 'rejected' | 'all' = 'all') {
  return useQuery({
    queryKey: queryKeys.admin.hostApplications(status),
    queryFn: async () => {
      const res = await api.admin.getHostApplications(status);
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useAdminUsers(filters?: { search?: string; role?: string }) {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: async () => {
      const res = await api.admin.getUsers(filters);
      return res.data;
    },
    ...liveQueryOptions,
  });
}

async function refreshHostApplications(queryClient: QueryClient) {
  await queryClient.refetchQueries({
    queryKey: [...queryKeys.admin.all, 'host-applications'],
  });
}

export function useVerifyHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.admin.verifyHost(id),
    onSuccess: async (res, orgId) => {
      const updated = res.data?.organization;
      patchAllHostApplicationLists(queryClient, (list) =>
        list.map((o) =>
          o.id === orgId ? { ...o, ...updated, isVerified: true } : o
        )
      );
      queryClient.setQueryData(
        queryKeys.admin.hostApplications('pending'),
        (old: any[] | undefined) =>
          Array.isArray(old) ? old.filter((o) => o.id !== orgId) : old
      );
      await refreshHostApplications(queryClient);
      await refreshAdminQueries(queryClient);
    },
  });
}

export function useRejectHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api.admin.rejectHost(id, reason),
    onSuccess: async (res, { id }) => {
      const updated = res.data?.organization;
      patchAllHostApplicationLists(queryClient, (list) =>
        list.map((o) => (o.id === id ? { ...o, ...updated } : o))
      );
      queryClient.setQueryData(
        queryKeys.admin.hostApplications('pending'),
        (old: any[] | undefined) =>
          Array.isArray(old) ? old.filter((o) => o.id !== id) : old
      );
      await refreshHostApplications(queryClient);
      await refreshAdminQueries(queryClient);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.admin.updateUserRole(id, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.admin.users(),
        refetchType: 'all',
      });
    },
  });
}

export function useAdminTransactions(filters?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.admin.transactions(filters),
    queryFn: async () => {
      const res = await api.admin.getTransactions(filters);
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useAdminRevenue() {
  return useQuery({
    queryKey: queryKeys.admin.revenue(),
    queryFn: async () => {
      const res = await api.admin.getRevenue();
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useAdminSupportTickets(status: string = 'all') {
  return useQuery({
    queryKey: queryKeys.admin.supportTickets(status),
    queryFn: async () => {
      const res = await api.admin.getSupportTickets(status === 'all' ? undefined : status);
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useAdminSupportTicket(id: number | null) {
  return useQuery({
    queryKey: queryKeys.admin.supportTicket(id!),
    queryFn: async () => {
      const res = await api.admin.getSupportTicket(id!);
      return res.data;
    },
    enabled: !!id,
    ...liveQueryOptions,
  });
}

export function useAdminReplySupport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body, status }: { id: number; body: string; status?: string }) =>
      api.admin.replyToSupportTicket(id, { body, status }),
    onSuccess: async (res, vars) => {
      const reply = res.data?.reply;
      const newStatus = vars.status ?? 'IN_PROGRESS';

      queryClient.setQueryData(queryKeys.admin.supportTicket(vars.id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          messages: reply ? [...(old.messages ?? []), reply] : old.messages,
        };
      });

      (['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).forEach((status) => {
        queryClient.setQueryData(
          queryKeys.admin.supportTickets(status),
          (old: any[] | undefined) => {
            if (!Array.isArray(old)) return old;
            return old.map((t) =>
              t.id === vars.id
                ? {
                    ...t,
                    status: newStatus,
                    updatedAt: new Date().toISOString(),
                    _count: { messages: (t._count?.messages ?? 0) + 1 },
                  }
                : t
            );
          }
        );
      });

      await refreshAdminQueries(queryClient);
    },
  });
}

export function useAdminUpdateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, priority }: { id: number; status?: string; priority?: string }) =>
      api.admin.updateSupportTicket(id, { status, priority }),
    onSuccess: async (_res, vars) => {
      const patchTicket = (t: any) =>
        t.id === vars.id
          ? {
              ...t,
              ...(vars.status ? { status: vars.status } : {}),
              ...(vars.priority ? { priority: vars.priority } : {}),
              updatedAt: new Date().toISOString(),
            }
          : t;

      queryClient.setQueryData(queryKeys.admin.supportTicket(vars.id), (old: any) =>
        old ? patchTicket(old) : old
      );

      (['all', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).forEach((status) => {
        queryClient.setQueryData(
          queryKeys.admin.supportTickets(status),
          (old: any[] | undefined) =>
            Array.isArray(old) ? old.map(patchTicket) : old
        );
      });

      await refreshAdminQueries(queryClient);
    },
  });
}
