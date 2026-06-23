import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { MapPin, Search, X } from 'lucide-react';

const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };

interface GoogleMapLocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  initialLocation?: { lat: number; lng: number };
  initialAddress?: string;
}

export const GoogleMapLocationPicker: React.FC<GoogleMapLocationPickerProps> = ({
  onLocationSelect,
  initialLocation = KANO_CENTER,
  initialAddress = 'Kano, Nigeria',
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  }>(initialLocation);
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-neutral-500">Google Maps API not configured</p>
        </div>
      </div>
    );
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setAddress(results[0].formatted_address);
        }
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        setSelectedLocation({ lat, lng });
        setAddress(results[0].formatted_address);
        setSearchQuery('');
      } else {
        alert('Location not found. Try another search.');
      }
      setIsSearching(false);
    });
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address,
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-grow relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2.5 bg-rose-500 text-white rounded-lg font-semibold text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Map */}
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{
            width: '100%',
            height: '400px',
            borderRadius: '12px',
          }}
          center={selectedLocation}
          zoom={13}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* Location marker */}
          <Marker
            position={selectedLocation}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            draggable={true}
            onDragEnd={(e) => {
              if (e.latLng) {
                const lat = e.latLng.lat();
                const lng = e.latLng.lng();
                setSelectedLocation({ lat, lng });

                // Reverse geocode to get address
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                  if (status === 'OK' && results?.[0]) {
                    setAddress(results[0].formatted_address);
                  }
                });
              }
            }}
          />
        </GoogleMap>
      </LoadScript>

      {/* Selected address display */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
          Selected Location
        </p>
        <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">
          {address}
        </p>
        <p className="text-xs text-neutral-500">
          Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
        </p>
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all active:scale-95"
      >
        Confirm Location
      </button>
    </div>
  );
};

export default GoogleMapLocationPicker;
