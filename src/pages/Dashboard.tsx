import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Home as HomeIcon, TrendingUp, Eye, Loader2, Edit, Trash2, User } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HouseCard } from '@/components/HouseCard';
import { VerificationPanel } from '@/components/VerificationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { House } from '@/types';
import { geocodeAddress } from '@/lib/geocoding';

// Nigerian states list
const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT', // Federal Capital Territory (Abuja)
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

const initialFormState = {
  title: '',
  description: '',
  price: '',
  location: '',
  streetAddress: '',
  city: '',
  state: 'FCT', // Default to FCT (Abuja)
  postalCode: '',
  type: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  images: [] as File[],
  featured: false,
  coordinates: undefined as { lat: number; lng: number } | undefined,
};

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [editStateOpen, setEditStateOpen] = useState(false);

  const isAgent = user?.role === 'agent' || user?.role === 'landlord';

  const housesQuery = useQuery({
    queryKey: ['agent-houses', user?.id],
    queryFn: () => api.houses.list({ agentId: user?.id }),
    enabled: isAgent && Boolean(user?.id),
  });

  const houses = housesQuery.data?.data ?? [];

  const createListingMutation = useMutation({
    mutationFn: ({ coordinates, location }: { coordinates?: { lat: number; lng: number }; location: string }) =>
      api.houses.create({
        title: formState.title,
        description: formState.description,
        price: Number(formState.price),
        location,
        type: formState.type,
        bedrooms: Number(formState.bedrooms),
        bathrooms: Number(formState.bathrooms),
        area: Number(formState.area),
        images: formState.images,
        featured: formState.featured,
        coordinates,
      }),
    onSuccess: () => {
      toast({
        title: 'Listing created',
        description: 'Your property has been published successfully.',
      });
      setIsDialogOpen(false);
      setFormState(initialFormState);
      housesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to create listing',
        description: error.message,
      });
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ houseId, coordinates, location }: { houseId: string; coordinates?: { lat: number; lng: number }; location: string }) =>
      api.houses.update(houseId, {
        title: formState.title,
        description: formState.description,
        price: Number(formState.price),
        location,
        type: formState.type,
        bedrooms: Number(formState.bedrooms),
        bathrooms: Number(formState.bathrooms),
        area: Number(formState.area),
        featured: formState.featured,
        coordinates,
      }),
    onSuccess: () => {
      toast({
        title: 'Listing updated',
        description: 'Your property has been updated successfully.',
      });
      setIsEditDialogOpen(false);
      setEditingHouse(null);
      setFormState(initialFormState);
      housesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to update listing',
        description: error.message,
      });
    },
  });

  const deleteListingMutation = useMutation({
    mutationFn: (houseId: string) => api.houses.delete(houseId),
    onSuccess: () => {
      toast({
        title: 'Listing deleted',
        description: 'Your property has been deleted successfully.',
      });
      housesQuery.refetch();
      statsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to delete listing',
        description: error.message,
      });
    },
  });

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    // Parse location string to extract address parts if possible
    const locationParts = house.location?.split(',') || [];
    // Try to extract state from location (last part is usually state)
    let extractedState = 'FCT'; // Default to FCT
    if (locationParts.length > 0) {
      const lastPart = locationParts[locationParts.length - 1]?.trim() || '';
      // Check if last part matches any state
      const matchedState = NIGERIAN_STATES.find(
        state => lastPart.toLowerCase().includes(state.toLowerCase()) || 
                 state.toLowerCase().includes(lastPart.toLowerCase())
      );
      if (matchedState) {
        extractedState = matchedState;
      }
    }
    setFormState({
      title: house.title,
      description: house.description,
      price: String(house.price),
      location: house.location,
      streetAddress: locationParts[0]?.trim() || '',
      city: locationParts[1]?.trim() || '',
      state: extractedState,
      postalCode: '',
      type: house.type,
      bedrooms: String(house.bedrooms || ''),
      bathrooms: String(house.bathrooms || ''),
      area: String(house.area || ''),
      images: [],
      featured: house.featured || false,
      coordinates: house.coordinates,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (houseId: string) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteListingMutation.mutate(houseId);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingHouse) return;

    // Build location string from address parts
    const locationParts: string[] = [];
    if (formState.streetAddress) locationParts.push(formState.streetAddress);
    if (formState.city) locationParts.push(formState.city);
    if (formState.state) locationParts.push(formState.state);
    const fullLocation = locationParts.length > 0 ? locationParts.join(', ') : formState.location;

    // Geocode address to get coordinates
    let coordinates = formState.coordinates;
    if ((formState.streetAddress || formState.city || formState.state) || formState.location) {
      setIsGeocoding(true);
      try {
        const geocodeResult = await geocodeAddress(fullLocation, {
          street: formState.streetAddress,
          city: formState.city,
          state: formState.state,
          postalCode: formState.postalCode,
        });
        if (geocodeResult) {
          coordinates = { lat: geocodeResult.lat, lng: geocodeResult.lng };
        } else {
          // Geocoding failed, but continue without coordinates
          toast({
            variant: 'default',
            title: 'Location geocoding failed',
            description: 'Property will be saved without exact coordinates. You can still search by location name.',
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue without coordinates
      } finally {
        setIsGeocoding(false);
      }
    }

    // Update with coordinates and full location
    updateListingMutation.mutate(
      { houseId: editingHouse.id, coordinates, location: fullLocation },
      {
        onSuccess: () => {
          // Update form state with coordinates and location for next time
          setFormState((prev) => ({ ...prev, coordinates, location: fullLocation }));
        },
      }
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Build location string from address parts
    const locationParts: string[] = [];
    if (formState.streetAddress) locationParts.push(formState.streetAddress);
    if (formState.city) locationParts.push(formState.city);
    if (formState.state) locationParts.push(formState.state);
    const fullLocation = locationParts.length > 0 ? locationParts.join(', ') : formState.location;

    // Geocode address to get coordinates
    let coordinates: { lat: number; lng: number } | undefined = undefined;
    if ((formState.streetAddress || formState.city || formState.state) || formState.location) {
      setIsGeocoding(true);
      try {
        const geocodeResult = await geocodeAddress(fullLocation, {
          street: formState.streetAddress,
          city: formState.city,
          state: formState.state,
          postalCode: formState.postalCode,
        });
        if (geocodeResult) {
          coordinates = { lat: geocodeResult.lat, lng: geocodeResult.lng };
        } else {
          // Geocoding failed, but continue without coordinates
          toast({
            variant: 'default',
            title: 'Location geocoding failed',
            description: 'Property will be saved without exact coordinates. You can still search by location name.',
          });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Continue without coordinates
      } finally {
        setIsGeocoding(false);
      }
    }

    // Create with coordinates and full location
    createListingMutation.mutate({ coordinates, location: fullLocation }, {
      onSuccess: () => {
        // Reset form state
        setFormState(initialFormState);
      },
    });
  };

  const statsQuery = useQuery({
    queryKey: ['house-stats', user?.id],
    queryFn: () => api.houses.getStats(),
    enabled: isAgent && Boolean(user?.id),
  });

  const stats = useMemo(
    () => ({
      totalListings: statsQuery.data?.totalListings ?? houses.length,
      totalViews: statsQuery.data?.totalViews ?? 0,
      inquiries: statsQuery.data?.inquiries ?? 0,
    }),
    [houses, statsQuery.data],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isAgent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Agent access required</h1>
          <p className="text-muted-foreground">
            The agent dashboard is only available to registered agents.
          </p>
          <Button variant="secondary" onClick={() => navigate('/user-dashboard')}>
            Go to user dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agent Dashboard</h1>
            <p className="text-muted-foreground">{user?.name}, manage your property listings</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile/edit')}
            className="transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
              <HomeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalListings}</div>
              <p className="text-xs text-muted-foreground">Active properties</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <p className="text-xs text-muted-foreground">Projected monthly reach</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Inquiries</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inquiries}</div>
              <p className="text-xs text-muted-foreground">Estimated monthly leads</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <VerificationPanel />
        </div>

        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full sm:w-auto">
                <Plus className="mr-2 h-5 w-5" />
                Add New Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Modern 4-Bedroom Duplex"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property..."
                    rows={4}
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="45000000"
                      value={formState.price}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, price: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Property Type</Label>
                    <Select
                      value={formState.type}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, type: value }))
                      }
                      required
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="self-con">Self-Con</SelectItem>
                        <SelectItem value="bungalow">Bungalow</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="mansion">Mansion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      placeholder="e.g., 123 Main Street"
                      value={formState.streetAddress}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, streetAddress: event.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="e.g., Wuse 2, Garki"
                        value={formState.city}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, city: event.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Popover open={stateOpen} onOpenChange={setStateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={stateOpen}
                            className="w-full justify-between"
                          >
                            {formState.state || 'Select state...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {NIGERIAN_STATES.map((state) => (
                                  <CommandItem
                                    key={state}
                                    value={state}
                                    onSelect={() => {
                                      setFormState((prev) => ({ ...prev, state }));
                                      setStateOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        formState.state === state ? 'opacity-100' : 'opacity-0'
                                      }`}
                                    />
                                    {state}
                                    {state === 'FCT' && ' (Abuja)'}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                    <Input
                      id="postalCode"
                      placeholder="e.g., 900001"
                      value={formState.postalCode}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, postalCode: event.target.value }))
                      }
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Enter the property address details. Coordinates will be automatically added for accurate map navigation.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      placeholder="4"
                      value={formState.bedrooms}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, bedrooms: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      placeholder="4"
                      value={formState.bathrooms}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, bathrooms: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="350"
                      value={formState.area}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, area: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Property Images (3-5 images required)</Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      if (files.length < 3 || files.length > 5) {
                        toast({
                          variant: 'destructive',
                          title: 'Invalid number of images',
                          description: 'Please select between 3 and 5 images.',
                        });
                        return;
                      }
                      setFormState((prev) => ({ ...prev, images: files }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload 3-5 images of your property (JPG, PNG, or WebP, max 5MB each).
                  </p>
                  {formState.images.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {formState.images.length} image(s) selected
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={formState.featured}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, featured: event.target.checked }))
                    }
                  />
                  <Label htmlFor="featured" className="text-sm">
                    Mark as featured property
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createListingMutation.isPending || isGeocoding}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : createListingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Create Listing'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Property Listing</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Property Title</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Modern 4-Bedroom Duplex"
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, title: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe your property..."
                    rows={4}
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, description: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Price (₦)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      placeholder="45000000"
                      value={formState.price}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, price: event.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-type">Property Type</Label>
                    <Select
                      value={formState.type}
                      onValueChange={(value) =>
                        setFormState((prev) => ({ ...prev, type: value }))
                      }
                      required
                    >
                      <SelectTrigger id="edit-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="duplex">Duplex</SelectItem>
                        <SelectItem value="self-con">Self-Con</SelectItem>
                        <SelectItem value="bungalow">Bungalow</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="mansion">Mansion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-streetAddress">Street Address</Label>
                    <Input
                      id="edit-streetAddress"
                      placeholder="e.g., 123 Main Street"
                      value={formState.streetAddress}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, streetAddress: event.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        placeholder="e.g., Wuse 2, Garki"
                        value={formState.city}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, city: event.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-state">State</Label>
                      <Popover open={editStateOpen} onOpenChange={setEditStateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={editStateOpen}
                            className="w-full justify-between"
                          >
                            {formState.state || 'Select state...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search state..." />
                            <CommandList>
                              <CommandEmpty>No state found.</CommandEmpty>
                              <CommandGroup>
                                {NIGERIAN_STATES.map((state) => (
                                  <CommandItem
                                    key={state}
                                    value={state}
                                    onSelect={() => {
                                      setFormState((prev) => ({ ...prev, state }));
                                      setEditStateOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        formState.state === state ? 'opacity-100' : 'opacity-0'
                                      }`}
                                    />
                                    {state}
                                    {state === 'FCT' && ' (Abuja)'}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-postalCode">Postal Code (Optional)</Label>
                    <Input
                      id="edit-postalCode"
                      placeholder="e.g., 900001"
                      value={formState.postalCode}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, postalCode: event.target.value }))
                      }
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Enter the property address details. Coordinates will be automatically updated for accurate map navigation.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-bedrooms">Bedrooms</Label>
                    <Input
                      id="edit-bedrooms"
                      type="number"
                      placeholder="4"
                      value={formState.bedrooms}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, bedrooms: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-bathrooms">Bathrooms</Label>
                    <Input
                      id="edit-bathrooms"
                      type="number"
                      placeholder="4"
                      value={formState.bathrooms}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, bathrooms: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-area">Area (m²)</Label>
                    <Input
                      id="edit-area"
                      type="number"
                      placeholder="350"
                      value={formState.area}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, area: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="edit-featured"
                    type="checkbox"
                    checked={formState.featured}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, featured: event.target.checked }))
                    }
                  />
                  <Label htmlFor="edit-featured" className="text-sm">
                    Mark as featured property
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateListingMutation.isPending || isGeocoding}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting location...
                    </>
                  ) : updateListingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Listing'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Your Listings</h2>
          {housesQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : houses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center space-y-4">
                <p className="text-xl text-muted-foreground">No listings yet</p>
                <p className="text-muted-foreground">
                  Create your first property listing to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {houses.map((house) => (
                <div key={house.id} className="relative group">
                  <HouseCard house={house} />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleEdit(house)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(house.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
