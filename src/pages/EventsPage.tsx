import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  Map as MapIcon,
  List as ListIcon,
  Globe,
  Monitor,
  Music,
  Wine,
  Palette,
  Briefcase,
  Leaf,
  Store,
  Trophy,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard, { Event } from '../components/EventCard';
import { GoogleMapEvents } from '../components/GoogleMapEvents';
import { useEvents } from '../hooks/queries/useEvents';
import { CACHE_CONFIGS } from '../lib/queryClient';
import { generateEventCollectionStructuredData } from '../lib/seo';
import { mockEvents, mapApiEventToFrontendEvent } from '../data/mockEvents';
import { Calendar as DateCalendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { cn } from '../lib/utils';

const categories = [
  { name: 'All', Icon: Globe },
  { name: 'Fairs', Icon: Store },
  { name: 'Music', Icon: Music },
  { name: 'Food', Icon: Wine },
  { name: 'Business', Icon: Briefcase },
  { name: 'Technology', Icon: Monitor },
  { name: 'Arts', Icon: Palette },
  { name: 'Sports', Icon: Trophy },
  { name: 'Wellness', Icon: Leaf },
];

type DatePreset = 'any' | 'today' | 'weekend' | 'month' | 'custom';
type PriceFilter = 'any' | 'free' | 'paid';
type WhenFilter = 'upcoming' | 'all' | 'past';

function toLocalDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return 'Pick a date';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getWeekendRange(now = new Date()) {
  const day = now.getDay(); // 0 Sun … 6 Sat
  const toSat = (6 - day + 7) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + toSat);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { from: startOfDay(saturday), to: endOfDay(sunday) };
}

function getMonthRange(now = new Date()) {
  const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const to = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { from, to };
}

function eventMinPrice(e: Event): number {
  if (e.ticketTypes && e.ticketTypes.length > 0) {
    return Math.min(...e.ticketTypes.map((t) => Number(t.price) || 0));
  }
  return typeof e.price === 'number' ? e.price : 0;
}

