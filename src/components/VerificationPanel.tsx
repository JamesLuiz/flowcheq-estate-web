import { useState, useRef } from 'react';
import { ShieldCheck, AlertCircle, Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const VerificationPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const documentInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<'nin' | 'driver_license'>('nin');
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<File | null>(null);

  const { data: verification, isLoading: isLoadingVerification } = useQuery({
    queryKey: ['verification', user?.id],
    queryFn: () => api.verifications.getMyVerification(),
    enabled: !!user && (user.role === 'agent' || user.role === 'landlord'),
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
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
      if (selfieInputRef.current) {
        selfieInputRef.current.value = '';
      }
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

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Document file size must be less than 1MB',
      });
      return;
    }

    // Check file type
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

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Selfie file size must be less than 1MB',
      });
      return;
    }

    // Check file type (only images for selfie)
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
    if (!selectedDocument) {
      toast({
        variant: 'destructive',
        title: 'No document selected',
        description: 'Please select a document to upload',
      });
      return;
    }

    if (!selectedSelfie) {
      toast({
        variant: 'destructive',
        title: 'No selfie selected',
        description: 'Please select a selfie/passport photo to upload',
      });
      return;
    }

    uploadMutation.mutate({ document: selectedDocument, selfie: selectedSelfie, type: documentType });
  };

  const getStatusBadge = () => {
    const status = verification?.status || user?.verificationStatus;
    
    switch (status) {
      case 'pending':
        return (
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
        );
      case 'approved':
        return (
          <Alert className="border-primary/50 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary">Verified {user?.role === 'agent' ? 'Agent' : 'Landlord'}</AlertTitle>
            <AlertDescription>
              Your account has been verified. You now have a verification badge on your profile and can upload properties.
            </AlertDescription>
          </Alert>
        );
      case 'rejected':
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Rejected</AlertTitle>
            <AlertDescription>
              {verification?.rejectionReason && (
                <div className="mb-2">
                  <strong>Reason:</strong> {verification.rejectionReason}
                </div>
              )}
              {verification?.adminMessage && (
                <div className="mb-2">
                  <strong>Message:</strong> {verification.adminMessage}
                </div>
              )}
              Please submit a new verification request with valid documents.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  if (user?.verified && user?.verificationStatus === 'approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Verification Status
          </CardTitle>
          <CardDescription>Your account is verified</CardDescription>
        </CardHeader>
        <CardContent>
          {getStatusBadge()}
        </CardContent>
      </Card>
    );
  }

  if (user?.role !== 'agent' && user?.role !== 'landlord') {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Get Verified
        </CardTitle>
        <CardDescription>
          Upload your NIN or Driver's License to verify your identity (Max 1MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {getStatusBadge()}
        
        {(user?.verificationStatus !== 'pending' && !verification) && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select value={documentType} onValueChange={(value: 'nin' | 'driver_license') => setDocumentType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nin">National Identification Number (NIN)</SelectItem>
                    <SelectItem value="driver_license">Driver's License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Upload Document (NIN or Driver's License)</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={documentInputRef}
                    id="document"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleDocumentSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => documentInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedDocument ? selectedDocument.name : 'Choose Document'}
                  </Button>
                </div>
                {selectedDocument && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedDocument.name} ({(selectedDocument.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPG, PNG, PDF (Max 1MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selfie">Upload Selfie/Passport Photo</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={selfieInputRef}
                    id="selfie"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleSelfieSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => selfieInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {selectedSelfie ? selectedSelfie.name : 'Choose Selfie Photo'}
                  </Button>
                </div>
                {selectedSelfie && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {selectedSelfie.name} ({(selectedSelfie.size / 1024).toFixed(2)} KB)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Accepted formats: JPG, PNG (Max 1MB) - Clear face photo required
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Document must be clear and readable</li>
                  <li>Name on document must match your registered name: <strong>{user?.name}</strong></li>
                  <li>Document must be valid and not expired</li>
                  <li>File size must be less than 1MB</li>
                </ul>
              </div>

              <Button 
                onClick={handleUpload} 
                disabled={uploadMutation.isPending || !selectedDocument || !selectedSelfie}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Verification
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
