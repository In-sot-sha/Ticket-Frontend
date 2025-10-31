import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowRight, Star, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

// Define the event type
interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  ticketsAvailable?: number;
  price?: string | number;
  rating?: number;
  attendees?: number;
}

interface EventCardProps {
  event: Event;
  variant?: 'featured' | 'regular' | 'organizer';
  showRating?: boolean;
  showTicketsAvailable?: boolean;
  showPrice?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ 
  event, 
  variant = 'regular', 
  showRating = false, 
  showTicketsAvailable = false,
  showPrice = true
}) => {
  const isFeatured = variant === 'featured';
  const isOrganizer = variant === 'organizer';

  // Format the price if it exists
  const formattedPrice = typeof event.price === 'number' 
    ? `₦${event.price.toLocaleString()}` 
    : event.price;

  // Determine if we should show price
  const shouldShowPrice = showPrice && (event.price || formattedPrice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link
        to={`/events/${event.id}`}
        className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary"
      >
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <div className={`overflow-hidden ${isFeatured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full shadow-lg">
              {isFeatured && <Tag className="h-3 w-3" />}
              {event.category}
            </span>
          </div>
          
          {/* Rating Badge - only for featured events */}
          {showRating && event.rating && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-gray-900 rounded-full shadow-lg">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">{event.rating}</span>
              </div>
            </div>
          )}
          
          {/* Date Badge - for organizer events */}
          {isOrganizer && (
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-900 rounded-full shadow-lg">
                <Calendar className="h-3.5 w-3.5 " />
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Title and Price */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 transition-colors">
              {event.title}
            </h3>
            {shouldShowPrice && (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold ">
                  {formattedPrice}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">per ticket</span>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 mr-2  flex-shrink-0" />
              <span className="truncate">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 mr-2  flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            
            {/* Show attendees for organizer events */}
            {isOrganizer && event.attendees && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{event.attendees} attendees expected</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            {showTicketsAvailable && event.ticketsAvailable !== undefined && (
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300 font-medium">{event.ticketsAvailable}</span>
                <span className="text-gray-400 dark:text-gray-500">left</span>
              </div>
            )}
            <div className="flex items-center gap-2 font-semibold text-sm group-hover:gap-3 transition-all ml-auto">
              <span>View Event</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;