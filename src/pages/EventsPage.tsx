import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  // Navigation,
  // Loader,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard, { Event } from '../components/EventCard';
import { GoogleMapEvents } from '../components/GoogleMapEvents';
import { useEvents } from '../hooks/queries/useEvents';
// import { useGeolocation } from '../hooks/useGeolocation';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { generateEventCollectionStructuredData } from '../lib/seo';
import { mockEvents, mapApiEventToFrontendEvent } from '../data/mockEvents';
// import { calculateDistance, formatDistance } from '../lib/distance';

const categories = [
  { name: 'All',         Icon: Globe },
  { name: 'Technology',  Icon: Monitor },
  { name: 'Music',       Icon: Music },
  { name: 'Food',        Icon: Wine },
  { name: 'Arts',        Icon: Palette },
  { name: 'Business',    Icon: Briefcase },
  { name: 'Environment', Icon: Leaf },
];

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
  // const [sortByDistance, setSortByDistance] = useState(false);

  // Get user's geolocation
  // const { coords: userLocation, loading: locLoading, requestLocation } = useGeolocation();

  // Use React Query hooks for data fetching with 3min cache (EVENTS_LIST config)
  const { data: eventsData = [], isLoading: eventsLoading } = useEvents(
    searchTerm || selectedCategory !== 'All' || locationFilter
      ? {
          search: searchTerm || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          location: locationFilter || undefined,
          limit: 100,
        }
      : { limit: 100 },
    CACHE_CONFIGS.EVENTS_LIST
  );

  // Transform API events or use mock
  let events: Event[] = useMemo(() => {
    const baseEvents = eventsData.length > 0
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

    // TODO: Sort by distance if enabled and user location available
    // if (sortByDistance && userLocation && baseEvents.length > 0) {
    //   const first = baseEvents[0];
    //   if ('latitude' in first && 'longitude' in first) {
    //     return [...baseEvents].sort((a, b) => {
    //       const distA = calculateDistance(
    //         userLocation.latitude,
    //         userLocation.longitude,
    //         (a as any).latitude || 11.9626,
    //         (a as any).longitude || 8.6753
    //       );
    //       const distB = calculateDistance(
    //         userLocation.latitude,
    //         userLocation.longitude,
    //         (b as any).latitude || 11.9626,
    //         (b as any).longitude || 8.6753
    //       );
    //       return distA - distB;
    //     });
    //   }
    // }

    return baseEvents;
  }, [eventsData, searchTerm, selectedCategory, locationFilter]);

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

      <Helmet>
        <title>Browse All Events | PartyStorm</title>
        <meta name="description" content="Explore all upcoming events in Kano. Filter by category, location, and date. Music, food, business, sports, arts, and more." />
        <meta property="og:title" content="Browse All Events | PartyStorm" />
        <meta property="og:description" content="Explore all upcoming events in Kano. Filter by category, location, and date." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Browse All Events | PartyStorm" />
        <meta name="twitter:description" content="Explore all upcoming events in Kano." />
        <link rel="canonical" href="https://partystorm.com/events" />
        <script type="application/ld+json">
          {JSON.stringify(generateEventCollectionStructuredData(eventsData, "Browse All Events in Kano"))}
        </script>
      </Helmet>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {/* Location filter — COMMENTED OUT FOR NOW */}
                  {/* <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                      Location
                    </label>
                    <div className="relative flex gap-2">
                      <div className="flex-1 relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search location..."
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                      
                      <button
                        onClick={requestLocation}
                        disabled={locLoading}
                        className="px-4 py-3 bg-rose-500 text-white rounded-xl font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0 whitespace-nowrap"
                      >
                        {locLoading ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <Navigation className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">Near Me</span>
                        <span className="sm:hidden">📍</span>
                      </button>
                    </div>
                    
                    {userLocation && (
                      <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                        <span>✓ Location enabled</span>
                      </div>
                    )}
                    
                    {userLocation && events.length > 0 && (
                      <button
                        onClick={() => setSortByDistance(!sortByDistance)}
                        className={`mt-3 w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                          sortByDistance
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-rose-300'
                        }`}
                      >
                        {sortByDistance ? '✓ Sorted by Distance' : 'Sort by Distance'}
                      </button>
                    )}
                  </div> */}

                  {/* Date filter */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                      Date
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>

                  {/* Guests filter */}
                  <div>
                    <label className="text-xs font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider block mb-2">
                      Group Size
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <select className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 appearance-none">
                        <option>Any size</option>
                        <option>1–50</option>
                        <option>50–200</option>
                        <option>200–500</option>
                        <option>500+</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Clear filters button */}
                {(searchTerm || selectedCategory !== 'All' || locationFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                      setLocationFilter('');
                      // setSortByDistance(false);
                      window.history.replaceState({}, '', window.location.pathname);
                    }}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 underline"
                  >
                    Clear all filters
                  </button>
                )}
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
                {/* {sortByDistance && userLocation && ' · Sorted by distance'} */}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(searchTerm || selectedCategory !== 'All' || locationFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setLocationFilter('');
                    // setSortByDistance(false);
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
            <div className={`grid gap-x-4 gap-y-6 grid-cols-2 sm:gap-x-6 ${
              showMap ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
              className={`grid gap-x-4 gap-y-6 grid-cols-2 sm:gap-x-6 ${
                showMap ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {events.map((event) => {
                // TODO: Uncomment when distance sorting is enabled
                // let eventDistance: number | undefined;
                // if (sortByDistance && userLocation && 'latitude' in event && 'longitude' in event) {
                //   eventDistance = calculateDistance(
                //     userLocation.latitude,
                //     userLocation.longitude,
                //     (event as any).latitude || 11.9626,
                //     (event as any).longitude || 8.6753
                //   );
                // }
                
                return (
                  <EventCard
                    key={event.id}
                    event={event}
                    showPrice={true}
                    showTicketsAvailable={true}
                    // distance={eventDistance}
                    onHover={setHoveredEventId}
                  />
                );
              })}
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
                <GoogleMapEvents
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
            <GoogleMapEvents
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