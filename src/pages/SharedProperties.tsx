import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { Users, Search, Filter, Heart, Loader2, Calendar, UserCheck, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { House } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SharedProperties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('sharedPropertyFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Quick book slot mutation
  const bookSlotMutation = useMutation({
    mutationFn: (houseId: string) => api.houses.bookSlot(houseId),
    onSuccess: () => {
      toast({
        title: 'Slot Booked!',
        description: 'You have successfully booked a slot in this shared property.',
      });
      queryClient.invalidateQueries({ queryKey: ['shared-properties'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.message || 'Failed to book slot',
        variant: 'destructive',
      });
    },
  });

  const hasUserBookedSlot = (property: any) => {
    if (!user || !property.bookedByUsers) return false;
    const userId = (user as any).id || (user as any)._id;
    return property.bookedByUsers.some((id: string) => id === userId);
  };

  const handleQuickBook = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please login to book a slot',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    if (user?.role !== 'user') {
      toast({
        title: 'Not Allowed',
        description: 'Only users can book slots',
        variant: 'destructive',
      });
      return;
    }
    bookSlotMutation.mutate(propertyId);
  };

  const renderPropertyCard = (property: House & { totalSlots?: number; availableSlots?: number; bookedByUsers?: string[] }, showFavoriteHeart: boolean = true) => {
    const isBooked = hasUserBookedSlot(property);
    const slotsAvailable = (property.availableSlots || 0) > 0;
    
    return (
      <div key={property.id} className="relative group">
        {showFavoriteHeart && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(property.id);
            }}
          >
            <Heart className={`h-5 w-5 ${favorites.includes(property.id) ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
          </Button>
        )}
        <HouseCard house={property} />
        
        {/* Enhanced slot info and actions */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`${
                !slotsAvailable 
                  ? 'bg-destructive/10 text-destructive' 
                  : isBooked 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-primary/10 text-primary'
              }`}
            >
              <Users className="h-3 w-3 mr-1" />
              {!slotsAvailable 
                ? 'Fully Booked' 
                : isBooked
                  ? 'You have a slot'
                  : `${property.availableSlots}/${property.totalSlots} slots`}
            </Badge>
            
            {isBooked && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                <UserCheck className="h-3 w-3 mr-1" />
                Booked
              </Badge>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => navigate(`/property/${property.id}`)}
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>
            
            {!isBooked && slotsAvailable && user?.role === 'user' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={(e) => handleQuickBook(property.id, e)}
                disabled={bookSlotMutation.isPending}
              >
                {bookSlotMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Book Slot
                  </>
                )}
              </Button>
            )}
            
            {isBooked && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => navigate(`/property/${property.id}`)}
              >
                <Users className="h-4 w-4 mr-1" />
                View Co-Tenants
              </Button>
            )}
          </div>
        </div>
      </div>
    );
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
        {favorites.length > 0 && filteredProperties.some((p: House) => favorites.includes(p.id)) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500 fill-red-500" />
              Your Favorites ({filteredProperties.filter((p: House) => favorites.includes(p.id)).length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties
                .filter((p: House) => favorites.includes(p.id))
                .map((property: House & { totalSlots?: number; availableSlots?: number; bookedByUsers?: string[] }) => 
                  renderPropertyCard(property, true)
                )}
            </div>
          </div>
        )}

        {/* All Shared Properties */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            All Shared Properties ({filteredProperties.filter((p: House) => !favorites.includes(p.id)).length})
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
                .map((property: House & { totalSlots?: number; availableSlots?: number; bookedByUsers?: string[] }) => 
                  renderPropertyCard(property, true)
                )}
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
