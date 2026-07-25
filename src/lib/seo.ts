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

export interface EventStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    '@type': string;
    name: string;
    address?: string;
  };
  organizer?: {
    '@type': string;
    name: string;
    url?: string;
  };
  image?: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
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

/**
 * Generate structured data for an event
 */
export const generateEventStructuredData = (event: any): EventStructuredData => {
  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}${eventPath(event)}`;

  const image =
    event.imageUrl || (event.images && event.images[0]) || `${baseUrl}/og-image.jpg`;
  const description = event.description || '';
  const location = event.location || 'Nigeria';
  const organizerName =
    event.organization?.name ||
    (typeof event.organizer === 'object' ? event.organizer.name : 'PartyStorm');

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: description,
    startDate: event.startDate || event.date,
    endDate: event.endDate,
    url: pageUrl,
    location: {
      '@type': 'Place',
      name: location,
      address: location,
    },
    organizer: {
      '@type': 'Organization',
      name: organizerName,
      url: baseUrl,
    },
    image: image,
    offers:
      event.ticketTypes && event.ticketTypes.length > 0
        ? {
            '@type': 'Offer',
            price: String(event.ticketTypes[0]?.price || event.price || 0),
            priceCurrency: 'NGN',
            availability: 'https://schema.org/InStock',
            url: pageUrl,
          }
        : undefined,
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
