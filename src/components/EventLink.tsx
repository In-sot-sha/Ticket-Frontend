import React, { useCallback } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { api } from '../services/api';

interface EventLinkProps extends Omit<LinkProps, 'to'> {
  eventId: number;
  children: React.ReactNode;
}

/**
 * EventLink component with automatic prefetch on hover
 * Prefetches event data when user hovers over link
 * Dramatically improves perceived performance
 */
export const EventLink: React.FC<EventLinkProps> = ({
  eventId,
  children,
  onMouseEnter,
  ...props
}) => {
  const queryClient = useQueryClient();

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Prefetch event data when user hovers over link
      queryClient.prefetchQuery({
        queryKey: queryKeys.events.detail(eventId),
        queryFn: () => api.events.getById(eventId).then(res => res.data),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });

      // Call original handler if provided
      onMouseEnter?.(e);
    },
    [eventId, queryClient, onMouseEnter]
  );

  return (
    <Link
      to={`/events/${eventId}`}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
};

export default EventLink;
