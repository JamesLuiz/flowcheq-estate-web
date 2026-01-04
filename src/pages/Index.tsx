import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HouseCard } from '@/components/HouseCard';
import { FeaturedAgents } from '@/components/FeaturedAgents';
import { SearchFilters } from '@/components/SearchFilters';
import { FeaturedBanner } from '@/components/FeaturedBanner';
import { FilterParams, House } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowRight, BellRing, Loader2, RotateCcw } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import heroImage from '@/assets/hero-abuja.jpg';
import { placeholderProperties } from '@/data/placeholderProperties';

const Index = () => {
  const [filters, setFilters] = useState<FilterParams>({});
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { addToHistory } = useSearchHistory();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // User denied or error getting location
        },
      );
    }
  }, []);

  const queryFilters = useMemo(() => {
    const { type, radius, ...rest } = filters;
    const cleanFilters: any = {
      ...rest,
      type: type && type !== 'all' ? type : undefined,
    };
    
    // Only add location sorting if user location is available AND user hasn't explicitly filtered
    // This helps show closest properties first without filtering them out
    if (userLocation && !filters.location) {
      cleanFilters.lat = userLocation.lat;
      cleanFilters.lng = userLocation.lng;
      // Use a very large radius to ensure all properties are shown, just sorted by distance
      cleanFilters.radius = 10000; // 10000km to show all properties globally
    }
    
    // Remove undefined values
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === undefined || cleanFilters[key] === null || cleanFilters[key] === '') {
        delete cleanFilters[key];
      }
    });
    
    return cleanFilters;
  }, [filters, userLocation]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.search ||
          (filters.type && filters.type !== 'all') ||
          filters.minPrice ||
          filters.maxPrice ||
          filters.location ||
          filters.listingType,
      ),
    [filters],
  );

  const housesQuery = useQuery({
    queryKey: ['houses', queryFilters],
    queryFn: () => api.houses.list(queryFilters),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const apiHouses = housesQuery.data?.data ?? [];
  // Use placeholder properties if no real properties are available
  const houses = apiHouses.length > 0 ? apiHouses : (placeholderProperties as House[]);
  const featuredHouses = houses.filter((house) => house.featured);
  const showingPlaceholders = apiHouses.length === 0;

  useEffect(() => {
    if (!hasActiveFilters) return;

    const searchFilters = {
      priceRange:
        filters.minPrice || filters.maxPrice
          ? `₦${filters.minPrice || 0} - ₦${filters.maxPrice || '∞'}`
          : undefined,
      type: filters.type && filters.type !== 'all' ? filters.type : undefined,
      location: filters.location || undefined,
    };

    addToHistory(filters.search || '', searchFilters);
  }, [filters, hasActiveFilters, addToHistory]);

  const alertMutation = useMutation({
    mutationFn: () =>
      api.alerts.create({
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        location: filters.location,
        type: filters.type && filters.type !== 'all' ? filters.type : undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
        radius: filters.radius || 20,
      }),
    onSuccess: () => {
      toast({
        title: 'Alert saved',
        description: 'We will notify you when matching properties are listed.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to save alert',
        description: error.message,
      });
    },
  });

  const handleSaveAlert = () => {
    if (!hasActiveFilters) {
      toast({
        variant: 'destructive',
        title: 'Add some filters first',
        description: 'Choose at least one filter before saving an alert.',
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        variant: 'destructive',
        title: 'Login required',
        description: 'Create an account or login to save property alerts.',
      });
      navigate('/auth');
      return;
    }

    alertMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative h-[600px] md:h-[700px] overflow-hidden">
        {/* Hero Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Modern Abuja residential properties"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              Find Your Dream Home in Abuja
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Welcome to the largest network of agents and landlords in Abuja. <br /> Discover the perfect home for you.
            </p>
            {!isAuthenticated && (
              <Link to="/auth">
                <Button size="lg" className="mt-4 shadow-elegant">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <FeaturedBanner />
        </div>
      </section>

      {featuredHouses.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Featured Properties</h2>
              <p className="text-muted-foreground">Handpicked homes just for you</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredHouses.map((house) => (
                <HouseCard key={house.id} house={house} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FeaturedAgents />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-3xl md:text-4xl font-bold">Browse All Properties</h2>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveAlert}
                  disabled={alertMutation.isPending}
                  className="w-full md:w-auto"
                >
                  {alertMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving alert...
                    </>
                  ) : (
                    <>
                      <BellRing className="mr-2 h-4 w-4" />
                      Save this search
                    </>
                  )}
                </Button>
              )}
            </div>
            <SearchFilters onFilterChange={setFilters} />
          </div>

          {housesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : housesQuery.isError ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-xl text-muted-foreground">
                We couldn&apos;t load properties right now. Please try again.
              </p>
              <p className="text-sm text-muted-foreground">
                {housesQuery.error instanceof Error ? housesQuery.error.message : 'Unknown error'}
              </p>
              <Button onClick={() => housesQuery.refetch()} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : houses.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-xl text-muted-foreground">
                {hasActiveFilters 
                  ? 'No properties found matching your criteria' 
                  : 'No properties available at the moment'}
              </p>
              {hasActiveFilters && (
                <Button onClick={() => setFilters({})} variant="outline">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {showingPlaceholders && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    <strong>Sample Properties:</strong> These are example listings to showcase what's available on House me. 
                    Real properties will appear once agents add listings.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {houses.map((house) => (
                  <HouseCard key={house.id} house={house} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