function isPastEvent(e: Event) {
  const end = new Date(e.endDate || e.date);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

function scoreMatch(event: Event, q: string): number {
  const needle = q.toLowerCase().trim();
  if (!needle) return 0;
  const title = (event.title || '').toLowerCase();
  const loc = (event.location || '').toLowerCase();
  const cat = (event.category || '').toLowerCase();
  const desc = (event.description || '').toLowerCase();
  let score = 0;
  if (title === needle) score += 100;
  if (title.startsWith(needle)) score += 60;
  if (title.includes(needle)) score += 40;
  if (cat.includes(needle)) score += 25;
  if (loc.includes(needle)) score += 20;
  if (desc.includes(needle)) score += 10;
  needle.split(/\s+/).forEach((part) => {
    if (part.length < 2) return;
    if (title.includes(part)) score += 8;
    if (loc.includes(part)) score += 4;
  });
  return score;
}

const pillBase =
  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 border';
const pillActive =
  'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-900 dark:border-white shadow-md';
const pillIdle =
  'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600';

const EventsPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'All'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null);

  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [customDate, setCustomDate] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('any');
  const [whenFilter, setWhenFilter] = useState<WhenFilter>('upcoming');
  const [promotedOnly, setPromotedOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 280);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      return { date: toLocalDateInput(now), dateFrom: undefined, dateTo: undefined };
    }
    if (datePreset === 'weekend') {
      const { from, to } = getWeekendRange(now);
      return { date: undefined, dateFrom: toLocalDateInput(from), dateTo: toLocalDateInput(to) };
    }
    if (datePreset === 'month') {
      const { from, to } = getMonthRange(now);
      return { date: undefined, dateFrom: toLocalDateInput(from), dateTo: toLocalDateInput(to) };
    }
    if (datePreset === 'custom' && customDate) {
      return { date: customDate, dateFrom: undefined, dateTo: undefined };
    }
    return { date: undefined, dateFrom: undefined, dateTo: undefined };
  }, [datePreset, customDate]);

  const listParams = useMemo(
    () => ({
      limit: 100,
      search: debouncedSearch || undefined,
      category: selectedCategory !== 'All' ? selectedCategory : undefined,
      date: dateRange.date,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      promoted: promotedOnly ? 'true' : undefined,
      upcoming: whenFilter === 'upcoming' && datePreset === 'any' ? 'true' : undefined,
    }),
    [debouncedSearch, selectedCategory, dateRange, promotedOnly, whenFilter, datePreset]
  );

  const { data: eventsData = [], isLoading: eventsLoading } = useEvents(
    listParams,
    CACHE_CONFIGS.EVENTS_LIST
  );

  // Broader set for empty-state suggestions (ignore search)
  const { data: suggestPool = [] } = useEvents(
    { limit: 40, upcoming: 'true' },
    CACHE_CONFIGS.EVENTS_LIST
  );

  const events: Event[] = useMemo(() => {
    const base: Event[] =
      eventsData.length > 0
        ? eventsData.map(mapApiEventToFrontendEvent)
        : mockEvents.filter((e: Event) => {
            if (!debouncedSearch) return true;
            return scoreMatch(e, debouncedSearch) > 0;
          });

    return base
      .filter((e: Event) => {
        if (priceFilter === 'free' && eventMinPrice(e) > 0) return false;
        if (priceFilter === 'paid' && eventMinPrice(e) <= 0) return false;
        if (whenFilter === 'upcoming' && isPastEvent(e)) return false;
        if (whenFilter === 'past' && !isPastEvent(e)) return false;
        if (promotedOnly && !e.isPromoted) return false;
        return true;
      })
      .sort((a: Event, b: Event) => {
        if (debouncedSearch) {
          return scoreMatch(b, debouncedSearch) - scoreMatch(a, debouncedSearch);
        }
        if (Boolean(a.isPromoted) !== Boolean(b.isPromoted)) {
          return a.isPromoted ? -1 : 1;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [eventsData, debouncedSearch, priceFilter, whenFilter, promotedOnly]);

  const suggestions = useMemo(() => {
    if (events.length > 0 || !debouncedSearch) return [] as Event[];
    const pool: Event[] =
      suggestPool.length > 0
        ? suggestPool.map(mapApiEventToFrontendEvent)
        : mockEvents;
    const scored = pool
      .map((e: Event) => ({ e, score: scoreMatch(e, debouncedSearch) }))
      .filter((x: { e: Event; score: number }) => x.score > 0)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 4)
      .map((x: { e: Event }) => x.e);

    if (scored.length > 0) return scored;

    const byCategory = pool.filter(
      (e: Event) =>
        selectedCategory !== 'All' &&
        e.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
    return (byCategory.length ? byCategory : pool.filter((e: Event) => !isPastEvent(e))).slice(
      0,
      4
    );
  }, [events.length, debouncedSearch, suggestPool, selectedCategory]);

  const relatedCategories = useMemo(() => {
    if (events.length > 0 || !debouncedSearch) return [] as string[];
    const pool: Event[] =
      suggestPool.length > 0
        ? suggestPool.map(mapApiEventToFrontendEvent)
        : mockEvents;
    const counts = new Map<string, number>();
    pool.forEach((e: Event) => {
      if (!e.category) return;
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .filter((name) => name !== selectedCategory)
      .slice(0, 4);
  }, [events.length, debouncedSearch, suggestPool, selectedCategory]);

  const loading = eventsLoading;
  const hasActiveFilters =
    !!searchTerm ||
    selectedCategory !== 'All' ||
    datePreset !== 'any' ||
    priceFilter !== 'any' ||
    whenFilter !== 'upcoming' ||
    promotedOnly;

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory('All');
    setDatePreset('any');
    setCustomDate('');
    setPriceFilter('any');
    setWhenFilter('upcoming');
    setPromotedOnly(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  useEffect(() => {
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
        <meta
          name="description"
          content="Explore all upcoming events in Kano. Filter by category, date, and price. Music, food, business, sports, arts, and more."
        />
        <meta property="og:title" content="Browse All Events | PartyStorm" />
        <meta
          property="og:description"
          content="Explore all upcoming events in Kano. Filter by category, date, and price."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Browse All Events | PartyStorm" />
        <meta name="twitter:description" content="Explore all upcoming events in Kano." />
        <link rel="canonical" href="https://partystorm.ng/events" />
        <script type="application/ld+json">
          {JSON.stringify(
            generateEventCollectionStructuredData(eventsData, 'Browse All Events in Kano')
          )}
        </script>
      </Helmet>

      <div className="border-b border-neutral-150 dark:border-neutral-900 bg-white/95 dark:bg-gray-950/95 backdrop-blur sticky top-20 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-grow relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by event, venue, category, or keyword…"
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

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 border rounded-full px-5 py-3.5 text-xs font-bold transition-all shrink-0',
                showFilters
                  ? 'border-neutral-900 dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2.5 mt-4 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(isActive ? 'All' : cat.name)}
                  className={cn(pillBase, isActive ? pillActive : pillIdle)}
                >
                  <cat.Icon
                    className={cn(
                      'h-3.5 w-3.5',
                      isActive
                        ? 'text-white dark:text-neutral-900'
                        : 'text-neutral-500 dark:text-neutral-400'
                    )}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-neutral-100 dark:border-neutral-900"
            >
              <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
                {/* When */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    When
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'upcoming', label: 'Upcoming' },
                        { id: 'all', label: 'All events' },
                        { id: 'past', label: 'Past' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWhenFilter(opt.id)}
                        className={cn(pillBase, whenFilter === opt.id ? pillActive : pillIdle)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                    Date
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {(
                      [
                        { id: 'any', label: 'Any date' },
                        { id: 'today', label: 'Today' },
                        { id: 'weekend', label: 'This weekend' },
                        { id: 'month', label: 'This month' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setDatePreset(opt.id);
                          setCustomDate('');
                        }}
                        className={cn(pillBase, datePreset === opt.id ? pillActive : pillIdle)}
                      >
                        {opt.label}
                      </button>
                    ))}

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            pillBase,
                            datePreset === 'custom' ? pillActive : pillIdle
                          )}
                        >
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {datePreset === 'custom' && customDate
                            ? formatDateLabel(customDate)
                            : 'Pick a date'}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DateCalendar
                          mode="single"
                          selected={
                            customDate ? new Date(customDate + 'T12:00:00') : undefined
                          }
                          onSelect={(day) => {
                            if (!day) return;
                            const dateStr = toLocalDateInput(day);
                            setCustomDate(dateStr);
                            setDatePreset('custom');
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Price + promoted */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Price
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'any', label: 'Any price' },
                          { id: 'free', label: 'Free' },
                          { id: 'paid', label: 'Paid' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPriceFilter(opt.id)}
                          className={cn(pillBase, priceFilter === opt.id ? pillActive : pillIdle)}
                        >
                          <Ticket className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                      Featured
                    </p>
                    <button
                      type="button"
                      onClick={() => setPromotedOnly((v) => !v)}
                      className={cn(pillBase, promotedOnly ? pillActive : pillIdle)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Promoted only
                    </button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
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

      <div className="flex-grow flex min-h-0 relative w-full">
        <div
          className={`transition-all duration-300 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 ${
            showMap ? 'hidden md:block md:w-[55%] xl:w-[58%]' : 'w-full'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                {searchTerm
                  ? `Results for "${searchTerm}"`
                  : selectedCategory !== 'All'
                    ? `${selectedCategory} Events`
                    : whenFilter === 'past'
                      ? 'Past Events'
                      : 'Upcoming Events'}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {loading
                  ? 'Loading...'
                  : `${events.length} event${events.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-rose-500 hover:underline"
                >
                  Clear all
                </button>
              )}
              {/* <button
                onClick={() => setShowMap(!showMap)}
                className="hidden lg:flex items-center gap-2 text-xs font-semibold px-4 py-2 border border-neutral-200 dark:border-neutral-800 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                {showMap ? <ListIcon className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                {showMap ? 'Hide map' : 'Show map'}
              </button> */}
            </div>
          </div>

          {loading ? (
            <div
              className={`grid gap-x-4 gap-y-6 grid-cols-2 sm:gap-x-6 ${
                showMap
                  ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                  : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
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
                showMap
                  ? 'sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                  : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}
            >
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  showPrice={true}
                  onHover={setHoveredEventId}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-2 sm:p-8 sm:p-12"
            >
              <div className="text-center max-w-lg mx-auto mb-8">
                <Search className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">
                  No exact matches
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {debouncedSearch
                    ? `Nothing matched “${debouncedSearch}”. Try a shorter keyword, or browse suggestions below.`
                    : 'No events match these filters. Loosen the date or price, or clear filters.'}
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-full px-6 py-3 text-xs font-bold hover:opacity-90 transition-opacity active:scale-95"
                >
                  Clear All Filters
                </button>
              </div>

              {relatedCategories.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3 text-center">
                    Try a category
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {relatedCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setSearchTerm('');
                        }}
                        className={cn(pillBase, pillIdle)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-4 text-center">
                    You might like
                  </p>
                  <div className="grid gap-x-4 gap-y-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-w-4xl mx-auto">
                    {suggestions.map((event) => (
                      <EventCard key={event.id} event={event} showPrice />
                    ))}
                  </div>
                </div>
              )}

              {!suggestions.length && relatedCategories.length === 0 && (
                <div className="text-center">
                  <Link
                    to="/"
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    Back to homepage
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </div>

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

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 md:hidden">
        {/* <button
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
        </button> */}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default EventsPage;
