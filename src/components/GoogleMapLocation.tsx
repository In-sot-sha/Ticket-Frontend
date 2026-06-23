import React from 'react';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import { ExternalLink, MapPin } from 'lucide-react';

interface GoogleMapLocationProps {
  location: string;
  latitude?: number;
  longitude?: number;
  eventTitle?: string;
}

// Fallback: Kano, Nigeria center
const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };

export const GoogleMapLocation: React.FC<GoogleMapLocationProps> = ({
  location,
  latitude,
  longitude,
  eventTitle = 'Event Location',
}) => {
  const center = latitude && longitude ? { lat: latitude, lng: longitude } : KANO_CENTER;

  const markers = latitude && longitude
    ? [
        {
          id: 'event',
          lat: latitude,
          lng: longitude,
          label: eventTitle,
          title: location,
        },
      ]
    : [];

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
      {/* Map container */}
      <div className="relative">
        <GoogleMapWrapper
          center={center}
          zoom={15}
          markers={markers}
          readOnly={true}
          height="300px"
        />

        {/* Open in Google Maps button */}
        <button
          onClick={() => {
            const url = `https://www.google.com/maps/search/${encodeURIComponent(location)}/@${latitude},${longitude},15z`;
            window.open(url, '_blank');
          }}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-4 py-2.5 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Google Maps
        </button>

        {/* Location info overlay — top left */}
        <div className="absolute top-4 left-4 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-0.5">
                Location
              </p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                {location}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapLocation;
