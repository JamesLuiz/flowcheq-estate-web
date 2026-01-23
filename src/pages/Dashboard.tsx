import { FormEvent, useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Home as HomeIcon, TrendingUp, Eye, Loader2, Edit, Trash2, User, ShieldAlert, CreditCard, Wallet, ArrowRight, Lock, EyeOff, AlertCircle, Check, ChevronsUpDown } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HouseCard } from '@/components/HouseCard';
import { VerificationDialog } from '@/components/VerificationDialog';
import { ViewingManagement } from '@/components/ViewingScheduler';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { House } from '@/types';
import { geocodeAddress } from '@/lib/geocoding';
import { NIGERIAN_BANKS } from '@/data/nigerianBanks';

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
  featured: false,
  coordinates: undefined as { lat: number; lng: number } | undefined,
  // Shared property fields
  isShared: false,
  totalSlots: '',
  // Viewing fee
  viewingFee: '',
  // Listing type
  listingType: 'buy' as 'rent' | 'buy',
  // Airbnb listing
  isAirbnb: false,
  // Proof of address
  proofOfAddress: null as File | null,
  // Tagged photos
  taggedPhotos: [] as Array<{ file: File; tag: string; description: string }>,
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
  const [isBankSettingsOpen, setIsBankSettingsOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    bankCode: '',
  });
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [showWithdrawPin, setShowWithdrawPin] = useState(false);
  const [showResetPin, setShowResetPin] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(3);
  const [pendingWithdrawAmount, setPendingWithdrawAmount] = useState<number | null>(null);
  const [isPinResetDialogOpen, setIsPinResetDialogOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPinAfterReset, setNewPinAfterReset] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);

  const isAgent = user?.role === 'agent' || user?.role === 'landlord';
  const isVerified = user?.verified && user?.verificationStatus === 'approved';

  const housesQuery = useQuery({
    queryKey: ['agent-houses', user?.id],
    queryFn: () => api.houses.list({ agentId: user?.id }),
    enabled: isAgent && Boolean(user?.id),
  });

  const houses = housesQuery.data?.data ?? [];

  // Bank account queries
  const bankAccountQuery = useQuery({
    queryKey: ['bank-account', user?.id],
    queryFn: () => api.agents.getBankAccount(),
    enabled: isAgent && Boolean(user?.id),
  });

  const pinStatusQuery = useQuery({
    queryKey: ['transaction-pin-status'],
    queryFn: () => api.agents.getTransactionPinStatus(),
    enabled: isAgent && Boolean(user?.id),
  });

  const updateBankAccountMutation = useMutation({
    mutationFn: (bankAccount: { bankName: string; accountNumber: string; accountName: string; bankCode: string }) =>
      api.agents.updateBankAccount(bankAccount),
    onSuccess: () => {
      toast({
        title: 'Bank account updated',
        description: 'Your bank account details have been saved successfully.',
      });
      setIsBankSettingsOpen(false);
      bankAccountQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to update bank account',
        description: error.message,
      });
    },
  });

  const requestPinResetMutation = useMutation({
    mutationFn: () => api.agents.requestTransactionPinReset(),
    onSuccess: () => {
      setResetCodeSent(true);
      toast({ 
        title: 'Reset code sent', 
        description: 'A 6-digit code has been sent to your email. It expires in 15 minutes.' 
      });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Failed to send code', description: error.message });
    },
  });

  const resetPinMutation = useMutation({
    mutationFn: ({ code, newPin }: { code: string; newPin: string }) => api.agents.resetTransactionPin(code, newPin),
    onSuccess: () => {
      toast({ 
        title: 'PIN reset successful', 
        description: 'Your transaction PIN has been reset. You can now use it for withdrawals.' 
      });
      pinStatusQuery.refetch();
      setIsPinResetDialogOpen(false);
      setResetCode('');
      setNewPinAfterReset('');
      setConfirmNewPin('');
      setResetCodeSent(false);
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Reset failed', description: error.message });
    },
  });

  // Initialize bank form when data is loaded
  useEffect(() => {
    if (bankAccountQuery.data?.bankAccount) {
      setBankForm({
        bankName: bankAccountQuery.data.bankAccount.bankName || '',
        accountNumber: bankAccountQuery.data.bankAccount.accountNumber || '',
        accountName: bankAccountQuery.data.bankAccount.accountName || '',
        bankCode: bankAccountQuery.data.bankAccount.bankCode || '',
      });
    }
  }, [bankAccountQuery.data]);

  const createListingMutation = useMutation({
    mutationFn: ({ coordinates, location }: { coordinates?: { lat: number; lng: number }; location: string }) => {
      // Keep HTML formatting from RichTextEditor - don't strip it
      const description = formState.description?.trim();
      
      if (!description || description === '<p><br></p>') {
        throw new Error('Description is required. Please enter a property description.');
      }

      return api.houses.create({
        title: formState.title,
        description: description, // Send HTML as-is
        price: Number(formState.price),
        location,
        type: formState.type,
        bedrooms: Number(formState.bedrooms),
        bathrooms: Number(formState.bathrooms),
        area: Number(formState.area),
        featured: formState.featured,
        coordinates,
        isShared: formState.isShared,
        totalSlots: formState.isShared ? Number(formState.totalSlots) : undefined,
        viewingFee: formState.viewingFee ? Number(formState.viewingFee) : undefined,
        listingType: formState.listingType,
        isAirbnb: formState.isAirbnb,
        proofOfAddress: formState.proofOfAddress || undefined,
        taggedPhotos: formState.taggedPhotos.length > 0 ? formState.taggedPhotos : undefined,
      } as any);
    },
    onSuccess: (data) => {
      setIsDialogOpen(false);
      housesQuery.refetch();
      statsQuery.refetch();
      
      // If marked as featured, redirect to promotion setup
      if (formState.featured && data?.id) {
        toast({
          title: 'Property created',
          description: 'Redirecting to promotion setup...',
        });
        navigate('/promotions/setup', {
          state: {
            propertyId: data.id,
            propertyTitle: formState.title,
            fromUpload: true,
          },
        });
      } else {
        toast({
          title: 'Listing created',
          description: 'Your property has been published successfully.',
        });
      }
      setFormState(initialFormState);
    },
    onError: (error: Error) => {
      console.error('Create listing error:', error);
      const errorDetails = (error as any).details;
      let errorMessage = error.message || 'An error occurred while creating the listing.';
      
      // Extract validation errors if present
      if (errorDetails?.message && Array.isArray(errorDetails.message)) {
        errorMessage = errorDetails.message.join(', ');
      } else if (errorDetails?.message) {
        errorMessage = errorDetails.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Failed to create listing',
        description: errorMessage,
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
        isShared: formState.isShared,
        totalSlots: formState.isShared ? Number(formState.totalSlots) : undefined,
        viewingFee: formState.viewingFee ? Number(formState.viewingFee) : undefined,
        listingType: formState.listingType,
      } as any),
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
    setFormState(prev => ({
      ...prev,
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
      featured: house.featured || false,
      coordinates: house.coordinates,
      isShared: (house as any).isShared || false,
      totalSlots: String((house as any).totalSlots || ''),
      viewingFee: String((house as any).viewingFee || ''),
      listingType: (house as any).listingType || 'buy',
    }));
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

    // Require at least 3 tagged photos (primary upload channel)
    if (formState.taggedPhotos.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Add property photos',
        description: 'Please add at least 3 tagged photos (up to 8).',
      });
      return;
    }

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

        {/* Verification Dialog */}
        <div className="mb-8">
          <VerificationDialog />
        </div>

        {/* Viewing Management */}
        <div className="mb-8">
          <ViewingManagement />
        </div>

        {/* Bank Settings */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Bank Account Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up your bank account to receive payments from viewing fees
                </p>
              </div>
              <Dialog open={isBankSettingsOpen} onOpenChange={setIsBankSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    {bankAccountQuery.data?.bankAccount ? 'Update Account' : 'Add Bank Account'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Bank Account Details</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName || !bankForm.bankCode) {
                        toast({
                          variant: 'destructive',
                          title: 'Validation Error',
                          description: 'Please fill in all fields',
                        });
                        return;
                      }
                      updateBankAccountMutation.mutate(bankForm);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Popover open={bankOpen} onOpenChange={setBankOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={bankOpen}
                            className="w-full justify-between"
                          >
                            {bankForm.bankName || 'Select bank...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search bank..." />
                            <CommandList className="max-h-[200px] sm:max-h-[300px]">
                              <CommandEmpty>No bank found.</CommandEmpty>
                              <CommandGroup>
                                {NIGERIAN_BANKS.map((bank) => (
                                  <CommandItem
                                    key={bank.code}
                                    value={bank.name}
                                    onSelect={() => {
                                      setBankForm((prev) => ({
                                        ...prev,
                                        bankName: bank.name,
                                        bankCode: bank.code,
                                      }));
                                      setBankOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        bankForm.bankName === bank.name ? 'opacity-100' : 'opacity-0'
                                      }`}
                                    />
                                    {bank.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Enter 10-digit account number"
                        value={bankForm.accountNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setBankForm((prev) => ({ ...prev, accountNumber: value }));
                        }}
                        required
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter your 10-digit bank account number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        placeholder="Enter account name (as it appears on your bank statement)"
                        value={bankForm.accountName}
                        onChange={(e) => setBankForm((prev) => ({ ...prev, accountName: e.target.value }))}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This should match the name on your bank account
                      </p>
                    </div>

                    {bankAccountQuery.data?.walletBalance !== undefined && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Wallet Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          ₦{bankAccountQuery.data.walletBalance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Available for withdrawal to your bank account
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBankSettingsOpen(false)}
                        disabled={updateBankAccountMutation.isPending}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateBankAccountMutation.isPending} className="w-full sm:w-auto">
                        {updateBankAccountMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Bank Account'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {bankAccountQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : bankAccountQuery.data?.bankAccount ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{bankAccountQuery.data.bankAccount.bankName}</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {bankAccountQuery.data.bankAccount.accountNumber}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {bankAccountQuery.data.bankAccount.accountName}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsBankSettingsOpen(true)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    Edit
                  </Button>
                </div>
                {bankAccountQuery.data.walletBalance !== undefined && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">Available Balance</span>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      ₦{bankAccountQuery.data.walletBalance.toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline"
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate('/wallet')}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        View Wallet
                      </Button>
                      {bankAccountQuery.data.walletBalance > 0 && (
                        <Button 
                          className="flex-1" 
                          size="sm"
                          onClick={() => navigate('/wallet')}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No bank account configured</p>
                <Button onClick={() => setIsBankSettingsOpen(true)}>Add Bank Account</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Virtual Account Info */}
        {bankAccountQuery.data?.virtualAccount && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Virtual Account
              </CardTitle>
              <CardDescription>
                Your Flutterwave virtual account for receiving payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Account Number</p>
                    <Badge variant={bankAccountQuery.data.virtualAccount.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {bankAccountQuery.data.virtualAccount.status || 'ACTIVE'}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold font-mono">
                    {bankAccountQuery.data.virtualAccount.accountNumber}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bankAccountQuery.data.virtualAccount.bankName}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>How it works:</strong> Payments from viewing fees are automatically deposited into this virtual account. 
                    You can withdraw funds from your wallet balance to your bank account anytime.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          {!isVerified ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">Verification Required</h3>
                  <p className="text-sm text-muted-foreground">
                    You must be verified to add properties. Complete your verification above.
                  </p>
                </div>
              </div>
              <Button disabled className="w-full sm:w-auto" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add New Property
              </Button>
            </div>
          ) : (
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
                  <RichTextEditor
                    value={formState.description}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, description: value }))
                    }
                    placeholder="Describe your property with rich formatting (bold, italic, lists, etc.)..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar to format your description with bold, italic, bullet points, and more.
                  </p>
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

                  <div className="space-y-2">
                    <Label htmlFor="listingType">Listing Type</Label>
                    <Select
                      value={formState.listingType}
                      onValueChange={(value: 'rent' | 'buy') =>
                        setFormState((prev) => ({ ...prev, listingType: value }))
                      }
                      required
                    >
                      <SelectTrigger id="listingType">
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
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

                {/* Tagged Photos Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <div>
                    <Label>Tagged Photos (Optional - Up to 8 photos)</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upload photos with room tags (bathroom, bedroom, kitchen, sitting room, lobby, toilet, full photo, etc.) and descriptions.
                    </p>
                  </div>
                  
                  {formState.taggedPhotos.map((photo, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2 bg-background">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Photo {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormState((prev) => ({
                              ...prev,
                              taggedPhotos: prev.taggedPhotos.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`tag-${index}`} className="text-xs">Room Tag</Label>
                        <Select
                          value={photo.tag}
                          onValueChange={(value) => {
                            setFormState((prev) => ({
                              ...prev,
                              taggedPhotos: prev.taggedPhotos.map((p, i) =>
                                i === index ? { ...p, tag: value } : p
                              ),
                            }));
                          }}
                        >
                          <SelectTrigger id={`tag-${index}`}>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bathroom">Bathroom</SelectItem>
                            <SelectItem value="bedroom">Bedroom</SelectItem>
                            <SelectItem value="kitchen">Kitchen</SelectItem>
                            <SelectItem value="sitting-room">Sitting Room</SelectItem>
                            <SelectItem value="lobby">Lobby</SelectItem>
                            <SelectItem value="toilet">Toilet</SelectItem>
                            <SelectItem value="full-photo">Full Photo of House</SelectItem>
                            <SelectItem value="exterior">Exterior</SelectItem>
                            <SelectItem value="balcony">Balcony</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Label htmlFor={`desc-${index}`} className="text-xs">Description (Optional)</Label>
                        <Input
                          id={`desc-${index}`}
                          placeholder="e.g., Modern kitchen with island"
                          value={photo.description}
                          onChange={(event) => {
                            setFormState((prev) => ({
                              ...prev,
                              taggedPhotos: prev.taggedPhotos.map((p, i) =>
                                i === index ? { ...p, description: event.target.value } : p
                              ),
                            }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {formState.taggedPhotos.length < 8 && (
                    <div>
                      <Input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                variant: 'destructive',
                                title: 'Image too large',
                                description: 'Image must be less than 5MB',
                              });
                              return;
                            }
                            setFormState((prev) => ({
                              ...prev,
                              taggedPhotos: [
                                ...prev.taggedPhotos,
                                { file, tag: '', description: '' },
                              ],
                            }));
                            event.target.value = '';
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Add another tagged photo ({formState.taggedPhotos.length}/8)
                      </p>
                    </div>
                  )}
                </div>

                {/* Viewing Fee */}
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="viewingFee">Viewing/Tour Fee (₦)</Label>
                  <Input
                    id="viewingFee"
                    type="number"
                    min="0"
                    placeholder="e.g., 5000 (leave empty for free viewing)"
                    value={formState.viewingFee}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, viewingFee: event.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a viewing fee that users must pay to schedule a property tour. Leave empty for free viewings.
                  </p>
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

                {/* Airbnb Listing */}
                <div className="flex items-center gap-2">
                  <input
                    id="isAirbnb"
                    type="checkbox"
                    checked={formState.isAirbnb}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, isAirbnb: event.target.checked }))
                    }
                  />
                  <Label htmlFor="isAirbnb" className="text-sm">
                    🏨 List as Airbnb/Short-term rental
                  </Label>
                </div>

                {/* Proof of Address */}
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="proofOfAddress">Proof of Address (Required)</Label>
                  <Input
                    id="proofOfAddress"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        // Validate file type
                        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                        if (!allowedTypes.includes(file.type)) {
                          toast({
                            variant: 'destructive',
                            title: 'Invalid file type',
                            description: 'Please upload a PDF or image file (JPG, PNG)',
                          });
                          event.target.value = '';
                          setFormState((prev) => ({ ...prev, proofOfAddress: null }));
                          return;
                        }
                        // Validate file size (10MB max)
                        if (file.size > 10 * 1024 * 1024) {
                          toast({
                            variant: 'destructive',
                            title: 'File too large',
                            description: 'Proof of address file must be less than 10MB',
                          });
                          event.target.value = '';
                          setFormState((prev) => ({ ...prev, proofOfAddress: null }));
                          return;
                        }
                        setFormState((prev) => ({ ...prev, proofOfAddress: file }));
                      }
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload utility bill or Certificate of Occupancy (C of O) for new houses. This will be visible to admin only for verification purposes.
                  </p>
                  {formState.proofOfAddress && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Selected: {formState.proofOfAddress.name} ({(formState.proofOfAddress.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>

                {/* Shared Property Toggle */}
                <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <input
                      id="isShared"
                      type="checkbox"
                      checked={formState.isShared}
                      onChange={(event) =>
                        setFormState((prev) => ({ 
                          ...prev, 
                          isShared: event.target.checked,
                          totalSlots: event.target.checked ? '2' : ''
                        }))
                      }
                    />
                    <Label htmlFor="isShared" className="text-sm font-medium">
                      🤝 Shared Property (2-to-Tango)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable this if the property can be rented by multiple tenants in separate slots.
                  </p>
                  
                  {formState.isShared && (
                    <div className="space-y-2">
                      <Label htmlFor="totalSlots">Number of Slots Available</Label>
                      <Input
                        id="totalSlots"
                        type="number"
                        min="2"
                        max="10"
                        placeholder="2"
                        value={formState.totalSlots}
                        onChange={(event) =>
                          setFormState((prev) => ({ ...prev, totalSlots: event.target.value }))
                        }
                        required={formState.isShared}
                      />
                      <p className="text-xs text-muted-foreground">
                        How many tenants can share this property? (2-10)
                      </p>
                    </div>
                  )}
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
          )}

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
                  <RichTextEditor
                    value={formState.description}
                    onChange={(value) =>
                      setFormState((prev) => ({ ...prev, description: value }))
                    }
                    placeholder="Describe your property with rich formatting (bold, italic, lists, etc.)..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the toolbar to format your description with bold, italic, bullet points, and more.
                  </p>
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

                  <div className="space-y-2">
                    <Label htmlFor="edit-listingType">Listing Type</Label>
                    <Select
                      value={formState.listingType}
                      onValueChange={(value: 'rent' | 'buy') =>
                        setFormState((prev) => ({ ...prev, listingType: value }))
                      }
                      required
                    >
                      <SelectTrigger id="edit-listingType">
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
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

                {/* Viewing Fee (editable in edit dialog) */}
                <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                  <Label htmlFor="edit-viewingFee">Viewing/Tour Fee (₦)</Label>
                  <Input
                    id="edit-viewingFee"
                    type="number"
                    min="0"
                    placeholder="e.g., 5000 (leave empty for free viewing)"
                    value={formState.viewingFee}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, viewingFee: event.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Set a viewing fee that users must pay to schedule a property tour. Leave empty for free viewings.
                  </p>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Listings</h2>
            <Badge variant="secondary" className="text-sm">
              {houses.length} {houses.length === 1 ? 'property' : 'properties'}
            </Badge>
          </div>
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

      {/* PIN Reset Dialog */}
      <Dialog open={isPinResetDialogOpen} onOpenChange={setIsPinResetDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle>Reset Transaction PIN</DialogTitle>
            <DialogDescription>
              Request a reset code via email, then enter it along with your new PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 sm:py-4">
            {!resetCodeSent ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    A 6-digit reset code will be sent to your email. The code expires in 15 minutes.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => requestPinResetMutation.mutate()}
                  disabled={requestPinResetMutation.isPending}
                  className="w-full"
                >
                  {requestPinResetMutation.isPending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                  ) : (
                    <>Send Reset Code to Email</>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">Reset Code</Label>
                  <div className="relative">
                    <Input
                      type={showResetCode ? 'text' : 'password'}
                      placeholder="Enter 6-digit reset code"
                      value={resetCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setResetCode(value);
                      }}
                      maxLength={6}
                      className="pr-10 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowResetCode(!showResetCode)}
                    >
                      {showResetCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">New Transaction PIN (6 digits)</Label>
                  <div className="relative">
                    <Input
                      type={showResetPin ? 'text' : 'password'}
                      placeholder="Enter new 6-digit PIN"
                      value={newPinAfterReset}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setNewPinAfterReset(value);
                      }}
                      maxLength={6}
                      className="pr-10 text-base"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 sm:px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowResetPin(!showResetPin)}
                    >
                      {showResetPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Confirm New PIN</Label>
                  <Input
                    type={showResetPin ? 'text' : 'password'}
                    placeholder="Confirm new 6-digit PIN"
                    value={confirmNewPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setConfirmNewPin(value);
                    }}
                    maxLength={6}
                    className="text-base"
                  />
                </div>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => {
                    setResetCode('');
                    setNewPinAfterReset('');
                    setConfirmNewPin('');
                    setResetCodeSent(false);
                  }}
                >
                  Request new code
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsPinResetDialogOpen(false);
                setResetCode('');
                setNewPinAfterReset('');
                setConfirmNewPin('');
                setResetCodeSent(false);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {resetCodeSent && (
              <Button 
                onClick={() => {
                  if (!resetCode || resetCode.length !== 6) {
                    toast({ variant: 'destructive', title: 'Invalid code', description: 'Please enter the 6-digit reset code' });
                    return;
                  }
                  if (!newPinAfterReset || newPinAfterReset.length !== 6 || !/^\d{6}$/.test(newPinAfterReset)) {
                    toast({ variant: 'destructive', title: 'Invalid PIN', description: 'PIN must be exactly 6 digits' });
                    return;
                  }
                  if (newPinAfterReset !== confirmNewPin) {
                    toast({ variant: 'destructive', title: 'PIN mismatch', description: 'PINs do not match' });
                    return;
                  }
                  resetPinMutation.mutate({ code: resetCode, newPin: newPinAfterReset });
                }}
                disabled={resetPinMutation.isPending || resetCode.length !== 6 || newPinAfterReset.length !== 6 || confirmNewPin.length !== 6}
                className="w-full sm:w-auto"
              >
                {resetPinMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                ) : (
                  <>Reset PIN</>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
