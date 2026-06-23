import React from 'react';
import { GoogleMapWrapper } from './GoogleMapWrapper';
import { MapPin, ExternalLink } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

interface GoogleMapEventsProps {
  events: Event[];
  hoveredEventId: number | null;
  onSelectEvent?: (event: Event) => void;
}

const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };

export const GoogleMapEvents: React.FC<GoogleMapEventsProps> = ({
  events,
  hoveredEventId,
  onSelectEvent,
}) => {
  // Filter events that have coordinates
  const eventsWithCoordinates = events.filter((e) => e.latitude && e.longitude);

  if (eventsWithCoordinates.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-500">No events with location data</p>
        </div>
      </div>
    );
  }

  // Calculate center from events
  const avgLat =
    eventsWithCoordinates.reduce((sum, e) => sum + (e.latitude || 0), 0) /
    eventsWithCoordinates.length;
  const avgLng =
    eventsWithCoordinates.reduce((sum, e) => sum + (e.longitude || 0), 0) /
    eventsWithCoordinates.length;

  const markers = eventsWithCoordinates.map((event) => ({
    id: event.id,
    lat: event.latitude || 0,
    lng: event.longitude || 0,
    label: event.title,
    title: event.location,
  }));

  return (
    <div className="w-full h-full relative">
      <GoogleMapWrapper
        center={{ lat: avgLat, lng: avgLng }}
        zoom={12}
        markers={markers}
        selectedMarkerId={hoveredEventId || undefined}
        onMarkerClick={(marker) => {
          const event = events.find((e) => e.id === marker.id);
          if (event) {
            onSelectEvent?.(event);
          }
        }}
        readOnly={true}
        height="100%"
      />

      {/* Open in Google Maps button */}
      <button
        onClick={() => {
          const url = `https://maps.google.com/?q=${avgLat},${avgLng}`;
          window.open(url, '_blank');
        }}
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white px-3 py-2 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Open on Map
      </button>
    </div>
  );
};

export default GoogleMapEvents;
