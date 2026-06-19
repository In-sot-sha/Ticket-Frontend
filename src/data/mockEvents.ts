import { Event } from '../components/EventCard';

export const mockEvents: Event[] = [
  {
    id: 1,
    title: 'AI & Web3 Developer Summit',
    date: '2026-07-15',
    location: 'BUK Convocation Arena, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 250,
    category: 'Technology',
    rating: 4.8,
    price: 5000,
  },
  {
    id: 2,
    title: 'Afrobeats Live Fest',
    date: '2026-08-20',
    location: 'Sani Abacha Stadium, Kofar Mata, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 500,
    category: 'Music',
    rating: 4.9,
    price: 10000,
  },
  {
    id: 3,
    title: 'Street Food Carnival',
    date: '2026-09-10',
    location: 'Kano Golf Club, Club Road, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 180,
    category: 'Food',
    rating: 4.7,
    price: 8500,
  },
  {
    id: 4,
    title: 'Startup Pitch Night',
    date: '2026-10-01',
    location: 'Bristol Palace Hotel, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 100,
    category: 'Business',
    rating: 4.6,
    price: 5000,
  },
  {
    id: 5,
    title: 'Contemporary Art Showcase',
    date: '2026-11-25',
    location: 'Gidan Makama Museum, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 120,
    category: 'Arts',
    rating: 4.9,
    price: 15000,
  },
  {
    id: 6,
    title: 'Morning Wellness Yoga',
    date: '2026-12-18',
    location: 'Kano Golf Club, Club Road, Kano, Nigeria',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    ticketsAvailable: 50,
    category: 'Wellness',
    rating: 4.5,
    price: 3000,
  },
  {
    id: 7,
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
    id: 8,
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

/**
 * Transform API event to frontend Event format
 */
export const mapApiEventToFrontendEvent = (apiEvent: any): Event => {
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
