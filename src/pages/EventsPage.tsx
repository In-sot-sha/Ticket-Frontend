import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '../components/EventCard';
import MapComponent from '../components/MapComponent';

// Mock data for events
const mockEvents = [
  {
    id: 1,
    title: 'Tech Conference 2023',
    date: '2023-12-15',
    location: 'Lagos, Nigeria',
    category: 'Technology',
    price: 5000,
    ticketsAvailable: 250,
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 2,
    title: 'Music Festival',
    date: '2023-11-20',
    location: 'Abuja, Nigeria',
    category: 'Music',
    price: 10000,
    ticketsAvailable: 500,
    rating: 4.9,
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 3,
    title: 'Food & Wine Expo',
    date: '2024-01-10',
    location: 'Port Harcourt, Nigeria',
    category: 'Food',
    price: 7500,
    ticketsAvailable: 180,
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
  },
  {
    id: 4,
    title: 'Art & Culture Summit',
    date: '2023-12-05',
    location: 'Ibadan, Nigeria',
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
    date: '2024-02-15',
    location: 'Kano, Nigeria',
    category: 'Business',
    price: 8000,
    ticketsAvailable: 120,
    rating: 4.5,
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f7b7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1184&q=80',
  },
  {
    id: 6,
    title: 'Environmental Sustainability Summit',
    date: '2024-03-20',
    location: 'Enugu, Nigeria',
    category: 'Environment',
    price: 4500,
    ticketsAvailable: 200,
    rating: 4.4,
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1171&q=80',
  },
];

const categories = [
  { name: 'All', icon: '🌐' },
  { name: 'Technology', icon: '💻' },
  { name: 'Music', icon: '🎵' },
  { name: 'Food', icon: '🍷' },
  { name: 'Arts', icon: '🎨' },
  { name: 'Business', icon: '💼' },
  { name: 'Environment', icon: '🌍' },
];

const EventsPage = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState(mockEvents);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);

  // Filter events
  useEffect(() => {
    let filtered = mockEvents;
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((event) => event.category === selectedCategory);
    }
    setEvents(filtered);
  }, [searchTerm, selectedCategory]);

  // Update URL
  useEffect(() => {
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
                  onClick={() =>
                    setSelectedCategory(isActive ? 'All' : cat.name)
                  }
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-md'
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
                >
                  <span>{cat.icon}</span>
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
      <div className="flex-grow flex relative w-full overflow-hidden">
        {/* Left: Events List */}
        <div
          className={`w-full transition-all duration-300 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto ${
            showMap ? 'lg:w-3/5 xl:w-[58%] block' : 'w-full block'
          } ${showMap ? 'hidden md:block' : 'block'}`}
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
                {events.length} event{events.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex items-center gap-3">
              {(searchTerm || selectedCategory !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    window.history.replaceState({}, '', window.location.pathname);
                  }}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              )}

              {/* Show Map Toggle (Desktop) */}
              <button
                onClick={() => setShowMap(!showMap)}
                className="hidden lg:flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                {showMap ? (
                  <ListIcon className="h-4 w-4" />
                ) : (
                  <MapIcon className="h-4 w-4" />
                )}
                {showMap ? 'Hide map' : 'Show map'}
              </button>
            </div>
          </div>

          {/* Events Grid */}
          {events.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className={`grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 ${
                showMap
                  ? 'lg:grid-cols-2 xl:grid-cols-3'
                  : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
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
              <span className="text-5xl block mb-4">🔍</span>
              <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6">
                We couldn't find any events matching your criteria. Try adjusting
                your search or filters.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-6 py-3 text-xs font-bold hover:opacity-90 transition-opacity active:scale-95"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>

        {/* Right: Map Panel */}
        <div
          className={`transition-all duration-300 sticky top-40 h-[calc(100vh-160px)] ${
            showMap ? 'w-full md:w-2/5 xl:w-[42%] block z-10' : 'w-0 hidden'
          } ${showMap ? 'block' : 'hidden md:hidden'}`}
        >
          <div className="w-full h-full p-4 md:p-6 md:pl-0">
            <MapComponent
              events={events}
              hoveredEventId={hoveredEventId}
              onSelectEvent={() => {}}
            />
          </div>
        </div>
      </div>

      {/* ─── Floating Mobile Map Toggle ─── */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 md:bottom-10 lg:hidden">
        <button
          onClick={() => setShowMap(!showMap)}
          className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-5 py-3 shadow-xl hover:scale-105 active:scale-95 transition-all text-xs font-bold flex items-center gap-2"
        >
          {showMap ? (
            <>
              <ListIcon className="h-4 w-4" />
              <span>Show list</span>
            </>
          ) : (
            <>
              <MapIcon className="h-4 w-4" />
              <span>Show map</span>
            </>
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