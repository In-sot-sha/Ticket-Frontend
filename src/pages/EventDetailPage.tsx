import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEventById } from '../hooks/queries/useEvents';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { generateEventStructuredData } from '../lib/seo';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Share2,
  Heart,
  CheckCircle,
  Store,
  User,
  Mail,
  Building,
  ArrowLeft,
  Star,
  Shield,
  Flag,
  ChevronRight,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { LazyImage } from '../components/LazyImage';
import { GoogleMapLocation } from '../components/GoogleMapLocation';

interface TicketType {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Organizer {
  name: string;
  email: string;
  phone: string;
  eventsHosted: number;
  joinedYear: number;
  responseRate: number;
  avatar: string;
}

interface Highlight {
  icon: string;
  label: string;
}

interface EventDetail {
  id: number;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  latitude?: number;
  longitude?: number;
  category: string;
  price: number;
  ticketsAvailable: number;
  rating: number;
  reviewCount: number;
  images: string[];
  organizer: Organizer;
  ticketTypes: TicketType[];
  amenities: string[];
  highlights: Highlight[];
  vendorApplicationsAllowed: boolean;
  vendorSettings?: {
    stallTypes: Array<{
      id: string;
      name: string;
      price: number;
      maxStalls: number;
      description?: string;
    }>;
  };
  vendorApplications: any[];
}

// Fallback mock event data (used if API fails)
const fallbackEvent: EventDetail = {
  id: 1,
  title: 'AI & Web3 Developer Summit',
  description:
    "Join us for the largest technology conference in Kano. Network with industry leaders, attend workshops, and learn about the latest trends in tech. This event brings together over 500 professionals from across West Africa for two days of immersive learning and networking.",
  date: '2026-07-15',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  location: 'BUK Convocation Arena, Kano, Nigeria',
  category: 'Technology',
  price: 5000,
  ticketsAvailable: 250,
  rating: 4.92,
  reviewCount: 128,
  images: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=1112&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  ],
  organizer: {
    name: 'Kano Event Hub',
    email: 'hello@kanoeventhub.com',
    phone: '+234 801 234 5678',
    eventsHosted: 24,
    joinedYear: 2024,
    responseRate: 98,
    avatar: 'K',
  },
  ticketTypes: [
    { id: 1, name: 'General Admission', price: 5000, quantity: 200 },
    { id: 2, name: 'VIP', price: 15000, quantity: 50 },
    { id: 3, name: 'Student', price: 2500, quantity: 100 },
  ],
  amenities: [
    'Free WiFi',
    'Lunch Provided',
    'Networking Sessions',
    'Workshops',
    'Swag Bag',
    'Certificate of Attendance',
  ],
  highlights: [
    { icon: '🎤', label: '15+ Speakers' },
    { icon: '🏢', label: 'Premium Venue' },
    { icon: '🍽️', label: 'Catering Included' },
    { icon: '📜', label: 'Certificate' },
  ],
  vendorApplicationsAllowed: true,
  vendorSettings: {
    stallTypes: [
      { id: 'stall_1', name: 'Basic Booth', price: 5000, maxStalls: 10, description: 'Perfect for startups' },
      { id: 'stall_2', name: 'Premium Booth', price: 15000, maxStalls: 5, description: 'Larger space with branding' },
    ],
  },
  vendorApplications: [] as any[],
};

