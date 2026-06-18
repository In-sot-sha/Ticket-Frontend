import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';

const liveQueryOptions = {
  staleTime: 0,
  refetchOnMount: 'always' as const,
};

export function useMySupportTickets() {
  return useQuery({
    queryKey: queryKeys.support.myTickets(),
    queryFn: async () => {
      const res = await api.support.getMyTickets();
      return res.data;
    },
    ...liveQueryOptions,
  });
}

export function useSupportTicket(id: number | null) {
  return useQuery({
    queryKey: queryKeys.support.ticket(id!),
    queryFn: async () => {
      const res = await api.support.getTicket(id!);
      return res.data;
    },
    enabled: !!id,
    ...liveQueryOptions,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      subject: string;
      body: string;
      category?: string;
    }) => api.support.createTicket(data),
    onSuccess: async (res) => {
      const ticket = res.data?.ticket;
      if (ticket) {
        queryClient.setQueryData(queryKeys.support.myTickets(), (old: any[] | undefined) =>
          Array.isArray(old) ? [ticket, ...old] : [ticket]
        );
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.support.all,
        refetchType: 'all',
      });
    },
  });
}

export function useReplySupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      api.support.reply(id, body),
    onSuccess: async (res, vars) => {
      const reply = res.data?.reply;

      queryClient.setQueryData(queryKeys.support.ticket(vars.id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          status: 'OPEN',
          messages: reply ? [...(old.messages ?? []), reply] : old.messages,
        };
      });

      queryClient.setQueryData(queryKeys.support.myTickets(), (old: any[] | undefined) => {
        if (!Array.isArray(old)) return old;
        return old.map((t) =>
          t.id === vars.id
            ? { ...t, status: 'OPEN', updatedAt: new Date().toISOString() }
            : t
        );
      });

      await queryClient.invalidateQueries({
        queryKey: queryKeys.support.all,
        refetchType: 'all',
      });
    },
  });
}
