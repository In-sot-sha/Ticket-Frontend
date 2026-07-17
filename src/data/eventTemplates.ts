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
  maxPerPerson?: string;
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
  category?: string;
  vendorSettings?: any;
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
    id: 'custom',
    name: 'Start from Scratch',
    tagline: 'Start with a blank canvas',
    image: '',
    title: '',
    description: '',
    locationType: 'physical',
    capacity: '',
    tickets: [{
      name: 'General Admission',
      price: '',
      quantity: '100',
      isFree: false,
      ticketStyle: 'rose',
      badgeText: '',
      accentColor: '',
      ticketHeadline: 'COME AND JOIN',
      venueLabel: 'LIVE AT',
    }],
    amenities: [],
    category: 'Other',
  },
  {
    id: 'fair',
    name: 'Fair',
    tagline: 'Exhibitions, food & vendor stalls',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80',
    title: 'Kano Community Fair',
    description: 'Welcome to the Kano Community Fair! Explore local vendor stalls, delicious street food, artisan crafts, live games, and family-friendly entertainment.',
    locationType: 'physical',
    capacity: '1000',
    tickets: [
      defaultTicket({ name: 'General Admission', price: '0', quantity: '800', isFree: true, ticketStyle: 'rose' }),
      defaultTicket({ name: 'VIP Pass', price: '5000', quantity: '200', ticketStyle: 'gold', badgeText: 'FAST TRACK' })
    ],
    amenities: ['Catering Included', 'Live Performances', 'Security Provided', 'Restrooms', 'Parking Space'],
    category: 'Fairs',
    vendorSettings: {
      allowVendors: true,
      stallTypes: [
        { id: 'stall_food', name: 'Food Stall', price: 15000, maxStalls: 15, description: 'Stall for food & beverage sales' },
        { id: 'stall_craft', name: 'Craft Stall', price: 10000, maxStalls: 25, description: 'Stall for local crafts & art goods' }
      ],
      allowedRoles: ['Catering', 'Decoration'],
      approvalMode: 'manual',
      applicationDeadline: 7,
    }
  },
  {
    id: 'wedding',
    name: 'Wedding',
    tagline: 'Save-the-date boarding pass',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    title: 'Nathalie & John',
    description:
      'Together with their families, request the pleasure of your company to celebrate their wedding day. Save the date and RSVP with your boarding pass.',
    locationType: 'physical',
    capacity: '150',
    tickets: [
      defaultTicket({
        name: 'Guest Admission',
        price: '0',
        quantity: '150',
        isFree: true,
        ticketStyle: 'boarding-gold',
        badgeText: 'WEDDING TICKET',
        ticketHeadline: 'Save the date',
        venueLabel: 'DESTINATION',
      }),
    ],
    amenities: ['Open Bar', 'Dinner Service', 'Live Music', 'Photo Booth', 'Valet Parking'],
    category: 'Wedding',
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
    category: 'Music',
  },
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
    category: 'Business',
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
    category: 'Technology',
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
      defaultTicket({
        name: 'Regular',
        price: '10000',
        quantity: '800',
        ticketStyle: 'stub-rose',
        ticketHeadline: 'LIVE SHOW',
        venueLabel: 'STAGE',
      }),
      defaultTicket({
        name: 'VIP',
        price: '25000',
        quantity: '200',
        ticketStyle: 'stub-gold',
        badgeText: 'VIP ACCESS',
        ticketHeadline: 'LIVE SHOW',
        venueLabel: 'STAGE',
      }),
    ],
    amenities: ['Free WiFi', 'Lunch Provided', 'Networking Sessions', 'Swag Bag', 'Live Performances', 'Catering Included'],
    category: 'Music',
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
    category: 'Technology',
  },

];
