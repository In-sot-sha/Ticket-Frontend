import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };
const LIBRARIES: ('places')[] = ['places'];

interface GoogleMapWrapperProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string | number;
    lat: number;
    lng: number;
    label: string;
    title?: string;
  }>;
  onMarkerClick?: (marker: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  height?: string;
  selectedMarkerId?: string | number;
  style?: React.CSSProperties;
}

export const GoogleMapWrapper: React.FC<GoogleMapWrapperProps> = ({
  center = KANO_CENTER,
  zoom = 12,
  markers = [],
  onMarkerClick,
  onMapClick,
  readOnly = true,
  height = '400px',
  selectedMarkerId,
  style,
}) => {
  const [infoWindowId, setInfoWindowId] = useState<string | number | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasApiKey ? apiKey : '',
    libraries: LIBRARIES,
  });

  if (!hasApiKey) {
    return (
      <div
        style={{ height, ...style }}
        className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700"
      >
        <div className="text-center">
          <MapPin className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-500">Google Maps API not configured</p>
          <p className="text-[10px] text-neutral-400 mt-1">Add VITE_GOOGLE_MAPS_API_KEY to .env</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{ height, ...style }}
        className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-red-300 dark:border-red-900/50"
      >
        <div className="text-center p-4">
          <MapPin className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Failed to load Google Maps</p>
          <p className="text-[10px] text-neutral-400 mt-1">Please check your network or API key</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        style={{ height, ...style }}
        className="flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-pulse"
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
          <p className="text-xs text-neutral-400 font-medium">Loading map...</p>
        </div>
      </div>
    );
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!readOnly && e.latLng && onMapClick) {
      onMapClick(e.latLng.lat(), e.latLng.lng());
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height,
        borderRadius: '16px',
        ...style,
      }}
      center={center}
      zoom={zoom}
      onClick={handleMapClick}
      options={{
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      }}
    >
      {/* Event markers */}
      {markers.map((marker) => (
        <React.Fragment key={marker.id}>
          <Marker
            position={{ lat: marker.lat, lng: marker.lng }}
            onClick={() => {
              setInfoWindowId(marker.id);
              onMarkerClick?.(marker);
            }}
            title={marker.title || marker.label}
          />

          {/* Info window on marker click */}
          {infoWindowId === marker.id && (
            <InfoWindow
              position={{ lat: marker.lat, lng: marker.lng }}
              onCloseClick={() => setInfoWindowId(null)}
            >
              <div className="text-xs font-semibold text-neutral-900 max-w-xs">
                {marker.label}
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapWrapper;
