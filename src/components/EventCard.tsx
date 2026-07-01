import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { LazyImage } from './LazyImage';

// Define the event type
interface Event {
  id: number;
  slug?: string;
  title: string;
  date: string;
  location: string;
  image: string;
  category?: string;
  ticketsAvailable?: number;
  price?: string | number;
  rating?: number;
  attendees?: number;
  latitude?: number;
  longitude?: number;
  ticketTypes?: Array<{ price: number }>;
}

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'regular' | 'organizer';
  showRating?: boolean;
  showTicketsAvailable?: boolean;
  showPrice?: boolean;
  distance?: number; // Distance in km from user
  onHover?: (id: number | null) => void;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  variant = 'regular', 
  showRating = true, 
  showTicketsAvailable = false,
  showPrice = true,
  distance,
  onHover
}) => {
  const [isSaved, setIsSaved] = useState(false);

  // Check if item is in wishlist in localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`wishlist_${event.id}`);
    if (saved === 'true') {
      setIsSaved(true);
    }
  }, [event.id]);

  // Handle wishlist click
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

  // Pricing Logic
  let displayPrice = '';
  if (event.ticketTypes && event.ticketTypes.length > 0) {
    const prices = event.ticketTypes.map(t => Number(t.price));
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

  // Determine if we should show price
  const shouldShowPrice = showPrice && (displayPrice !== '');

  // Format the date relatively
  const formatRelativeDate = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);

    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays > 1 && diffDays < 7) {
      // Return day of week (e.g. "Saturday")
      return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      // Standard format
      return eventDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
  };

  const formattedDate = formatRelativeDate(event.date);

  return (
    <div
  
    >
      <Link to={`/events/${event.slug || event.id}`} className="block w-full">
        
        {/* Card Image Wrapper */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-100/50 dark:border-neutral-900/30">
          <LazyImage
            src={event.image}
            alt={event.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            containerClassName="relative w-full h-full"
          />

          {/* Heart Button Overlay */}
          <button
            onClick={handleWishlistToggle}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-white/90 transition-transform active:scale-90"
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              className={`h-5 w-5 stroke-[2] drop-shadow-md transition-colors ${
                isSaved 
                  ? 'fill-rose-500 stroke-rose-500' 
                  : 'fill-black/35 stroke-white hover:stroke-rose-500'
              }`}
            />
          </button>

          {/* Available tickets badge — hide on mobile */}
          {showTicketsAvailable && event.ticketsAvailable !== undefined && event.ticketsAvailable > 0 && (
            <div className="hidden sm:block absolute bottom-3 left-3 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-extrabold text-neutral-800 dark:text-neutral-200 uppercase tracking-wide">
              {event.ticketsAvailable} left
            </div>
          )}
        </div>

        {/* Details section */}
        <div className="mt-2 flex flex-col">
          
          {/* First Line: Title */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight flex-1">
              {event.title}
            </h3>
          </div>

          {/* Second Line: Location */}
          <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
            {event.location}
          </p>
          {/* TODO: Uncomment when distance sorting is enabled */}
          {/* {distance !== undefined && (
            <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-semibold inline-block ml-1">
              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
            </p>
          )} */}

          {/* Third Line: Date */}
          <p className="text-[10px] sm:text-xs text-neutral-450 dark:text-neutral-505 mt-0.5 font-normal">
            {formattedDate}
          </p>

          {/* Fourth Line: Price */}
          {shouldShowPrice && (
            <p className="text-[10px] sm:text-xs text-neutral-900 dark:text-white mt-1.5 font-bold leading-none">
              {displayPrice}
            </p>
          )}

          {/* Fifth Line: Rating (tablet+) */}
          
        </div>
        
      </Link>
    </div>
  );
};

export default EventCard;
export type { Event };