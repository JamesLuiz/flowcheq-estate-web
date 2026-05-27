import { useState, useRef } from 'react';
import { 
  ShieldCheck, AlertCircle, Upload, Loader2, FileText, CheckCircle2, 
  BadgeCheck, Star, Eye, HeadphonesIcon, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const VerificationDialog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'nin' | 'driver_license'>('nin');
  const isLandlordRole =
    user?.role === 'landlord' ||
    user?.role === 'real_estate_company' ||
    user?.role === 'company';
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<File | null>(null);

  const { data: verification, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['verification', user?.id],
    queryFn: () => api.verifications.getMyVerification(),
    enabled: !!user && (user.role === 'agent' || isLandlordRole),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ document, selfie, type }: { document: File; selfie: File; type: 'nin' | 'driver_license' }) => {
      return api.verifications.upload(type, document, selfie);
    },
    onSuccess: () => {
      toast({
        title: 'Verification submitted',
        description: 'Your documents have been uploaded and are under review.',
      });
      queryClient.invalidateQueries({ queryKey: ['verification'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setSelectedDocument(null);
      setSelectedSelfie(null);
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload verification documents',
      });
    },
  });

  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Document file size must be less than 1MB',
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, or PDF file',
      });
      return;
    }

    setSelectedDocument(file);
  };

  const handleSelfieSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Selfie file size must be less than 1MB',
      });
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPG or PNG image',
      });
      return;
    }

    setSelectedSelfie(file);
  };

  const handleUpload = () => {
    if (!selectedDocument || !selectedSelfie) {
      toast({
        variant: 'destructive',
        title: 'Missing files',
        description: 'Please select both document and selfie',
      });
      return;
    }

    const type = isLandlordRole ? 'nin' : documentType;
    uploadMutation.mutate({ document: selectedDocument, selfie: selectedSelfie, type });
  };

  // Check verification status
  const isVerified = user?.verified && user?.verificationStatus === 'approved';
  const isPending = user?.verificationStatus === 'pending' || verification?.status === 'pending';
  const isRejected = user?.verificationStatus === 'rejected' || verification?.status === 'rejected';

  const resendEmailMutation = useMutation({
    mutationFn: () => api.auth.resendEmailVerification(),
    onSuccess: (data) => {
      toast({ title: 'Email sent', description: data.message });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Could not send email', description: error.message });
    },
  });

  if (user?.role !== 'agent' && !isLandlordRole) {
    return null;
  }

  if (isLandlordRole && !user?.emailVerified) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="pt-6 space-y-3">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verify your email</AlertTitle>
            <AlertDescription>
              Landlord verification requires a verified email, NIN on your profile, and a selfie.
              Check your inbox for the link we sent when you registered.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => resendEmailMutation.mutate()}
            disabled={resendEmailMutation.isPending}
          >
            {resendEmailMutation.isPending ? 'Sending…' : 'Resend verification email'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const benefits = [
    { icon: BadgeCheck, text: 'Verification badge on your profile' },
    { icon: Star, text: 'Increased trust from potential clients' },
    { icon: Eye, text: 'Higher visibility in search results' },
    { icon: HeadphonesIcon, text: 'Priority support from our team' },
  ];

  // Already verified
  if (isVerified) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Verified {user?.role === 'agent' ? 'Agent' : 'Landlord'}</h3>
              <p className="text-sm text-muted-foreground">Your account is verified and trusted</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending verification
  if (isPending) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Verification Pending</AlertTitle>
            <AlertDescription>
              Your verification is being reviewed. This usually takes 24-48 hours.
              {verification?.adminMessage && (
                <div className="mt-2 text-sm">
                  <strong>Note:</strong> {verification.adminMessage}
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:border-primary/50 transition-colors">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">Get Verified</h3>
                  <p className="text-sm text-muted-foreground">Build trust with potential clients</p>
                </div>
              </div>
              <Button>Start Verification</Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Get Verified
          </DialogTitle>
          <DialogDescription>
            Verify your identity to build trust with potential clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium">Benefits of verification:</h4>
            <div className="grid gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rejected alert */}
          {isRejected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Previous Verification Rejected</AlertTitle>
              <AlertDescription>
                {verification?.rejectionReason && (
                  <div className="mb-2">
                    <strong>Reason:</strong> {verification.rejectionReason}
                  </div>
                )}
                Please submit a new verification with valid documents.
              </AlertDescription>
            </Alert>
          )}

          {isLandlordRole ? (
            <p className="text-sm text-muted-foreground">
              Landlord verification: <strong>NIN</strong> (number on your profile) + upload a photo of your NIN slip/card + <strong>selfie</strong>. Email must already be verified.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={(v: 'nin' | 'driver_license') => setDocumentType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nin">National Identification Number (NIN)</SelectItem>
                  <SelectItem value="driver_license">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{isLandlordRole ? 'Upload NIN document (photo/PDF)' : 'Upload Document'}</Label>
            <input
              ref={documentInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleDocumentSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => documentInputRef.current?.click()}
              className="w-full h-20 border-dashed"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5" />
                <span className="text-sm">
                  {selectedDocument ? selectedDocument.name : 'Click to upload document'}
                </span>
                {selectedDocument && (
                  <span className="text-xs text-muted-foreground">
                    {(selectedDocument.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </Button>
          </div>

          {/* Selfie Upload */}
          <div className="space-y-2">
            <Label>Upload Selfie/Passport Photo</Label>
            <input
              ref={selfieInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleSelfieSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => selfieInputRef.current?.click()}
              className="w-full h-20 border-dashed"
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-5 w-5" />
                <span className="text-sm">
                  {selectedSelfie ? selectedSelfie.name : 'Click to upload selfie'}
                </span>
                {selectedSelfie && (
                  <span className="text-xs text-muted-foreground">
                    {(selectedSelfie.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            </Button>
          </div>

          {/* Requirements */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium">Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Document must be clear and readable</li>
              <li>Name must match: <strong>{user?.name}</strong></li>
              <li>File size must be less than 1MB</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !selectedDocument || !selectedSelfie}
            className="w-full"
            size="lg"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Start Verification
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
