import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Bed, Bath, Maximize, Loader2, Filter, Navigation } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { House } from '@/types';
import { Link } from 'react-router-dom';

const FALLBACK_CENTER = { lat: 9.0765, lng: 7.3986 }; // Abuja

const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  'Maitama, Abuja': { lat: 9.082, lng: 7.4948 },
  'Asokoro, Abuja': { lat: 9.0376, lng: 7.534 },
  'Wuse 2, Abuja': { lat: 9.0643, lng: 7.482 },
  'Gwarimpa, Abuja': { lat: 9.1108, lng: 7.4165 },
  'Garki, Abuja': { lat: 9.0352, lng: 7.4878 },
  'Jabi, Abuja': { lat: 9.0721, lng: 7.4447 },
  'Kubwa, Abuja': { lat: 9.1346, lng: 7.3375 },
  'Lugbe, Abuja': { lat: 8.95, lng: 7.375 },
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

const MapView = () => {
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey ?? '',
  });

  const housesQuery = useQuery({
    queryKey: ['map-houses'],
    queryFn: () => api.houses.list(),
  });

  const houses = housesQuery.data?.data ?? [];
  const locations = useMemo(() => {
    const unique = new Set<string>();
    houses.forEach((house) => {
      if (house.location) {
        unique.add(house.location);
      }
    });
    return Array.from(unique);
  }, [houses]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // ignore errors silently for now
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const filteredHouses = useMemo(() => {
    if (locationFilter === 'all') return houses;
    return houses.filter((house) => house.location === locationFilter);
  }, [houses, locationFilter]);

  const selectedHouse = filteredHouses.find((house) => house.id === selectedHouseId);

  const computeCoordinates = (house: House): google.maps.LatLngLiteral => {
    if (house.coordinates) {
      return house.coordinates;
    }
    if (house.location && locationCoordinates[house.location]) {
      return locationCoordinates[house.location];
    }
    return FALLBACK_CENTER;
  };

  const mapCenter = selectedHouse
    ? computeCoordinates(selectedHouse)
    : userPosition ?? FALLBACK_CENTER;

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 relative">
        {!googleMapsApiKey ? (
          <div className="flex items-center justify-center h-full text-center px-4">
            <Card className="max-w-lg">
              <CardContent className="p-8 space-y-4">
                <h2 className="text-xl font-semibold">Google Maps API key missing</h2>
                <p className="text-muted-foreground">
                  Set <code className="bg-muted px-2 py-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
                  in your environment variables to enable the interactive map.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : !isLoaded || housesQuery.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={12}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              {filteredHouses.map((house) => {
                const coords = computeCoordinates(house);
                return (
                  <Marker
                    key={house.id}
                    position={coords}
                    onClick={() => setSelectedHouseId(house.id)}
                    icon={{
                      url:
                        selectedHouseId === house.id
                          ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                          : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                );
              })}

              {userPosition && (
                <Marker
                  position={userPosition}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#2563eb',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                  }}
                />
              )}
            </GoogleMap>

            <div className="absolute top-4 right-4 left-4 md:left-auto w-auto md:w-72 z-20 space-y-3">
              <Card className="shadow-xl">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    Filter by Location
                  </div>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredHouses.length} of {houses.length} properties
                  </p>
                </CardContent>
              </Card>

              {userPosition && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={() => setSelectedHouseId(null)}
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Follow my location
                </Button>
              )}
            </div>

            {selectedHouse && (
              <div className="absolute inset-x-4 bottom-4 md:right-4 md:left-auto md:w-96 z-20">
                <Card className="shadow-xl">
                  <div className="relative">
                    <img
                      src={selectedHouse.images?.[0] ?? '/placeholder.svg'}
                      alt={selectedHouse.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    {selectedHouse.featured && (
                      <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{selectedHouse.title}</h3>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{selectedHouse.location}</span>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(selectedHouse.price)}
                      </p>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedHouse.bedrooms ?? '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedHouse.bathrooms ?? '-'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Maximize className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedHouse.area ? `${selectedHouse.area}m²` : '-'}</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {selectedHouse.description}
                    </p>

                    <Link to={`/house/${selectedHouse.id}`}>
                      <Button className="w-full">View Full Details</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MapView;
