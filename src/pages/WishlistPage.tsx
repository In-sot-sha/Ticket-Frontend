import React, { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import EventCard from '../components/EventCard';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const WishlistPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to load wishlist IDs from localStorage
  const loadWishlistIds = () => {
    const ids: number[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wishlist_')) {
        const val = localStorage.getItem(key);
        if (val === 'true') {
          const id = Number(key.replace('wishlist_', ''));
          if (!isNaN(id)) {
            ids.push(id);
          }
        }
      }
    }
    setWishlistIds(ids);
  };

  useEffect(() => {
    loadWishlistIds();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Fetch all events from API
        const response = await api.events.getAll({ limit: 100 });
        if (response.data && response.data.events) {
          // Map API events to frontend shape needed by EventCard
          const mapped = response.data.events.map((e: any) => ({
            id: e.id,
            title: e.title,
            date: e.startDate,
            location: e.location || 'Online',
            image: e.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
            category: e.category,
            ticketsAvailable: e.ticketTypes?.reduce((acc: number, t: any) => acc + (t.quantity || 0), 0) || 0,
            price: e.price ?? 0,
            rating: 4.5 + (e.id % 5) * 0.1
          }));
          setEvents(mapped);
        }
      } catch (err) {
        console.error('Failed to load events for wishlist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events matching our wishlist IDs
  const wishlistEvents = events.filter(e => wishlistIds.includes(e.id));

  // Handler to listen to wishlist changes from cards
  const handleWishlistChange = () => {
    loadWishlistIds();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-neutral-900 dark:text-neutral-100 pb-16">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Wishlist</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
            <p className="text-xs text-neutral-450 dark:text-neutral-500">Loading your saved events...</p>
          </div>
        ) : wishlistEvents.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg mx-auto">
            <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-base font-bold mb-2">Create your first wishlist</h3>
            <p className="text-xs text-neutral-450 dark:text-neutral-500 mb-6 max-w-xs mx-auto">
              As you search, click the heart icon on events you like to save them here.
            </p>
            <Link to="/events">
              <Button className="rounded-full text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white px-6">
                Explore Events
              </Button>
            </Link>
          </div>
        ) : (
          <div 
            onClick={handleWishlistChange} 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {wishlistEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                showTicketsAvailable={true}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;