// Map API response to the shape used by the page
const mapApiEventToDetail = (apiEvent: any): EventDetail => {
  const startDate = new Date(apiEvent.startDate);
  const endDate = new Date(apiEvent.endDate);
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const imageUrl = apiEvent.imageUrl || fallbackEvent.images[0];
  // Only use images that were actually uploaded — no padding with fallback stock photos
  const images = [imageUrl];

  return {
    id: apiEvent.id,
    title: apiEvent.title,
    description: apiEvent.description || '',
    date: apiEvent.startDate,
    startTime: formatTime(startDate),
    endTime: formatTime(endDate),
    location: apiEvent.location || 'Online',
    latitude: apiEvent.latitude,
    longitude: apiEvent.longitude,
    category: apiEvent.category || 'Other',
    price: apiEvent.price ?? 0,
    ticketsAvailable: apiEvent.ticketTypes
      ? apiEvent.ticketTypes.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0)
      : 0,
    rating: 0,
    reviewCount: 0,
    images,
    organizer: {
      name: apiEvent.organization?.name || 'Event Organizer',
      email: apiEvent.organization?.email || '',
      phone: '',
      eventsHosted: 0,
      joinedYear: new Date(apiEvent.createdAt || Date.now()).getFullYear(),
      responseRate: 0,
      avatar: (apiEvent.organization?.name || 'E')[0].toUpperCase(),
    },
    ticketTypes: apiEvent.ticketTypes || [],
    amenities: (() => {
      try {
        return apiEvent.amenities ? JSON.parse(apiEvent.amenities) : [];
      } catch {
        return [];
      }
    })(),
    highlights: (() => {
      try {
        return apiEvent.highlights ? JSON.parse(apiEvent.highlights) : [];
      } catch {
        return [];
      }
    })(),
    vendorApplicationsAllowed: apiEvent.allowVendors || false,
    vendorSettings: apiEvent.vendorSettings ? {
      stallTypes: Array.isArray(apiEvent.vendorSettings.stallTypes)
        ? apiEvent.vendorSettings.stallTypes
        : [],
    } : undefined,
    vendorApplications: apiEvent.vendorApplications || [],
  };
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);

  // Use React Query hook to fetch event with 3min cache (EVENT_DETAIL config)
  const { data: eventData, isLoading, error, isError } = useEventById(
    id ? Number(id) : 0,
    !!id,
    CACHE_CONFIGS.EVENT_DETAIL
  );

  const event: EventDetail = eventData ? mapApiEventToDetail(eventData) : fallbackEvent;
  const notFound = isError && (error as any)?.response?.status === 404;

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem(`wishlist_${id}`);
      setIsSaved(saved === 'true');
    }
  }, [id]);

  const handlePurchaseTicket = () => {
    navigate(`/book/${event.id}`);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      <Helmet>
        <title>{event?.title || 'Event Details'} | PartyStorm</title>
        <meta name="description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events in Kano.'} />
        <meta property="og:title" content={event?.title || 'Event Details'} />
        <meta property="og:description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events.'} />
        <meta property="og:type" content="event" />
        {event?.images && event.images.length > 0 && <meta property="og:image" content={event.images[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event?.title || 'Event Details'} />
        <meta name="twitter:description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events.'} />
        {event?.id && <link rel="canonical" href={`https://partystorm.com/event/${event.id}`} />}
        {event?.id && (
          <script type="application/ld+json">
            {JSON.stringify(generateEventStructuredData(event))}
          </script>
        )}
      </Helmet>
      {isLoading && (
        <div className="animate-pulse">
          {/* Skeleton Gallery */}
          <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8 pt-0 md:pt-6">
            <div className="w-full h-[300px] sm:h-[380px] md:h-[460px] bg-neutral-200 dark:bg-neutral-800 md:rounded-2xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Skeleton Left: Details */}
              <div className="lg:w-[60%] xl:w-[65%]">
                <div className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-4"></div>
                <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-6"></div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                    <div className="h-3 w-1/4 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                  </div>
                </div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
                  ))}
                </div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
                <div className="space-y-3 mb-8">
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                </div>
              </div>

              {/* Skeleton Right: Booking Card */}
              <div className="hidden lg:block lg:w-[40%] xl:w-[35%]">
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 h-48 bg-neutral-100 dark:bg-neutral-800/50"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Not Found State ─── */}
      {!isLoading && notFound && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md px-6">
            <span className="text-5xl block mb-4">🔍</span>
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">Event not found</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              The event you're looking for doesn't exist or may have been removed.
            </p>
            <button
              onClick={() => navigate('/events')}
              className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-full px-6 py-3 text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
            >
              Browse All Events
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content (only when loaded and found) ─── */}
      {!isLoading && !notFound && (<>

      {/* ─── Photo Gallery ─── */}
      <div className="max-w-8xl mx-auto px-0 md:px-6 lg:px-8 pt-0 md:pt-6">
        {event.images.length === 1 ? (
          /* Single image — full width */
          <div
            className="relative w-full h-[300px] sm:h-[380px] md:h-[460px] rounded-none md:rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setShowAllPhotos(true)}
          >
            <LazyImage
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              containerClassName="relative w-full h-full"
            />
          </div>
        ) : (
          /* 2–5 images — Airbnb-style grid */
          <div className={`relative grid gap-2 rounded-none md:rounded-2xl overflow-hidden h-[300px] sm:h-[360px] md:h-[420px] ${
            event.images.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-2 md:grid-cols-4 md:grid-rows-2'
          }`}>
            {/* Main large image */}
            <div
              className={`relative cursor-pointer group overflow-hidden ${
                event.images.length >= 3 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
              onClick={() => setShowAllPhotos(true)}
            >
              <LazyImage
                src={event.images[0]}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                containerClassName="relative w-full h-full"
              />
            </div>
            {/* Secondary images */}
            {event.images.slice(1).map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer group overflow-hidden"
                onClick={() => setShowAllPhotos(true)}
              >
                <LazyImage
                  src={img}
                  alt={`${event.title} ${i + 2}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  containerClassName="relative w-full h-full"
                />
              </div>
            ))}
            {/* Show all photos button — only when more than 1 image */}
            <button
              onClick={() => setShowAllPhotos(true)}
              className="absolute bottom-4 right-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors z-10"
            >
              Show all {event.images.length} photos
            </button>
          </div>
        )}
      </div>

      {/* ─── Mobile Booking Card (shown only on mobile, right after gallery) ─── */}
      <div className="lg:hidden max-w-8xl mx-auto px-4 sm:px-6 pt-6">
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm bg-white dark:bg-gray-900">
          {/* Price + Rating */}
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-neutral-900 dark:text-white">
                ₦{event.price.toLocaleString()}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">/ ticket</span>
            </div>
            {event.reviewCount > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                <span className="font-bold text-neutral-900 dark:text-white">{event.rating}</span>
                <span className="text-neutral-500">· {event.reviewCount}</span>
              </div>
            )}
          </div>

          {/* Button(s) */}
          {event.vendorApplicationsAllowed ? (
            <div className="space-y-2">
              <button
                onClick={handlePurchaseTicket}
                className="w-full h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Ticket className="h-4 w-4" />
                Buy Tickets
              </button>
              <button
                onClick={() => {
                  if (isAuthenticated ) {
              
                    navigate(`/book/${event.id}?type=vendor`);
                  } else {
                    navigate(`/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor`)}`);
                  }
                }}
                className="w-full h-11 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-bold hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Store className="h-4 w-4" />
                Apply as Vendor
              </button>
            </div>
          ) : (
            <button
              onClick={handlePurchaseTicket}
              className="w-full h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Reserve Tickets
            </button>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Left: Event Details */}
          <div className="lg:w-[60%] xl:w-[65%]">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
                  {event.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (!id) return;
                    const newState = !isSaved;
                    setIsSaved(newState);
                    if (newState) {
                      localStorage.setItem(`wishlist_${id}`, 'true');
                    } else {
                      localStorage.removeItem(`wishlist_${id}`);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isSaved ? 'fill-rose-500 text-rose-500' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  />
                  <span className="text-xs font-bold underline text-neutral-700 dark:text-neutral-300">
                    {isSaved ? 'Saved' : 'Save'}
                  </span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
                  <Share2 className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-xs font-bold underline text-neutral-700 dark:text-neutral-300">
                    Share
                  </span>
                </button>
              </div>
            </div>

            {/* Quick meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              {event.reviewCount > 0 && (
                <>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                    <span className="font-bold text-neutral-900 dark:text-white">{event.rating}</span>
                  </span>
                  <span>·</span>
                  <span className="underline font-medium">{event.reviewCount} reviews</span>
                  <span>·</span>
                </>
              )}
              <span className="font-medium">{event.location}</span>
            </div>

            {/* Divider */}
            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {/* Organizer section */}
            <button
              onClick={() => setShowOrganizerModal(true)}
              className="w-full flex items-center gap-4 mb-6 group text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-2xl p-3 -mx-3 transition-colors"
            >
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-full w-14 h-14 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
                {event.organizer.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Hosted by {event.organizer.name}
                </h3>
                {event.organizer.eventsHosted > 0 && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {event.organizer.eventsHosted} events hosted
                    {event.organizer.responseRate > 0 && ` · ${event.organizer.responseRate}% response rate`}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 shrink-0 transition-colors" />
            </button>

            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {event.highlights.length > 0 && (
              <>
                <div className="space-y-5 mb-6">
                  {event.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-2xl">{h.icon}</span>
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {h.label}
                      </span>
                    </div>
                  ))}
                </div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
              </>
            )}

            {/* Event details */}
            <div className="mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                    <Calendar className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Date</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                    <Clock className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Time</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {event.startTime} – {event.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
                    <MapPin className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Location</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Show map for physical events */}
              {event.location && event.location !== 'Online' && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <GoogleMapLocation 
                    location={event.location}
                    latitude={event.latitude}
                    longitude={event.longitude}
                    eventTitle={event.title}
                  />
                </div>
              )}
            </div>

            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {/* About */}
            <div className="mb-8">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
                About this event
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {event.amenities.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  What's included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <CheckCircle className="h-5 w-5 text-rose-500 shrink-0" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor section */}
            {event.vendorApplicationsAllowed && (
              <>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                      <Store className="h-5 w-5 text-rose-500" />
                      Vendor Opportunities
                    </h2>
                  </div>

                  {/* Vendor Stall Type Cards */}
                  {event.vendorSettings && event.vendorSettings.stallTypes && event.vendorSettings.stallTypes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {event.vendorSettings.stallTypes.map((stall: any) => (
                        <motion.div
                          key={stall.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 bg-white dark:bg-neutral-900 hover:border-rose-300 dark:hover:border-rose-700 transition-colors"
                        >
                          <div className="mb-3">
                            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">{stall.name}</h3>
                            <p className="text-xs text-neutral-500 mt-1">₦{stall.price.toLocaleString()} per stall</p>
                          </div>

                          {stall.description && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3">{stall.description}</p>
                          )}

                          <p className="text-[10px] text-neutral-400 mb-4">
                            Max {stall.maxStalls} stalls available
                          </p>

                          {isAuthenticated && user?.role === 'VENDOR' ? (
                            <button
                              onClick={() => navigate(`/book/${event.id}?type=vendor&stallType=${stall.id}`)}
                              className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-lg px-4 py-2.5 text-xs font-bold hover:shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              Apply Now
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor&stallType=${stall.id}`)}`)}
                              className="w-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg px-4 py-2.5 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                            >
                              Sign in to Apply
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                      No specific stall types defined. Contact the organizer for more details.
                    </p>
                  )}

                  {!isAuthenticated && (
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-3 text-xs text-neutral-600 dark:text-neutral-400">
                      Interested in becoming a vendor?{' '}
                      <button
                        onClick={() => navigate('/login')}
                        className="font-bold text-rose-500 hover:underline"
                      >
                        Create an account
                      </button>{' '}
                      to apply.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── Right: Booking Card (Sticky, Desktop only) ─── */}
          <div className="hidden lg:block lg:w-[40%] xl:w-[35%]">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-lg bg-white dark:bg-gray-900"
              >
                {/* Price header */}
                <div className="flex items-baseline justify-between mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                      ₦{event.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">/ ticket</span>
                  </div>
                  {event.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                      <span className="font-bold text-neutral-900 dark:text-white">{event.rating}</span>
                      <span className="text-neutral-500">· {event.reviewCount} reviews</span>
                    </div>
                  )}
                </div>

                {/* Show choice buttons if vendors are allowed, otherwise just reserve button */}
                {event.vendorApplicationsAllowed ? (
                  <>
                    {/* Reserve Tickets Button */}
                    <button
                      onClick={handlePurchaseTicket}
                      className="w-full h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] mb-2 flex items-center justify-center gap-2"
                    >
                      <Ticket className="h-4 w-4" />
                      Buy Tickets
                    </button>

                    {/* Apply as Vendor Button */}
                    <button
                      onClick={() => {
                        if (isAuthenticated ) {
                          navigate(`/book/${event.id}?type=vendor`);
                        } else {
                          navigate(`/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor`)}`);
                        }
                      }}
                      className="w-full h-11 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-sm font-bold hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Store className="h-4 w-4" />
                      Apply as Vendor
                    </button>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mt-3">
                      You won't be charged yet
                    </p>
                  </>
                ) : (
                  <>
                    {/* Reserve button */}
                    <button
                      onClick={handlePurchaseTicket}
                      className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] mb-3 mt-4"
                    >
                      Reserve Tickets
                    </button>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mb-4">
                      You won't be charged yet
                    </p>
                  </>
                )}
              </motion.div>

              {/* Report listing */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Flag className="h-3.5 w-3.5 text-neutral-400" />
                <button className="text-xs font-medium text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-700 dark:hover:text-neutral-300">
                  Report this listing
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Full-screen Photo Gallery Modal ─── */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-neutral-100 dark:border-neutral-900 px-4 py-3 flex items-center">
            <button
              onClick={() => setShowAllPhotos(false)}
              className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-2">
            {event.images.map((img, i) => (
              <div key={i} className="relative w-full h-96 rounded-xl overflow-hidden">
                <LazyImage
                  src={img}
                  alt={`${event.title} ${i + 1}`}
                  className="w-full h-full object-cover"
                  containerClassName="relative w-full h-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Organizer Detail Modal ─── */}
      {showOrganizerModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowOrganizerModal(false); }}
        >
          {/* On mobile: sheet stops above tab bar (pb-16). On sm+: centred card */}
          <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 overflow-hidden pb-16 sm:pb-0">

            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white">Organizer Info</h2>
              <button
                onClick={() => setShowOrganizerModal(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Organizer profile */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] sm:max-h-none">
              {/* Avatar + name + Twitter/Instagram-style verified badge */}
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl font-extrabold shadow-md shrink-0">
                  {event.organizer.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-base text-neutral-900 dark:text-white">
                      {event.organizer.name}
                    </h3>
                    {/* Verified badge — solid filled circle with checkmark, like Twitter/Instagram */}
                    <span title="Verified Organizer" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 shrink-0">
                      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white" aria-hidden="true">
                        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      </svg>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Member since {event.organizer.joinedYear}
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-3 text-center">
                  <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{event.organizer.eventsHosted}</p>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Events Hosted</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-3 text-center">
                  <p className="text-lg font-extrabold text-neutral-900 dark:text-white">{event.organizer.responseRate}%</p>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Response Rate</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-3 text-center">
                  <p className="text-lg font-extrabold text-rose-500">{event.rating}</p>
                  <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Avg. Rating</p>
                </div>
              </div>

              {/* Contact details */}
              <div className="space-y-3 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Contact</p>
                <div className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0">
                    <Mail className="h-4 w-4 text-neutral-500" />
                  </div>
                  <span className="font-medium truncate">{event.organizer.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                  <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl shrink-0">
                    <User className="h-4 w-4 text-neutral-500" />
                  </div>
                  <span className="font-medium">{event.organizer.phone}</span>
                </div>
              </div>

              {/* Trust notice */}
              <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-3 text-xs text-blue-700 dark:text-blue-400">
                <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This organizer's identity and events have been reviewed by the PartyStorm team. Always pay through the platform for buyer protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      </>)}

      {/* ─── Sticky Bottom Bar (Mobile only, when not loading) ─── */}
      {!isLoading && !notFound && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-neutral-900 dark:text-white">
                From ₦{(event.price || 0).toLocaleString()}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">/ ticket</span>
            </div>
          </div>
          {event.vendorApplicationsAllowed ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePurchaseTicket}
                className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-lg text-xs font-bold px-4 py-2.5 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                Buy
              </button>
              <button
                onClick={() => {
                  if (isAuthenticated && user?.role === 'VENDOR') {
                    navigate(`/book/${event.id}?type=vendor`);
                  } else {
                    navigate(`/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor`)}`);
                  }
                }}
                className="border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-bold px-4 py-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 transition-all active:scale-[0.98]"
              >
                Vendor
              </button>
            </div>
          ) : (
            <button
              onClick={handlePurchaseTicket}
              className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-xs font-bold px-6 py-3 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              Reserve
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;