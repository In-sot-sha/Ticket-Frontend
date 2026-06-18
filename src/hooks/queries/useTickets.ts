import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { queryKeys } from '@/lib/queryKeys';

interface TicketListParams {
  userId?: number;
  eventId?: number;
}

/**
 * Fetch user's tickets
 */
export const useTickets = (params?: TicketListParams) => {
  return useQuery({
    queryKey: queryKeys.tickets.list(params),
    queryFn: () => api.tickets.getAll(params).then(res => res.data),
  });
};

/**
 * Fetch a single ticket by ID
 */
export const useTicketById = (id: number, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => api.tickets.getById(id).then(res => res.data),
    enabled: enabled && !!id,
  });
};

/**
 * Purchase ticket mutation
 */
export const usePurchaseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { eventId: number; ticketTypeId: number; quantity: number }) =>
      api.tickets.purchase(data).then(res => res.data),
    onSuccess: (data, variables) => {
      // Invalidate all ticket lists (user tickets)
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.lists() });
      // Also invalidate event data to update ticket availability
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.list() });
    },
  });
};

/**
 * Validate ticket (QR code scanning)
 */
export const useValidateTicket = () => {
  return useMutation({
    mutationFn: (qrCode: string) =>
      api.tickets.validate(qrCode).then(res => res.data),
  });
};
