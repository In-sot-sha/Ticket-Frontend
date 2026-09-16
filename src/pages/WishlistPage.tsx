import { useState, useMemo, useEffect, useCallback } from 'react';
import { Heart, Calendar, MapPin, ArrowRight, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useEvents } from '../hooks/queries/useEvents';
import { mapApiEventToFrontendEvent } from '../data/mockEvents';
import { cn } from '../lib/utils';

function readWishlistIds(): number[] {
  const ids: number[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('wishlist_')) {
      const val = localStorage.getItem(key);
      if (val === 'true') {
        const id = Number(key.replace('wishlist_', ''));
        if (!Number.isNaN(id)) ids.push(id);
      }
    }
  }
  return ids;
}

function formatRelativeDate(dateString?: string) {
  if (!dateString) return '';
  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return dateString;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays < 7) {
    return eventDate.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isEventPast(dateString?: string, endDate?: string) {
  const end = endDate || dateString;
  if (!end) return false;
  const d = new Date(end);
  return !Number.isNaN(d.getTime()) && d.getTime() < Date.now();
}

const WishlistPage = () => {
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => readWishlistIds());
  const { data: allEvents = [], isLoading } = useEvents({ limit: 100 });

  const refreshWishlist = useCallback(() => {
    setWishlistIds(readWishlistIds());
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('wishlist_')) refreshWishlist();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refreshWishlist);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refreshWishlist);
    };
  }, [refreshWishlist]);

  const mappedEvents = useMemo(
    () => allEvents.map(mapApiEventToFrontendEvent),
    [allEvents]
  );

  const wishlistEvents = useMemo(() => {
    const items = mappedEvents.filter((e: any) => wishlistIds.includes(e.id));
    return [...items].sort((a: any, b: any) => {
      const aPast = isEventPast(a.date, a.endDate);
      const bPast = isEventPast(b.date, b.endDate);
      if (aPast !== bPast) return aPast ? 1 : -1;
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    });
  }, [mappedEvents, wishlistIds]);

  const removeFromWishlist = (id: number) => {
    localStorage.removeItem(`wishlist_${id}`);
    setWishlistIds((prev) => prev.filter((x) => x !== id));
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-20">
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-gray-950/90 border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4 gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white">
                Wishlist
              </h1>
              <p className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {isLoading
                  ? 'Loading…'
                  : `${wishlistEvents.length} saved event${wishlistEvents.length === 1 ? '' : 's'} · upcoming first`}
              </p>
            </div>
            <Link
              to="/events"
              className="shrink-0 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              Browse events <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse flex gap-3 rounded-2xl border border-neutral-150 dark:border-neutral-800 p-3"
              >
                <div className="h-20 w-20 rounded-xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : wishlistEvents.length === 0 ? (
          <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-4">
              <Heart className="h-8 w-8 text-neutral-400 dark:text-neutral-600" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              No saved events yet
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              Tap the heart on events you like — they&apos;ll show up here for quick access.
            </p>
            <Link to="/events">
              <Button className="rounded-full text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-md">
                Discover Events
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {wishlistEvents.map((event: any) => {
              const past = isEventPast(event.date, event.endDate);
              const href = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

              return (
                <li key={event.id}>
                  <div className="flex gap-3 sm:gap-4 rounded-2xl border border-neutral-150 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5">
                    <Link
                      to={href}
                      className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0"
                    >
                      <img
                        src={
                          event.image ||
                          'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80'
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="min-w-0 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={href} className="min-w-0">
                          <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-2 leading-snug hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                            {event.title || 'Event'}
                          </h3>
                        </Link>
                        <span
                          className={cn(
                            'shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                            past
                              ? 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                          )}
                        >
                          {past ? 'Past' : 'Saved'}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                        <span className="truncate">{formatRelativeDate(event.date)}</span>
                      </p>
                      {event.location && (
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </p>
                      )}

                      <div className="mt-auto pt-2.5 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(event.id)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 transition-colors"
                          aria-label={`Remove ${event.title} from wishlist`}
                        >
                          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                          Remove
                        </button>
                        <Link to={href}>
                          <Button
                            size="sm"
                            className="rounded-full text-[11px] font-bold h-8 px-3 bg-rose-500 hover:bg-rose-600 text-white border-0 shrink-0"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;
