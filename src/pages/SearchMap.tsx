import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map } from '@/components/Map';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Navigation } from 'lucide-react';
import { api } from '@/lib/api';
import { House } from '@/types';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const SearchMap = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  const housesQuery = useQuery({
    queryKey: ['houses', 'map'],
    queryFn: () => api.houses.list({ limit: 100 }),
  });

  const houses = housesQuery.data?.data ?? [];

  // Handle URL parameters for specific house
  useEffect(() => {
    const houseId = searchParams.get('houseId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (houseId && houses.length > 0) {
      const house = houses.find(h => h.id === houseId);
      if (house) {
        setSelectedHouse(house);
      }
    }
  }, [searchParams, houses]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Default to Abuja, Nigeria if no houses with coordinates
  const defaultLat = 9.0765;
  const defaultLng = 7.3986;

  // Get coordinates from URL params if available, otherwise calculate center
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  
  const centerLat = urlLat ? parseFloat(urlLat) : (houses.length > 0 && houses.some(h => h.coordinates?.lat)
    ? houses.filter(h => h.coordinates?.lat).reduce((sum, h) => sum + (h.coordinates?.lat ?? 0), 0) / houses.filter(h => h.coordinates?.lat).length
    : defaultLat);

  const centerLng = urlLng ? parseFloat(urlLng) : (houses.length > 0 && houses.some(h => h.coordinates?.lng)
    ? houses.filter(h => h.coordinates?.lng).reduce((sum, h) => sum + (h.coordinates?.lng ?? 0), 0) / houses.filter(h => h.coordinates?.lng).length
    : defaultLng);

  const markers = houses
    .filter(house => house.coordinates?.lat && house.coordinates?.lng)
    .map(house => ({
      lat: house.coordinates!.lat,
      lng: house.coordinates!.lng,
      label: `${house.title} - ${formatPrice(house.price)}`,
      id: house.id,
      house: house,
    }));

  const handleMarkerClick = (marker: any) => {
    if (marker.house) {
      setSelectedHouse(marker.house);
    }
  };

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/search-map');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <h2 className="text-2xl font-bold">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please sign in or create an account to access the property map and view exact locations.
              </p>
              <Button onClick={() => navigate('/auth')} className="w-full">
                Sign In / Register
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Property Map</h1>
          <p className="text-muted-foreground">
            Explore properties on the map. Click on markers to view details.
          </p>
        </div>

        {housesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : housesQuery.isError ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              Failed to load properties. Please try again.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Map
                latitude={centerLat}
                longitude={centerLng}
                zoom={urlLat && urlLng ? 15 : (selectedHouse?.coordinates?.lat ? 14 : 11)}
                markers={markers}
                onMarkerClick={handleMarkerClick}
                className="h-[400px] md:h-[600px] lg:h-[700px]"
                enableDirections={true}
                directionsDestination={selectedHouse?.coordinates ? {
                  lat: selectedHouse.coordinates.lat,
                  lng: selectedHouse.coordinates.lng,
                } : undefined}
              />
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Properties on Map</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {markers.length} propert{markers.length === 1 ? 'y' : 'ies'} with location data
                  </p>
                </CardContent>
              </Card>

              {selectedHouse && (
                <Card className="border-primary">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{selectedHouse.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{selectedHouse.location}</p>
                    <p className="text-xl font-bold text-primary mb-4">
                      {formatPrice(selectedHouse.price)}
                    </p>
                    {selectedHouse.bedrooms && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {selectedHouse.bedrooms} bed{selectedHouse.bedrooms > 1 ? 's' : ''}
                        {selectedHouse.bathrooms && ` • ${selectedHouse.bathrooms} bath${selectedHouse.bathrooms > 1 ? 's' : ''}`}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 mt-4">
                      {selectedHouse.coordinates?.lat && selectedHouse.coordinates?.lng && (
                        <Button
                          onClick={() => {
                            setShowDirections(!showDirections);
                            // Open Google Maps with directions
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedHouse.coordinates!.lat},${selectedHouse.coordinates!.lng}`;
                            window.open(url, '_blank');
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Get Directions
                        </Button>
                      )}
                      <Button asChild className="w-full">
                        <Link to={`/house/${selectedHouse.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {houses.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">All Properties</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {houses.map((house) => (
                        <div
                          key={house.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedHouse?.id === house.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedHouse(house)}
                        >
                          <p className="font-medium text-sm">{house.title}</p>
                          <p className="text-xs text-muted-foreground">{house.location}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatPrice(house.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SearchMap;

