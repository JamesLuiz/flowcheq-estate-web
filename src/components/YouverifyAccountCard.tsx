import { useEffect, useRef, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Link } from 'react-router-dom';

import {

  ShieldCheck,

  Loader2,

  Upload,

  CheckCircle2,

  Wallet,

  CreditCard,

  AlertCircle,

} from 'lucide-react';

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

  getWalletPathForRole,

} from '@/lib/roles';



function formatNgn(amount: number) {

  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

}



function getVerificationCopy(role?: string | null) {

  if (isAgentRole(role)) {

    return {

      title: 'Account verification (YouVerify)',

      description:

        'Top up your wallet, then verify your identity to manage properties and receive leads.',

    };

  }

  if (isListingOwnerRole(role)) {

    return {

      title: 'Account verification (YouVerify)',

      description:

        'Fund your virtual wallet and verify with NIN or driver license to publish listings.',

    };

  }

  if (isLawyerRole(role)) {

    return {

      title: 'Partner identity verification (YouVerify)',

      description:

        'Top up your wallet and verify the lead partner identity for your law firm account.',

    };

  }

  if (isHouseHunterRole(role)) {

    return {

      title: 'Account verification (YouVerify)',

      description:

        'Fund your wallet and verify your identity to book viewings and use trusted features.',

    };

  }

  return {

    title: 'Account verification (YouVerify)',

    description: 'Top up your wallet, then verify with NIN or driver license and a selfie.',

  };

}



