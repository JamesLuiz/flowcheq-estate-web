import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Upload, Loader2, CreditCard, Calendar, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const PRICE_PER_DAY = 10000; // ₦10,000 per day

const PROMOTION_PACKAGES = [
  { days: 7, label: '1 Week', discount: 0 },
  { days: 14, label: '2 Weeks', discount: 5 },
  { days: 30, label: '1 Month', discount: 10 },
];

interface LocationState {
  propertyId?: string;
  propertyTitle?: string;
  fromUpload?: boolean;
}

const PromotionSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const state = location.state as LocationState | null;
  const propertyId = state?.propertyId;
  const propertyTitle = state?.propertyTitle;
  const fromUpload = state?.fromUpload;

  const [selectedDays, setSelectedDays] = useState(7);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculatePrice = (days: number) => {
    const pkg = PROMOTION_PACKAGES.find((p) => p.days === days);
    const discount = pkg?.discount || 0;
    const basePrice = days * PRICE_PER_DAY;
    return basePrice - (basePrice * discount) / 100;
  };

  const handleBannerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Banner image must be less than 5MB',
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or WebP image',
      });
      return;
    }

    setBannerImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const initializePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!propertyId || !bannerImage || !user) throw new Error('Missing required data');
      
      return api.promotions.initializePayment({
        houseId: propertyId,
        days: selectedDays,
        email: user.email,
        name: user.name,
        phone: user.phone,
      });
    },
    onSuccess: (data) => {
      if (data.link) {
        // Store promotion details for callback
        sessionStorage.setItem('pendingPromotion', JSON.stringify({
          propertyId,
          days: selectedDays,
          bannerImage: bannerPreview,
        }));
        window.location.href = data.link;
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Payment initialization failed',
        description: error.message,
      });
    },
  });

  const handleSubmit = async () => {
    if (!propertyId) {
      toast({
        variant: 'destructive',
        title: 'No property selected',
        description: 'Please select a property to promote',
      });
      return;
    }

    if (!bannerImage) {
      toast({
        variant: 'destructive',
        title: 'No banner image',
        description: 'Please upload a promotional banner image',
      });
      return;
    }

    setIsProcessing(true);
    initializePaymentMutation.mutate();
  };

  const handleSkip = () => {
    if (fromUpload) {
      toast({
        title: 'Property uploaded',
        description: 'Your property has been published successfully without promotion.',
      });
    }
    navigate('/dashboard');
  };

  if (!propertyId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-3xl font-bold">No Property Selected</h1>
          <p className="text-muted-foreground">
            Please select a property to promote from your dashboard.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <Button variant="ghost" className="mb-4 md:mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Promote Your Property</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Get more visibility for: <span className="font-semibold">{propertyTitle}</span>
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Banner Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <ImageIcon className="h-5 w-5" />
                Promotional Banner
              </CardTitle>
              <CardDescription className="text-sm">
                Upload an eye-catching banner for the homepage carousel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleBannerSelect}
                className="hidden"
              />

              {bannerPreview ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Change Banner
                  </Button>
                </div>
              ) : (
                <div
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload className="h-8 md:h-12 w-8 md:w-12 text-muted-foreground" />
                  <div className="text-center px-4">
                    <p className="font-medium text-sm md:text-base">Click to upload banner</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      JPG, PNG, or WebP (max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-5 w-5" />
                Select Duration
              </CardTitle>
              <CardDescription className="text-sm">
                Choose how long your property should be featured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={String(selectedDays)}
                onValueChange={(value) => setSelectedDays(Number(value))}
                className="space-y-3"
              >
                {PROMOTION_PACKAGES.map((pkg) => (
                  <div
                    key={pkg.days}
                    className={`flex items-center justify-between p-3 md:p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedDays === pkg.days
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDays(pkg.days)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={String(pkg.days)} id={`pkg-${pkg.days}`} />
                      <Label htmlFor={`pkg-${pkg.days}`} className="cursor-pointer">
                        <span className="font-semibold text-sm md:text-base">{pkg.label}</span>
                        {pkg.discount > 0 && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {pkg.discount}% OFF
                          </span>
                        )}
                      </Label>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm md:text-base">
                        ₦{calculatePrice(pkg.days).toLocaleString()}
                      </p>
                      {pkg.discount > 0 && (
                        <p className="text-xs text-muted-foreground line-through">
                          ₦{(pkg.days * PRICE_PER_DAY).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>

              <div className="mt-6 p-3 md:p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground text-sm md:text-base">Duration:</span>
                  <span className="font-semibold text-sm md:text-base">{selectedDays} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm md:text-base">Total:</span>
                  <span className="text-xl md:text-2xl font-bold text-primary">
                    ₦{calculatePrice(selectedDays).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            size="lg"
            className="flex-1 order-1 sm:order-2"
            onClick={handleSubmit}
            disabled={!bannerImage || isProcessing || initializePaymentMutation.isPending}
          >
            {initializePaymentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay & Promote
              </>
            )}
          </Button>
          {fromUpload && (
            <Button 
              variant="outline" 
              size="lg" 
              className="order-2 sm:order-1"
              onClick={handleSkip}
            >
              Skip Promotion
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionSetup;
