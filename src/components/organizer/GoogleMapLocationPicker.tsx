import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Search, X, Check, Navigation, Loader2 } from 'lucide-react';
import { KANO_CENTER, resolveVenue, searchVenues, venueLabel, type VenueSuggestion } from '../../lib/venueSearch';
const LIBRARIES: ('places')[] = ['places'];

function nameFromGeocode(result: google.maps.GeocoderResult) {
  const match = result.address_components?.find((part) =>
    part.types.some((type) =>
      ['establishment', 'point_of_interest', 'premise', 'restaurant'].includes(type)
    )
  );
  return match?.long_name || '';
}

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
  const [placeName, setPlaceName] = useState('');

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
  const [searchResults, setSearchResults] = useState<VenueSuggestion[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            setPlaceName(nameFromGeocode(results[0]));
            setAddress(results[0].formatted_address);
          }
        });
      }
    }
  };

  const applySuggestion = async (suggestion: VenueSuggestion) => {
    const resolved = await resolveVenue(suggestion);
    if (resolved.latitude != null && resolved.longitude != null) {
      setSelectedLocation({ lat: resolved.latitude, lng: resolved.longitude });
    }
    const label = venueLabel(resolved);
    setPlaceName(label);
    setAddress(resolved.address);
    setSearchQuery(label);
    setSearchResults([]);
  };

  const runSearch = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      setSearchResults(await searchVenues(query));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    void runSearch(searchQuery);
  };

  const handleConfirm = () => {
    onLocationSelect({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: placeName || address,
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
            placeholder="Search a venue, restaurant, or address"
            value={searchQuery}
            onChange={(e) => {
              const next = e.target.value;
              setSearchQuery(next);
              if (debounceTimer.current) clearTimeout(debounceTimer.current);
              debounceTimer.current = setTimeout(() => {
                void runSearch(next);
              }, 300);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-8 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
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
      {searchResults.length > 0 && (
        <div className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50 p-2 space-y-1 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-400">
            Venues, restaurants, and addresses
          </p>
          {searchResults.map((result, i) => (
            <button
              key={result.placeId || `${result.address}-${i}`}
              type="button"
              onClick={() => void applySuggestion(result)}
              className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-xs text-neutral-800 hover:bg-rose-50 dark:text-neutral-200 dark:hover:bg-rose-950/40"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
              <span className="min-w-0">
                {result.name && <span className="block truncate font-semibold">{result.name}</span>}
                <span className="block truncate text-neutral-500">{result.address}</span>
              </span>
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
                        setPlaceName(nameFromGeocode(results[0]));
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
            {placeName || address}
          </p>
          {placeName && address && placeName !== address && (
            <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{address}</p>
          )}
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
