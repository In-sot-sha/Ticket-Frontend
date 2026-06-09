export interface TicketDraft {
  name: string;
  price: string;
  quantity: string;
  isFree: boolean;
  ticketStyle: string;
  badgeText: string;
  accentColor: string;
  ticketHeadline: string;
  venueLabel: string;
}

export interface EventTemplate {
  id: string;
  name: string;
  tagline: string;
  image: string;
  title: string;
  description: string;
  locationType: 'physical' | 'online';
  capacity: string;
  tickets: TicketDraft[];
  amenities?: string[];
}

const defaultTicket = (overrides: Partial<TicketDraft>): TicketDraft => ({
  name: 'General Admission',
  price: '',
  quantity: '100',
  isFree: false,
  ticketStyle: 'rose',
  badgeText: '',
  accentColor: '',
  ticketHeadline: 'COME AND JOIN',
  venueLabel: 'LIVE AT',
  ...overrides,
});

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: 'conference',
    name: 'Conference',
    tagline: 'Talks, panels & networking',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    title: 'Annual Conference',
    description: 'Join industry leaders for a day of inspiring talks, workshops, and meaningful connections.',
    locationType: 'physical',
    capacity: '500',
    tickets: [defaultTicket({ name: 'General Admission', price: '15000', quantity: '300', ticketStyle: 'midnight' })],
  },
  {
    id: 'party',
    name: 'Party',
    tagline: 'Music, food & good vibes',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
    title: 'Night Party',
    description: 'An unforgettable evening with live DJs, great food, and an electric atmosphere.',
    locationType: 'physical',
    capacity: '200',
    tickets: [defaultTicket({ name: 'Entry', price: '5000', quantity: '200', ticketStyle: 'rose' })],
  },
  {
    id: 'workshop',
    name: 'Workshop',
    tagline: 'Hands-on learning',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80',
    title: 'Skills Workshop',
    description: 'A practical, interactive session where participants learn by doing alongside expert facilitators.',
    locationType: 'physical',
    capacity: '40',
    tickets: [defaultTicket({ name: 'Workshop Seat', price: '8000', quantity: '40', ticketStyle: 'emerald' })],
  },
  {
    id: 'concert',
    name: 'Concert',
    tagline: 'Live performance',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    title: 'Live Concert',
    description: 'Experience an incredible night of live music featuring top artists and special guests.',
    locationType: 'physical',
    capacity: '1000',
    tickets: [
      defaultTicket({ name: 'Regular', price: '10000', quantity: '800', ticketStyle: 'rose' }),
      defaultTicket({ name: 'VIP', price: '25000', quantity: '200', ticketStyle: 'gold', badgeText: 'VIP ACCESS' }),
    ],
    amenities: ['Free WiFi', 'Lunch Provided', 'Networking Sessions', 'Swag Bag', 'Live Performances', 'Catering Included'],
  },
  {
    id: 'meetup',
    name: 'Meetup',
    tagline: 'Casual community gathering',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
    title: 'Community Meetup',
    description: 'A relaxed gathering to connect with like-minded people, share ideas, and build community.',
    locationType: 'physical',
    capacity: '80',
    tickets: [defaultTicket({ name: 'Free RSVP', price: '0', quantity: '80', isFree: true, ticketStyle: 'ocean' })],
  },
  {
    id: 'webinar',
    name: 'Webinar',
    tagline: 'Host online from anywhere',
    image: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&q=80',
    title: 'Online Webinar',
    description: 'Join us online for an engaging virtual session — participate from the comfort of your home.',
    locationType: 'online',
    capacity: '500',
    tickets: [defaultTicket({ name: 'Online Access', price: '3000', quantity: '500', ticketStyle: 'purple' })],
  },
];
