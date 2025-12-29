import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from './ui/button';
import { Layers } from 'lucide-react';

interface MapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  markers?: { lat: number; lng: number; label?: string; id?: string }[];
  onMarkerClick?: (marker: { lat: number; lng: number; label?: string; id?: string }) => void;
  className?: string;
  enableDirections?: boolean;
  directionsDestination?: { lat: number; lng: number };
}

export const Map = ({ 
  latitude, 
  longitude, 
  zoom = 12, 
  markers = [],
  onMarkerClick,
  className = 'h-[250px] md:h-[500px]',
  enableDirections = false,
  directionsDestination,
}: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [is3DMode, setIs3DMode] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token is missing. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file');
      return;
    }

    mapboxgl.accessToken = accessToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: is3DMode ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: is3DMode ? Math.max(zoom, 16) : zoom, // Minimum zoom 16 for 3D clarity
      pitch: is3DMode ? 45 : 0, // Reduced pitch for better clarity
      bearing: 0,
      antialias: true, // Enable antialiasing for smoother rendering
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control for user location
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.current.addControl(geolocate, 'top-right');

    // Handle resize
    const handleResize = () => {
      map.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.current?.remove();
    };
  }, [latitude, longitude, zoom, is3DMode]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    const addMarkersToMap = () => {
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add new markers
      markers.forEach((marker) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.cursor = 'pointer';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.zIndex = '1000'; // Ensure markers appear above map
        
        // Create marker with house icon (fallback to emoji if image not available)
        el.style.backgroundColor = '#3b82f6';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '18px';
        el.innerHTML = '🏠';
        
        // Try to load custom marker image
        const markerImg = new Image();
        markerImg.onload = () => {
          el.style.backgroundImage = 'url(/house-marker.png)';
          el.style.backgroundSize = 'cover';
          el.innerHTML = '';
        };
        markerImg.onerror = () => {
          // Keep emoji fallback
        };
        markerImg.src = '/house-marker.png';

        const mapboxMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .addTo(map.current!);

        if (onMarkerClick) {
          el.addEventListener('click', () => {
            onMarkerClick(marker);
          });
        }

        // Add popup if label exists
        if (marker.label) {
          const popupContent = document.createElement('div');
          popupContent.innerHTML = `
            <div class="p-2">
              <p class="font-semibold text-sm mb-1">${marker.label}</p>
              ${enableDirections && marker.lat && marker.lng ? `
                <a 
                  href="https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}" 
                  target="_blank"
                  class="text-xs text-primary hover:underline mt-1 block"
                >
                  Get Directions →
                </a>
              ` : ''}
            </div>
          `;
          const popup = new mapboxgl.Popup({ offset: 25 })
            .setDOMContent(popupContent);
          mapboxMarker.setPopup(popup);
        }

        markersRef.current.push(mapboxMarker);
      });
    };

    // Wait for map to be ready
    if (map.current.loaded()) {
      addMarkersToMap();
    } else {
      map.current.once('load', () => {
        addMarkersToMap();
      });
    }

    // Re-add markers when map style changes (for 3D mode)
    const handleStyleLoad = () => {
      addMarkersToMap();
    };
    
    map.current.on('style.load', handleStyleLoad);
    
    return () => {
      map.current?.off('style.load', handleStyleLoad);
    };
  }, [markers, onMarkerClick, enableDirections]);

  const toggle3DMode = () => {
    if (!map.current) return;
    const new3DMode = !is3DMode;
    setIs3DMode(new3DMode);
    
    // Get current zoom level
    const currentZoom = map.current.getZoom();
    
    // Update map style - use satellite-streets for better clarity in 3D
    const newStyle = new3DMode 
      ? 'mapbox://styles/mapbox/satellite-streets-v12' // Better clarity with labels
      : 'mapbox://styles/mapbox/streets-v12';
    
    map.current.setStyle(newStyle);
    
    // Set pitch and adjust zoom after style loads (markers will be re-added automatically via style.load event)
    map.current.once('style.load', () => {
      // Adjust zoom for better clarity in 3D mode
      const targetZoom = new3DMode 
        ? Math.max(currentZoom, 16) // Minimum zoom 16 for 3D clarity
        : currentZoom;
      
      map.current?.easeTo({
        pitch: new3DMode ? 45 : 0, // Reduced pitch from 60 to 45 for better clarity
        zoom: targetZoom,
        duration: 1000,
      });
    });
  };

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className={`w-full rounded-lg overflow-hidden ${className}`}
      />
      <Button
        onClick={toggle3DMode}
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur-sm"
      >
        <Layers className="h-4 w-4 mr-2" />
        {is3DMode ? '2D View' : '3D View'}
      </Button>
    </div>
  );
};

