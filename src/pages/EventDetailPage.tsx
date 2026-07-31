import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useEventBySlug, useEvents } from '../hooks/queries/useEvents';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { generateEventStructuredData } from '../lib/seo';
import { buildSocialUrl, hasAnySocial, OrgSocialLinks, parseOrgSocials } from '../lib/orgSocials';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  Share2,
  Heart,
  CheckCircle,
  Store,
  Mail,
  ArrowLeft,
  Star,
  Flag,
  ChevronRight,
  X,
  AlertCircle,
  Globe,
  Instagram,
  Twitter,
  TicketIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { LazyImage } from '../components/LazyImage';
import { GoogleMapLocation } from '../components/GoogleMapLocation';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const formatDeadlineFriendly = (dateStr: string) => {
  try {
    const deadlineDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDay = new Date(deadlineDate);
    deadlineDay.setHours(0, 0, 0, 0);

    const diffTime = deadlineDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Closed on ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (diffDays === 0) {
      return "Closes Today!";
    }
    if (diffDays === 1) {
      return "Closes Tomorrow!";
    }
    if (diffDays <= 7) {
      return `Closes in ${diffDays} days (${deadlineDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})`;
    }
    return `Applications close: ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } catch {
    return `Applications close: ${dateStr}`;
  }
};

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
  logo?: string;
  website?: string;
  description?: string;
  socials?: OrgSocialLinks;
  isVerified?: boolean;
}

interface Highlight {
  icon: string;
  label: string;
}

interface EventDetail {
  id: number;
  slug?: string;
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
  isPublished: boolean;
  endDateRaw: string;
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
  vendorDeadline?: string;
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
  isPublished: true,
  endDateRaw: '2026-08-20'
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
    slug: apiEvent.slug,
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
      email: apiEvent.organization?.owner?.email || '',
      phone: '',
      eventsHosted: 0,
      joinedYear: new Date(apiEvent.createdAt || Date.now()).getFullYear(),
      responseRate: 0,
      avatar: (apiEvent.organization?.name || 'E')[0].toUpperCase(),
      logo: apiEvent.organization?.logo,
      website: apiEvent.organization?.website,
      description: apiEvent.organization?.description,
      socials: parseOrgSocials(apiEvent.organization?.socials),
      isVerified: apiEvent.organization?.isVerified,
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
    isPublished: apiEvent.isPublished ?? false,
    endDateRaw: apiEvent.endDate,
    vendorSettings: apiEvent.vendorSettings ? {
      stallTypes: Array.isArray(apiEvent.vendorSettings.stallTypes)
        ? apiEvent.vendorSettings.stallTypes
        : [],
    } : undefined,
    vendorApplications: apiEvent.vendorApplications || [],
    vendorDeadline: apiEvent.vendorDeadline,
  };
};

const EventDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [showFlier, setShowFlier] = useState(false);

  // Reserved path words must never resolve as event detail
  useEffect(() => {
    if (slug === 'create' || slug === 'new' || slug === 'edit') {
      navigate('/organizer/events/create', { replace: true });
    }
  }, [slug, navigate]);

  // Use React Query hook to fetch event with 3min cache (EVENT_DETAIL config)
  const { data: eventData, isLoading, error, isError } = useEventBySlug(
    slug || '',
    !!slug && slug !== 'create' && slug !== 'new' && slug !== 'edit',
    CACHE_CONFIGS.EVENT_DETAIL
  );

  // Fetch similar events by category
  const { data: similarEventsData } = useEvents(
    eventData ? { category: eventData.category, limit: 4 } : undefined,
    { staleTime: 1000 * 60 * 5 }
  );

  const event: EventDetail = eventData ? mapApiEventToDetail(eventData) : fallbackEvent;

  useEffect(() => {
    setActivePhotoIndex(0);
  }, [event.id, event.images?.[0]]);
  const notFound = isError && (error as any)?.response?.status === 404;

  // Derived status flags
  const isEventDraft = !event.isPublished;
  const isEventEnded = event.endDateRaw ? new Date(event.endDateRaw) < new Date() : false;
  const ticketingBlocked = isEventDraft || isEventEnded;
  const isVendorDeadlinePassed = event.vendorDeadline ? new Date() > new Date(event.vendorDeadline) : false;

  const getEventBadge = () => {
    if (!event.date) return null;
    const eventDate = new Date(event.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 1) {
      return { text: 'Sales End Soon', className: 'bg-rose-500 text-white' };
    }
    if (event.ticketsAvailable !== undefined && event.ticketsAvailable > 0 && event.ticketsAvailable <= 15) {
      return { text: 'Almost Full', className: 'bg-amber-500 text-white' };
    }
    if (event.ticketsAvailable !== undefined && event.ticketsAvailable > 0 && event.ticketsAvailable <= 50) {
      return { text: 'Going Fast', className: 'bg-indigo-600 text-white' };
    }
    return null;
  };

  const badge = getEventBadge();

  // Filter out current event and format similar events
  const similarEvents = similarEventsData
    ? similarEventsData
        .filter((e: any) => e.id !== event.id)
        .slice(0, 2)
        .map((e: any) => ({
          id: e.id,
          slug: e.slug,
          title: e.title,
          date: e.startDate,
          location: e.location || 'Online',
          image: e.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
          category: e.category || 'Other',
          price: 0,
          ticketTypes: e.ticketTypes || [],
          rating: 0,
        }))
    : [];

  const handleReportSubmit = async () => {
    if (!reportReason) return;
    setIsSubmittingReport(true);
    try {
      // Submit report to backend
      await api.post('/support/report', {
        eventId: event.id,
        reason: reportReason,
        description: reportDescription,
      });
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      alert('Thank you for your report. Our team will review it shortly.');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (eventData?.id) {
      const saved = localStorage.getItem(`wishlist_${eventData.id}`);
      setIsSaved(saved === 'true');
    }
  }, [eventData?.id]);

  const handlePurchaseTicket = () => {
    navigate(`/book/${event.id}`);
  };

  const formatDate = (dateString: string) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    
    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format with relative day
    let relativeDay = '';
    if (diffDays === 0) {
      relativeDay = 'Today';
    } else if (diffDays === 1) {
      relativeDay = 'Tomorrow';
    } else if (diffDays > 1 && diffDays <= 7) {
      relativeDay = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (diffDays > 7 && diffDays <= 14) {
      relativeDay = 'Next week';
    } else {
      // Default full date for events far in the future
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    
    // Format: "Today, December 15, 2024" or "Tomorrow, December 16, 2024" etc.
    const fullDate = eventDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    
    return `${relativeDay}, ${fullDate}`;
  };

  const handleShare = async () => {
    // Create URL with slug if available, otherwise use ID
    const shareUrl = event.slug 
      ? `${window.location.origin}/events/${event.slug}`
      : `${window.location.origin}/events/${event.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} happening at ${event.location}!`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy to clipboard with slug URL
      navigator.clipboard.writeText(shareUrl);
      alert(`Event link copied to clipboard!\n\n${shareUrl}`);
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      <Helmet>
        <title>{event?.title || 'Event Details'} | PartyStorm</title>
        <meta name="description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events in Nigeria.'} />
        <meta property="og:title" content={event?.title || 'Event Details'} />
        <meta property="og:description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events.'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={event?.slug ? `https://partystorm.ng/events/${event.slug}` : `https://partystorm.ng/events/${event?.id || ''}`} />
        {event?.images && event.images.length > 0 && <meta property="og:image" content={event.images[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event?.title || 'Event Details'} />
        <meta name="twitter:description" content={event?.description?.substring(0, 160) || 'Book tickets for amazing events.'} />
        {event?.slug && <link rel="canonical" href={`https://partystorm.ng/events/${event.slug}`} />}
        {event?.id && !event?.slug && (
          <link rel="canonical" href={`https://partystorm.ng/events/${event.id}`} />
        )}
        {event?.id && (
          <script type="application/ld+json">
            {JSON.stringify(generateEventStructuredData(event))}
          </script>
        )}
      </Helmet>
      {isLoading && (
        <div className="animate-pulse">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="lg:w-[60%] xl:w-[65%] space-y-6">
                <div className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                <div className="w-full aspect-[4/3] max-h-[420px] bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                  <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                  <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                </div>
              </div>
              <div className="hidden lg:block lg:w-[40%] xl:w-[35%]">
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 h-48 bg-neutral-100 dark:bg-neutral-800/50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Not Found State ─── */}
      {!isLoading && notFound && (
 
      
            <div className="min-h-[90vh] bg-gradient-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center px-4 py-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-pink-500/20 blur-2xl rounded-full" />
            <div className="relative bg-rose-100 dark:bg-rose-900/20 rounded-full p-4">
              <TicketIcon className="h-12 w-12 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tighter">
          404
        </h1>

        <p className="text-lg font-semibold text-neutral-700 dark:text-neutral-200 mb-2">
          Event not found
        </p>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8">
          The page you're looking for doesn't exist or has been moved. Check the URL and try again, or explore our other pages.
        </p>

        {/* Suggestions */}
        <div className="mb-8 space-y-3 text-left bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-4 border border-neutral-200 dark:border-neutral-800">
          <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            You might want to:
          </p>
          <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Check the URL spelling</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Return to the home page</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-rose-500">•</span>
              <span>Browse events and discover</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* <Button
            asChild
            className="flex-1 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-semibold"
          >
            <Link to="/" className="flex items-center justify-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button> */}

          <Button
            asChild
            variant="outline"
            className="flex-1 rounded-full border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Link to="/events" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Explore Events
            </Link>
          </Button>
        </div>

        {/* Fun message */}
        <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
            "The event you're looking for is not in the universe... yet."
          </p>
        </div>
      </div>
    </div>

      )}

      {/* ─── Main Content (only when loaded and found) ─── */}
      {!isLoading && !notFound && (<>

      {/* ─── Content ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row gap-12">

          {/* Left: Event Details */}
          <div className="lg:w-[60%] xl:w-[65%]">
            {/* Media first */}
            {event.images.length > 0 && (() => {
              const photos = event.images;
              const safeIndex = Math.min(activePhotoIndex, photos.length - 1);
              return (
                <div className="mb-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePhotoIndex(safeIndex);
                      setShowAllPhotos(true);
                    }}
                    className="relative block w-full overflow-hidden rounded-2xl aspect-[4/3] max-h-[440px] bg-neutral-100 dark:bg-neutral-900 group"
                  >
                    <LazyImage
                      src={photos[safeIndex]}
                      alt={event.title}
                      className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                      containerClassName="absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
                    {photos.length > 1 && (
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                        {safeIndex + 1} / {photos.length}
                      </span>
                    )}
                  </button>

                  {photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-0.5">
                      {photos.map((img, i) => (
                        <button
                          key={`hero-thumb-${i}`}
                          type="button"
                          onClick={() => setActivePhotoIndex(i)}
                          className={cn(
                            'relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl overflow-hidden ring-2 transition-all',
                            i === safeIndex
                              ? 'ring-rose-500'
                              : 'ring-transparent opacity-75 hover:opacity-100'
                          )}
                          aria-label={`Show photo ${i + 1}`}
                        >
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowAllPhotos(true)}
                        className="h-14 sm:h-16 shrink-0 rounded-xl px-3 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        View all
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Title Row */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex-1">
                {badge && (
                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider mb-2 ${badge.className}`}>
                    {badge.text}
                  </span>
                )}
                <h1 className="text-xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white leading-tight">
                  {event.title}
                </h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (!event.id) return;
                    const newState = !isSaved;
                    setIsSaved(newState);
                    if (newState) {
                      localStorage.setItem(`wishlist_${event.id}`, 'true');
                    } else {
                      localStorage.removeItem(`wishlist_${event.id}`);
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
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Share2 className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-xs font-bold underline text-neutral-700 dark:text-neutral-300">
                    Share
                  </span>
                </button>
                {/* <button 
                  onClick={() => setShowFlier(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Sparkles className="h-4 w-4 text-rose-500" />
                  <span className="text-xs font-bold underline text-neutral-700 dark:text-neutral-300">
                    Flier
                  </span>
                </button> */}
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
            <hr className="border-neutral-100 dark:border-neutral-900 mb-4" />

            {/* Event details - Date/Time/Location (Simplified) */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {formatDate(event.date)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {event.startTime} – {event.endTime}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {event.location}
                </span>
              </div>
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
                {/* Highlights */}
            {event.highlights.length > 0 && (
              <>
                <div className="space-y-5 mb-2">
                  {event.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-2xl">{h.icon}</span>
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {h.label}
                      </span>
                    </div>
                  ))}
                </div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-1" />
              </>
            )}

            {event.amenities.length > 0 && (
              <div className="mb-2">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
                  What's included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
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

            <hr className="border-neutral-100 dark:border-neutral-900 mb-1" />

            {/* Hosted by - Organizer section */}
            <button
              onClick={() => setShowOrganizerModal(true)}
              className="w-full flex items-center gap-4 mb-2 group text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 rounded-2xl p-3 -mx-3 transition-colors"
            >
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-full w-14 h-14 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0 overflow-hidden">
               <img src={event.organizer.logo || event.organizer.avatar} alt={event.organizer.name} className='w-full h-full object-cover' />
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

            {/* Map - for physical events */}
            {event.location && event.location !== 'Online' && (
              <>
                <div className="mb-8 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                  <GoogleMapLocation 
                    location={event.location}
                    latitude={event.latitude}
                    longitude={event.longitude}
                    eventTitle={event.title}
                  />
                </div>
                <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />
              </>
            )}

        

            {/* ─── Events You May Like ─── */}
            <div className="mt-12">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-6">
                More in {event.category}
              </h2>
              {similarEvents.length > 0 ? (
                <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:gap-x-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                  {similarEvents.map((evt: any, idx: number) => (
                    <motion.div
                      key={evt.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <EventCard event={evt} showPrice={true} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No similar events found. Check back soon!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right: Booking card (Sticky, Desktop only) ─── */}
          <div className="hidden lg:block lg:w-[40%] xl:w-[35%]">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-950 p-6 shadow-sm"
              >
                <p className="font-ticket text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Tickets
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-ticket text-3xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
                    {displayPrice}
                  </p>
                  {event.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                      <span className="font-ticket font-semibold text-neutral-900 dark:text-white">
                        {event.rating}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span>
                      {event.startTime} – {event.endTime}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  {ticketingBlocked ? (
                    <div className="rounded-xl bg-neutral-50 dark:bg-neutral-900 p-4 text-center">
                      {isEventDraft ? (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                          <p className="font-ticket text-sm font-semibold text-neutral-900 dark:text-white">
                            Coming soon
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">Tickets aren’t live yet.</p>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5 text-neutral-400 mx-auto mb-2" />
                          <p className="font-ticket text-sm font-semibold text-neutral-900 dark:text-white">
                            Event ended
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">Ticket sales are closed.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handlePurchaseTicket}
                        className="group w-full rounded-xl bg-rose-500 px-4 py-3.5 text-white shadow-[0_8px_20px_-10px_rgba(244,63,94,0.65)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-rose-600 hover:shadow-[0_12px_24px_-10px_rgba(244,63,94,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                      >
                        <span className="flex items-center justify-center gap-2 font-ticket text-[15px] font-semibold uppercase tracking-[0.12em]">
                          <Ticket className="h-4 w-4 opacity-90" />
                          Get tickets
                          <motion.span
                            className="inline-flex"
                            animate={{ x: [0, 5, 0] }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          >
                            <ChevronRight className="h-4 w-4 opacity-90" />
                          </motion.span>
                        </span>
                      </button>

                      {event.vendorApplicationsAllowed && (
                        <button
                          type="button"
                          disabled={isVendorDeadlinePassed}
                          onClick={() => {
                            if (isVendorDeadlinePassed) return;
                            if (isAuthenticated) {
                              navigate(`/book/${event.id}?type=vendor`);
                            } else {
                              navigate(
                                `/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor`)}`
                              );
                            }
                          }}
                          className={cn(
                            'mt-2.5 w-full h-11 rounded-xl border text-sm font-ticket font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-[0.99]',
                            isVendorDeadlinePassed
                              ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 cursor-not-allowed'
                              : 'border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-900'
                          )}
                        >
                          <Store className="h-4 w-4" />
                          {isVendorDeadlinePassed ? 'Vendor closed' : 'Apply as vendor'}
                        </button>
                      )}

                      {event.vendorApplicationsAllowed && event.vendorDeadline && (
                        <p
                          className={cn(
                            'text-[10px] font-ticket font-semibold text-center mt-2.5 uppercase tracking-wide',
                            isVendorDeadlinePassed ? 'text-rose-500' : 'text-neutral-500'
                          )}
                        >
                          Vendor: {formatDeadlineFriendly(event.vendorDeadline)}
                        </p>
                      )}

                      {(() => {
                        if (!event.date) return null;
                        const eventDate = new Date(event.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const diffDays = Math.round(
                          (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        if (diffDays >= 0 && diffDays <= 1) {
                          return (
                            <p className="text-[10px] font-ticket font-semibold text-center mt-2 text-rose-500 uppercase tracking-wide">
                              Closes {diffDays === 0 ? 'today' : 'tomorrow'}
                            </p>
                          );
                        }
                        return null;
                      })()}

                      <p className="text-[11px] text-neutral-500 text-center mt-3">
                        You won’t be charged yet
                      </p>
                    </>
                  )}
                </div>
              </motion.div>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Flag className="h-3.5 w-3.5 text-neutral-400" />
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs font-medium text-neutral-500 dark:text-neutral-400 underline hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  Report this listing
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Full-screen Photo Gallery Modal ─── */}
      {showAllPhotos && (
        <div className="fixed inset-0 bg-neutral-950 z-50 flex flex-col">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => setShowAllPhotos(false)}
              className="flex items-center gap-2 text-sm font-bold text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <p className="text-sm font-semibold text-white/80">
              {Math.min(activePhotoIndex, event.images.length - 1) + 1} / {event.images.length}
            </p>
            <button
              type="button"
              onClick={() => setShowAllPhotos(false)}
              className="p-2 rounded-lg text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-3 py-4">
            {event.images.length > 1 && (
              <button
                type="button"
                className="absolute left-2 sm:left-4 z-10 h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
                onClick={() =>
                  setActivePhotoIndex((i) => (i - 1 + event.images.length) % event.images.length)
                }
                aria-label="Previous photo"
              >
                <ChevronRight className="h-5 w-5 rotate-180" />
              </button>
            )}
            <img
              src={event.images[Math.min(activePhotoIndex, event.images.length - 1)]}
              alt={`${event.title} photo ${activePhotoIndex + 1}`}
              className="max-h-[min(78vh,820px)] max-w-full object-contain rounded-lg"
            />
            {event.images.length > 1 && (
              <button
                type="button"
                className="absolute right-2 sm:right-4 z-10 h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center"
                onClick={() => setActivePhotoIndex((i) => (i + 1) % event.images.length)}
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {event.images.length > 1 && (
            <div className="shrink-0 flex gap-2 overflow-x-auto justify-center px-4 py-3 border-t border-white/10">
              {event.images.map((img, i) => (
                <button
                  key={`modal-thumb-${i}`}
                  type="button"
                  onClick={() => setActivePhotoIndex(i)}
                  className={cn(
                    'h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 bg-neutral-800',
                    i === activePhotoIndex ? 'border-rose-500' : 'border-transparent opacity-70'
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Organizer Detail Modal ─── */}
      {showOrganizerModal && (
        <ResponsiveModal
          open={showOrganizerModal}
          onOpenChange={() => setShowOrganizerModal(false)}
          size={3}
        >
          <div className="w-full max-h-[90vh] overflow-y-auto mb-8">
            {/* Header with close button */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Event Organizer</h2>
             
            </div>

            {/* Content */}
            <div className="p-2 space-y-6">
              {/* Hero section with avatar and name */}
              <div className="relative  mb-6">
                <div className="px- pt-0 pb-4 relative">
                  <div className="flex items-end gap-4  mb-4">
                    <div className="relative">
                        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0 overflow-hidden">
                          <img src={event.organizer.logo || event.organizer.avatar} alt={event.organizer.name} className='w-full h-full object-cover' />

                      </div>
                      {/* Verified badge */}
                      <div className="absolute -bottom-2 -right-2 flex items-center justify-center w-8 h-8 rounded-full bg-rose-500 border-4 border-white dark:border-neutral-900 shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true">
                          <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                      </div>
                    </div>
                    <div className="pb-2">
                      <h3 className="font-extrabold text-2xl text-neutral-900 dark:text-white mb-1">
                        {event.organizer.name}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Verified Organizer
                      </p>
                         <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Member Since {event.organizer.joinedYear}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

           

              {/* About organizer */}
              <div>
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white mb-3">About</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {event.organizer.description ||
                    `${event.organizer.name} hosts events on PartyStorm. Connect with them using the links below.`}
                </p>
              </div>

              {/* Contact & socials */}
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white">Contact</h4>
                <div className="space-y-2">
                  {event.organizer.website && (
                    <a
                      href={
                        event.organizer.website.startsWith('http')
                          ? event.organizer.website
                          : `https://${event.organizer.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/40">
                        <Globe className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-rose-500" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Website</p>
                        <p className="text-[11px] text-rose-500 truncate underline-offset-2 group-hover:underline">
                          {event.organizer.website.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-rose-400 shrink-0" />
                    </a>
                  )}

                  {event.organizer.socials?.instagram && (
                    <a
                      href={buildSocialUrl('instagram', event.organizer.socials.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-950/40">
                        <Instagram className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-rose-500" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Instagram</p>
                        <p className="text-[11px] text-rose-500 truncate underline-offset-2 group-hover:underline">
                          {event.organizer.socials.instagram.startsWith('http')
                            ? event.organizer.socials.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@')
                            : event.organizer.socials.instagram.startsWith('@')
                              ? event.organizer.socials.instagram
                              : `@${event.organizer.socials.instagram}`}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-rose-400 shrink-0" />
                    </a>
                  )}

                  {event.organizer.socials?.twitter && (
                    <a
                      href={buildSocialUrl('twitter', event.organizer.socials.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <Twitter className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">X / Twitter</p>
                        <p className="text-[11px] text-rose-500 truncate">
                          {event.organizer.socials.twitter}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                    </a>
                  )}

                  {event.organizer.socials?.facebook && (
                    <a
                      href={buildSocialUrl('facebook', event.organizer.socials.facebook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-600">
                        f
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Facebook</p>
                        <p className="text-[11px] text-rose-500 truncate">
                          {event.organizer.socials.facebook}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                    </a>
                  )}

                  {event.organizer.socials?.tiktok && (
                    <a
                      href={buildSocialUrl('tiktok', event.organizer.socials.tiktok)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-extrabold text-neutral-600">
                        TT
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">TikTok</p>
                        <p className="text-[11px] text-rose-500 truncate">
                          {event.organizer.socials.tiktok}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                    </a>
                  )}

                  {event.organizer.email && (
                    <a
                      href={`mailto:${event.organizer.email}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <Mail className="h-4 w-4 text-neutral-600 dark:text-neutral-300 group-hover:text-rose-500" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white">Email</p>
                        <p className="text-[11px] text-rose-500 truncate underline-offset-2 group-hover:underline">
                          {event.organizer.email}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-rose-400 shrink-0" />
                    </a>
                  )}

                  {!event.organizer.website &&
                    !hasAnySocial(event.organizer.socials || {}) &&
                    !event.organizer.email && (
                      <p className="text-xs text-neutral-500 py-2">
                        This organizer hasn&apos;t added public contact links yet.
                      </p>
                    )}
                </div>
              </div>

              {/* Trust & Safety Section */}
              {/* <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Verified & Trusted</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      This organizer's identity and events have been reviewed by the PartyStorm team. All transactions are protected by our buyer protection policy.
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Action Button */}
              {/* <button
                onClick={() => {
                  setShowOrganizerModal(false);
                  // Scroll to contact form or similar
                }}
                className="w-full h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                Contact Organizer
              </button> */}
            </div>
          </div>
        </ResponsiveModal>
      )}

      {/* ─── Report Listing Modal ─── */}
      {showReportModal && (
        <ResponsiveModal
          open={showReportModal}
          onOpenChange={() => setShowReportModal(false)}
          size={2}
        >
          <div className="w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white">Report Listing</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Alert */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Help us improve</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Your report helps us maintain a safe and trustworthy platform. Our team will review it within 24 hours.
                  </p>
                </div>
              </div>

              {/* Report Reason */}
              <div>
                <label className="text-sm font-extrabold text-neutral-900 dark:text-white block mb-3">
                  What's the issue? <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'misleading', label: 'Misleading information', description: 'Event details are incorrect or misleading' },
                    { id: 'fraud', label: 'Suspicious activity', description: 'Possible fraudulent or scam event' },
                    { id: 'inappropriate', label: 'Inappropriate content', description: 'Content violates community guidelines' },
                    { id: 'other', label: 'Something else', description: 'Other issue' },
                  ].map((reason) => (
                    <label
                      key={reason.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        reportReason === reason.id
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.id}
                        checked={reportReason === reason.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-white text-sm">{reason.label}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{reason.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-extrabold text-neutral-900 dark:text-white block mb-2">
                  Additional details
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please provide more context about your report..."
                  className="w-full h-24 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 h-11 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportSubmit}
                  disabled={!reportReason || isSubmittingReport}
                  className="flex-1 h-11 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReport ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ResponsiveModal>
      )}

   

      </>)}

      {/* ─── Sticky Bottom Bar (Mobile only, when not loading) ─── */}
      {!isLoading && !notFound && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[9px] font-ticket font-semibold uppercase tracking-[0.16em] text-neutral-400">
              From
            </p>
            <span className="font-ticket text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
              {displayPrice}
            </span>
            {event.vendorApplicationsAllowed && event.vendorDeadline && (
              <p
                className={cn(
                  'text-[9px] font-ticket font-semibold uppercase tracking-wider mt-0.5',
                  isVendorDeadlinePassed ? 'text-rose-500' : 'text-neutral-500'
                )}
              >
                Vendor: {formatDeadlineFriendly(event.vendorDeadline)}
              </p>
            )}
          </div>
          {ticketingBlocked ? (
            <span className="text-xs font-ticket font-semibold uppercase tracking-wide text-neutral-400 px-4 py-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              {isEventDraft ? 'Coming Soon' : 'Event Ended'}
            </span>
          ) : event.vendorApplicationsAllowed ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePurchaseTicket}
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-ticket font-semibold uppercase tracking-wider px-4 py-2.5 shadow-[0_6px_16px_-8px_rgba(244,63,94,0.7)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
              >
                Get tickets
              </button>
              {!isVendorDeadlinePassed && (
                <button
                  onClick={() => {
                    if (isAuthenticated && user?.role === 'VENDOR') {
                      navigate(`/book/${event.id}?type=vendor`);
                    } else {
                      navigate(`/login?redirect=${encodeURIComponent(`/book/${event.id}?type=vendor`)}`);
                    }
                  }}
                  className="border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-ticket font-semibold uppercase tracking-wider px-4 py-2.5 transition-colors active:scale-[0.99]"
                >
                  Vendor
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handlePurchaseTicket}
              className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-ticket font-semibold uppercase tracking-wider px-6 py-3 shadow-[0_6px_16px_-8px_rgba(244,63,94,0.7)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
            >
              Get tickets
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;