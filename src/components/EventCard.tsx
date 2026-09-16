import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { LazyImage } from './LazyImage';
import { getEventUrgencyBadges, isEventPast } from '../lib/eventBadges';
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
  ticketTypes?: Array<{ price: number; quantity?: number }>;
  isPromoted?: boolean;
  description?: string;
}

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'regular' | 'organizer';
  showRating?: boolean;
  showTicketsAvailable?: boolean;
  showPrice?: boolean;
  distance?: number;
  onHover?: (id: number | null) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  showTicketsAvailable = false,
  showPrice = true,
  onHover,
}) => {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`wishlist_${event.id}`);
    if (saved === 'true') {
      setIsSaved(true);
    }
  }, [event.id]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isSaved;
    setIsSaved(newState);
    if (newState) {
      localStorage.setItem(`wishlist_${event.id}`, 'true');
    } else {
      localStorage.removeItem(`wishlist_${event.id}`);
    }
  };

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

  const formattedDate = formatRelativeDate(event.date);
  const isPast = isEventPast(event.date, event.endDate);
  const isPromotedActive = Boolean(event.isPromoted) && !isPast;
  const urgencyBadges = getEventUrgencyBadges({
    date: event.date,
    endDate: event.endDate,
    ticketsAvailable: event.ticketsAvailable,
    hasTicketTypes: (event.ticketTypes?.length ?? 0) > 0,
    maxBadges: isPromotedActive ? 1 : 2,
  });

  return (
    <div
      onMouseEnter={() => onHover?.(event.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group"
    >
      <Link to={`/events/${event.slug || event.id}`} className="block w-full">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-900/30">
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1 items-start max-w-[70%]">
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

          <button
            onClick={handleWishlistToggle}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/90 transition-transform active:scale-90"
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-5 w-5 stroke-[2] drop-shadow-md transition-colors ${
                isSaved
                  ? 'fill-rose-500 stroke-rose-500'
                  : 'fill-black/35 stroke-white hover:stroke-rose-500'
              }`}
            />
          </button>

          {showTicketsAvailable &&
            !isPast &&
            event.ticketsAvailable !== undefined &&
            event.ticketsAvailable > 0 &&
            event.ticketsAvailable <= 50 && (
              <div className="hidden sm:block absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
                {event.ticketsAvailable} left
              </div>
            )}
        </div>

        <div className="mt-2 flex flex-col">
          <div className="flex justify-between items-start gap-2">
            <h3
              className={cn(
                'font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight flex-1',
                isPast && 'text-neutral-500 dark:text-neutral-400'
              )}
            >
              {event.title}
            </h3>
          </div>

          <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
            {event.location}
          </p>

          <p className="text-[10px] sm:text-xs text-neutral-450 dark:text-neutral-505 mt-0.5 font-normal">
            {formattedDate}
          </p>

          {shouldShowPrice && (
            <p className="text-[10px] sm:text-xs text-neutral-900 dark:text-white mt-1.5 font-bold leading-none">
              {displayPrice}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default EventCard;
export type { Event };
