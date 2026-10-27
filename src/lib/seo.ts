/**
 * SEO utilities for meta tags and structured data
 */

export const SITE_URL = 'https://partystorm.ng';

export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export interface EventOfferStructuredData {
  '@type': 'Offer';
  name?: string;
  price: string;
  priceCurrency: string;
  availability: string;
  validFrom: string;
  priceValidUntil: string;
  url: string;
}

export interface EventStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  eventStatus: string;
  eventAttendanceMode: string;
  location: {
    '@type': string;
    name: string;
    address?: string;
    url?: string;
  };
  organizer: {
    '@type': string;
    name: string;
    url?: string;
  };
  performer:
    | {
        '@type': string;
        name: string;
      }
    | Array<{
        '@type': string;
        name: string;
      }>;
  image?: string;
  offers: EventOfferStructuredData | EventOfferStructuredData[];
  url?: string;
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_URL;
}

function eventPath(event: { slug?: string; id?: number | string }): string {
  const slugOrId = event.slug || (event.id != null ? String(event.id) : '');
  return slugOrId ? `/events/${slugOrId}` : '/events';
}

function toIsoDate(val: any): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function resolveStartDate(event: any): string {
  const direct = toIsoDate(event.startDate);
  if (direct) return direct;

  if (event.date) {
    if (event.time) {
      const combined = toIsoDate(`${event.date} ${event.time}`);
      if (combined) return combined;
    }
    const fromDate = toIsoDate(event.date);
    if (fromDate) return fromDate;
  }
  return new Date().toISOString();
}

function resolveEndDate(event: any, startIso: string): string {
  const direct = toIsoDate(event.endDate);
  if (direct) {
    // If provided endDate is chronologically after start, use it
    if (new Date(direct).getTime() > new Date(startIso).getTime()) {
      return direct;
    }
  }

  // Fallback: 4 hours after start time
  try {
    const start = new Date(startIso);
    const computed = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    return computed.toISOString();
  } catch {
    return new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  }
}

/**
 * Generate structured data for an event adhering to Google Search Console guidelines
 */
export const generateEventStructuredData = (event: any): EventStructuredData => {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}${eventPath(event)}`;

  const image =
    event.imageUrl || (event.images && event.images[0]) || `${baseUrl}/og-image.jpg`;
  const description = event.description || event.title || 'Event tickets on PartyStorm';
  const locationName = event.location || 'Nigeria';
  const organizerName =
    event.organization?.name ||
    (typeof event.organizer === 'object' && event.organizer?.name ? event.organizer.name : null) ||
    'PartyStorm';

  // 1. Resolve robust ISO startDate and endDate (Fixes: Missing field "endDate")
  const startIso = resolveStartDate(event);
  const endIso = resolveEndDate(event, startIso);

  // 2. Resolve eventStatus (Fixes: Missing field "eventStatus")
  let eventStatus = 'https://schema.org/EventScheduled';
  const rawStatus = String(event.status || '').toUpperCase();
  if (rawStatus === 'CANCELLED' || event.isCancelled) {
    eventStatus = 'https://schema.org/EventCancelled';
  } else if (rawStatus === 'POSTPONED' || event.isPostponed) {
    eventStatus = 'https://schema.org/EventPostponed';
  } else if (rawStatus === 'RESCHEDULED') {
    eventStatus = 'https://schema.org/EventRescheduled';
  } else if (rawStatus === 'MOVED_ONLINE') {
    eventStatus = 'https://schema.org/EventMovedOnline';
  }

  // 3. Resolve eventAttendanceMode & Location
  const locType = String(event.locationType || '').toLowerCase();
  const isOnline = locType === 'online' || Boolean(event.onlineUrl && !event.location);
  const isHybrid = locType === 'hybrid';
  const eventAttendanceMode = isOnline
    ? 'https://schema.org/OnlineEventAttendanceMode'
    : isHybrid
    ? 'https://schema.org/MixedEventAttendanceMode'
    : 'https://schema.org/OfflineEventAttendanceMode';

  const locationData = isOnline
    ? {
        '@type': 'VirtualLocation',
        name: 'Online Event',
        url: event.onlineUrl || pageUrl,
      }
    : {
        '@type': 'Place',
        name: locationName,
        address: locationName,
      };

  // 4. Resolve performer (Fixes: Missing field "performer")
  let performer: EventStructuredData['performer'];
  if (Array.isArray(event.performers) && event.performers.length > 0) {
    performer = event.performers.map((p: any) => ({
      '@type': typeof p === 'object' && p?.type ? p.type : 'PerformingGroup',
      name: typeof p === 'object' && p?.name ? p.name : String(p),
    }));
  } else {
    const performerName =
      (typeof event.performer === 'object' && event.performer?.name) ||
      (typeof event.performer === 'string' && event.performer.trim() ? event.performer.trim() : null) ||
      (typeof event.artist === 'string' && event.artist.trim() ? event.artist.trim() : null) ||
      (typeof event.host === 'string' && event.host.trim() ? event.host.trim() : null) ||
      organizerName ||
      'PartyStorm';

    performer = {
      '@type': 'PerformingGroup',
      name: performerName,
    };
  }

  // 5. Resolve offers with validFrom (Fixes: Missing field "validFrom" (in "offers"))
  const validFromIso =
    toIsoDate(event.createdAt) ||
    toIsoDate(event.startDate || event.date) ||
    new Date().toISOString();

  let offers: EventOfferStructuredData | EventOfferStructuredData[];

  if (Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0) {
    const mappedOffers: EventOfferStructuredData[] = event.ticketTypes.map((ticket: any) => ({
      '@type': 'Offer',
      name: ticket.name || 'General Admission',
      price: String(ticket.price != null && !isNaN(Number(ticket.price)) ? Number(ticket.price) : 0),
      priceCurrency: 'NGN',
      availability:
        ticket.isPaused || (ticket.quantity != null && ticket.quantity <= 0)
          ? 'https://schema.org/SoldOut'
          : 'https://schema.org/InStock',
      validFrom: toIsoDate(ticket.createdAt) || validFromIso,
      priceValidUntil: endIso,
      url: pageUrl,
    }));

    offers = mappedOffers.length === 1 ? mappedOffers[0] : mappedOffers;
  } else {
    offers = {
      '@type': 'Offer',
      name: 'General Admission',
      price: String(event.price != null && !isNaN(Number(event.price)) ? Number(event.price) : 0),
      priceCurrency: 'NGN',
      availability: 'https://schema.org/InStock',
      validFrom: validFromIso,
      priceValidUntil: endIso,
      url: pageUrl,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: description,
    startDate: startIso,
    endDate: endIso,
    eventStatus,
    eventAttendanceMode,
    url: pageUrl,
    location: locationData,
    organizer: {
      '@type': 'Organization',
      name: organizerName,
      url: baseUrl,
    },
    performer,
    image,
    offers,
  };
};

/**
 * Generate structured data for event collection
 */
export const generateEventCollectionStructuredData = (events: any[], title: string) => {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: `${baseUrl}/events`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: events.slice(0, 10).map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: event.title,
        url: `${baseUrl}${eventPath(event)}`,
      })),
    },
  };
};

/**
 * Generate structured data for organization
 */
export const generateOrganizationStructuredData = () => {
  const baseUrl = getBaseUrl();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PartyStorm',
    url: baseUrl,
    logo: `${baseUrl}/og-image.jpg`,
    description: 'Discover and book event tickets in Nigeria.',
    sameAs: [],
  };
};
