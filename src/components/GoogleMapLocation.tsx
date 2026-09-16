import React from 'react';
import { Navigation } from 'lucide-react';

interface GoogleMapLocationProps {
  location: string;
  latitude?: number;
  longitude?: number;
  eventTitle?: string;
  height?: string;
}

function parseCoord(value?: number) {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Google place embed: venue card, pin, directions — no zoom or map-type controls. */
function embedSrc(location: string, lat?: number, lng?: number) {
  const place = location?.trim();
  const query = place && place !== 'Online' ? place : lat != null && lng != null ? `${lat},${lng}` : '';
  const params = new URLSearchParams({
    q: query,
    z: '16',
    output: 'embed',
    hl: 'en',
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}

export const GoogleMapLocation: React.FC<GoogleMapLocationProps> = ({
  location,
  latitude,
  longitude,
  eventTitle = 'Event location',
  height = '320px',
}) => {
  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const src = embedSrc(location, lat, lng);
  const destination = lat != null && lng != null ? `${lat},${lng}` : location;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800">
      <iframe
        title={eventTitle || location || 'Event location'}
        src={src}
        className="block w-full border-0"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 border-t border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-rose-400 dark:hover:bg-rose-950/30"
      >
        <Navigation className="h-4 w-4" />
        Get directions
      </a>
    </div>
  );
};

export default GoogleMapLocation;
