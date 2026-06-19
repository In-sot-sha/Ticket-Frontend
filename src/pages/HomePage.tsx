import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Globe,
  Music,
  Wine,
  Briefcase,
  Monitor,
  Palette,
  Trophy,
  Leaf,
} from 'lucide-react';
import EventCard, { Event } from '../components/EventCard';
import { EventLink } from '../components/EventLink';
import { useEvents } from '../hooks/queries/useEvents';
import { mockEvents, mapApiEventToFrontendEvent } from '../data/mockEvents';

/* ── Promoted hero slides ─────────────────────────────── */
const heroSlides = [
  {
    id: 1,
    title: 'AI & Web3 Developer Summit',
    subtitle: 'Join 500+ tech leaders in Kano',
    cta: 'Get Tickets',
    link: '/events',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tag: 'Featured',
  },
  {
    id: 2,
    title: 'Afrobeats Live Fest',
    subtitle: 'Two nights of afrobeats, R&B & more in Kano',
    cta: 'Explore Lineup',
    link: '/events',
    image:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tag: 'Trending',
  },
  {
    id: 3,
    title: 'Street Food Carnival',
    subtitle: 'Taste the best of Kano — 50+ vendors',
    cta: 'Reserve Your Spot',
    link: '/events',
    image:
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tag: 'New',
  },
  {
    id: 4,
    title: 'Startup Pitch Night',
    subtitle: 'Where ideas meet investors — Kano Edition',
    cta: 'Apply Now',
    link: '/events',
    image:
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    tag: 'Limited Seats',
  },
];

const categories = [
  { name: 'All',        icon: Globe },
  { name: 'Music',      icon: Music },
  { name: 'Food',       icon: Wine },
  { name: 'Business',   icon: Briefcase },
  { name: 'Technology', icon: Monitor },
  { name: 'Arts',       icon: Palette },
  { name: 'Sports',     icon: Trophy },
  { name: 'Wellness',   icon: Leaf },
];

/* ── Hero Carousel ────────────────────────────────────── */
const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const total = heroSlides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] md:h-[480px] overflow-hidden rounded-none md:rounded-3xl group">
      {/* Slides */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={heroSlides[current].image}
            alt={heroSlides[current].title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 flex items-end sm:items-center z-10">
        <div className="px-6 sm:px-10 md:px-14 pb-12 sm:pb-0 max-w-xl">
          <motion.span
            key={`tag-${current}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-3 py-1 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-3"
          >
            {heroSlides[current].tag}
          </motion.span>
          <motion.h2
            key={`title-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2"
          >
            {heroSlides[current].title}
          </motion.h2>
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base text-white/80 mb-5"
          >
            {heroSlides[current].subtitle}
          </motion.p>
          <motion.div
            key={`cta-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to={heroSlides[current].link}
              className="inline-flex items-center gap-2 bg-white text-neutral-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-rose-500 hover:text-white transition-colors shadow-lg active:scale-95"
            >
              {heroSlides[current].cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-neutral-800 dark:text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-neutral-800 dark:text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-white'
                : 'w-2 h-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
            
          />
        ))}
        
      </div>
    </div>
  );
};

/* ── Home Page ────────────────────────────────────────── */
const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  // Use React Query hooks for data fetching with caching
  const { data: eventsData, isLoading, error } = useEvents(
    selectedCategory !== 'All' ? { limit: 20, category: selectedCategory } : { limit: 20 }
  );
  
  // Transform API events to frontend format, fallback to mock if empty
  const filteredEvents: Event[] = (eventsData && eventsData.length > 0)
    ? eventsData.map(mapApiEventToFrontendEvent)
    : mockEvents;

  return (
    <div className="bg-white dark:bg-gray-950 min-h-[calc(100vh-80px)] flex flex-col relative">

      {/* ─── Hero Carousel Section ─── */}
      <section className="w-full px-0 md:px-6 lg:px-8 pt-0 md:pt-4">
        <HeroCarousel />
      </section>

      {/* ─── Sticky Category Bar ─── */}
      <div className="sticky top-20 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-150 dark:border-gray-900 shadow-sm flex items-center justify-center  sm:px-6 px-2 py-2 gap-4">
        {/* Categories carousel */}
        <div className="flex items-center sm:justify-center gap-3 sm:mt-4 mt-1 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(isActive ? 'All' : cat.name)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border ${isActive
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-md'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                  }`}
              >
                <cat.icon className={`h-3.5 w-3.5 ${isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Main Content: Events Grid ─── */}
      <div className="flex-grow w-full px-6 py-6 md:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {selectedCategory === 'All'
                ? 'Discover upcoming events'
                : `${selectedCategory} events`}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading ? 'Loading events...' : `Showing ${filteredEvents.length} premium event listings near you`}
            </p>
          </div>
          <Link
            to="/events"
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
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
        ) : error ? (
         <>

       <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {mockEvents.map((event) => (
              <EventLink key={event.id} eventId={event.id}>
                <EventCard event={event} />
              </EventLink>
            ))}
          </div>
         </>
        ) : filteredEvents.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredEvents.map((event) => (
              <EventLink key={event.id} eventId={event.id}>
                <EventCard event={event} />
              </EventLink>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-4xl block mb-4">🔍</span>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-white">
              No listings found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-450 max-w-xs mx-auto mt-2">
              Try switching to a different category or clearing active filters to browse
              all options.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default HomePage;
