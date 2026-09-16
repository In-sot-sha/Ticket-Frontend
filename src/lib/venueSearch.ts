export type VenueSuggestion = {
  address: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
};

export const KANO_CENTER = { lat: 11.9626, lng: 8.6753 };

function uniqueSuggestions(items: VenueSuggestion[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = (item.placeId || item.address).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function predictionsToSuggestions(
  predictions: google.maps.places.AutocompletePrediction[]
): VenueSuggestion[] {
  return predictions.map((prediction) => ({
    address: prediction.description,
    name: prediction.structured_formatting?.main_text || prediction.description,
    placeId: prediction.place_id,
  }));
}

function placesRequest(
  input: string,
  types?: string[]
): Promise<VenueSuggestion[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places) {
      resolve([]);
      return;
    }
    const service = new window.google.maps.places.AutocompleteService();
    const location = new window.google.maps.LatLng(KANO_CENTER.lat, KANO_CENTER.lng);
    service.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'ng' },
        location,
        radius: 80000,
        origin: location,
        ...(types ? { types } : {}),
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
          resolve(predictionsToSuggestions(predictions));
          return;
        }
        resolve([]);
      }
    );
  });
}

async function nominatim(query: string): Promise<VenueSuggestion[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    countrycodes: 'ng',
    addressdetails: '1',
    limit: '6',
    viewbox: '8.30,12.20,8.95,11.80',
    bounded: '0',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((item: any) => ({
    address: item.display_name,
    name: item.name || String(item.display_name).split(',')[0],
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }));
}

/** Addresses plus restaurants, cafes, and other food spots, preferring Kano. */
export async function searchVenues(query: string): Promise<VenueSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (window.google?.maps?.places) {
    const [places, businesses] = await Promise.all([
      placesRequest(trimmed),
      placesRequest(trimmed, ['establishment']),
    ]);
    const merged = uniqueSuggestions([...businesses, ...places]).slice(0, 8);
    if (merged.length) return merged;
  }

  const [addresses, food] = await Promise.all([
    nominatim(trimmed),
    nominatim(`${trimmed} restaurant`).catch(() => [] as VenueSuggestion[]),
  ]);
  return uniqueSuggestions([...addresses, ...food]).slice(0, 8);
}

/** What guests recognize: the place name, not the street address. */
export function venueLabel(suggestion: VenueSuggestion) {
  const name = suggestion.name?.trim();
  if (name && name !== suggestion.address) return name;
  return name || suggestion.address;
}

export function resolveVenue(suggestion: VenueSuggestion): Promise<VenueSuggestion> {
  if (suggestion.latitude != null && suggestion.longitude != null) {
    return Promise.resolve(suggestion);
  }
  if (suggestion.placeId && window.google?.maps?.places) {
    return new Promise((resolve) => {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        { placeId: suggestion.placeId!, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            resolve({
              ...suggestion,
              name: place.name || suggestion.name,
              address: place.formatted_address || suggestion.address,
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
            return;
          }
          resolve(suggestion);
        }
      );
      return;
    });
  }
  if (window.google?.maps?.Geocoder) {
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: suggestion.address }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location;
          resolve({
            ...suggestion,
            address: results[0].formatted_address || suggestion.address,
            latitude: loc.lat(),
            longitude: loc.lng(),
          });
          return;
        }
        resolve(suggestion);
      });
    });
  }
  return Promise.resolve(suggestion);
}
