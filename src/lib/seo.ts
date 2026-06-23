/**
 * SEO utilities for meta tags and structured data
 */

export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
}

export interface EventStructuredData {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    "@type": string;
    name: string;
    address?: string;
  };
  organizer?: {
    "@type": string;
    name: string;
    url?: string;
  };
  image?: string;
  offers?: {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
}

/**
 * Generate structured data for an event
 */
export const generateEventStructuredData = (event: any): EventStructuredData => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://partystorm.com';
  
  // Handle both API response and EventDetail component types
  const image = event.imageUrl || (event.images && event.images[0]) || `${baseUrl}/og-image.png`;
  const description = event.description || "";
  const location = event.location || "Kano, Nigeria";
  const organizerName = event.organization?.name || (typeof event.organizer === 'object' ? event.organizer.name : "PartyStorm");
  
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: description,
    startDate: event.startDate || event.date,
    endDate: event.endDate,
    location: {
      "@type": "Place",
      name: location,
      address: location,
    },
    organizer: {
      "@type": "Organization",
      name: organizerName,
      url: baseUrl,
    },
    image: image,
    offers: event.ticketTypes && event.ticketTypes.length > 0 ? {
      "@type": "Offer",
      price: String(event.ticketTypes[0]?.price || event.price || 0),
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/event/${event.id}`,
    } : undefined,
  };
};

/**
 * Generate structured data for event collection
 */
export const generateEventCollectionStructuredData = (events: any[], title: string) => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://partystorm.com';

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    url: baseUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: events.slice(0, 10).map((event, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: event.title,
        url: `${baseUrl}/event/${event.id}`,
      })),
    },
  };
};

/**
 * Generate structured data for organization
 */
export const generateOrganizationStructuredData = () => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://partystorm.com';

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PartyStorm",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Event ticketing platform for Kano events and experiences",
    sameAs: [],
  };
};
