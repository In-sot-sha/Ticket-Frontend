import React from 'react';
import { getEventPhase, PHASE_LABELS, PHASE_STYLES } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

const EventPhaseBadge: React.FC<{
  event: { isPublished?: boolean; phase?: string; startDate?: string; endDate?: string };
  className?: string;
}> = ({ event, className }) => {
  const phase = getEventPhase(event);
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', PHASE_STYLES[phase], className)}>
      {PHASE_LABELS[phase]}
    </span>
  );
};

export default EventPhaseBadge;
