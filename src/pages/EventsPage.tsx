import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  X,
  SlidersHorizontal,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Map as MapIcon,
  List as ListIcon,
  Globe,
  Monitor,
  Music,
  Wine,
  Palette,
  Briefcase,
  Leaf,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard, { Event } from '../components/EventCard';
import MapComponent from '../components/MapComponent';
import { useEvents } from '../hooks/queries/useEvents';

// Mock data for events
const mockEvents = [
  {
    id: 1,
    title: 'AI & Web3 Developer Summit',
    date: '2026-06-15',
    location: 'BUK Convocation Arena, Kano, Nigeria',
    category: 'Technology',
    price: 5000,
    ticketsAvailable: 250,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 2,
    title: 'Afrobeats Live Fest',
    date: '2026-07-20',
    location: 'Sani Abacha Stadium, Kofar Mata, Kano, Nigeria',
    category: 'Music',
    price: 10000,
    ticketsAvailable: 500,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 3,
    title: 'Street Food Carnival',
    date: '2026-08-10',
    location: 'Kano Golf Club, Club Road, Kano, Nigeria',
    category: 'Food',
    price: 7500,
    ticketsAvailable: 180,
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 4,
    title: 'Contemporary Art Showcase',
    date: '2026-09-05',
    location: 'Gidan Makama Museum, Kano, Nigeria',
    category: 'Arts',
    price: 3000,
    ticketsAvailable: 320,
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 5,
    title: 'Business Leadership Conference',
    date: '2026-10-15',
    location: 'Bristol Palace Hotel, Kano, Nigeria',
    category: 'Business',
    price: 8000,
    ticketsAvailable: 120,
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f7b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1184&q=80',
  },
  {
    id: 6,
    title: 'Kano Durbar Soundwave',
    date: '2026-11-20',
    location: 'Gidan Rumfa (Emir\'s Palace), Kano, Nigeria',
    category: 'Music',
    price: 4500,
    ticketsAvailable: 200,
    rating: 4.4,
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80',
  },
];

const categories = [
  { name: 'All',         Icon: Globe },
  { name: 'Technology',  Icon: Monitor },
  { name: 'Music',       Icon: Music },
  { name: 'Food',        Icon: Wine },
  { name: 'Arts',        Icon: Palette },
  { name: 'Business',    Icon: Briefcase },
  { name: 'Environment', Icon: Leaf },
];

const mapApiEventToFrontendEvent = (apiEvent: any): Event => {
  const ticketsAvailable = apiEvent.ticketTypes
    ? apiEvent.ticketTypes.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0)
    : 100;
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    date: apiEvent.startDate,
    location: apiEvent.location || 'Online',
    image: apiEvent.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800',
    category: apiEvent.category || 'Other',
    ticketsAvailable,
    price: apiEvent.price ?? 0,
    rating: apiEvent.rating || 4.5 + (apiEvent.id % 5) * 0.1,
    attendees: apiEvent.attendees || 0
  };
};

const EventsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);

  // Use React Query hooks for data fetching
  const { data: eventsData = [], isLoading: eventsLoading, error: eventsError } = useEvents(
    searchTerm || selectedCategory !== 'All' || locationFilter
      ? {
          search: searchTerm || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          location: locationFilter || undefined,
          limit: 100,
        }
      : { limit: 100 }
  );

  // Use frontend categories (API fallback removed per requirements)
  const categories = [
    { name: 'All', Icon: Globe },
    { name: 'Technology', Icon: Monitor },
    { name: 'Music', Icon: Music },
    { name: 'Food', Icon: Wine },
    { name: 'Arts', Icon: Palette },
    { name: 'Business', Icon: Briefcase },
    { name: 'Wellness', Icon: Leaf },
  ];

  // Transform API events or use mock
  const events: Event[] = eventsData.length > 0
    ? eventsData.map(mapApiEventToFrontendEvent)
    : mockEvents.filter((e) => {
        let match = true;
        if (searchTerm) {
          match = match && (
            e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.location.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        if (selectedCategory !== 'All') {
          match = match && e.category === selectedCategory;
        }
        if (locationFilter) {
          match = match && e.location.toLowerCase().includes(locationFilter.toLowerCase());
        }
        return match;
      });

  const loading = eventsLoading;

  // Update URL
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory !== 'All') params.set('category', selectedCategory);
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">

      {/* ─── Search Header ─── */}
      <div className="border-b border-neutral-150 dark:border-neutral-900 bg-white/95 dark:bg-gray-950/95 backdrop-blur sticky top-20 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search bar — Airbnb pill style */}
          <div className="flex items-center gap-3">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search events, locations, or categories..."
                className="w-full pl-11 pr-10 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-neutral-200 dark:bg-neutral-700 rounded-full p-1 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  <X className="h-3 w-3 text-neutral-600 dark:text-neutral-300" />
                </button>
              )}
            </div>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border rounded-full px-5 py-3.5 text-xs font-bold transition-all shrink-0 ${
                showFilters
                  ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>

          {/* Category chips row */}
          <div className="flex items-center gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isActive ? 'All' : cat.name)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-md'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <cat.Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'}`} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-neutral-100 dark:border-neutral-900"
            >
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Location filter */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  {/* Date filter */}
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  {/* Guests filter */}
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                    <select className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none">
                      <option>Any number of guests</option>
                      <option>1–50</option>
                      <option>50–200</option>
                      <option>200–500</option>
                      <option>500+</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Main Content: Events Grid + Map ─── */}
      <div className="flex-grow flex min-h-0 relative w-full">
        {/* Events List */}
        <div
          className={`transition-all duration-300 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 ${
            showMap ? 'hidden md:block md:w-[55%] xl:w-[58%]' : 'w-full'
          }`}
        >
          {/* Results header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {searchTerm
                  ? `Results for "${searchTerm}"`
                  : selectedCategory !== 'All'
                  ? `${selectedCategory} Events`
                  : 'All Upcoming Events'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {loading ? 'Loading...' : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(searchTerm || selectedCategory !== 'All' || locationFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setLocationFilter('');
                    window.history.replaceState({}, '', window.location.pathname);
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowMap(!showMap)}
                className="hidden lg:flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                {showMap ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className={`grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 ${
              showMap ? 'lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 ${
                showMap ? 'lg:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showPrice={true}
                  showTicketsAvailable={true}
                  onHover={setHoveredEventId}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800"
            >
              <Search className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">No events found</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
                We couldn't find any events matching your criteria. Try adjusting your search or filters.
              </p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('All'); window.history.replaceState({}, '', window.location.pathname); }}
                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-6 py-3 text-xs font-bold hover:opacity-90 transition-opacity active:scale-95"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>

        {/* Map Panel — sticky, fills remaining height */}
        {showMap && (
          <div className="hidden md:block md:w-[45%] xl:w-[42%] sticky top-40 self-start h-[calc(100vh-160px)]">
            <div className="h-full p-4 pl-0 pr-6">
              <div className="h-full rounded-3xl overflow-hidden shadow-lg border border-neutral-200 dark:border-neutral-800">
                <MapComponent
                  events={events}
                  hoveredEventId={hoveredEventId}
                  onSelectEvent={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile-only full-screen map view */}
        {showMap && (
          <div className="md:hidden w-full h-[calc(100vh-200px)]">
            <MapComponent
              events={events}
              hoveredEventId={hoveredEventId}
              onSelectEvent={() => {}}
            />
          </div>
        )}
      </div>

      {/* ─── Floating Mobile Map Toggle ─── */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 md:hidden">
        <button
          onClick={() => setShowMap(!showMap)}
          className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-5 py-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold flex items-center gap-2"
        >
          {showMap ? (
            <><ListIcon className="h-4 w-4" /><span>Show list</span></>
          ) : (
            <><MapIcon className="h-4 w-4" /><span>Show map</span></>
          )}
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default EventsPage;