import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Loader2, Upload, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  isAgentRole,
  isHouseHunterRole,
  isLawyerRole,
  isListingOwnerRole,
  requiresYouverifyAccount,
  isYouverifyVerified,
} from '@/lib/roles';

function getVerificationCopy(role?: string | null) {
  if (isAgentRole(role)) {
    return {
      title: 'Account verification (YouVerify)',
      description:
        'Verify your identity to manage properties, receive leads, and build trust. Agents do not create listings — landlords and companies publish properties.',
    };
  }
  if (isListingOwnerRole(role)) {
    return {
      title: 'Account verification (YouVerify)',
      description:
        'Verify with your NIN or driver license and a live selfie to publish property listings. Verification is processed and billed through YouVerify.',
    };
  }
  if (isLawyerRole(role)) {
    return {
      title: 'Partner identity verification (YouVerify)',
      description:
        'Verify the lead partner identity for your law firm account. Law firm admin approval is still required separately before the legal review panel opens.',
    };
  }
  if (isHouseHunterRole(role)) {
    return {
      title: 'Account verification (YouVerify)',
      description:
        'Verify your identity to book viewings and use trusted features on Flowcheq Estate. Verification is processed through YouVerify.',
    };
  }
  return {
    title: 'Account verification (YouVerify)',
    description: 'Verify your identity with NIN or driver license and a selfie via YouVerify.',
  };
}

export function YouverifyAccountCard() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [documentType, setDocumentType] = useState<'nin' | 'driver_license'>('nin');
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') ?? '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);

  if (!user || !requiresYouverifyAccount(user.role)) return null;

  const status = user.youverifyStatus ?? 'not_started';
  const verified = isYouverifyVerified(user);
  const copy = getVerificationCopy(user.role);

  const mutation = useMutation({
    mutationFn: () =>
      api.youverify.verifyAccountIdentity({
        documentType,
        idNumber: idNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        isSubjectConsent: consent,
        selfie: selfie!,
      }),
    onSuccess: async (data) => {
      if (data.alreadyVerified || data.verified) {
        toast({
          title: 'Identity verified',
          description: data.message ?? 'Your YouVerify check passed.',
        });
        await refresh();
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Verification did not pass',
        description: data.message ?? 'Check your ID details and selfie, then try again.',
      });
      await refresh();
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Verification failed', description: e.message });
    },
  });

  if (verified) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <div>
              <h3 className="font-semibold">Verified with YouVerify</h3>
              <p className="text-sm text-muted-foreground">Your identity check is complete.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {copy.title}
          </CardTitle>
          <Badge variant="secondary">{status.replace(/_/g, ' ')}</Badge>
        </div>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Manual document upload is no longer accepted. Enter your ID, upload a clear selfie, and
          submit for instant YouVerify validation (NIN or driver license + liveness match).
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>ID type</Label>
            <Select
              value={documentType}
              onValueChange={(v) => setDocumentType(v as 'nin' | 'driver_license')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nin">National ID (NIN)</SelectItem>
                <SelectItem value="driver_license">Driver&apos;s license</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="yv-id">{documentType === 'nin' ? 'NIN' : 'License number'}</Label>
            <Input
              id="yv-id"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={documentType === 'nin' ? '11-digit NIN' : 'Driver license number'}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yv-first">First name (as on ID)</Label>
            <Input
              id="yv-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="yv-last">Last name (as on ID)</Label>
            <Input
              id="yv-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="yv-dob">Date of birth (optional)</Label>
            <Input
              id="yv-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Selfie photo</Label>
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                toast({
                  variant: 'destructive',
                  title: 'File too large',
                  description: 'Selfie must be under 5MB.',
                });
                return;
              }
              setSelfie(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => selfieInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {selfie ? selfie.name : 'Upload selfie (JPG or PNG, max 5MB)'}
          </Button>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="yv-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
          />
          <Label htmlFor="yv-consent" className="text-sm font-normal leading-snug">
            I consent to YouVerify processing my identity data for KYC verification.
          </Label>
        </div>

        <Button
          className="w-full"
          disabled={
            mutation.isPending ||
            !consent ||
            !idNumber.trim() ||
            !firstName.trim() ||
            !lastName.trim() ||
            !selfie
          }
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ShieldCheck className="h-4 w-4 mr-2" />
          )}
          Verify with YouVerify
        </Button>
      </CardContent>
    </Card>
  );
}
