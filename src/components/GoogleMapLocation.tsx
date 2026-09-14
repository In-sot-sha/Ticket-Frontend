import React, { useEffect, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import { ExternalLink, MapPin } from 'lucide-react';

interface GoogleMapLocationProps {
  location: string;
  latitude?: number;
  longitude?: number;
  eventTitle?: string;
}

const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };
const LIBRARIES: ('places')[] = ['places'];

function parseCoord(value?: number) {
  if (value == null || Number.isNaN(Number(value))) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export const GoogleMapLocation: React.FC<GoogleMapLocationProps> = ({
  location,
  latitude,
  longitude,
  eventTitle = 'Event Location',
}) => {
  const savedLat = parseCoord(latitude);
  const savedLng = parseCoord(longitude);
  const [resolved, setResolved] = useState<{ lat: number; lng: number } | null>(
    savedLat != null && savedLng != null ? { lat: savedLat, lng: savedLng } : null
  );

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasApiKey ? apiKey : '',
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (savedLat != null && savedLng != null) {
      setResolved({ lat: savedLat, lng: savedLng });
      return;
    }

    if (!isLoaded || !location || location === 'Online' || !window.google?.maps?.Geocoder) {
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        setResolved({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [isLoaded, location, savedLat, savedLng]);

  const center = resolved ?? KANO_CENTER;
  const markers = resolved
    ? [
        {
          id: 'event',
          lat: resolved.lat,
          lng: resolved.lng,
          label: eventTitle,
          title: location,
        },
      ]
    : [];

  const mapsUrl =
    resolved != null
      ? `https://www.google.com/maps/search/?api=1&query=${resolved.lat},${resolved.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
      <div className="relative">
        <GoogleMapWrapper
          center={center}
          zoom={resolved ? 15 : 12}
          markers={markers}
          selectedMarkerId={resolved ? 'event' : undefined}
          readOnly={true}
          height="300px"
        />

        <button
          type="button"
          onClick={() => window.open(mapsUrl, '_blank')}
          className="absolute bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-4 py-2.5 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Google Maps
        </button>

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
