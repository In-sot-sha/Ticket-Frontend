import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for missing marker images in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LocationMapProps {
  location: string;
  onLocationChange: (location: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

export const LocationMap: React.FC<LocationMapProps> = ({ location, onLocationChange, onCoordinatesChange }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [markerCoordinates, setMarkerCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Default to Lagos, Nigeria center
  const defaultLat = 6.5244;
  const defaultLng = 3.3792;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = L.map(mapContainer.current).setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // Handle map clicks
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove old marker
      if (marker.current) {
        map.current?.removeLayer(marker.current);
      }

      // Add new marker
      marker.current = L.marker([lat, lng]).addTo(map.current!);
      setMarkerCoordinates({ lat, lng });
      
      if (onCoordinatesChange) {
        onCoordinatesChange(lat, lng);
      }

      // Optionally update location text
      onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    };

    map.current.on('click', handleMapClick);

    return () => {
      map.current?.off('click', handleMapClick);
    };
  }, [onLocationChange, onCoordinatesChange]);

  // Geocode location string when it changes
  useEffect(() => {
    if (!location || !map.current) return;

    // Simple check: if location looks like coordinates, use them
    const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);

      if (!isNaN(lat) && !isNaN(lng)) {
        map.current.setView([lat, lng], 13);

        if (marker.current) {
          map.current.removeLayer(marker.current);
        }
        marker.current = L.marker([lat, lng]).addTo(map.current);
        setMarkerCoordinates({ lat, lng });
      }
      return;
    }

    // Otherwise, use Nominatim for geocoding
    const searchLocation = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
        );
        const results = await response.json();

        if (results.length > 0) {
          const { lat, lon } = results[0];
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);

          map.current?.setView([latNum, lonNum], 13);

          if (marker.current) {
            map.current?.removeLayer(marker.current);
          }
          marker.current = L.marker([latNum, lonNum]).addTo(map.current!);
          setMarkerCoordinates({ lat: latNum, lng: lonNum });
          
          if (onCoordinatesChange) {
            onCoordinatesChange(latNum, lonNum);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    };

    // Debounce the geocoding
    const timer = setTimeout(searchLocation, 1000);
    return () => clearTimeout(timer);
  }, [location, onCoordinatesChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-rose-500" />
        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
          Click on the map to set location or enter an address below
        </p>
      </div>

      {/* Map container */}
      <div
        ref={mapContainer}
        className="w-full h-80 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm"
        style={{ zIndex: 1 }}
      />

      {/* Marker info */}
      {markerCoordinates && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
          <p className="text-xs font-mono text-blue-700 dark:text-blue-400">
            📍 {markerCoordinates.lat.toFixed(6)}, {markerCoordinates.lng.toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
        💡 Tip: You can also paste coordinates like "6.5244, 3.3792" in the address field above
      </p>
    </div>
  );
};