export function YouverifyAccountCard() {

  const { user, refresh } = useAuth();

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const selfieInputRef = useRef<HTMLInputElement>(null);



  const [documentType, setDocumentType] = useState<'nin' | 'driver_license'>('nin');

  const [idNumber, setIdNumber] = useState('');

  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] ?? '');

  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') ?? '');

  const [dateOfBirth, setDateOfBirth] = useState('');

  const [selfie, setSelfie] = useState<File | null>(null);

  const [consent, setConsent] = useState(false);



  const statusQuery = useQuery({
    queryKey: ['youverify-account-status'],
    queryFn: () => api.youverify.getAccountStatus(),
    enabled: Boolean(user && requiresYouverifyAccount(user.role)),
    refetchInterval: (query) => {
      const d = query.state.data;
      if (d?.processing || d?.paymentStatus === 'fee_debiting') return 4000;
      return false;
    },
  });



  const isProcessing =
    statusQuery.data?.processing || statusQuery.data?.paymentStatus === 'fee_debiting';

  useEffect(() => {
    if (!isProcessing) return;
    const id = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [isProcessing, refresh]);

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
      if (data.processing) {
        toast({
          title: 'Processing verification fee',
          description:
            data.message ??
            'Flutterwave is confirming your payment. YouVerify will run automatically.',
        });
        queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });
        return;
      }

      if (data.alreadyVerified || data.verified) {

        toast({

          title: 'Identity verified',

          description: data.message ?? 'Your YouVerify check passed.',

        });

        await refresh();

        queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });

        return;

      }



      toast({

        variant: 'destructive',

        title: 'Verification did not pass',

        description: data.message ?? 'Check your ID details and selfie, then try again.',

      });

      await refresh();

      queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });

    },

    onError: (e: Error) => {

      toast({ variant: 'destructive', title: 'Verification failed', description: e.message });

      queryClient.invalidateQueries({ queryKey: ['youverify-account-status'] });

    },

  });



  if (!user || !requiresYouverifyAccount(user.role)) return null;

  const verified = isYouverifyVerified(user);
  const copy = getVerificationCopy(user.role);
  const walletPath = getWalletPathForRole(user.role);
  const verificationFee = statusQuery.data?.verificationFee ?? 1500;
  const walletBalance = statusQuery.data?.walletBalance ?? 0;
  const paymentStatus = statusQuery.data?.paymentStatus ?? 'awaiting_funding';
  const canVerify = statusQuery.data?.canVerify ?? false;
  const feeAlreadyPaid = statusQuery.data?.feeAlreadyPaid ?? false;
  const virtualAccount = statusQuery.data?.virtualAccount;
  const youverifyStatus = user.youverifyStatus ?? 'not_started';

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



  const needsTopUp = !feeAlreadyPaid && walletBalance < verificationFee;



  return (

    <Card className="border-primary/20 bg-primary/5">

      <CardHeader className="pb-2">

        <div className="flex items-center justify-between gap-2">

          <CardTitle className="text-base flex items-center gap-2">

            <ShieldCheck className="h-5 w-5 text-primary" />

            {copy.title}

          </CardTitle>

          <Badge variant="secondary">{youverifyStatus.replace(/_/g, ' ')}</Badge>

        </div>

        <CardDescription>{copy.description}</CardDescription>

      </CardHeader>

      <CardContent className="space-y-4">

        <div className="rounded-lg border bg-background p-4 space-y-3">

          <div className="flex items-center gap-2 text-sm font-medium">

            <Wallet className="h-4 w-4 text-primary" />

            Verification wallet

          </div>

          <div className="grid gap-2 sm:grid-cols-3 text-sm">

            <div>

              <p className="text-muted-foreground">Required fee</p>

              <p className="font-semibold">{formatNgn(verificationFee)}</p>

            </div>

            <div>

              <p className="text-muted-foreground">Your balance</p>

              <p className="font-semibold">{formatNgn(walletBalance)}</p>

            </div>

            <div>

              <p className="text-muted-foreground">Payment status</p>

              <p className="font-semibold capitalize">{paymentStatus.replace(/_/g, ' ')}</p>

            </div>

          </div>



          {virtualAccount?.accountNumber && (

            <div className="text-xs text-muted-foreground border-t pt-3">

              <p className="font-medium text-foreground mb-1">Virtual account (Flutterwave)</p>

              <p>{virtualAccount.accountName}</p>

              <p>

                {virtualAccount.bankName} · {virtualAccount.accountNumber}

              </p>

              <p className="mt-1">Transfer NGN here or use card top-up below.</p>

            </div>

          )}



          {needsTopUp && (

            <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm">

              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />

              <div>

                <p className="font-medium">Top up required</p>

                <p className="text-muted-foreground">

                  Add at least {formatNgn(verificationFee - walletBalance)} more to your wallet

                  before verification.

                </p>

              </div>

            </div>

          )}



          {isProcessing && (

            <div className="flex items-start gap-2 rounded-md bg-primary/10 p-3 text-sm">

              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary mt-0.5" />

              <div>

                <p className="font-medium">Payment processing</p>

                <p className="text-muted-foreground">

                  Flutterwave is confirming your wallet debit. YouVerify runs as soon as the fee

                  is confirmed — this page refreshes automatically.

                </p>

              </div>

            </div>

          )}



          <Button asChild variant={needsTopUp ? 'default' : 'outline'} className="w-full sm:w-auto">

            <Link to={walletPath}>

              <CreditCard className="h-4 w-4 mr-2" />

              {needsTopUp ? 'Top up wallet' : 'Manage wallet'}

            </Link>

          </Button>

        </div>



        {statusQuery.data?.paymentEvents && statusQuery.data.paymentEvents.length > 0 && (

          <div className="text-xs text-muted-foreground space-y-1">

            <p className="font-medium text-foreground">Payment timeline</p>

            {[...statusQuery.data.paymentEvents].reverse().slice(0, 5).map((event, i) => (

              <p key={`${event.status}-${i}`}>

                {new Date(event.at).toLocaleString()} — {event.status.replace(/_/g, ' ')}

                {event.note ? `: ${event.note}` : ''}

              </p>

            ))}

          </div>

        )}



        <p className="text-xs text-muted-foreground">

          When you submit, Flutterwave debits {formatNgn(verificationFee)} from your virtual wallet,

          then YouVerify runs your NIN or driver license + selfie check.

          {feeAlreadyPaid ? ' Your fee is already paid — you can retry verification.' : ''}

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

            I consent to YouVerify processing my identity data and authorize the verification fee

            debit from my wallet.

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

            !selfie ||

            !canVerify ||

            isProcessing

          }

          onClick={() => mutation.mutate()}

        >

          {mutation.isPending ? (

            <Loader2 className="h-4 w-4 animate-spin mr-2" />

          ) : (

            <ShieldCheck className="h-4 w-4 mr-2" />

          )}

          Pay {formatNgn(verificationFee)} &amp; verify

        </Button>

      </CardContent>

    </Card>

  );

}

