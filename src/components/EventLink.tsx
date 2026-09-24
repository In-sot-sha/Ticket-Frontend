import React, { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { api } from '../services/api';

interface EventLinkProps {
  eventId: number;
  children: React.ReactNode;
  className?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * Hover wrapper that prefetches event data.
 * Does not render its own link — EventCard already links to the event.
 */
export const EventLink: React.FC<EventLinkProps> = ({
  eventId,
  children,
  className,
  onMouseEnter,
}) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.events.detail(eventId),
        queryFn: () => api.events.getById(eventId).then(res => res.data),
        staleTime: 5 * 60 * 1000,
      });

      onMouseEnter?.(e);
    },
    [eventId, queryClient, onMouseEnter]
  );

  return (
    <div className={className} onMouseEnter={handleMouseEnter}>
      {children}
    </div>
  );
};

export default EventLink;
