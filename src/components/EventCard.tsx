import { Link } from 'react-router-dom';
import { LazyImage } from './LazyImage';
import { eventHasUnlimitedTickets, getEventUrgencyBadges, isEventPast } from '../lib/eventBadges';
import { cn } from '../lib/utils';

// Define the event type
interface Event {
  id: number;
  slug?: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  image: string;
  category?: string;
  ticketsAvailable?: number;
  price?: string | number;
  rating?: number;
  attendees?: number;
  latitude?: number;
  longitude?: number;
  ticketTypes?: Array<{ price: number; quantity?: number | null; isPaused?: boolean }>;
  isPromoted?: boolean;
  description?: string;
}

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'regular' | 'organizer';
  showRating?: boolean;
  showTicketsAvailable?: boolean;
  showPrice?: boolean;
  compact?: boolean;
  distance?: number;
  onHover?: (id: number | null) => void;
}

export function EventCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/9] w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-3 sm:mt-2.5">
        <div className="h-3.5 w-28 rounded bg-neutral-200 dark:bg-neutral-800 sm:h-3" />
        <div className="mt-1 h-5 w-[88%] rounded bg-neutral-200 dark:bg-neutral-800 sm:h-[15px]" />
        <div className="mt-1 h-5 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 sm:hidden" />
        <div className="mt-1 h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 sm:mt-0.5 sm:h-3" />
        <div className="mt-2 h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-800 sm:h-3.5" />
      </div>
    </div>
  );
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  showTicketsAvailable = false,
  showPrice = true,
  compact = false,
  onHover,
}) => {
  let displayPrice = '';
  if (event.ticketTypes && event.ticketTypes.length > 0) {
    const prices = event.ticketTypes.map((t) => Number(t.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (minPrice === 0 && maxPrice === 0) {
      displayPrice = 'Free';
    } else if (minPrice === 0 && maxPrice > 0) {
      displayPrice = 'Free - Paid';
    } else if (event.ticketTypes.length > 1 && minPrice < maxPrice) {
      displayPrice = `From ₦${minPrice.toLocaleString()}`;
    } else {
      displayPrice = `₦${minPrice.toLocaleString()}`;
    }
  } else if (typeof event.price === 'number') {
    displayPrice = event.price === 0 ? 'Free' : `₦${event.price.toLocaleString()}`;
  } else if (event.price) {
    displayPrice = String(event.price);
  }

  const shouldShowPrice = showPrice && displayPrice !== '';

  const formatRelativeDate = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);

    const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) {
      return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const eventDate = new Date(event.date);
  const formattedDate = isNaN(eventDate.getTime())
    ? formatRelativeDate(event.date)
    : eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) +
      (event.date.includes('T')
        ? ` · ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
        : '');
  const isPast = isEventPast(event.date, event.endDate);
  const isPromotedActive = Boolean(event.isPromoted) && !isPast;
  const ticketsUnlimited = eventHasUnlimitedTickets(event.ticketTypes);
  const urgencyBadges = getEventUrgencyBadges({
    date: event.date,
    endDate: event.endDate,
    ticketsAvailable: event.ticketsAvailable,
    ticketsUnlimited,
    hasTicketTypes: (event.ticketTypes?.length ?? 0) > 0,
    maxBadges: isPromotedActive ? 1 : 2,
  });

  return (
    <div
      onMouseEnter={() => onHover?.(event.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group"
    >
      <Link
        to={`/events/${event.slug || event.id}`}
        className="block w-full"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <div className="absolute left-2 top-2 z-10 flex max-w-[80%] flex-col items-start gap-1">
            {isPromotedActive && (
              <span className="px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shadow-sm bg-rose-500 text-white">
                Promoted
              </span>
            )}
            {urgencyBadges.map((badge) => (
              <span
                key={badge.text}
                className={cn(
                  'px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shadow-sm',
                  badge.className
                )}
              >
                {badge.text}
              </span>
            ))}
          </div>

          <LazyImage
            src={event.image}
            alt={event.title}
            className={cn(
              'h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105',
              isPast && 'opacity-80 grayscale-[0.35]'
            )}
            containerClassName="relative w-full h-full"
          />

          {showTicketsAvailable &&
            !isPast &&
            !ticketsUnlimited &&
            event.ticketsAvailable !== undefined &&
            event.ticketsAvailable != null &&
            event.ticketsAvailable > 0 &&
            event.ticketsAvailable <= 50 && (
              <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                {event.ticketsAvailable} left
              </div>
            )}
        </div>

        <div className={cn(compact ? 'mt-1.5 sm:mt-2.5' : 'mt-3 sm:mt-2.5')}>
          <p className={cn('font-semibold text-rose-600 dark:text-rose-400', compact ? 'text-[11px] sm:text-xs' : 'text-sm sm:text-xs')}>
            {formattedDate}
          </p>
          <h3
            className={cn(
              'line-clamp-2 font-bold text-neutral-900 dark:text-white',
              compact ? 'mt-0.5 text-sm leading-tight sm:mt-1 sm:text-[15px] sm:leading-snug' : 'mt-1 text-lg leading-snug sm:text-[15px]',
              isPast && 'text-neutral-500 dark:text-neutral-400'
            )}
          >
            {event.title}
          </h3>
          <p className={cn('line-clamp-1 text-neutral-500 dark:text-neutral-400', compact ? 'mt-0.5 text-xs sm:text-xs' : 'mt-1 text-sm sm:mt-0.5 sm:text-xs')}>
            {event.location}
          </p>
          {shouldShowPrice && (
            <p className={cn('font-bold tabular-nums text-neutral-900 dark:text-white', compact ? 'mt-1 text-sm sm:mt-2 sm:text-sm' : 'mt-2 text-base sm:text-sm')}>
              {displayPrice === 'Free' || displayPrice.startsWith('From') || displayPrice.includes('-')
                ? displayPrice
                : `From ${displayPrice}`}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
export type { Event };
