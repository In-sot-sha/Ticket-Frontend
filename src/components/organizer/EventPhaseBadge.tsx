import React from 'react';
import { getEventPhase, PHASE_LABELS, PHASE_STYLES } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

export function getEventCountdownLabel(event: {
  isPublished?: boolean;
  startDate?: string;
  endDate?: string;
  phase?: string;
}): { label: string; style: string } {
  if (event.isPublished === false) {
    return {
      label: 'Draft',
      style: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    };
  }
  if (!event.startDate || !event.endDate) {
    return {
      label: 'Draft',
      style: 'bg-neutral-800 text-neutral-300 border-neutral-700',
    };
  }

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now > end) {
    return {
      label: 'Ended',
      style: 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60',
    };
  }

  if (now >= start && now <= end) {
    return {
      label: 'Live Now',
      style: 'bg-emerald-500 text-white font-extrabold border-emerald-400 shadow-sm animate-pulse',
    };
  }

  // Before event start
  const diffMs = start.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours <= 1) {
    const diffMins = Math.max(Math.floor(diffMs / (1000 * 60)), 1);
    return {
      label: `Starts in ${diffMins}m`,
      style: 'bg-rose-500 text-white font-extrabold border-rose-400 animate-pulse',
    };
  }

  if (diffHours < 24) {
    return {
      label: `Starts in ${diffHours}h`,
      style: 'bg-amber-500 text-white font-bold border-amber-400',
    };
  }

  if (diffDays === 1) {
    return {
      label: 'Tomorrow',
      style: 'bg-amber-500 text-white font-bold border-amber-400',
    };
  }

  return {
    label: `${diffDays} days to go`,
    style: 'bg-rose-500/90 backdrop-blur-md text-white font-extrabold border-white/20',
  };
}

const EventPhaseBadge: React.FC<{
  event: { isPublished?: boolean; phase?: string; startDate?: string; endDate?: string };
  className?: string;
  showCountdown?: boolean;
}> = ({ event, className, showCountdown }) => {
  if (showCountdown) {
    const countdown = getEventCountdownLabel(event);
    return (
      <span
        className={cn(
          'px-3 py-1 text-xs font-bold rounded-full border shadow-xs',
          countdown.style,
          className
        )}
      >
        {countdown.label}
      </span>
    );
  }

  const phase = getEventPhase(event);
  return (
    <span className={cn('px-2.5 py-0.5 text-xs font-semibold rounded-full', PHASE_STYLES[phase], className)}>
      {PHASE_LABELS[phase]}
    </span>
  );
};

export default EventPhaseBadge;
