import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Search, X, Check, Navigation, Loader2 } from 'lucide-react';

const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };
const LIBRARIES: ('places')[] = ['places'];

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

  useEffect(() => {
    if (initialLocation?.lat != null && initialLocation?.lng != null) {
      setSelectedLocation(initialLocation);
    }
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialLocation?.lat, initialLocation?.lng, initialAddress]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lng: number; address: string }>>([]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const hasGoogleKey = Boolean(apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE');

  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: hasGoogleKey ? apiKey : '',
    libraries: LIBRARIES,
  });

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedLocation({ lat, lng });

      // Reverse geocode to get address
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setAddress(results[0].formatted_address);
          }
        });
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    // 1. Try Google Geocoder if available
    if (hasGoogleKey && window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          setSelectedLocation({ lat, lng });
          setAddress(results[0].formatted_address);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          fallbackSearchNominatim();
        }
        setIsSearching(false);
      });
      return;
    }

    // 2. Fallback to OpenStreetMap Nominatim
    fallbackSearchNominatim();
  };

  const fallbackSearchNominatim = async () => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&countrycodes=ng&limit=4`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const first = data[0];
          setSelectedLocation({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
          setAddress(first.display_name);
          setSearchResults(
            data.map((d: any) => ({
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lon),
              address: d.display_name,
            }))
          );
        } else {
          alert('Location not found. Try typing a landmark or city name.');
        }
      }
    } catch {
      alert('Error searching for location. Please check connection.');
    } finally {
      setIsSearching(false);
    }
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
            placeholder="Search venue or address (e.g. Landmark Centre Lagos)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="w-full pl-10 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2.5 bg-rose-500 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-rose-600 disabled:opacity-50 transition-colors shrink-0 cursor-pointer shadow-2xs"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search results list if multiple matches found */}
      {searchResults.length > 1 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 p-2 space-y-1">
          <p className="text-[10px] font-bold uppercase text-neutral-400 px-2 py-0.5">Select Result</p>
          {searchResults.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelectedLocation({ lat: r.lat, lng: r.lng });
                setAddress(r.address);
                setSearchResults([]);
              }}
              className="w-full text-left p-2 rounded-lg text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-2"
            >
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{r.address}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map display */}
      {hasGoogleKey ? (
        !isMapLoaded ? (
          <div className="w-full h-[340px] flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-800 animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
              <p className="text-xs text-neutral-400 font-medium">Loading map...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '340px',
              borderRadius: '16px',
            }}
            center={selectedLocation}
            zoom={14}
            onClick={handleMapClick}
            options={{
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            <Marker
              position={selectedLocation}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setSelectedLocation({ lat, lng });

                  if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                      if (status === 'OK' && results?.[0]) {
                        setAddress(results[0].formatted_address);
                      }
                    });
                  }
                }
              }}
            />
          </GoogleMap>
        )
      ) : (
        <div className="w-full h-72 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-850 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center">
          <div className="p-3 rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/30 mb-2">
            <MapPin className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Interactive Location Picker</p>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">
            Use the search bar above to look up any venue or address in Nigeria. Your coordinates will be pinned automatically!
          </p>
        </div>
      )}

      {/* Selected address display */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-start gap-2.5">
        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-500 dark:bg-rose-950/40 shrink-0 mt-0.5">
          <Navigation className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Selected Location
          </p>
          <p className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 line-clamp-2">
            {address}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
            Coordinates: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Check className="h-4 w-4" />
        <span>Confirm Venue Location</span>
      </button>
    </div>
  );
};

export default GoogleMapLocationPicker;
