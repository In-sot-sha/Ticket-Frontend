import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VenueSuggestion {
  address: string;
  name?: string;
  latitude?: number;
  longitude?: number;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (location: { address: string; latitude?: number; longitude?: number }) => void;
  onOpenMapPicker: () => void;
  latitude?: number;
  longitude?: number;
  placeholder?: string;
  className?: string;
}

export const VenueAutocomplete: React.FC<VenueAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onOpenMapPicker,
  latitude,
  longitude,
  placeholder = 'e.g. Landmark Centre, Water Corporation Drive, Victoria Island, Lagos',
  className,
}) => {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Query suggestions with debounce
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Try Google Maps Places Autocomplete if available in browser
    if (window.google?.maps?.places) {
      try {
        const service = new window.google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input: query, componentRestrictions: { country: 'ng' } },
          (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
              const geocoder = new window.google.maps.Geocoder();
              const formattedList: VenueSuggestion[] = predictions.slice(0, 5).map((p) => ({
                address: p.description,
                name: p.structured_formatting?.main_text || p.description,
              }));
              setSuggestions(formattedList);
              setLoading(false);
              return;
            }
            // Fallback to OSM Nominatim
            fallbackToNominatim(query);
          }
        );
        return;
      } catch {
        // Fallback to OSM Nominatim
        fallbackToNominatim(query);
        return;
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim for real geo suggestions
    fallbackToNominatim(query);
  };

  const fallbackToNominatim = async (query: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=ng&addressdetails=1&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const list: VenueSuggestion[] = data.map((item: any) => ({
          address: item.display_name,
          name: item.name || item.display_name.split(',')[0],
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
        setSuggestions(list);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 350);
  };

  const handleSelectSuggestion = (s: VenueSuggestion) => {
    onChange(s.address);
    setIsOpen(false);
    setSuggestions([]);

    if (s.latitude != null && s.longitude != null) {
      onSelect({
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
      });
    } else if (window.google?.maps?.Geocoder) {
      // Geocode address to get lat/lng
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: s.address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          onSelect({
            address: s.address,
            latitude: loc.lat(),
            longitude: loc.lng(),
          });
        } else {
          onSelect({ address: s.address });
        }
      });
    } else {
      onSelect({ address: s.address });
    }
  };

  return (
    <div ref={dropdownRef} className="relative w-full space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className={cn(className, 'pr-8')}
          />
          {loading ? (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setSuggestions([]);
                setIsOpen(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onOpenMapPicker}
          className="px-3.5 py-2 bg-rose-500 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-rose-600 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
        >
          <MapPin className="h-4 w-4" />
          <span>{latitude != null && longitude != null ? 'Edit pin' : 'Pick on map'}</span>
        </button>
      </div>

      {/* Geocoded coordinates indicator */}
      {latitude != null && longitude != null && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium pl-0.5">
          <Navigation className="h-3 w-3 shrink-0" />
          Map coordinates pinned ({latitude.toFixed(4)}, {longitude.toFixed(4)})
        </p>
      )}

      {/* Auto-suggest dropdown menu */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-1.5 bg-neutral-50 dark:bg-neutral-850 px-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <span>Suggested Locations</span>
            <span className="text-[9px] lowercase font-normal">Click to select</span>
          </div>
          {suggestions.map((s, idx) => (
            <button
              key={`${s.address}-${idx}`}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="w-full p-2.5 sm:p-3 text-left hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors flex items-start gap-2.5 group cursor-pointer"
            >
              <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/40 shrink-0 transition-colors mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                {s.name && (
                  <p className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                    {s.name}
                  </p>
                )}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-tight">
                  {s.address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueAutocomplete;
