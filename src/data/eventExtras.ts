export const AMENITY_OPTIONS = [
  'Free WiFi',
  'Lunch Provided',
  'Networking Sessions',
  'Workshops',
  'Swag Bag',
  'Certificate of Attendance',
  'Parking',
  'Live Music',
  'Catering Included',
  'VIP Lounge',
];

export const HIGHLIGHT_LABELS = [
  '15+ Speakers',
  'Premium Venue',
  'Live Performances',
  'Networking',
  'Goodie Bag',
];

/** All preset "what's included" suggestions (no emojis) */
export const INCLUDED_SUGGESTIONS = [...new Set([...AMENITY_OPTIONS, ...HIGHLIGHT_LABELS])];

export interface TicketTypePreset {
  name: string;
  ticketStyle: string;
  badgeText: string;
  ticketHeadline?: string;
  venueLabel?: string;
  isFree?: boolean;
  suggestedPrice?: string;
}

export const TICKET_TYPE_PRESETS: TicketTypePreset[] = [
  { name: 'General Admission', ticketStyle: 'rose', badgeText: '' },
  { name: 'VIP', ticketStyle: 'gold', badgeText: 'VIP ACCESS', suggestedPrice: '25000' },
  { name: 'Early Bird', ticketStyle: 'emerald', badgeText: 'EARLY BIRD', suggestedPrice: '8000' },
  { name: 'Student', ticketStyle: 'ocean', badgeText: 'STUDENT', suggestedPrice: '5000' },
  { name: 'Backstage Pass', ticketStyle: 'purple', badgeText: 'BACKSTAGE', suggestedPrice: '50000' },
  { name: 'Group Pass', ticketStyle: 'midnight', badgeText: 'GROUP', suggestedPrice: '35000' },
  { name: 'Free RSVP', ticketStyle: 'ocean', badgeText: '', isFree: true, suggestedPrice: '0' },
];
