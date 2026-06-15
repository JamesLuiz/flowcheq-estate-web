import { FormEvent, useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, User, ShieldAlert } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { LandlordManagementInbox } from '@/components/landlord/LandlordManagementInbox';
import { isListingOwnerRole, isYouverifyVerified } from '@/lib/roles';
import { INSPECTION_FEE_NGN, GPS_PHOTO_MIN, GPS_PHOTO_MAX, requiredOwnershipDocs } from '@/lib/listing-requirements';
import { formatPriceNgn } from '@/lib/format';
import { ViewingManagement } from '@/components/ViewingScheduler';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { House } from '@/types';
import {
  initialLandlordListingFormState,
} from '@/components/landlord/landlordListingFormState';
import { geocodeListingLocation, houseToFormState } from '@/components/landlord/landlordListingUtils';
import { LandlordStatsCards } from '@/components/landlord/LandlordStatsCards';
import { LandlordListingsGrid } from '@/components/landlord/LandlordListingsGrid';
import { LandlordBankSection } from '@/components/landlord/LandlordBankSection';
import { LandlordCreateListingDialog } from '@/components/landlord/LandlordCreateListingDialog';
import { LandlordEditListingDialog } from '@/components/landlord/LandlordEditListingDialog';
import { LandlordPinResetDialog } from '@/components/landlord/LandlordPinResetDialog';
import { YouverifyAccountCard } from '@/components/YouverifyAccountCard';

const initialFormState = initialLandlordListingFormState;

const LandlordDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showResetPin, setShowResetPin] = useState(false);
  const [isPinResetDialogOpen, setIsPinResetDialogOpen] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPinAfterReset, setNewPinAfterReset] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showResetCode, setShowResetCode] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [gpsVerifyPropertyId, setGpsVerifyPropertyId] = useState<string | null>(null);
  const inspectionConfirmRef = useRef<string | null>(null);

  const isListingOwner = isListingOwnerRole(user?.role);
  const isVerified = isYouverifyVerified(user);

  const housesQuery = useQuery({
    queryKey: ['landlord-houses', user?.id],
    queryFn: () => api.houses.list({ agentId: user?.id }),
    enabled: isListingOwner && Boolean(user?.id),
  });

  const houses = housesQuery.data?.data ?? [];

  const pinStatusQuery = useQuery({
    queryKey: ['transaction-pin-status'],
    queryFn: () => api.agents.getTransactionPinStatus(),
    enabled: isListingOwner && Boolean(user?.id),
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

  const confirmInspectionMutation = useMutation({
    mutationFn: ({
      propertyId,
      transactionId,
    }: {
      propertyId: string;
      transactionId: string;
    }) => api.propertyVerification.confirmInspection(propertyId, transactionId),
    onSuccess: () => {
      toast({
        title: 'Inspection fee confirmed',
        description: 'You can now request field verification for this property.',
      });
      housesQuery.refetch();
      setSearchParams({}, { replace: true });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Could not confirm payment',
        description: error.message,
      });
      setSearchParams({}, { replace: true });
    },
  });

  useEffect(() => {
    const inspection = searchParams.get('inspection');
    const propertyId = searchParams.get('propertyId');
    const transactionId =
      searchParams.get('transaction_id') ||
      searchParams.get('transactionId') ||
      searchParams.get('id');
    if (inspection !== 'success' || !propertyId || !transactionId) return;

    const confirmKey = `${propertyId}:${transactionId}`;
    if (inspectionConfirmRef.current === confirmKey) return;
    inspectionConfirmRef.current = confirmKey;

    confirmInspectionMutation.mutate({ propertyId, transactionId });
    // confirmInspectionMutation identity changes each render; ref prevents duplicate calls
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const createListingMutation = useMutation({
    mutationFn: ({
      coordinates,
      location,
      googlePlaceId,
      formattedAddress,
      coordinatesSource,
    }: {
      coordinates?: { lat: number; lng: number };
      location: string;
      googlePlaceId?: string;
      formattedAddress?: string;
      coordinatesSource?: 'places' | 'geocode' | 'agent_gps';
    }) => {
      // Keep HTML formatting from RichTextEditor - don't strip it
      const description = formState.description?.trim();
      
      if (!description || description === '<p><br></p>') {
        throw new Error('Description is required. Please enter a property description.');
      }

      const ownershipDocuments = requiredOwnershipDocs(formState.listingType)
        .filter((t) => formState.ownershipDocs[t])
        .map((t) => ({ type: t, file: formState.ownershipDocs[t]! }));

      const taggedPhotosPayload = formState.taggedPhotos.map((p) => ({
        file: p.file,
        tag: p.tag,
        description: p.description,
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        accuracy: 25,
      }));

      return api.houses.create({
        title: formState.title,
        description: description,
        price: Number(formState.price),
        location,
        type: formState.type,
        bedrooms: Number(formState.bedrooms),
        bathrooms: Number(formState.bathrooms),
        area: Number(formState.area),
        featured: formState.featured,
        coordinates,
        googlePlaceId,
        formattedAddress,
        coordinatesSource,
        isShared: formState.isShared,
        totalSlots: formState.isShared ? Number(formState.totalSlots) : undefined,
        listingType: formState.listingType,
        isAirbnb: formState.isAirbnb,
        amenities: formState.amenities,
        ownershipDocuments,
        taggedPhotos: taggedPhotosPayload,
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
          description: `Pay the ${formatPriceNgn(INSPECTION_FEE_NGN)} inspection fee on the listing card, then request field verification.`,
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
    mutationFn: ({
      houseId,
      coordinates,
      location,
      googlePlaceId,
      formattedAddress,
      coordinatesSource,
    }: {
      houseId: string;
      coordinates?: { lat: number; lng: number };
      location: string;
      googlePlaceId?: string;
      formattedAddress?: string;
      coordinatesSource?: 'places' | 'geocode' | 'agent_gps';
    }) =>
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
        googlePlaceId,
        formattedAddress,
        coordinatesSource,
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
    setFormState(houseToFormState(house));
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

      setIsGeocoding(true);
    const { coordinates, fullLocation, googlePlaceId, formattedAddress, coordinatesSource } =
      await geocodeListingLocation(formState, () => {
          toast({
            variant: 'default',
            title: 'Location geocoding failed',
        description:
          'Property will be saved without exact coordinates. You can still search by location name.',
      });
    });
        setIsGeocoding(false);

    updateListingMutation.mutate(
      {
        houseId: editingHouse.id,
        coordinates,
        location: fullLocation,
        googlePlaceId,
        formattedAddress,
        coordinatesSource,
      },
      {
        onSuccess: () => {
          setFormState((prev) => ({
            ...prev,
            coordinates,
            location: fullLocation,
            googlePlaceId: googlePlaceId ?? prev.googlePlaceId,
            formattedAddress: formattedAddress ?? prev.formattedAddress,
            coordinatesSource: coordinatesSource ?? prev.coordinatesSource,
          }));
        },
      },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const photoCount = formState.taggedPhotos.length;
    if (photoCount < GPS_PHOTO_MIN || photoCount > GPS_PHOTO_MAX) {
      toast({
        variant: 'destructive',
        title: 'GPS property photos',
        description: `Add ${GPS_PHOTO_MIN}Ã¢â‚¬â€œ${GPS_PHOTO_MAX} tagged photos with GPS metadata (use Flowcheq Capture on mobile when available).`,
      });
      return;
    }

    const requiredDocs = requiredOwnershipDocs(formState.listingType);
    const missingDocs = requiredDocs.filter((t) => !formState.ownershipDocs[t]);
    if (missingDocs.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Ownership documents required',
        description: `Missing: ${missingDocs.join(', ')}`,
      });
      return;
    }

      setIsGeocoding(true);
    const { coordinates, fullLocation, googlePlaceId, formattedAddress, coordinatesSource } =
      await geocodeListingLocation(formState, () => {
          toast({
            variant: 'default',
            title: 'Location geocoding failed',
        description:
          'Property will be saved without exact coordinates. You can still search by location name.',
      });
    });
        setIsGeocoding(false);

    createListingMutation.mutate(
      { coordinates, location: fullLocation, googlePlaceId, formattedAddress, coordinatesSource },
      {
      onSuccess: () => {
        // Reset form state
        setFormState(initialFormState);
      },
    });
  };

  const statsQuery = useQuery({
    queryKey: ['house-stats', user?.id],
    queryFn: () => api.houses.getStats(),
    enabled: isListingOwner && Boolean(user?.id),
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

  if (!isListingOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">Landlord access required</h1>
          <p className="text-muted-foreground">
            Only landlords and real estate companies can manage listings here.
          </p>
          <Button variant="secondary" onClick={() => navigate('/agent/dashboard')}>
            Go to agent dashboard
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
            <h1 className="text-4xl font-bold mb-2">Landlord Dashboard</h1>
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

        <LandlordStatsCards
          totalListings={stats.totalListings}
          totalViews={stats.totalViews}
          inquiries={stats.inquiries}
        />

        <div className="mb-6">
          <YouverifyAccountCard />
        </div>

        <div className="mb-8">
          <LandlordManagementInbox />
        </div>

        {/* Viewing Management */}
        <div className="mb-8">
          <ViewingManagement />
        </div>

        <LandlordBankSection userId={user?.id} enabled={isListingOwner} />

        <div className="mb-6">
          {!isVerified ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-destructive" />
                <div>
                  <h3 className="font-semibold text-destructive">YouVerify required</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete YouVerify identity check above (NIN or driver license + selfie) before
                    adding properties.
                  </p>
                </div>
              </div>
              <Button disabled className="w-full sm:w-auto" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Add New Property
              </Button>
            </div>
          ) : (
            <LandlordCreateListingDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              formState={formState}
              setFormState={setFormState}
              onSubmit={handleSubmit}
              isGeocoding={isGeocoding}
              isPending={createListingMutation.isPending}
            />
          )}

          <LandlordEditListingDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            formState={formState}
            setFormState={setFormState}
            onSubmit={handleEditSubmit}
            isGeocoding={isGeocoding}
            isPending={updateListingMutation.isPending}
          />
                </div>

        <LandlordListingsGrid
          houses={houses}
          isLoading={housesQuery.isLoading}
          gpsVerifyPropertyId={gpsVerifyPropertyId}
          onGpsVerifyPropertyIdChange={setGpsVerifyPropertyId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onListingsUpdated={() => housesQuery.refetch()}
        />
                </div>

      <LandlordPinResetDialog
        open={isPinResetDialogOpen}
        onOpenChange={setIsPinResetDialogOpen}
        resetCodeSent={resetCodeSent}
        setResetCodeSent={setResetCodeSent}
        resetCode={resetCode}
        setResetCode={setResetCode}
        newPinAfterReset={newPinAfterReset}
        setNewPinAfterReset={setNewPinAfterReset}
        confirmNewPin={confirmNewPin}
        setConfirmNewPin={setConfirmNewPin}
        showResetCode={showResetCode}
        setShowResetCode={setShowResetCode}
        showResetPin={showResetPin}
        setShowResetPin={setShowResetPin}
        onRequestReset={() => requestPinResetMutation.mutate()}
        onConfirmReset={() => resetPinMutation.mutate({ code: resetCode, newPin: newPinAfterReset })}
        isRequesting={requestPinResetMutation.isPending}
        isResetting={resetPinMutation.isPending}
      />
    </div>
  );
};

export default LandlordDashboard;
