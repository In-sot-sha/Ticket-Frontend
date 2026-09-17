import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
  Store,
} from 'lucide-react';
import EventCard, { Event, EventCardSkeleton } from '../components/EventCard';
import { EventLink } from '../components/EventLink';
import { useEvents } from '../hooks/queries/useEvents';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { generateEventCollectionStructuredData } from '../lib/seo';
import {
  clearHeroCarouselCache,
  readHeroCarouselCache,
  slidesFingerprint,
  writeHeroCarouselCache,
} from '../lib/heroCarouselCache';

function isPastEvent(e: Event) {
  const end = new Date(e.endDate || e.date);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

function sortEventsUpcomingFirst(list: Event[]) {
  return [...list].sort((a, b) => {
    const aPast = isPastEvent(a);
    const bPast = isPastEvent(b);
    if (aPast !== bPast) return aPast ? 1 : -1;
    // Among upcoming: promoted first, then soonest
    if (!aPast) {
      if (Boolean(a.isPromoted) !== Boolean(b.isPromoted)) {
        return a.isPromoted ? -1 : 1;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    // Among past: most recent first
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  tag: string;
  expiresAt?: string;
};

const contactSlide: HeroSlide = {
  id: 0,
  title: 'Hosting an event?',
  subtitle: 'Tell us what you need. We can help with tickets and the door.',
  cta: 'Contact us',
  link: '/contact',
  image:
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
  tag: '',
};

const categories = [
  { name: 'All',        icon: Globe },
  { name: 'Fairs',      icon: Store },
  { name: 'Music',      icon: Music },
  { name: 'Food',       icon: Wine },
  { name: 'Business',   icon: Briefcase },
  { name: 'Technology', icon: Monitor },
  { name: 'Arts',       icon: Palette },
  { name: 'Sports',     icon: Trophy },
  { name: 'Wellness',   icon: Leaf },
];

/* ── Hero Carousel ────────────────────────────────────── */
const HeroCarousel = ({ slides }: { slides: HeroSlide[] }) => {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  useEffect(() => {
    setCurrent((c) => (total === 0 ? 0 : Math.min(c, total - 1)));
  }, [total]);

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  // Auto-advance
  useEffect(() => {
    if (total < 2) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next, total]);

  if (total === 0) return null;

  return (
    <div className="relative w-full aspect-[5/3] sm:aspect-[16/7] lg:aspect-[2/1] lg:max-h-[360px] overflow-hidden rounded-none md:rounded-3xl group bg-neutral-900">
      {/* Slides */}
      <AnimatePresence initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="h-full w-full object-fill object-center"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-end sm:items-center">
        <div className="max-w-md px-5 pb-10 sm:px-10 sm:pb-0 md:px-14">
          {slides[current].tag ? (
            <motion.span
              key={`tag-${current}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-2 hidden rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white sm:inline-block"
            >
              {slides[current].tag}
            </motion.span>
          ) : null}
          <motion.h2
            key={`title-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-1.5 text-lg font-bold leading-tight text-rose-500 sm:text-2xl sm:text-white md:text-3xl"
          >
            {slides[current].title}
          </motion.h2>
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-3 text-xs leading-relaxed text-white sm:mb-4 sm:text-sm"
          >
            {slides[current].subtitle}
          </motion.p>
          <motion.div
            key={`cta-${current}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to={slides[current].link}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-900 transition-colors hover:bg-rose-500 hover:text-white sm:px-4 sm:py-2 sm:text-sm"
            >
              {slides[current].cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {total > 1 && (
        <>
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-neutral-800 dark:text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-full p-2 shadow-lg sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-neutral-800 dark:text-white" />
      </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
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
      )}
    </div>
  );
};

/* ── Home Page ────────────────────────────────────────── */
const HomePage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Upcoming only on homepage — past events live on Explore (/events)
  const { data: eventsData, isLoading, error } = useEvents(
    selectedCategory !== 'All'
      ? { limit: 25, category: selectedCategory, upcoming: 'true' }
      : { limit: 25, upcoming: 'true' },
    CACHE_CONFIGS.HOMEPAGE_EVENTS
  );

  const {
    data: promotedData,
    isSuccess: promotedSuccess,
    isError: promotedError,
  } = useEvents(
    { promoted: 'true', upcoming: 'true', limit: 5 },
    { ...CACHE_CONFIGS.HOMEPAGE_EVENTS, gcTime: 24 * 60 * 60 * 1000 }
  );

  const filteredEvents: Event[] = useMemo(() => {
    const base = (eventsData || []).map(mapApiEventToFrontendEvent);
    const promoted: Event[] = (promotedData || [])
      .map(mapApiEventToFrontendEvent)
      .filter((e: Event) => e.isPromoted && !isPastEvent(e));
    const seen = new Set(promoted.map((e) => e.id));
    const rest = base.filter((e: Event) => !seen.has(e.id));
    const upcoming = rest.filter((e: Event) => !isPastEvent(e));
    const past = rest
      .filter(isPastEvent)
      .sort((a: Event, b: Event) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    return sortEventsUpcomingFirst([...promoted, ...upcoming, ...past]);
  }, [eventsData, promotedData]);

  const liveSlides = useMemo(() => {
    return (promotedData || [])
      .map((raw: any) => {
        const e = mapApiEventToFrontendEvent(raw);
        const description =
          typeof raw.description === 'string'
            ? raw.description.trim()
            : typeof e.description === 'string'
              ? e.description.trim()
              : '';
        return {
          id: e.id,
          title: e.title || raw.title || 'Featured event',
          subtitle: description
            ? description.length > 80
              ? `${description.substring(0, 80)}...`
              : description
            : raw.location || e.location || 'Featured on PartyStorm',
          cta: 'Get Tickets',
          link: `/events/${raw.slug || e.slug || e.id}`,
          image: raw.imageUrl || e.image || '',
          tag: raw.category || e.category || 'Featured',
          expiresAt: e.endDate || e.date || raw.endDate || raw.startDate || undefined,
        };
      })
      .filter((s: HeroSlide) => {
        if (!s.image) return false;
        if (!s.expiresAt) return true;
        const t = new Date(s.expiresAt).getTime();
        return Number.isNaN(t) || t > Date.now();
      });
  }, [promotedData]);

  const [cachedSlides, setCachedSlides] = useState<HeroSlide[]>(() => readHeroCarouselCache());

  useEffect(() => {
    if (!promotedSuccess || promotedError) return;
    if (liveSlides.length === 0) {
      clearHeroCarouselCache();
      setCachedSlides([]);
      return;
    }
    if (slidesFingerprint(liveSlides) !== slidesFingerprint(cachedSlides)) {
      writeHeroCarouselCache(liveSlides);
      setCachedSlides(liveSlides);
    }
  }, [promotedSuccess, promotedError, liveSlides, cachedSlides]);

  const dynamicSlides = useMemo(() => {
    const now = Date.now();
    const notExpired = (s: HeroSlide) => {
      if (!s.expiresAt) return true;
      const t = new Date(s.expiresAt).getTime();
      return Number.isNaN(t) || t > now;
    };
    if (promotedSuccess) {
      const live = liveSlides.filter(notExpired);
      return live.length > 0 ? live : [contactSlide];
    }
    const cached = cachedSlides.filter(notExpired);
    if (cached.length > 0) return cached;
    return [contactSlide];
  }, [promotedSuccess, liveSlides, cachedSlides]);

  return (
    <div className="bg-white dark:bg-gray-950 min-h-[calc(100vh-80px)] flex flex-col relative">

      <Helmet>
        <title>Discover Events in Kano | PartyStorm</title>
        <meta name="description" content="Browse and book tickets for amazing events in Kano. Music, food, business, sports, and more. Find your next unforgettable experience." />
        <meta property="og:title" content="Discover Events in Kano | PartyStorm" />
        <meta property="og:description" content="Browse and book tickets for amazing events in Kano. Music, food, business, sports, and more." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Discover Events in Kano | PartyStorm" />
        <meta name="twitter:description" content="Browse and book tickets for amazing events in Kano." />
        <link rel="canonical" href="https://partystorm.ng/" />
        <script type="application/ld+json">
          {JSON.stringify(generateEventCollectionStructuredData(filteredEvents, "Discover Events in Kano"))}
        </script>
      </Helmet>

      {/* ─── Hero Carousel Section ─── */}
      <section className="w-full px-0 md:px-6 lg:px-8 pt-0 md:pt-2">
        <HeroCarousel slides={dynamicSlides} />
      </section>

  

      {/* ─── Main Content: Events Grid ─── */}
      <div className="flex-grow w-full px-3 sm:px-6 py-1 md:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              {selectedCategory === 'All'
                ? 'Upcoming events'
                : `${selectedCategory} events`}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isLoading
                ? 'Loading events...'
                : `${filteredEvents.length} happening soon near you`}
            </p>
          </div>
          <Link
            to="/events"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2 text-xs font-bold text-neutral-800 dark:text-neutral-100 hover:border-rose-300 hover:text-rose-600 transition-colors"
          >
            More
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading && !eventsData ? (
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : error && !eventsData ? (
          <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-6">
            <h3 className="font-bold text-red-700 dark:text-red-300 mb-2">Unable to load events</h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              Check your connection and try again.
            </p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {filteredEvents.map((event) => (
                <EventLink key={event.id} eventId={event.id}>
                  <EventCard event={event} />
                </EventLink>
              ))}
            </div>
            <div className="mt-8 flex justify-center pb-4">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 text-sm font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors active:scale-[0.98]"
              >
                Explore more events
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
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
