import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
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
  Minus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

// Mock event data
const mockEvent = {
  id: 1,
  title: 'Tech Conference 2023',
  description:
    "Join us for the largest technology conference in Nigeria. Network with industry leaders, attend workshops, and learn about the latest trends in tech. This event brings together over 500 professionals from across West Africa for two days of immersive learning and networking.",
  date: '2023-12-15',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  location: 'Eko Convention Centre, Lagos, Nigeria',
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
    name: 'Tech Events Nigeria',
    email: 'info@techevents.com',
    phone: '+234 801 234 5678',
    eventsHosted: 24,
    joinedYear: 2019,
    responseRate: 98,
    avatar: 'T',
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
  vendorApplications: [
    {
      id: 1,
      vendorName: 'Tech Gadgets Ltd',
      businessName: 'Tech Gadgets Nigeria',
      category: 'Electronics',
      description: 'Latest tech gadgets and accessories',
      status: 'pending',
    },
  ],
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const event = mockEvent;

  const handlePurchaseTicket = () => {
    if (selectedTicket === null) {
      alert('Please select a ticket type');
      return;
    }
    const orderData = {
      ticketTypeId: selectedTicket,
      quantity: ticketQuantity,
    };
    navigate(`/book/${event.id}`, { state: orderData });
  };

  const selectedTicketType = event.ticketTypes.find((t) => t.id === selectedTicket);
  const totalPrice = (selectedTicketType?.price || event.price) * ticketQuantity;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ─── Photo Gallery (Airbnb grid) ─── */}
      <div className="max-w-7xl mx-auto px-0 md:px-6 lg:px-8 pt-0 md:pt-6">
        <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 rounded-none md:rounded-2xl overflow-hidden h-[300px] sm:h-[360px] md:h-[420px]">
          {/* Main large image */}
          <div className="col-span-2 row-span-2 relative cursor-pointer group" onClick={() => setShowAllPhotos(true)}>
            <img
              src={event.images[0]}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
          {/* Secondary images */}
          {event.images.slice(1, 5).map((img, i) => (
            <div key={i} className="hidden md:block relative cursor-pointer group overflow-hidden" onClick={() => setShowAllPhotos(true)}>
              <img
                src={img}
                alt={`${event.title} ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          ))}
          {/* Show all photos button */}
          <button
            onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-4 right-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors z-10"
          >
            Show all photos
          </button>
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
                  onClick={() => setIsSaved(!isSaved)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Heart
                    className={`h-4 w-4 ${
                      isSaved ? 'fill-rose-500 text-rose-500' : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  />
                  <span className="text-xs font-bold underline text-neutral-700 dark:text-neutral-300">
                    Save
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
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                <span className="font-bold text-neutral-900 dark:text-white">{event.rating}</span>
              </span>
              <span>·</span>
              <span className="underline font-medium">{event.reviewCount} reviews</span>
              <span>·</span>
              <span className="font-medium">{event.location}</span>
            </div>

            {/* Divider */}
            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {/* Organizer section */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-full w-14 h-14 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
                {event.organizer.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Hosted by {event.organizer.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {event.organizer.eventsHosted} events hosted · Joined {event.organizer.joinedYear} · {event.organizer.responseRate}% response rate
                </p>
              </div>
            </div>

            <hr className="border-neutral-100 dark:border-neutral-900 mb-6" />

            {/* Highlights */}
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

            {/* What's Included */}
            <div className="mb-8">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-4">
                What's included
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {event.amenities.map((amenity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-3"
                  >
                    <CheckCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
                      {amenity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

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
                    {user?.role === 'VENDOR' && (
                      <button
                        onClick={() => navigate(`/events/${event.id}/apply-vendor`)}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-4 py-2 text-xs font-bold hover:opacity-90 transition-opacity active:scale-95"
                      >
                        Apply as Vendor
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    Interested in showcasing your products or services? Apply to become a vendor.
                  </p>
                  {!isAuthenticated && (
                    <button
                      onClick={() => navigate('/login')}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Log in to apply →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ─── Right: Booking Card (Sticky) ─── */}
          <div className="lg:w-[40%] xl:w-[35%]">
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
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-neutral-900 text-neutral-900 dark:fill-white dark:text-white" />
                    <span className="font-bold text-neutral-900 dark:text-white">{event.rating}</span>
                    <span className="text-neutral-500">· {event.reviewCount} reviews</span>
                  </div>
                </div>

                {/* Ticket Type Selection (stacked border-sharing) */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-4">
                  <div className="border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      Ticket Type
                    </p>
                    <select
                      value={selectedTicket ?? ''}
                      onChange={(e) => setSelectedTicket(Number(e.target.value) || null)}
                      className="w-full bg-transparent text-sm font-semibold text-neutral-900 dark:text-white focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">Select ticket type</option>
                      {event.ticketTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — ₦{t.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-4 py-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                      Guests
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTicketQuantity((q) => Math.max(1, q - 1))}
                        className="border border-neutral-300 dark:border-neutral-700 rounded-full p-1.5 hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors disabled:opacity-30"
                        disabled={ticketQuantity <= 1}
                      >
                        <Minus className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-neutral-900 dark:text-white">
                        {ticketQuantity}
                      </span>
                      <button
                        onClick={() => setTicketQuantity((q) => Math.min(10, q + 1))}
                        className="border border-neutral-300 dark:border-neutral-700 rounded-full p-1.5 hover:border-neutral-500 dark:hover:border-neutral-500 transition-colors disabled:opacity-30"
                        disabled={ticketQuantity >= 10}
                      >
                        <Plus className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reserve button */}
                <button
                  onClick={handlePurchaseTicket}
                  className="w-full h-12 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] mb-3"
                >
                  Reserve
                </button>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center mb-4">
                  You won't be charged yet
                </p>

                {/* Price breakdown */}
                {selectedTicket && (
                  <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400 underline">
                        ₦{(selectedTicketType?.price || 0).toLocaleString()} × {ticketQuantity} ticket{ticketQuantity > 1 ? 's' : ''}
                      </span>
                      <span className="text-neutral-900 dark:text-white font-medium">
                        ₦{totalPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400 underline">
                        Service fee
                      </span>
                      <span className="text-neutral-900 dark:text-white font-medium">
                        ₦{Math.round(totalPrice * 0.05).toLocaleString()}
                      </span>
                    </div>
                    <hr className="border-neutral-100 dark:border-neutral-800" />
                    <div className="flex items-center justify-between text-sm font-extrabold">
                      <span className="text-neutral-900 dark:text-white">Total</span>
                      <span className="text-neutral-900 dark:text-white">
                        ₦{(totalPrice + Math.round(totalPrice * 0.05)).toLocaleString()}
                      </span>
                    </div>
                  </div>
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
              <img
                key={i}
                src={img}
                alt={`${event.title} ${i + 1}`}
                className="w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;