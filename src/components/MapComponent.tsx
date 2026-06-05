import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';

// Standard coordinates for Nigerian cities used in mock data
const CITY_COORDINATES: { [key: string]: [number, number] } = {
  'lagos': [6.5244, 3.3792],
  'abuja': [9.0765, 7.3986],
  'port harcourt': [4.8156, 7.0498],
  'ibadan': [7.3775, 3.9470],
  'kano': [12.0022, 8.5920],
  'enugu': [6.4584, 7.5083],
};

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  category?: string;
  price?: string | number;
  image: string;
}

interface MapComponentProps {
  events: Event[];
  hoveredEventId: number | null;
  onSelectEvent?: (id: number) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  events, 
  hoveredEventId,
  onSelectEvent 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const navigate = useNavigate();

  // Helper to get coordinates with small random offset to prevent overlap
  const getEventCoordinates = (location: string, index: number): [number, number] => {
    const locLower = location.toLowerCase();
    let coords: [number, number] = [9.082, 8.675]; // default center of Nigeria

    for (const city of Object.keys(CITY_COORDINATES)) {
      if (locLower.includes(city)) {
        coords = [...CITY_COORDINATES[city]];
        break;
      }
    }

    // Add slight deterministic jitter based on index so pins don't overlap exactly
    const angle = index * 0.5;
    const radius = 0.015; // Jitter radius in degrees
    return [
      coords[0] + Math.sin(angle) * radius,
      coords[1] + Math.cos(angle) * radius
    ];
  };

  // Helper to format price to compact form (e.g. ₦10k or Free)
  const formatPriceCompact = (price: string | number | undefined): string => {
    if (price === undefined || price === null) return 'Free';
    
    let numericPrice = 0;
    if (typeof price === 'string') {
      const clean = price.replace(/[^\d]/g, '');
      numericPrice = parseInt(clean, 10) || 0;
    } else {
      numericPrice = price;
    }

    if (numericPrice === 0) return 'Free';
    if (numericPrice >= 1000) {
      return `₦${(numericPrice / 1000).toFixed(0)}k`;
    }
    return `₦${numericPrice}`;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Detect theme class on body/html
    const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
    
    // Choose CartoDB tiles based on theme
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: [8.5, 7.5], // Center of Nigeria
      zoom: 6,
      zoomControl: false // Position zoom control bottom right later
    });

    mapRef.current = map;

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19
    }).addTo(map);

    // Add zoom controls to the bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Clean up
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when events or theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (events.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    events.forEach((event, idx) => {
      const coords = getEventCoordinates(event.location, idx);
      bounds.push(coords);

      const displayPrice = formatPriceCompact(event.price);
      
      // Create Airbnb-style HTML divIcon for marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div id="marker-pin-${event.id}" class="map-price-pin flex items-center justify-center bg-white dark:bg-gray-800 text-neutral-900 dark:text-neutral-100 font-bold border border-neutral-200 dark:border-neutral-700 px-2.5 py-1.5 rounded-full shadow-md hover:shadow-lg text-xs leading-none transition-all cursor-pointer select-none hover:scale-105 active:scale-95 duration-200">
            ${displayPrice}
          </div>
        `,
        iconSize: [40, 24],
        iconAnchor: [20, 12]
      });

      const marker = L.marker(coords, { icon: customIcon }).addTo(map);
      markersRef.current[event.id] = marker;

      // Create Popup template mimicking Airbnb card preview
      const popupContent = document.createElement('div');
      popupContent.className = 'w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer';
      popupContent.innerHTML = `
        <div class="h-28 overflow-hidden relative">
          <img src="${event.image}" alt="${event.title}" class="w-full h-full object-cover" />
          <span class="absolute top-2 left-2 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">${event.category}</span>
        </div>
        <div class="p-3">
          <h4 class="font-bold text-xs line-clamp-1 text-neutral-800 dark:text-neutral-100 mb-1">${event.title}</h4>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mb-1.5">${event.location}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-neutral-900 dark:text-white">${displayPrice}</span>
            <span class="text-[10px] text-rose-500 font-bold">Details &rarr;</span>
          </div>
        </div>
      `;

      popupContent.addEventListener('click', () => {
        navigate(`/events/${event.id}`);
        if (onSelectEvent) onSelectEvent(event.id);
      });

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'airbnb-map-popup'
      });

      marker.on('click', () => {
        marker.openPopup();
      });
    });

    // Zoom/pan map to bounds of all markers if we have elements
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [events, navigate]);

  // Sync Hover State (Card hover highlights Marker pin)
  useEffect(() => {
    Object.keys(markersRef.current).forEach(idKey => {
      const id = parseInt(idKey, 10);
      const markerElement = document.getElementById(`marker-pin-${id}`);
      if (markerElement) {
        if (id === hoveredEventId) {
          markerElement.classList.add('bg-neutral-900', 'text-white', 'scale-110', 'border-neutral-900', 'z-[1000]');
          markerElement.classList.remove('bg-white', 'text-neutral-900', 'dark:bg-gray-800', 'dark:text-neutral-100');
        } else {
          markerElement.classList.remove('bg-neutral-900', 'text-white', 'scale-110', 'border-neutral-900', 'z-[1000]');
          markerElement.classList.add('bg-white', 'text-neutral-900', 'dark:bg-gray-800', 'dark:text-neutral-100');
        }
      }
    });
  }, [hoveredEventId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-800/80 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      
      {/* Styles for divIcon to ensure no standard leaflet background details */}
      <style>{`
        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .airbnb-map-popup .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 8px 28px rgba(0,0,0,0.15) !important;
        }
        .airbnb-map-popup .leaflet-popup-content {
          margin: 0 !important;
          width: 192px !important;
        }
        .airbnb-map-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .map-price-pin {
          transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
