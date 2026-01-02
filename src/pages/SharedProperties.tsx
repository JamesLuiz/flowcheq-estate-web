import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HouseCard } from '@/components/HouseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Filter, Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { House } from '@/types';

const SharedProperties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sharedPropertyFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  const { data, isLoading } = useQuery({
    queryKey: ['shared-properties'],
    queryFn: () => api.houses.list({ shared: true }),
  });

  const sharedProperties = data?.data || [];

  const filteredProperties = sharedProperties.filter((property: House & { isShared?: boolean; totalSlots?: number; availableSlots?: number }) => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || property.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    let matchesPrice = true;
    if (priceFilter === 'under500k') matchesPrice = property.price < 500000;
    else if (priceFilter === '500k-1m') matchesPrice = property.price >= 500000 && property.price <= 1000000;
    else if (priceFilter === '1m-2m') matchesPrice = property.price >= 1000000 && property.price <= 2000000;
    else if (priceFilter === 'above2m') matchesPrice = property.price > 2000000;

    return matchesSearch && matchesLocation && matchesPrice;
  });

  const toggleFavorite = (propertyId: string) => {
    const newFavorites = favorites.includes(propertyId)
      ? favorites.filter(id => id !== propertyId)
      : [...favorites, propertyId];
    setFavorites(newFavorites);
    localStorage.setItem('sharedPropertyFavorites', JSON.stringify(newFavorites));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Users className="h-5 w-5" />
            <span className="font-medium">2-to-Tango</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Shared Properties
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find properties with available slots for co-tenants. Share living spaces and split costs with compatible roommates.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under500k">Under ₦500k</SelectItem>
                    <SelectItem value="500k-1m">₦500k - ₦1M</SelectItem>
                    <SelectItem value="1m-2m">₦1M - ₦2M</SelectItem>
                    <SelectItem value="above2m">Above ₦2M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              Your Favorites ({favorites.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties
                .filter((p: House) => favorites.includes(p.id))
                .map((property: House & { totalSlots?: number; availableSlots?: number }) => (
                  <div key={property.id} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    </Button>
                    <HouseCard house={property} />
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Users className="h-3 w-3 mr-1" />
                        {property.availableSlots || 0}/{property.totalSlots || 0} slots available
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* All Shared Properties */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            All Shared Properties ({filteredProperties.length})
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProperties.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Shared Properties Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || locationFilter || priceFilter !== 'all'
                    ? 'Try adjusting your search filters'
                    : 'Check back later for new shared property listings'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties
                .filter((p: House) => !favorites.includes(p.id))
                .map((property: House & { totalSlots?: number; availableSlots?: number }) => (
                  <div key={property.id} className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(property.id)}
                    >
                      <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                    </Button>
                    <HouseCard house={property} />
                    <div className="mt-2 flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`${
                          (property.availableSlots || 0) === 0 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {(property.availableSlots || 0) === 0 
                          ? 'Fully Booked' 
                          : `${property.availableSlots}/${property.totalSlots} slots available`}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-foreground mb-4">How 2-to-Tango Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold mb-2">Find a Property</h4>
                <p className="text-sm text-muted-foreground">Browse shared properties with available slots that match your needs.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold mb-2">Book Your Slot</h4>
                <p className="text-sm text-muted-foreground">Schedule a viewing and book your slot in the shared property.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold mb-2">Connect with Co-Tenants</h4>
                <p className="text-sm text-muted-foreground">View other tenants' profiles and connect externally.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default SharedProperties;
