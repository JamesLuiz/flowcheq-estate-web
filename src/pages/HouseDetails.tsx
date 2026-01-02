import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
  Heart,
  Loader2,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HouseMapView } from '@/components/HouseMapView';
import { VirtualTour } from '@/components/VirtualTour';
import { ViewingScheduler } from '@/components/ViewingScheduler';
import { useFavorites } from '@/hooks/useFavorites';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(price);

const HouseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated, user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const queryClient = useQueryClient();
  
  // Only users (not agents/landlords) can favorite properties
  const canFavorite = isAuthenticated && user?.role === 'user';
  

  const houseQuery = useQuery({
    queryKey: ['house', id],
    queryFn: () => api.houses.get(id as string),
    enabled: Boolean(id),
    retry: (failureCount, error) =>
      !(
        error instanceof Error &&
        (error.message.includes('not found') || error.message.includes('Cast to ObjectId failed'))
      ) && failureCount < 2,
  });

  const house = houseQuery.data;
  const agent = house?.agent;
  const isHouseFavorite = house ? isFavorite(house.id) : false;
  
  // Check if user has booked a slot
  const hasBookedSlot = house?.bookedByUsers?.includes(user?.id || '') || false;
  
  // Co-tenants query
  const coTenantsQuery = useQuery({
    queryKey: ['co-tenants', id],
    queryFn: () => api.houses.getCoTenants(id as string),
    enabled: Boolean(id) && isAuthenticated && Boolean(house?.isShared) && hasBookedSlot,
  });
  
  // Slot booking mutations
  const bookSlotMutation = useMutation({
    mutationFn: () => api.houses.bookSlot(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house', id] });
      toast({
        title: 'Slot booked!',
        description: 'You have successfully booked a slot in this shared property.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to book slot',
        description: error.message,
      });
    },
  });
  
  const cancelSlotMutation = useMutation({
    mutationFn: () => api.houses.cancelSlot(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house', id] });
      queryClient.invalidateQueries({ queryKey: ['co-tenants', id] });
      toast({
        title: 'Slot cancelled',
        description: 'Your slot has been cancelled successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to cancel slot',
        description: error.message,
      });
    },
  });

  const shareViaWhatsApp = () => {
    if (!house) return;
    const text = encodeURIComponent(
      `Check out this property: ${house.title} - ${formatPrice(house.price)}\n${window.location.href}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    if (!house) return;

    const shareData = {
      title: house.title,
      text: `Check out this property: ${house.title} - ${formatPrice(house.price)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({ title: 'Shared successfully!' });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          shareViaWhatsApp();
        }
      }
    } else {
      shareViaWhatsApp();
    }
  };

  const handleFavoriteClick = () => {
    if (!house) return;
    toggleFavorite(house.id);
    toast({
      title: isHouseFavorite ? 'Removed from favorites' : 'Added to favorites',
    });
  };

  const handleWhatsAppClick = () => {
    if (!house || !agent?.phone) return;
    
    const phone = agent.phone.replace(/\s/g, '');
    const propertyUrl = window.location.href;
    const imageLinks = house.images?.slice(0, 5).map(img => img).join('\n') || '';
    
    // Build comprehensive message with property details
    let message = `🏠 *Property Inquiry*\n\n`;
    message += `*${house.title}*\n\n`;
    message += `📍 Location: ${house.location}\n`;
    message += `💰 Price: ${formatPrice(house.price)}\n`;
    if (house.bedrooms) message += `🛏️ Bedrooms: ${house.bedrooms}\n`;
    if (house.bathrooms) message += `🚿 Bathrooms: ${house.bathrooms}\n`;
    if (house.area) message += `📐 Area: ${house.area}m²\n`;
    message += `\n${house.description}\n\n`;
    if (imageLinks) {
      message += `📸 Property Images:\n${imageLinks}\n\n`;
    }
    message += `🔗 View Full Details: ${propertyUrl}\n\n`;
    if (house.coordinates?.lat && house.coordinates?.lng) {
      message += `🗺️ Location: https://www.google.com/maps?q=${house.coordinates.lat},${house.coordinates.lng}\n\n`;
    }
    message += `Hi, I'm interested in this property. Please provide more information.`;
    
    const encodedMessage = encodeURIComponent(message);
    
    // Track WhatsApp click
    if (house.id) {
      api.houses.trackWhatsAppClick(house.id).catch(console.error);
    }
    
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const handleLocationClick = () => {
    if (house?.coordinates?.lat && house.coordinates?.lng) {
      navigate(`/search-map?houseId=${house.id}&lat=${house.coordinates.lat}&lng=${house.coordinates.lng}`);
    } else {
      navigate(`/search-map?houseId=${house?.id}`);
    }
  };

  if (houseQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (houseQuery.isError || !house) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold">Property not found</h1>
          <p className="text-muted-foreground">
            The property you are looking for does not exist or has been removed.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const images = house.images && house.images.length > 0 ? house.images : ['/placeholder.svg'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to listings
            </Button>
          </Link>
          <div className="flex gap-2">
            {canFavorite && (
              <Button 
                onClick={handleFavoriteClick} 
                variant="outline" 
                size="icon"
                className="transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <Heart
                  className={`h-5 w-5 transition-all duration-300 ${
                    isHouseFavorite ? 'fill-primary text-primary scale-110' : 'text-foreground'
                  }`}
                />
              </Button>
            )}
            <Button onClick={handleShare} variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-elegant">
                <img
                  src={images[selectedImage]}
                  alt={house.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-background/90 text-foreground capitalize">
                  {house.type}
                </Badge>
                {house.featured && (
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                )}
                {house.isShared && (
                  <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                    🤝 Shared Property
                  </Badge>
                )}
                {house.isShared && (house.availableSlots || 0) === 0 && (
                  <Badge className="absolute top-16 right-4 bg-destructive text-destructive-foreground">
                    Fully Booked
                  </Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImage(index)}
                      className={`relative aspect-video rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${house.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">{house.title}</h1>
                  <button
                    onClick={handleLocationClick}
                    className="flex items-center text-muted-foreground mb-4 hover:text-primary transition-colors cursor-pointer group"
                  >
                    <MapPin className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-lg">{house.location}</span>
                    {house.coordinates?.lat && house.coordinates?.lng && (
                      <span className="ml-2 text-xs text-primary">(View on Map)</span>
                    )}
                  </button>
                  <p className="text-3xl font-bold text-primary">{formatPrice(house.price)}</p>
                </div>

                <div className="flex flex-wrap gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {house.bedrooms ?? '-'} {house.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {house.bathrooms ?? '-'} {house.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">
                      {house.area ? `${house.area}m²` : 'Area not specified'}
                    </span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <div 
                    className="text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: house.description }}
                  />
                </div>

                {/* Virtual Tour */}
                {images.length > 1 && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Virtual Tour</h2>
                    <VirtualTour images={images} propertyTitle={house.title} />
                  </div>
                )}
              </CardContent>
            </Card>

            {isAuthenticated && (house.coordinates?.lat && house.coordinates?.lng) && (
              <Card className="mt-6">
                <CardContent className="p-0">
                  <div className="p-6 pb-0">
                    <h2 className="text-xl font-semibold mb-4">Location</h2>
                  </div>
                  <HouseMapView house={house} />
                </CardContent>
              </Card>
            )}
            {!isAuthenticated && house.coordinates?.lat && house.coordinates?.lng && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <h2 className="text-xl font-semibold mb-2">Location Map</h2>
                    <p className="text-sm text-foreground mb-4">
                      Sign in or create an account to view the exact location and get directions to this property.
                    </p>
                    <Link to="/auth">
                      <Button className="w-full">
                        Sign In / Register to View Map
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Contact Agent</h3>
                  <img
                    src={
                      agent?.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${agent?.name ?? 'Agent'}`
                    }
                    alt={agent?.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                  <h4 className="font-semibold text-lg">{agent?.name ?? 'Agent details'}</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {agent?.role === 'agent' ? 'Registered Agent' : agent?.role === 'landlord' ? 'Landlord' : 'Property Owner'}
                  </p>
                </div>

                {!isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm text-foreground mb-3">
                        Sign in or create an account to contact the agent/landlord and view their contact information.
                      </p>
                      <Link to="/auth" className="block">
                        <Button className="w-full" size="lg">
                          Sign In / Register
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Button
                        onClick={handleWhatsAppClick}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                        size="lg"
                        disabled={!agent?.phone}
                      >
                        <svg viewBox="0 0 24 24" className="mr-2 h-5 w-5 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        {agent?.role === 'landlord' ? 'WhatsApp Landlord' : 'WhatsApp Agent'}
                      </Button>
                      {agent?.phone && (
                        <Button className="w-full" size="lg" asChild>
                          <a href={`tel:${agent.phone}`}>
                            <Phone className="mr-2 h-4 w-4" />
                            {agent?.role === 'landlord' ? 'Call Landlord' : 'Call Agent'}
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" className="w-full" size="lg" asChild>
                        <a href={`mailto:${agent?.email ?? ''}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          {agent?.role === 'landlord' ? 'Email Landlord' : 'Email Agent'}
                        </a>
                      </Button>
                      {agent?.id && (
                        <Link to={`/agent/${agent.id}`} className="block">
                          <Button variant="secondary" className="w-full" size="lg">
                            View Profile
                          </Button>
                        </Link>
                      )}

                      {/* Shared Property Slot Booking */}
                      {house.isShared && isAuthenticated && user?.role === 'user' && (
                        <div className="space-y-3 pt-4 border-t border-border">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Available Slots</h4>
                              <p className="text-xs text-muted-foreground">
                                {house.availableSlots || 0} of {house.totalSlots || 0} slots available
                              </p>
                            </div>
                            {hasBookedSlot && (
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400">
                                <UserCheck className="h-3 w-3 mr-1" />
                                Slot Booked
                              </Badge>
                            )}
                          </div>
                          
                          {!hasBookedSlot && (house.availableSlots || 0) > 0 && (
                            <Button
                              onClick={() => bookSlotMutation.mutate()}
                              disabled={bookSlotMutation.isPending}
                              className="w-full"
                              size="lg"
                            >
                              {bookSlotMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Booking...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Book a Slot
                                </>
                              )}
                            </Button>
                          )}
                          
                          {hasBookedSlot && (
                            <Button
                              onClick={() => {
                                if (confirm('Are you sure you want to cancel your slot booking?')) {
                                  cancelSlotMutation.mutate();
                                }
                              }}
                              disabled={cancelSlotMutation.isPending}
                              variant="destructive"
                              className="w-full"
                              size="lg"
                            >
                              {cancelSlotMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Cancel My Slot
                                </>
                              )}
                            </Button>
                          )}
                          
                          {hasBookedSlot && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full" size="lg">
                                  <Users className="mr-2 h-4 w-4" />
                                  View Co-Tenants
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Co-Tenants</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  {coTenantsQuery.isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                  ) : coTenantsQuery.data?.coTenants && coTenantsQuery.data.coTenants.length > 0 ? (
                                    <div className="space-y-3">
                                      {coTenantsQuery.data.coTenants.map((coTenant) => (
                                        <Card key={coTenant.id}>
                                          <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                              <img
                                                src={
                                                  coTenant.avatarUrl ||
                                                  `https://api.dicebear.com/7.x/initials/svg?seed=${coTenant.name}`
                                                }
                                                alt={coTenant.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                              />
                                              <div className="flex-1">
                                                <h4 className="font-semibold">{coTenant.name}</h4>
                                                <p className="text-sm text-muted-foreground">{coTenant.email}</p>
                                                {coTenant.phone && (
                                                  <p className="text-sm text-muted-foreground">{coTenant.phone}</p>
                                                )}
                                              </div>
                                              <div className="flex gap-2">
                                                {coTenant.phone && (
                                                  <Button
                                                    size="icon"
                                                    variant="outline"
                                                    asChild
                                                    className="h-9 w-9"
                                                  >
                                                    <a href={`tel:${coTenant.phone}`}>
                                                      <Phone className="h-4 w-4" />
                                                    </a>
                                                  </Button>
                                                )}
                                                <Button
                                                  size="icon"
                                                  variant="outline"
                                                  asChild
                                                  className="h-9 w-9"
                                                >
                                                  <a href={`mailto:${coTenant.email}`}>
                                                    <Mail className="h-4 w-4" />
                                                  </a>
                                                </Button>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-center text-muted-foreground py-8">
                                      No co-tenants yet. Be the first to book a slot!
                                    </p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      )}
                      
                      {/* Viewing Scheduler */}
                      {agent?.id && (
                        <ViewingScheduler 
                          houseId={house.id} 
                          agentId={agent.id} 
                          propertyTitle={house.title} 
                        />
                      )}
                    </div>

                    <div className="pt-4 border-t border-border space-y-2 text-sm">
                      {agent?.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{agent.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{agent?.email}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseDetails;
