import { useState, useEffect, useCallback } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface UseGeolocationReturn {
  coords: GeolocationCoordinates | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
}

const STORAGE_KEY = 'lastKnownLocation';
const LOCATION_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const useGeolocation = (): UseGeolocationReturn => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Try to load last known location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { coords: lastCoords, timestamp } = JSON.parse(stored);
        // Use cached location if less than 5 minutes old
        if (Date.now() - timestamp < LOCATION_CACHE_TIME) {
          setCoords(lastCoords);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newCoords = { latitude, longitude, accuracy };
        
        setCoords(newCoords);
        setLoading(false);
        
        // Cache to localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            coords: newCoords,
            timestamp: Date.now(),
          })
        );
      },
      (err) => {
        let errorMsg = 'Failed to get location';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please enable it in your browser settings.';
        } else if (err.code === 2) {
          errorMsg = 'Location service is unavailable';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out';
        }
        setError(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return { coords, error, loading, requestLocation };
};
